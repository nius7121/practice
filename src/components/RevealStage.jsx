import { useEffect, useRef, useState, useCallback } from 'react'
import ConfettiBurst from './ConfettiBurst'
import MarbleRouletteModal from './MarbleRouletteModal'
import { playDrumroll, playFanfare, playReveal } from '../lib/sound'
import { duckBgmForReveal, restoreBgmAfterReveal } from '../lib/bgm'
import './RevealStage.css'

const PICK_HOLD_MS = 1300
const SUSPENSE_HOLD_MS = 1400

/**
 * 코인 드래프트 발표 애니메이션.
 * 교사 화면(주도)과 학생 화면(관람) 양쪽에서 공유해서 사용한다.
 */
export default function RevealStage({
  sequence = [],
  revealIndex = 0,
  captains,
  studentsById,
  interactive = false,
  onAdvance,
  autoplay = false,
  onToggleAutoplay,
  onFinish,
  myStudentId,
  overflow = [],
}) {
  const [settledCount, setSettledCount] = useState(() => Math.min(revealIndex, sequence.length))
  const [spotlight, setSpotlight] = useState(null)
  const [activeTieItem, setActiveTieItem] = useState(null)
  const [myBanner, setMyBanner] = useState(null)
  const [confettiTrigger, setConfettiTrigger] = useState(null)
  const processingRef = useRef(false)
  const doneAnnouncedRef = useRef(false)

  // 발표 화면이 떠 있는 동안은 배경음악을 잠시 끄고 효과음에 집중하게 한다.
  useEffect(() => {
    duckBgmForReveal()
    return () => restoreBgmAfterReveal()
  }, [])

  const total = sequence.length

  const finishItem = useCallback((idx, item) => {
    setSpotlight(null)
    setSettledCount(idx + 1)
    processingRef.current = false
    if (myStudentId && item.studentId === myStudentId) {
      setMyBanner(item)
      setTimeout(() => setMyBanner(null), 3400)
    }
  }, [myStudentId])

  const handleMiniGameComplete = useCallback(() => {
    if (!activeTieItem) return
    const { idx, item } = activeTieItem
    setActiveTieItem(null)
    setSpotlight({ item, phase: 'landed' })
    playReveal()
    setTimeout(() => {
      finishItem(idx, item)
    }, PICK_HOLD_MS)
  }, [activeTieItem, finishItem])

  useEffect(() => {
    const target = Math.min(revealIndex, total)
    if (processingRef.current || settledCount >= target) return

    const idx = settledCount
    const item = sequence[idx]
    if (!item) return
    processingRef.current = true

    // 1단계: 1.4초간 긴장감(두구두구) 연출
    setSpotlight({ item, phase: 'suspense' })
    playDrumroll(1.3)

    const suspenseTimer = setTimeout(() => {
      // 동점자인 경우: 결과 바로 공개 금지 -> 마블 룰렛 전용 미니게임 화면으로 전환
      if (item.tie && item.tiedCandidates?.length > 1) {
        setSpotlight({ item, phase: 'tie_pending' })
        setActiveTieItem({ idx, item })
      } else {
        // 일반 픽: 바로 결과 착지
        setSpotlight({ item, phase: 'landed' })
        playReveal()
        setTimeout(() => {
          finishItem(idx, item)
        }, PICK_HOLD_MS)
      }
    }, SUSPENSE_HOLD_MS)

    return () => {
      clearTimeout(suspenseTimer)
    }
  }, [revealIndex, settledCount, sequence, total, finishItem])

  useEffect(() => {
    if (total > 0 && settledCount >= total && !doneAnnouncedRef.current) {
      doneAnnouncedRef.current = true
      playFanfare()
      setConfettiTrigger(Date.now())
    }
    if (settledCount < total) doneAnnouncedRef.current = false
  }, [settledCount, total])

  const settled = sequence.slice(0, settledCount)
  const teamMembers = {}
  captains.forEach((c) => {
    teamMembers[c.id] = []
  })
  settled.forEach((item) => {
    teamMembers[item.captainId]?.push(item)
  })

  const captainById = Object.fromEntries(captains.map((c) => [c.id, c]))
  const nameOf = (id) => studentsById[id]?.name ?? '???'

  const allRevealed = total > 0 && settledCount >= total
  const canAdvance = interactive && !autoplay && settledCount >= Math.min(revealIndex, total) && !allRevealed

  return (
    <div className="reveal-stage">
      <div className="reveal-progress">
        <span>🏆 팀 발표</span>
        <span className="reveal-progress-count">
          {settledCount} / {total}
        </span>
      </div>

      <div className="reveal-spotlight">
        {spotlight ? (
          <>
            {spotlight.phase === 'landed' && (
              <div
                key={`flash-${spotlight.item.studentId}`}
                className="reveal-flash"
                style={{ '--team-color': captainById[spotlight.item.captainId]?.color }}
              />
            )}
            <SpotlightCard spotlight={spotlight} captainById={captainById} nameOf={nameOf} />
          </>
        ) : settledCount === 0 ? (
          <div className="spotlight-idle">두근두근... 발표를 시작해주세요!</div>
        ) : (
          <RecapCard item={settled[settled.length - 1]} captainById={captainById} nameOf={nameOf} />
        )}
      </div>

      <div className="reveal-team-grid">
        {captains.map((captain) => (
          <div className="reveal-team-col" key={captain.id} style={{ '--team-color': captain.color }}>
            <div className="reveal-team-head">
              <span className="reveal-team-dot" />
              <span className="reveal-team-name">{captain.teamName || `${captain.name} 팀`}</span>
              <span className="reveal-team-count">{teamMembers[captain.id].length}</span>
            </div>
            <ul className="reveal-team-list">
              {teamMembers[captain.id].map((item) => (
                <li
                  key={item.studentId}
                  className={`reveal-chip ${item.studentId === myStudentId ? 'is-me' : ''}`}
                >
                  {nameOf(item.studentId)}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {overflow.length > 0 && (
        <div className="reveal-overflow-warning">
          ⚠️ 자동 배정이 안 된 학생이 있어요: {overflow.map((id) => nameOf(id)).join(', ')} — 발표가 끝나면
          선생님이 직접 팀을 지정해주세요.
        </div>
      )}

      {interactive && (
        <div className="reveal-controls">
          {allRevealed ? (
            <button type="button" className="primary-btn is-finish" onClick={onFinish}>
              결과 확인하기 🎉
            </button>
          ) : (
            <button type="button" className="primary-btn" onClick={onAdvance} disabled={!canAdvance}>
              다음 발표 ▶
            </button>
          )}
          <label className="reveal-autoplay">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => onToggleAutoplay?.(e.target.checked)}
              disabled={allRevealed}
            />
            자동으로 이어서 발표하기
          </label>
        </div>
      )}

      {myBanner && (
        <div className="reveal-my-banner" style={{ '--team-color': captainById[myBanner.captainId]?.color }}>
          🎉 나는 <strong>{captainById[myBanner.captainId]?.teamName || `${captainById[myBanner.captainId]?.name} 팀`}</strong>
          !
        </div>
      )}

      {activeTieItem && (
        <MarbleRouletteModal
          item={activeTieItem.item}
          captains={captains}
          studentsById={studentsById}
          onComplete={handleMiniGameComplete}
        />
      )}

      <ConfettiBurst trigger={confettiTrigger} />
    </div>
  )
}

function SpotlightCard({ spotlight, captainById, nameOf }) {
  const { item, phase } = spotlight

  if (phase === 'suspense') {
    return (
      <div className="spotlight-card is-suspense">
        <div className="spotlight-badge">두근두근... 🥁</div>
        <div className="spotlight-drumroll-text">두구두구두구...</div>
        <div className="spotlight-suspense-spinner">🎲</div>
      </div>
    )
  }

  if (phase === 'tie_pending') {
    return (
      <div className="spotlight-card is-suspense">
        <div className="spotlight-badge">⚡ 동점 발생!</div>
        <div className="spotlight-drumroll-text">마블 룰렛 추첨 중...</div>
        <div className="spotlight-suspense-spinner">🔮</div>
      </div>
    )
  }

  const captain = captainById[item.captainId]
  return (
    <div className="spotlight-card is-landed" style={{ '--team-color': captain?.color }}>
      {item.tie && <div className="spotlight-badge">🎲 마블 룰렛 추첨 결과</div>}
      <div className="spotlight-name">{nameOf(item.studentId)}</div>
      <div className="spotlight-arrow">→</div>
      <div className="spotlight-team">{captain?.teamName || `${captain?.name} 팀`}</div>
      <div className="spotlight-amount">{item.amount} 코인</div>
    </div>
  )
}

function RecapCard({ item, captainById, nameOf }) {
  if (!item) return null
  const captain = captainById[item.captainId]
  return (
    <div className="spotlight-card is-recap" style={{ '--team-color': captain?.color }}>
      <div className="spotlight-name">{nameOf(item.studentId)}</div>
      <div className="spotlight-arrow">→</div>
      <div className="spotlight-team">{captain?.teamName || `${captain?.name} 팀`}</div>
    </div>
  )
}
