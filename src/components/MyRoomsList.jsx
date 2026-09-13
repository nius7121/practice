import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTeacherRooms, forgetTeacherRoom } from '../lib/storage'
import { getRoomOnce } from '../services/roomService'
import './MyRoomsList.css'

const STATUS_LABEL = {
  lobby: '대기실',
  bidding: '코인 배분 중',
  revealing: '발표 중',
  done: '완료',
}

/**
 * 이 브라우저에서 선생님이 만든 방 목록을 보여준다. 방을 다시 찾아 들어갈 수 있게 한다.
 * 선생님 전용 화면(방 만들기)에서만 사용한다 — 학생도 보는 홈 화면에는 두지 않는다.
 */
export default function MyRoomsList() {
  const [rooms, setRooms] = useState(() => getTeacherRooms())

  if (rooms.length === 0) return null

  function handleForget(roomId) {
    forgetTeacherRoom(roomId)
    setRooms((prev) => prev.filter((r) => r.roomId !== roomId))
  }

  return (
    <div className="card my-rooms">
      <span className="section-title">이전에 만든 방</span>
      <ul className="my-rooms-list">
        {rooms.map((room) => (
          <MyRoomRow key={room.roomId} room={room} onForget={() => handleForget(room.roomId)} />
        ))}
      </ul>
    </div>
  )
}

function MyRoomRow({ room, onForget }) {
  // undefined: 확인 중, null: 삭제된 방, object: 살아있는 방 최신 정보
  const [live, setLive] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    getRoomOnce(room.roomId).then((data) => {
      if (!cancelled) setLive(data)
    })
    return () => {
      cancelled = true
    }
  }, [room.roomId])

  const isMissing = live === null
  const displayName = live?.name || room.name || '이름 없는 방'

  return (
    <li className={`my-room-row ${isMissing ? 'is-missing' : ''}`}>
      <div className="my-room-info">
        <span className="my-room-name">{displayName}</span>
        <span className="my-room-meta">
          입장 코드 {room.roomId}
          {live && ` · ${STATUS_LABEL[live.status] || live.status}`}
          {isMissing && ' · 삭제된 방이에요'}
        </span>
      </div>
      {isMissing ? (
        <button type="button" className="ghost-btn" onClick={onForget}>
          목록에서 지우기
        </button>
      ) : (
        <Link to={`/teacher/${room.roomId}`} className="ghost-btn my-room-enter">
          입장하기
        </Link>
      )}
    </li>
  )
}
