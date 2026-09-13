import { useRef, useState } from 'react'
import { manualAssign, setTeamName, updateRoomSettings } from '../../services/roomService'
import { exportResultsAsCsv, exportElementAsImage } from '../../lib/exportResults'

export default function DonePanel({ roomId, roomName, captains, students, readOnly }) {
  const [replaying, setReplaying] = useState(false)
  const [exportingImage, setExportingImage] = useState(false)
  const resultGridRef = useRef(null)

  const membersByCaptain = {}
  captains.forEach((c) => {
    membersByCaptain[c.id] = []
  })
  const overflowStudents = []
  students.forEach((s) => {
    if (s.assignedCaptainId && membersByCaptain[s.assignedCaptainId]) {
      membersByCaptain[s.assignedCaptainId].push(s)
    } else {
      overflowStudents.push(s)
    }
  })

  async function handleReplay() {
    setReplaying(true)
    await updateRoomSettings(roomId, { status: 'revealing', revealIndex: 0 })
  }

  function handleExportCsv() {
    const teams = captains.map((captain) => ({
      teamName: captain.teamName || `${captain.name} 팀`,
      members: [{ name: captain.name, isCaptain: true }, ...membersByCaptain[captain.id].map((m) => ({ name: m.name, isCaptain: false }))],
    }))
    exportResultsAsCsv(roomName, teams)
  }

  async function handleExportImage() {
    if (!resultGridRef.current) return
    setExportingImage(true)
    try {
      await exportElementAsImage(resultGridRef.current, roomName)
    } catch {
      window.alert('이미지를 만들지 못했어요. 다시 시도해주세요.')
    } finally {
      setExportingImage(false)
    }
  }

  return (
    <div className="stack">
      <div className="spread">
        <span className="section-title">🏆 최종 팀 구성</span>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="ghost-btn" onClick={handleExportCsv}>
            CSV로 내보내기
          </button>
          <button type="button" className="ghost-btn" onClick={handleExportImage} disabled={exportingImage}>
            {exportingImage ? '이미지 만드는 중...' : '이미지로 저장'}
          </button>
          {!readOnly && (
            <button type="button" className="ghost-btn" onClick={handleReplay} disabled={replaying}>
              발표 다시보기 ▶
            </button>
          )}
        </div>
      </div>

      {overflowStudents.length > 0 && (
        <div className="overflow-panel stack">
          <strong>직접 배정이 필요한 학생</strong>
          <p className="page-subtitle" style={{ margin: 0 }}>
            최대 인원 설정 때문에 자동으로 팀을 정하지 못했어요. 팀을 골라주세요.
          </p>
          {overflowStudents.map((s) => (
            <div className="row" key={s.id}>
              <span style={{ flex: 1 }}>{s.name}</span>
              {!readOnly && (
                <select
                  className="text-input"
                  style={{ width: 'auto' }}
                  value=""
                  onChange={(e) => manualAssign(roomId, s.id, e.target.value)}
                >
                  <option value="" disabled>
                    팀 선택
                  </option>
                  {captains.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.teamName || `${c.name} 팀`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="result-grid" ref={resultGridRef}>
        {captains.map((captain) => (
          <TeamResultCard
            key={captain.id}
            roomId={roomId}
            captain={captain}
            members={membersByCaptain[captain.id]}
            allCaptains={captains}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  )
}

function TeamResultCard({ roomId, captain, members, allCaptains, readOnly }) {
  const [name, setName] = useState(captain.teamName || `${captain.name} 팀`)

  function handleSaveName() {
    const trimmed = name.trim()
    if (!trimmed) return
    const isDuplicate = allCaptains.some(
      (c) => c.id !== captain.id && (c.teamName || `${c.name} 팀`).trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (isDuplicate) {
      window.alert(`'${trimmed}'(은)는 이미 존재하는 다른 팀의 이름입니다. 중복되지 않는 이름을 사용해주세요.`)
      setName(captain.teamName || `${captain.name} 팀`)
      return
    }
    setTeamName(roomId, captain.id, trimmed)
  }

  return (
    <div className="result-team-card" style={{ '--team-color': captain.color }}>
      <div className="result-team-head">
        <span className="reveal-team-dot" style={{ background: captain.color }} />
        <input
          className="result-team-name-input"
          value={name}
          disabled={readOnly}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSaveName}
        />
        <span className="participant-tag">{members.length + 1}명</span>
      </div>
      <div className="result-member-row">
        <span>👑 {captain.name}</span>
        <span className="participant-tag">주장</span>
      </div>
      {members.map((m) => (
        <div className="result-member-row" key={m.id}>
          <span>{m.name}</span>
          {!readOnly && (
            <select
              className="text-input"
              style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
              value={captain.id}
              onChange={(e) => manualAssign(roomId, m.id, e.target.value)}
            >
              {allCaptains.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.teamName || `${c.name} 팀`}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  )
}
