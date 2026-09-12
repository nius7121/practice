import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRoomOnce } from '../services/roomService'
import { normalizeRoomCode } from '../lib/roomCode'

export default function JoinPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const roomId = normalizeRoomCode(code)
    if (!roomId) {
      setError('입장 코드를 입력해주세요.')
      return
    }
    setError('')
    setChecking(true)
    try {
      const room = await getRoomOnce(roomId)
      if (!room) {
        setError('해당 코드의 방을 찾을 수 없어요. 코드를 다시 확인해주세요.')
        setChecking(false)
        return
      }
      navigate(`/room/${roomId}`)
    } catch {
      setError('방을 확인하지 못했어요. 네트워크를 확인해주세요.')
      setChecking(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">참가하기</h1>
      <p className="page-subtitle">선생님이 알려준 5자리 입장 코드를 입력해주세요.</p>

      <form className="card stack" onSubmit={handleSubmit}>
        <div className="field">
          <label className="field-label" htmlFor="code">
            입장 코드
          </label>
          <input
            id="code"
            className="text-input"
            placeholder="예: 7K4RP"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            autoFocus
            style={{ letterSpacing: '0.2em', fontWeight: 800, fontSize: '1.2rem', textAlign: 'center' }}
          />
        </div>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="primary-btn" disabled={checking}>
          {checking ? '확인 중...' : '입장하기'}
        </button>
      </form>
    </div>
  )
}
