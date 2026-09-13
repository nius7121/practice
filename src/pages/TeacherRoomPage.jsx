import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRoom, captainsOf, studentsOf } from '../hooks/useRoom'
import { getTeacherToken, forgetTeacherRoom } from '../lib/storage'
import { deleteRoom } from '../services/roomService'
import { buildTeamColorMap } from '../lib/teamColor'
import LobbyPanel from './teacher/LobbyPanel'
import BiddingPanel from './teacher/BiddingPanel'
import RevealPanel from './teacher/RevealPanel'
import DonePanel from './teacher/DonePanel'
import './TeacherRoomPage.css'

export default function TeacherRoomPage() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { room, loading } = useRoom(roomId)
  const [copyState, setCopyState] = useState('idle')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const isOwner = room ? getTeacherToken(roomId) === room.teacherToken : false

  useEffect(() => {
    setConfirmingDelete(false)
  }, [room?.status])

  if (loading) {
    return <div className="center-loading">불러오는 중...</div>
  }

  if (!room) {
    return (
      <div className="page">
        <h1 className="page-title">방을 찾을 수 없어요</h1>
        <p className="page-subtitle">방이 삭제되었거나 코드가 올바르지 않습니다.</p>
      </div>
    )
  }

  const captains = captainsOf(room)
  const students = studentsOf(room)
  const teamColors = buildTeamColorMap(captains)
  const captainsWithColor = captains.map((c) => ({ ...c, color: teamColors[c.id] }))

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopyState('copied')
      setTimeout(() => setCopyState('idle'), 1500)
    } catch {
      setCopyState('idle')
    }
  }

  async function handleDelete() {
    await deleteRoom(roomId)
    forgetTeacherRoom(roomId)
    navigate('/')
  }

  return (
    <div className="page wide teacher-room">
      <div className="teacher-room-head card">
        <div className="teacher-room-info">
          <div className="teacher-room-name">{room.name}</div>
          <div className="teacher-room-meta">
            주장 {room.captainCount}명 · 코인 {room.coinCount}개 · 팀당 {room.minTeamSize}~
            {room.maxTeamSize}명
          </div>
        </div>
        <button type="button" className="room-code-badge" onClick={handleCopyCode} title="클릭해서 복사">
          <span className="room-code-label">입장 코드</span>
          <span className="room-code-value">{roomId}</span>
          <span className="room-code-copy">{copyState === 'copied' ? '복사됨!' : '복사'}</span>
        </button>
      </div>

      {!isOwner && (
        <div className="teacher-viewer-notice">
          👀 이 브라우저는 방 개설자가 아니에요. 진행은 방을 만든 선생님 화면에서만 가능해요.
        </div>
      )}

      {room.status === 'lobby' && (
        <LobbyPanel room={room} roomId={roomId} captains={captains} students={students} readOnly={!isOwner} />
      )}
      {room.status === 'bidding' && (
        <BiddingPanel roomId={roomId} captains={captains} students={students} readOnly={!isOwner} />
      )}
      {room.status === 'revealing' && (
        <RevealPanel room={room} roomId={roomId} captains={captainsWithColor} students={students} readOnly={!isOwner} />
      )}
      {room.status === 'done' && (
        <DonePanel roomId={roomId} captains={captainsWithColor} students={students} readOnly={!isOwner} />
      )}

      {isOwner && (
        <div className="teacher-danger-zone">
          {!confirmingDelete ? (
            <button type="button" className="danger-btn" onClick={() => setConfirmingDelete(true)}>
              방 삭제하기
            </button>
          ) : (
            <div className="row">
              <span className="error-text">정말 삭제할까요? 모든 참가 기록이 사라져요.</span>
              <button type="button" className="danger-btn" onClick={handleDelete}>
                네, 삭제합니다
              </button>
              <button type="button" className="ghost-btn" onClick={() => setConfirmingDelete(false)}>
                취소
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
