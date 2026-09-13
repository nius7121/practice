import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom } from '../services/roomService'
import { saveTeacherRoom, getTeacherRooms } from '../lib/storage'
import MyRoomsList from '../components/MyRoomsList'

export default function TeacherCreatePage() {
  const navigate = useNavigate()
  const [roomName, setRoomName] = useState('')
  const [captainCount, setCaptainCount] = useState(4)
  const [coinCount, setCoinCount] = useState(5)
  const [minTeamSize, setMinTeamSize] = useState(4)
  const [maxTeamSize, setMaxTeamSize] = useState(6)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    const trimmed = roomName.trim()
    if (!trimmed) return '방 이름을 입력해주세요.'

    const myRooms = getTeacherRooms()
    const isDuplicate = myRooms.some(
      (r) => r.name && r.name.trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (isDuplicate) {
      return `'${trimmed}'(은)는 이미 만든 방(팀) 이름입니다. 다른 이름을 사용해주세요.`
    }

    if (captainCount < 2) return '주장은 최소 2명 이상이어야 합니다.'
    if (coinCount < 1) return '코인 개수는 1개 이상이어야 합니다.'
    if (minTeamSize < 1) return '최소 인원은 1명 이상이어야 합니다.'
    if (maxTeamSize < minTeamSize) return '최대 인원은 최소 인원보다 크거나 같아야 합니다.'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      window.alert(validationError)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const { roomId, teacherToken } = await createRoom({
        roomName: roomName.trim(),
        captainCount: Number(captainCount),
        coinCount: Number(coinCount),
        minTeamSize: Number(minTeamSize),
        maxTeamSize: Number(maxTeamSize),
      })
      saveTeacherRoom(roomId, { token: teacherToken, name: roomName.trim() })
      navigate(`/teacher/${roomId}`)
    } catch (err) {
      setError(err.message || '방을 만들지 못했습니다. 다시 시도해주세요.')
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">방 만들기</h1>
      <p className="page-subtitle">
        설정은 방을 만든 뒤 학생들이 입장하는 대기실 단계에서도 언제든 바꿀 수 있어요.
      </p>

      <MyRoomsList />

      <form className="card stack" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="roomName">
            방 이름
          </label>
          <input
            id="roomName"
            className="text-input"
            placeholder="예: 2학년 3반 체육대회 팀 짜기"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            maxLength={40}
          />
        </div>

        <div className="row" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div className="field" style={{ flex: '1 1 140px' }}>
            <label className="field-label" htmlFor="captainCount">
              주장 수 (팀 수)
            </label>
            <input
              id="captainCount"
              type="number"
              min={2}
              className="text-input"
              value={captainCount}
              onChange={(e) => setCaptainCount(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: '1 1 140px' }}>
            <label className="field-label" htmlFor="coinCount">
              학생당 코인 개수
            </label>
            <input
              id="coinCount"
              type="number"
              min={1}
              className="text-input"
              value={coinCount}
              onChange={(e) => setCoinCount(e.target.value)}
            />
          </div>
        </div>

        <div className="row" style={{ flexWrap: 'wrap', gap: 16 }}>
          <div className="field" style={{ flex: '1 1 140px' }}>
            <label className="field-label" htmlFor="minTeamSize">
              팀별 최소 인원 (주장 포함)
            </label>
            <input
              id="minTeamSize"
              type="number"
              min={1}
              className="text-input"
              value={minTeamSize}
              onChange={(e) => setMinTeamSize(e.target.value)}
            />
          </div>
          <div className="field" style={{ flex: '1 1 140px' }}>
            <label className="field-label" htmlFor="maxTeamSize">
              팀별 최대 인원 (주장 포함)
            </label>
            <input
              id="maxTeamSize"
              type="number"
              min={1}
              className="text-input"
              value={maxTeamSize}
              onChange={(e) => setMaxTeamSize(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="error-text">{error}</div>}

        <button type="submit" className="primary-btn" disabled={submitting}>
          {submitting ? '만드는 중...' : '방 만들고 입장 코드 받기'}
        </button>
      </form>
    </div>
  )
}
