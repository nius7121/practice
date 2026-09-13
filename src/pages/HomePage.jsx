import { Link } from 'react-router-dom'
import './HomePage.css'

export default function HomePage() {
  return (
    <div className="page home-page">
      <div className="home-hero">
        <h1 className="home-title">
          코인으로 팀을 뽑는
          <br />
          Live Draft
        </h1>
        <p className="page-subtitle">
          학생들이 가진 코인을 주장에게 나눠 걸면, 가장 높은 코인을 건 학생부터 순서대로 팀이
          정해집니다. 결과는 그 자리에서 실시간으로 발표돼요.
        </p>
      </div>

      <div className="home-choices">
        <Link to="/teacher/new" className="home-card">
          <span className="home-card-emoji">🧑‍🏫</span>
          <span className="home-card-title">선생님이에요</span>
          <span className="home-card-desc">방을 만들고 드래프트를 진행할게요</span>
        </Link>
        <Link to="/join" className="home-card">
          <span className="home-card-emoji">🙋</span>
          <span className="home-card-title">학생이에요</span>
          <span className="home-card-desc">입장 코드로 참가할게요</span>
        </Link>
      </div>
    </div>
  )
}
