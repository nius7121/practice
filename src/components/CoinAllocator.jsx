import { useMemo, useState } from 'react'
import './CoinAllocator.css'

/**
 * 학생이 가진 코인을 주장들에게 나눠 거는 UI.
 * captains: {id, name, color}[]
 * coinCount: 지급된 코인 총 개수
 * initialBids: 기존에 제출한 값이 있으면 이어서 수정 가능
 */
export default function CoinAllocator({ captains, coinCount, initialBids, onSubmit, submitting }) {
  const [bids, setBids] = useState(() => {
    const base = {}
    captains.forEach((c) => {
      base[c.id] = initialBids?.[c.id] ?? 0
    })
    return base
  })

  const used = useMemo(() => Object.values(bids).reduce((a, b) => a + b, 0), [bids])
  const remaining = coinCount - used

  function change(captainId, delta) {
    setBids((prev) => {
      const next = Math.max(0, prev[captainId] + delta)
      if (delta > 0 && remaining <= 0) return prev
      return { ...prev, [captainId]: next }
    })
  }

  function reset() {
    const base = {}
    captains.forEach((c) => {
      base[c.id] = 0
    })
    setBids(base)
  }

  return (
    <div className="coin-allocator">
      <div className={`coin-remaining ${remaining === 0 ? 'is-ready' : ''}`}>
        <span className="coin-remaining-num">{remaining}</span>
        <span>개 남음 (총 {coinCount}개)</span>
      </div>

      <div className="coin-captain-list">
        {captains.map((captain) => (
          <div className="coin-captain-row" key={captain.id} style={{ '--team-color': captain.color }}>
            <div className="coin-captain-name">
              <span className="coin-captain-dot" />
              {captain.name}
            </div>
            <div className="coin-stepper">
              <button
                type="button"
                className="coin-btn"
                onClick={() => change(captain.id, -1)}
                disabled={bids[captain.id] === 0 || submitting}
                aria-label={`${captain.name} 코인 줄이기`}
              >
                −
              </button>
              <span className="coin-value">{bids[captain.id]}</span>
              <button
                type="button"
                className="coin-btn"
                onClick={() => change(captain.id, 1)}
                disabled={remaining === 0 || submitting}
                aria-label={`${captain.name} 코인 늘리기`}
              >
                +
              </button>
            </div>
            <div className="coin-bar-track">
              <div
                className="coin-bar-fill"
                style={{ width: coinCount ? `${(bids[captain.id] / coinCount) * 100}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="coin-actions">
        <button type="button" className="ghost-btn" onClick={reset} disabled={submitting}>
          초기화
        </button>
        <button
          type="button"
          className="primary-btn"
          disabled={remaining !== 0 || submitting}
          onClick={() => onSubmit(bids)}
        >
          {submitting ? '제출 중...' : '이대로 제출하기'}
        </button>
      </div>
    </div>
  )
}
