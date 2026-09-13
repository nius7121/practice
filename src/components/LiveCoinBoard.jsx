import { useEffect, useRef, useState } from 'react'
import { playCoinDing } from '../lib/sound'
import './LiveCoinBoard.css'

function randomCoord() {
  return {
    x: Math.floor(10 + Math.random() * 75), // 10% ~ 85%
    y: Math.floor(15 + Math.random() * 65), // 15% ~ 80%
    rot: Math.floor(-25 + Math.random() * 50),
  }
}

/**
 * 실시간 코인 투표 보드:
 * 팀별 게이지를 없애고, 학생 1명이 투표를 완료할 때마다
 * 화면 임의(랜덤) 좌표에 골드 코인이 나타나며 '띠링' 사운드를 재생한다.
 * 어느 팀에 베팅했는지는 일절 노출되지 않아 완벽한 익명성을 유지한다.
 */
export default function LiveCoinBoard({ students = [] }) {
  const [coins, setCoins] = useState([])
  const prevSubmittedIdsRef = useRef(new Set())
  const isInitialMount = useRef(true)

  useEffect(() => {
    const currentSubmitted = students.filter((s) => s.submittedAt)
    const currentIds = new Set(currentSubmitted.map((s) => s.id))
    const prevIds = prevSubmittedIdsRef.current

    // Initial mount: load coins for students who already submitted quietly
    if (isInitialMount.current) {
      isInitialMount.current = false
      const initialCoins = currentSubmitted.map((s) => ({
        id: s.id,
        ...randomCoord(),
        isNew: false,
      }))
      setCoins(initialCoins)
      prevSubmittedIdsRef.current = currentIds
      return
    }

    // Detect newly submitted students
    const newlySubmitted = currentSubmitted.filter((s) => !prevIds.has(s.id))

    if (newlySubmitted.length > 0) {
      // Play '띠링' sound!
      playCoinDing()

      const newCoins = newlySubmitted.map((s) => ({
        id: s.id,
        ...randomCoord(),
        isNew: true,
      }))

      setCoins((prev) => [...prev, ...newCoins])
      prevSubmittedIdsRef.current = currentIds
    } else if (currentIds.size < prevIds.size) {
      // If someone was kicked or reset
      setCoins((prev) => prev.filter((c) => currentIds.has(c.id)))
      prevSubmittedIdsRef.current = currentIds
    }
  }, [students])

  const submittedCount = students.filter((s) => s.submittedAt).length

  return (
    <div className="live-coin-board">
      <div className="lcb-header">
        <div className="lcb-title">
          <span>🪙</span>
          <span>실시간 투표 현황 (제출 {submittedCount} / {students.length}명)</span>
        </div>
        <p className="lcb-subtitle">
          학생이 배분을 마치고 제출하면 랜덤 위치에 코인이 나타나요! (어느 팀인지는 비밀 🤫)
        </p>
      </div>

      <div className="lcb-coins-area">
        {coins.length === 0 ? (
          <div className="lcb-empty-hint">
            학생들이 코인을 배분하고 있어요...<br />제출이 시작되면 여기에 코인이 쏟아집니다!
          </div>
        ) : (
          coins.map((coin) => (
            <div
              key={coin.id}
              className={`lcb-coin ${coin.isNew ? 'is-new' : ''}`}
              style={{
                left: `${coin.x}%`,
                top: `${coin.y}%`,
                '--rot': `${coin.rot}deg`,
                transform: `rotate(${coin.rot}deg)`,
              }}
              title="누군가의 소중한 투표 코인!"
            >
              🪙
            </div>
          ))
        )}
      </div>
    </div>
  )
}
