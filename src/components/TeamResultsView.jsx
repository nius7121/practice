import './TeamResultsView.css'

/** 최종 팀 구성을 읽기 전용으로 보여준다 (학생 화면용). */
export default function TeamResultsView({ captains, students, myStudentId }) {
  const membersByCaptain = {}
  captains.forEach((c) => {
    membersByCaptain[c.id] = []
  })
  const overflow = []
  students.forEach((s) => {
    if (s.assignedCaptainId && membersByCaptain[s.assignedCaptainId]) {
      membersByCaptain[s.assignedCaptainId].push(s)
    } else {
      overflow.push(s)
    }
  })

  return (
    <div className="stack">
      <div className="result-grid">
        {captains.map((captain) => (
          <div className="result-team-card" style={{ '--team-color': captain.color }} key={captain.id}>
            <div className="result-team-head">
              <span className="reveal-team-dot" style={{ background: captain.color }} />
              <span className="result-team-name-static">{captain.teamName || `${captain.name} 팀`}</span>
              <span className="participant-tag">{membersByCaptain[captain.id].length + 1}명</span>
            </div>
            <div className={`result-member-row ${captain.id === myStudentId ? 'is-me' : ''}`}>
              <span>👑 {captain.name}</span>
            </div>
            {membersByCaptain[captain.id].map((m) => (
              <div className={`result-member-row ${m.id === myStudentId ? 'is-me' : ''}`} key={m.id}>
                <span>{m.name}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      {overflow.length > 0 && (
        <p className="page-subtitle" style={{ textAlign: 'center' }}>
          아직 팀이 정해지지 않은 학생이 있어요. 선생님이 곧 배정해줄 거예요.
        </p>
      )}
    </div>
  )
}
