import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="page" style={{ textAlign: 'center' }}>
      <h1 className="page-title">페이지를 찾을 수 없어요</h1>
      <Link to="/" className="primary-btn" style={{ alignSelf: 'center', textDecoration: 'none' }}>
        홈으로 가기
      </Link>
    </div>
  )
}
