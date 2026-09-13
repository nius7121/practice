import { useEffect, useRef, useState } from 'react'
import ConfettiBurst from './ConfettiBurst'
import { playDrumroll, playFanfare, playReveal, playTick } from '../lib/sound'
import { duckBgmForReveal, restoreBgmAfterReveal } from '../lib/bgm'
import './RevealStage.css'

const PICK_HOLD_MS = 1300
const CARD_FACEDOWN_HOLD_MS = 650
const CARD_REVEAL_STAGGER_MS = 500
const CARD_RESULT_HOLD_MS = 1300

/** 문자열을 안정적인 정수로 바꾼다 (동점 카드 숫자를 모든 화면에서 똑같이 만들기 위한 시드용). */
function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0
  }
  return h
}

/**
 * 동점 후보들에게 하이로우 카드 숫자(2~10)를 나눠준다. 이미 정해진 승자가 항상 가장 높은
 * 숫자를 뽑도록 만들어서, "카드 뽑기" 연출과 실제 결과가 절대 어긋나지 않게 한다.
 * 같은 item에 대해 어느 화면에서 계산하든 항상 같은 숫자가 나온다(순수 함수).
 */
function buildTieCards(item) {
  const candidates = item.tiedCandidates
  const values = candidates.map((c) => 2 + (hashSeed(`${item.order}:${c.studentId}:${c.captainId}`) % 9))
  const winnerIndex = candidates.findIndex(
    (c) => c.studentId === item.studentId && c.captainId === item.captainId
  )
  if (winnerIndex >= 0) {
    const maxOther = Math.max(0, ...values.filter((_, i) => i !== winnerIndex))
    values[winnerIndex] = Math.min(13, maxOther + 1)
  }
  return candidates.map((c, i) => ({ ...c, cardValue: values[i] }))
}

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
      const cards = buildTieCards(item)
      setSpotlight({ item, phase: 'cards', cards, revealedCount: 0 })
      playDrumroll(0.55)
      timeoutId = setTimeout(function revealNext(revealedCount = 0) {
        const nextCount = revealedCount + 1
        playTick()
        setSpotlight({ item, phase: 'cards', cards, revealedCount: nextCount })
        if (nextCount < cards.length) {
          timeoutId = setTimeout(() => revealNext(nextCount), CARD_REVEAL_STAGGER_MS)
        } else {
          timeoutId = setTimeout(() => {
            setSpotlight({ item, phase: 'landed' })
            playReveal()
            timeoutId = setTimeout(finish, PICK_HOLD_MS)
          }, CARD_RESULT_HOLD_MS)
        }
      }, CARD_FACEDOWN_HOLD_MS)
    } else {
      setSpotlight({ item, phase: 'landed' })
      playReveal()
      timeoutId = setTimeout(finish, PICK_HOLD_MS)
    }

    return () => {
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
  const { item, phase } = spotlight
  if (phase === 'cards') {
    return <TieCardDraw item={item} cards={spotlight.cards} revealedCount={spotlight.revealedCount} captainById={captainById} nameOf={nameOf} />
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

/** 동점자들이 하이로우 카드를 한 장씩 뒤집어서, 더 높은 숫자가 나온 학생이 뽑히는 미니게임 연출. */
function TieCardDraw({ item, cards, revealedCount, captainById, nameOf }) {
  const allRevealed = revealedCount >= cards.length

  return (
    <div className="card-draw">
      <div className="spotlight-badge">🃏 동점! 하이로우 카드 뽑기</div>
      <div className="card-draw-row">
        {cards.map((c, i) => {
          const captain = captainById[c.captainId]
          const isFlipped = i < revealedCount
          const isWinner =
            allRevealed && c.studentId === item.studentId && c.captainId === item.captainId
          return (
            <div
              key={`${c.studentId}-${c.captainId}`}
              className={`draw-card ${isFlipped ? 'is-flipped' : ''} ${isWinner ? 'is-winner' : ''}`}
              style={{ '--team-color': captain?.color }}
            >
              <div className="draw-card-inner">
                <div className="draw-card-face draw-card-back">🂠</div>
                <div className="draw-card-face draw-card-front">{c.cardValue}</div>
              </div>
              <div className="draw-card-name">{nameOf(c.studentId)}</div>
            </div>
          )
        })}
      </div>
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
