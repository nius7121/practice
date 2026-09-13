import { useState } from 'react'
import { backToLobby, lockAndComputeResults } from '../../services/roomService'
import { playClick, primeAudio } from '../../lib/sound'
import TeamCoinGauge from '../../components/TeamCoinGauge'

export default function BiddingPanel({ roomId, captains, students, readOnly }) {
  const [locking, setLocking] = useState(false)
  const submittedCount = students.filter((s) => s.submittedAt).length
  const allSubmitted = students.length > 0 && submittedCount === students.length

  async function handleLock() {
    if (readOnly) return
    if (!allSubmitted) {
      const ok = window.confirm(
        `아직 ${students.length - submittedCount}명이 제출하지 않았어요. 지금 마감할까요? (미제출자는 코인을 하나도 걸지 않은 것으로 처리돼요)`
      )
      if (!ok) return
    }
    primeAudio()
    playClick()
    setLocking(true)
    await lockAndComputeResults(roomId)
  }

  return (
    <div className="stack">
      <div className="card stack">
        <div className="spread">
          <span className="section-title">코인 배분 중</span>
          <span className={`progress-pill ${allSubmitted ? 'is-ready' : ''}`}>
            제출 {submittedCount} / {students.length}명
          </span>
        </div>
        <p className="page-subtitle">
          누가 누구에게 코인을 걸었는지는 아무에게도 보이지 않아요. 발표 순간까지 비밀이에요! 🤫
        </p>
        <TeamCoinGauge captains={captains} students={students} />
        <ul className="participant-list">
          {students.map((s) => (
            <li className="participant-row" key={s.id}>
              <span className="participant-name">{s.name}</span>
              <span className="participant-tag" style={{ opacity: s.submittedAt ? 1 : 0.3 }}>
                {s.submittedAt ? '제출 완료' : '대기 중'}
              </span>
            </li>
          ))}
        </ul>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          {captains.map((c) => (
            <span key={c.id} className="participant-tag">
              👑 {c.name}
            </span>
          ))}
        </div>
      </div>

      {!readOnly && (
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <button type="button" className="ghost-btn" onClick={() => backToLobby(roomId)}>
            ← 대기실로 되돌리기
          </button>
          <button
            type="button"
            className="primary-btn"
            disabled={students.length === 0 || locking}
            onClick={handleLock}
          >
            제출 마감하고 결과 계산하기 🎲
          </button>
        </div>
      )}
    </div>
  )
}
