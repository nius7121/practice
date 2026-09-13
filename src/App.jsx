import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { startBgm } from './lib/bgm'
import HomePage from './pages/HomePage'
import TeacherCreatePage from './pages/TeacherCreatePage'
import TeacherRoomPage from './pages/TeacherRoomPage'
import JoinPage from './pages/JoinPage'
import StudentRoomPage from './pages/StudentRoomPage'
import GuidePage from './pages/GuidePage'
import NotFoundPage from './pages/NotFoundPage'
import ldLogo from './assets/ld-logo.png'
import './App.css'

function Chrome({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand">
          <img src={ldLogo} alt="" className="app-brand-logo" />
          Live Draft
        </Link>
        <nav className="app-nav">
          <Link to="/guide" className="app-nav-btn">
            사용법
          </Link>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}

export default function App() {
  // 브라우저 자동재생 정책 때문에, 앱 안 어디든 첫 클릭/터치가 있을 때 배경음악을 시작한다.
  useEffect(() => {
    function unlock() {
      startBgm()
      window.removeEventListener('pointerdown', unlock)
    }
    window.addEventListener('pointerdown', unlock)
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <BrowserRouter>
      <Chrome>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/teacher/new" element={<TeacherCreatePage />} />
          <Route path="/teacher/:roomId" element={<TeacherRoomPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/room/:roomId" element={<StudentRoomPage />} />
          <Route path="/guide" element={<GuidePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Chrome>
    </BrowserRouter>
  )
}
