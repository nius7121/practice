import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import HomePage from './pages/HomePage'
import TeacherCreatePage from './pages/TeacherCreatePage'
import TeacherRoomPage from './pages/TeacherRoomPage'
import JoinPage from './pages/JoinPage'
import StudentRoomPage from './pages/StudentRoomPage'
import GuidePage from './pages/GuidePage'
import NotFoundPage from './pages/NotFoundPage'
import './App.css'

function Chrome({ children }) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-brand">
          🏁 라이브 드래프트
        </Link>
        <nav className="app-nav">
          <Link to="/guide">사용법</Link>
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}

export default function App() {
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
