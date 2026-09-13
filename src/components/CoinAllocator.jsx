import { useMemo, useRef, useState } from 'react'
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
  const trackRefs = useRef({})

  const used = useMemo(() => Object.values(bids).reduce((a, b) => a + b, 0), [bids])
  const remaining = coinCount - used

  function change(captainId, delta) {
    setBids((prev) => {
      const next = Math.max(0, prev[captainId] + delta)
      if (delta > 0 && remaining <= 0) return prev
      return { ...prev, [captainId]: next }
    })
  }

  /** 드래그/키보드 조작으로 특정 값을 바로 지정한다. 다른 주장에게 이미 건 코인은 건드리지 않는다. */
  function setValue(captainId, rawValue) {
    setBids((prev) => {
      const otherUsed = Object.entries(prev).reduce(
        (sum, [id, v]) => (id === captainId ? sum : sum + v),
        0
      )
      const maxAllowed = Math.max(0, coinCount - otherUsed)
      const next = Math.max(0, Math.min(maxAllowed, Math.round(rawValue)))
      if (next === prev[captainId]) return prev
      return { ...prev, [captainId]: next }
    })
  }

  function updateFromPointer(captainId, clientX) {
    const track = trackRefs.current[captainId]
    if (!track || !coinCount) return
    const rect = track.getBoundingClientRect()
    const ratio = rect.width === 0 ? 0 : (clientX - rect.left) / rect.width
    setValue(captainId, ratio * coinCount)
  }

  function handlePointerDown(captainId, e) {
    if (submitting) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    updateFromPointer(captainId, e.clientX)
  }

  function handlePointerMove(captainId, e) {
    if (submitting || e.buttons === 0) return
    updateFromPointer(captainId, e.clientX)
  }

  function handleTrackKeyDown(captainId, e) {
    if (submitting) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      change(captainId, 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      change(captainId, -1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setValue(captainId, 0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setValue(captainId, coinCount)
    }
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
            <div
              className="coin-bar-track"
              ref={(el) => {
                trackRefs.current[captain.id] = el
              }}
              onPointerDown={(e) => handlePointerDown(captain.id, e)}
              onPointerMove={(e) => handlePointerMove(captain.id, e)}
              onKeyDown={(e) => handleTrackKeyDown(captain.id, e)}
              role="slider"
              aria-label={`${captain.name}에게 건 코인`}
              aria-valuemin={0}
              aria-valuemax={coinCount}
              aria-valuenow={bids[captain.id]}
              aria-disabled={submitting}
              tabIndex={submitting ? -1 : 0}
            >
              <div
                className="coin-bar-fill"
                style={{ width: coinCount ? `${(bids[captain.id] / coinCount) * 100}%` : '0%' }}
              >
                <span className="coin-bar-thumb" />
              </div>
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
