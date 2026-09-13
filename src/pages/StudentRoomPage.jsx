import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useRoom, captainsOf, studentsOf } from '../hooks/useRoom'
import { getStudentSession, saveStudentSession, clearStudentSession } from '../lib/storage'
import { joinRoom, submitBids } from '../services/roomService'
import { buildTeamColorMap } from '../lib/teamColor'
import { forceStopBgm } from '../lib/bgm'
import CoinAllocator from '../components/CoinAllocator'
import RevealStage from '../components/RevealStage'
import TeamResultsView from '../components/TeamResultsView'
import LiveCoinBoard from '../components/LiveCoinBoard'
import { primeAudio } from '../lib/sound'
import './StudentRoomPage.css'

export default function StudentRoomPage() {
  const { roomId } = useParams()
  const { room, loading } = useRoom(roomId)
  const [session, setSession] = useState(() => getStudentSession(roomId))

  useEffect(() => {
    if (room?.status === 'revealing' || room?.status === 'done') {
      forceStopBgm()
    }
  }, [room?.status])

  if (loading) {
    return <div className="center-loading">불러오는 중...</div>
  }

  if (!room) {
    return (
      <div className="page">
        <h1 className="page-title">방을 찾을 수 없어요</h1>
        <p className="page-subtitle">코드가 올바른지, 방이 아직 열려있는지 확인해주세요.</p>
      </div>
    )
  }

  const member = session ? room.members?.[session.studentId] : null

  if (!session || !member) {
    if (session && !member) clearStudentSession(roomId) // 방에서 내보내진 경우 등: 남아있던 세션 정리
    return <NameEntry roomId={roomId} roomName={room.name} onJoined={setSession} />
  }

  const captains = captainsOf(room)
  const students = studentsOf(room)
  const teamColors = buildTeamColorMap(captains)
  const captainsWithColor = captains.map((c) => ({ ...c, color: teamColors[c.id] }))
  const studentsById = Object.fromEntries(students.map((s) => [s.id, s]))

  return (
    <div className="page student-room">
      <div className="student-room-head">
        <span>{room.name}</span>
        <span className="participant-tag">{member.name} 님</span>
      </div>

      {room.status === 'lobby' && (
        <div className="stack">
          <div className="card stack" style={{ textAlign: 'center' }}>
            {member.isCaptain ? (
              <>
                <div style={{ fontSize: '2.4rem' }}>👑</div>
                <p>당신은 이번 드래프트의 주장으로 지정되었어요!</p>
                <p className="page-subtitle">선생님이 시작하면 다른 학생들이 코인을 걸기 시작해요.</p>
              </>
            ) : (
              <p className="page-subtitle">선생님이 시작할 때까지 잠시만 기다려주세요.</p>
            )}
          </div>

          <div className="card stack">
            <div className="spread">
              <span className="section-title">대기실 현황</span>
              <span className="progress-pill">총 {captains.length + students.length}명 입장</span>
            </div>
            {captains.length === 0 ? (
              <p className="page-subtitle" style={{ textAlign: 'center' }}>
                아직 지정된 주장이 없어요.
              </p>
            ) : (
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {captains.map((c) => (
                  <span key={c.id} className="participant-tag">
                    👑 {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {room.status === 'bidding' &&
        (member.isCaptain ? (
          <div className="card stack" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem' }}>👑</div>
            <p>지금 다른 학생들이 당신에게 코인을 걸고 있어요.</p>
            <p className="page-subtitle">누가 얼마나 걸었는지는 발표 시간에 공개돼요. 기대해주세요!</p>
            <LiveCoinBoard students={students} />
          </div>
        ) : (
          <BiddingForm
            room={room}
            roomId={roomId}
            studentId={session.studentId}
            member={member}
            captains={captainsWithColor}
          />
        ))}

      {room.status === 'revealing' && (
        <div className="card">
          <RevealStage
            sequence={room.sequence || []}
            revealIndex={room.revealIndex || 0}
            captains={captainsWithColor}
            studentsById={studentsById}
            interactive={false}
            myStudentId={session.studentId}
            overflow={room.overflow || []}
          />
        </div>
      )}

      {room.status === 'done' && (
        <TeamResultsView captains={captainsWithColor} students={students} myStudentId={session.studentId} />
      )}
    </div>
  )
}

function NameEntry({ roomId, roomName, onJoined }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    setError('')
    setJoining(true)
    try {
      primeAudio()
      const studentId = await joinRoom(roomId, name)
      const session = { studentId, name: name.trim() }
      saveStudentSession(roomId, session)
      onJoined(session)
    } catch (err) {
      const msg = err.message || '입장하지 못했어요. 다시 시도해주세요.'
      setError(msg)
      window.alert(msg)
      setJoining(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">{roomName}</h1>
      <p className="page-subtitle">이름을 입력하면 입장할 수 있어요.</p>
      <form className="card stack" onSubmit={handleSubmit}>
        <input
          className="text-input"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoFocus
        />
        {error && <div className="error-text">{error}</div>}
        <button type="submit" className="primary-btn" disabled={joining}>
          {joining ? '입장 중...' : '입장하기'}
        </button>
      </form>
    </div>
  )
}

function BiddingForm({ room, roomId, studentId, member, captains }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [justSubmitted, setJustSubmitted] = useState(Boolean(member.submittedAt))

  async function handleSubmit(bids) {
    setSubmitting(true)
    setError('')
    try {
      await submitBids(roomId, studentId, bids, captains.map((c) => c.id), room.coinCount)
      setJustSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card stack">
      {justSubmitted && (
        <div className="progress-pill is-ready" style={{ alignSelf: 'center' }}>
          제출 완료! 원하면 아래에서 다시 바꿔서 제출할 수 있어요.
        </div>
      )}
      <p className="page-subtitle" style={{ textAlign: 'center' }}>
        받은 코인 {room.coinCount}개를 주장들에게 원하는 만큼 나눠 걸어보세요.
      </p>
      <CoinAllocator
        captains={captains}
        coinCount={room.coinCount}
        initialBids={member.bids}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
      {error && <div className="error-text">{error}</div>}
    </div>
  )
}
