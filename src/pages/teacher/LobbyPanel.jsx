import { useState } from 'react'
import { setCaptain, kickMember, startBidding, updateRoomSettings } from '../../services/roomService'
import { playClick, primeAudio } from '../../lib/sound'

export default function LobbyPanel({ room, roomId, captains, students, readOnly }) {
  const [starting, setStarting] = useState(false)
  const [settings, setSettings] = useState({
    coinCount: room.coinCount,
    minTeamSize: room.minTeamSize,
    maxTeamSize: room.maxTeamSize,
  })
  const [savingSettings, setSavingSettings] = useState(false)

  const allMembers = [...captains, ...students].sort((a, b) => a.joinedAt - b.joinedAt)
  const captainsReady = captains.length === room.captainCount
  const capacity = room.maxTeamSize * room.captainCount
  const overCapacity = students.length > capacity - captains.length

  async function toggleCaptain(member) {
    if (readOnly) return
    if (!member.isCaptain && captains.length >= room.captainCount) return
    await setCaptain(roomId, member.id, !member.isCaptain)
  }

  async function handleKick(member) {
    if (readOnly) return
    if (!window.confirm(`${member.name} 님을 방에서 내보낼까요?`)) return
    await kickMember(roomId, member.id)
  }

  async function handleStart() {
    if (readOnly) return
    primeAudio()
    playClick()
    setStarting(true)
    await startBidding(roomId)
  }

  async function saveSettings() {
    setSavingSettings(true)
    await updateRoomSettings(roomId, {
      coinCount: Number(settings.coinCount),
      minTeamSize: Number(settings.minTeamSize),
      maxTeamSize: Number(settings.maxTeamSize),
    })
    setSavingSettings(false)
  }

  const settingsChanged =
    Number(settings.coinCount) !== room.coinCount ||
    Number(settings.minTeamSize) !== room.minTeamSize ||
    Number(settings.maxTeamSize) !== room.maxTeamSize

  return (
    <div className="stack">
      <div className="card stack">
        <div className="spread">
          <span className="section-title">대기실</span>
          <span className={`progress-pill ${captainsReady ? 'is-ready' : ''}`}>
            주장 {captains.length} / {room.captainCount}명 지정됨
          </span>
        </div>

        {allMembers.length === 0 ? (
          <div className="empty-note">아직 입장한 학생이 없어요. 입장 코드를 화면에 띄워주세요!</div>
        ) : (
          <ul className="participant-list">
            {allMembers.map((member) => (
              <li className="participant-row" key={member.id}>
                <span className="participant-name">{member.name}</span>
                {member.isCaptain && <span className="participant-tag">주장</span>}
                {!readOnly && (
                  <>
                    <label className="captain-toggle">
                      <input
                        type="checkbox"
                        checked={member.isCaptain}
                        onChange={() => toggleCaptain(member)}
                        disabled={!member.isCaptain && captains.length >= room.captainCount}
                      />
                      주장으로 지정
                    </label>
                    <button type="button" className="ghost-btn" onClick={() => handleKick(member)}>
                      내보내기
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {!readOnly && (
        <div className="card stack">
          <span className="section-title">설정</span>
          <div className="settings-grid">
            <div className="field">
              <label className="field-label">코인 개수</label>
              <input
                type="number"
                min={1}
                className="text-input"
                value={settings.coinCount}
                onChange={(e) => setSettings((s) => ({ ...s, coinCount: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="field-label">최소 인원</label>
              <input
                type="number"
                min={1}
                className="text-input"
                value={settings.minTeamSize}
                onChange={(e) => setSettings((s) => ({ ...s, minTeamSize: e.target.value }))}
              />
            </div>
            <div className="field">
              <label className="field-label">최대 인원</label>
              <input
                type="number"
                min={1}
                className="text-input"
                value={settings.maxTeamSize}
                onChange={(e) => setSettings((s) => ({ ...s, maxTeamSize: e.target.value }))}
              />
            </div>
          </div>
          {settingsChanged && (
            <button type="button" className="ghost-btn" onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? '저장 중...' : '설정 저장'}
            </button>
          )}
        </div>
      )}

      {overCapacity && (
        <div className="error-text">
          ⚠️ 현재 최대 인원 설정으로는 학생 {students.length}명을 다 수용할 수 없어요. 최대 인원을
          늘리거나 주장 수를 늘려주세요.
        </div>
      )}

      {!readOnly && (
        <button
          type="button"
          className="primary-btn"
          disabled={!captainsReady || students.length === 0 || starting}
          onClick={handleStart}
        >
          코인 배분 시작하기 →
        </button>
      )}
      {!captainsReady && !readOnly && (
        <p className="page-subtitle" style={{ textAlign: 'center' }}>
          시작하려면 정확히 {room.captainCount}명을 주장으로 지정해주세요.
        </p>
      )}
    </div>
  )
}
