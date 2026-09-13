import './TeamCoinGauge.css'

/**
 * 제출이 끝난 학생들의 코인만 합산해서, 팀별로 얼마나 몰리고 있는지 "정도"만 보여준다.
 * 누가 얼마를 걸었는지는 절대 알 수 없고, 팀 사이의 상대적인 쏠림만 게이지로 드러난다.
 */
export default function TeamCoinGauge({ captains, students }) {
  const submitted = students.filter((s) => s.submittedAt)

  const totals = captains.map((captain) => {
    const total = submitted.reduce((sum, s) => sum + (s.bids?.[captain.id] || 0), 0)
    return { captain, total }
  })
  const maxTotal = Math.max(1, ...totals.map((t) => t.total))

  return (
    <div className="coin-gauge">
      <div className="coin-gauge-caption">
        🔥 팀별 코인 쏠림 (금액은 비밀, 분위기만!) · 제출 {submitted.length} / {students.length}명
      </div>
      <div className="coin-gauge-list">
        {totals.map(({ captain, total }) => (
          <div className="coin-gauge-row" key={captain.id} style={{ '--team-color': captain.color }}>
            <span className="coin-gauge-name">{captain.teamName || `${captain.name} 팀`}</span>
            <div className="coin-gauge-track">
              <div
                className="coin-gauge-fill"
                style={{ width: total > 0 ? `${Math.max(6, (total / maxTotal) * 100)}%` : '0%' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
