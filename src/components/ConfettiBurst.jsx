import { useEffect, useMemo, useState } from 'react'
import './ConfettiBurst.css'

const COLORS = ['#ff5d73', '#3ac2ff', '#ffd23f', '#3ddc97', '#b980ff', '#ff9f43']

/** trigger 값이 바뀔 때마다 화면에 색종이를 한 번 터뜨린다. */
export default function ConfettiBurst({ trigger, count = 60 }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (trigger === undefined || trigger === null) return
    setShow(true)
    const timer = setTimeout(() => setShow(false), 2600)
    return () => clearTimeout(timer)
  }, [trigger])

  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.8 + Math.random() * 1.2,
        color: COLORS[i % COLORS.length],
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 160,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trigger, count]
  )

  if (!show) return null

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
