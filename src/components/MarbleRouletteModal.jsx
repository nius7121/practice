import { useEffect, useRef, useState } from 'react'
import { playTick, playReveal, playDrumroll } from '../lib/sound'
import ConfettiBurst from './ConfettiBurst'
import './MarbleRouletteModal.css'

const VIBRANT_COLORS = [
  '#3b82f6', '#ec4899', '#10b981', '#f59e0b',
  '#8b5cf6', '#06b6d4', '#ef4444', '#f97316'
]

export default function MarbleRouletteModal({ item, captains, studentsById, onComplete }) {
  const canvasRef = useRef(null)
  const [phase, setPhase] = useState('spinning') // 'spinning' | 'won'
  const [confettiTrigger, setConfettiTrigger] = useState(null)
  const animRef = useRef(null)

  const rawCandidates = item.tiedCandidates || [{ studentId: item.studentId, captainId: item.captainId }]
  const candidates = rawCandidates.map((c, i) => ({
    ...c,
    name: studentsById[c.studentId]?.name || '학생',
    color: VIBRANT_COLORS[i % VIBRANT_COLORS.length]
  }))

  const winnerIndex = candidates.findIndex(
    (c) => c.studentId === item.studentId && c.captainId === item.captainId
  )
  const targetWinnerIdx = winnerIndex >= 0 ? winnerIndex : 0
  const winnerCandidate = candidates[targetWinnerIdx]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const size = 300
    canvas.width = size * window.devicePixelRatio
    canvas.height = size * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const center = size / 2
    const radius = size / 2 - 12
    const numSlices = candidates.length
    const sliceAngle = (Math.PI * 2) / numSlices

    // 12시 방향(top, -PI/2)에 당첨 슬라이스의 중심이 오도록 최종 회전각 계산
    // pointer is at top (-PI/2)
    // Slice center angle: angle = currentRotation + targetWinnerIdx * sliceAngle + sliceAngle / 2
    // We want angle % (2*PI) === -PI/2  =>  3*PI/2
    const baseTargetAngle = (Math.PI * 1.5) - (targetWinnerIdx * sliceAngle + sliceAngle / 2)
    // Add multiple full spins (e.g. 5 to 7 full rotations)
    const fullSpins = 6 * Math.PI * 2
    const finalAngle = fullSpins + ((baseTargetAngle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2))

    const duration = 4200
    const startTime = performance.now()
    let lastTickAngle = 0

    playDrumroll(3.8)

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3)
    }

    function draw(now) {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)
      const eased = easeOutCubic(progress)
      const currentAngle = eased * finalAngle

      // Tick sound on slice crossing
      if (Math.abs(currentAngle - lastTickAngle) >= sliceAngle) {
        playTick()
        lastTickAngle = currentAngle
      }

      ctx.clearRect(0, 0, size, size)

      // Outer rim
      ctx.save()
      ctx.beginPath()
      ctx.arc(center, center, radius + 8, 0, Math.PI * 2)
      ctx.fillStyle = '#0f172a'
      ctx.fill()
      ctx.lineWidth = 4
      ctx.strokeStyle = '#d4af37'
      ctx.stroke()
      ctx.restore()

      // Draw slices
      ctx.save()
      ctx.translate(center, center)
      ctx.rotate(currentAngle)

      for (let i = 0; i < numSlices; i++) {
        const c = candidates[i]
        const start = i * sliceAngle
        const end = start + sliceAngle

        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, radius, start, end)
        ctx.closePath()
        ctx.fillStyle = c.color
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.stroke()

        // Text
        ctx.save()
        ctx.rotate(start + sliceAngle / 2)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 13px sans-serif'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4
        ctx.fillText(c.name, radius - 20, 5)
        ctx.restore()
      }

      ctx.restore()

      // Marble ball animation (rolling on outer edge)
      const ballRadius = 8
      const marbleTrackRadius = radius - 14
      // Ball counter-orbits slightly for dynamic realistic marble feel
      const marbleAngle = currentAngle * 1.5
      const mx = center + Math.cos(marbleAngle) * (progress < 0.9 ? marbleTrackRadius : (radius * 0.75))
      const my = center + Math.sin(marbleAngle) * (progress < 0.9 ? marbleTrackRadius : (radius * 0.75))

      ctx.save()
      const grad = ctx.createRadialGradient(mx - 2, my - 2, 1, mx, my, ballRadius)
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(0.3, '#f1f5f9')
      grad.addColorStop(0.8, '#64748b')
      grad.addColorStop(1, '#1e293b')
      ctx.beginPath()
      ctx.arc(mx, my, ballRadius, 0, Math.PI * 2)
      ctx.fillStyle = grad
      ctx.shadowColor = '#fff'
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.restore()

      if (progress < 1) {
        animRef.current = requestAnimationFrame(draw)
      } else {
        setPhase('won')
        playReveal()
        setConfettiTrigger(Date.now())
      }
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [candidates, targetWinnerIdx])

  const captain = captains.find((c) => c.id === item.captainId)

  // Auto-return after win
  useEffect(() => {
    if (phase !== 'won') return
    const timer = setTimeout(() => {
      onComplete()
    }, 2800)
    return () => clearTimeout(timer)
  }, [phase, onComplete])

  return (
    <div className="marble-roulette-overlay">
      <div className="marble-roulette-container">
        <div className="mr-badge">🚨 동점자 발생! 마블 룰렛</div>
        <h2 className="mr-title">마블 룰렛 추첨</h2>
        <p className="mr-subtitle">
          같은 코인을 건 동점자 중 1명이 룰렛 추첨으로 먼저 합류합니다!
        </p>

        <div className="mr-candidates-list">
          {candidates.map((c) => {
            const isWinner = phase === 'won' && c.studentId === winnerCandidate.studentId
            return (
              <div
                key={`${c.studentId}-${c.captainId}`}
                className={`mr-candidate-chip ${isWinner ? 'is-winner-chip' : ''}`}
                style={{ '--c-color': c.color }}
              >
                <span className="mr-marble-dot" />
                <span>{c.name}</span>
              </div>
            )
          })}
        </div>

        <div className="mr-roulette-wrapper">
          <div className="mr-pointer" />
          <canvas ref={canvasRef} className="mr-wheel-canvas" />
          <div className="mr-center-cap">🔮</div>
        </div>

        {phase === 'won' && (
          <div className="mr-result-panel">
            <div className="mr-result-title">
              🎉 <strong>{winnerCandidate.name}</strong> 당첨!
            </div>
            <p className="mr-subtitle">
              {captain?.teamName || `${captain?.name} 팀`}으로 배정되었습니다!
            </p>
            <button type="button" className="mr-return-btn" onClick={onComplete}>
              결과 발표로 돌아가기 →
            </button>
          </div>
        )}
      </div>
      <ConfettiBurst trigger={confettiTrigger} />
    </div>
  )
}
