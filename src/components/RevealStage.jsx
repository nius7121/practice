import { useEffect, useRef, useState } from 'react'
import ConfettiBurst from './ConfettiBurst'
import { playDrumroll, playFanfare, playReveal, playTick } from '../lib/sound'
import { duckBgmForReveal, restoreBgmAfterReveal } from '../lib/bgm'
import './RevealStage.css'

const TICK_COUNT = 14
const TICK_INTERVAL_MS = 110
const TIE_LANDED_HOLD_MS = 1100
const PICK_HOLD_MS = 1300

/**
 * 코인 드래프트 발표 애니메이션.
 * 교사 화면(주도)과 학생 화면(관람) 양쪽에서 공유해서 사용한다.
 *
 * @param {Object} props
 * @param {Array} props.sequence - room.sequence
 * @param {number} props.revealIndex - room.revealIndex (여기까지 공개되어야 함)
 * @param {Array} props.captains - {id, name, color}[]
 * @param {Record<string, {id, name}>} props.studentsById
 * @param {boolean} [props.interactive] - true면 "다음 발표" 컨트롤을 보여준다
 * @param {() => void} [props.onAdvance]
 * @param {boolean} [props.autoplay]
 * @param {(v: boolean) => void} [props.onToggleAutoplay]
 * @param {string} [props.myStudentId] - 이 화면을 보는 학생 본인 id (있으면 본인 픽에서 강조)
 * @param {string[]} [props.overflow] - 자동 배정에 실패해 수동 지정이 필요한 학생 id
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

  useEffect(() => {
    const target = Math.min(revealIndex, total)
    if (processingRef.current || settledCount >= target) return

    const idx = settledCount
    const item = sequence[idx]
    if (!item) return
    processingRef.current = true

    let intervalId = null
    let timeoutId = null

    const finish = () => {
      setSpotlight(null)
      setSettledCount(idx + 1)
      processingRef.current = false
      if (myStudentId && item.studentId === myStudentId) {
        setMyBanner(item)
        setTimeout(() => setMyBanner(null), 3400)
      }
    }

    if (item.tie && item.tiedCandidates?.length > 1) {
      let tick = 0
      playDrumroll(Math.min(1.2, (TICK_COUNT * TICK_INTERVAL_MS) / 1000))
      intervalId = setInterval(() => {
        const candidate = item.tiedCandidates[tick % item.tiedCandidates.length]
        setSpotlight({ item, phase: 'ticking', candidate })
        playTick()
        tick += 1
        if (tick >= TICK_COUNT) {
          clearInterval(intervalId)
          setSpotlight({ item, phase: 'landed' })
          playReveal()
          timeoutId = setTimeout(finish, TIE_LANDED_HOLD_MS)
        }
      }, TICK_INTERVAL_MS)
    } else {
      setSpotlight({ item, phase: 'landed' })
      playReveal()
      timeoutId = setTimeout(finish, PICK_HOLD_MS)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [revealIndex, settledCount, sequence, total, myStudentId])

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

      <ConfettiBurst trigger={confettiTrigger} />
    </div>
  )
}

function SpotlightCard({ spotlight, captainById, nameOf }) {
  const { item, phase, candidate } = spotlight
  if (phase === 'ticking') {
    const captain = captainById[candidate.captainId]
    return (
      <div className="spotlight-card is-ticking" style={{ '--team-color': captain?.color }}>
        <div className="spotlight-badge">동점 추첨 중...</div>
        <div className="spotlight-name">{nameOf(candidate.studentId)}</div>
        <div className="spotlight-arrow">→</div>
        <div className="spotlight-team">{captain?.teamName || `${captain?.name} 팀`}</div>
      </div>
    )
  }
  const captain = captainById[item.captainId]
  return (
    <div className="spotlight-card is-landed" style={{ '--team-color': captain?.color }}>
      {item.tie && <div className="spotlight-badge">🎲 추첨 결과</div>}
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
