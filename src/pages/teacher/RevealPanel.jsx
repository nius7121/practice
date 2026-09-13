import { useEffect } from 'react'
import RevealStage from '../../components/RevealStage'
import { advanceReveal, setRevealAutoplay, finishReveal } from '../../services/roomService'
import { primeAudio } from '../../lib/sound'

const AUTOPLAY_INTERVAL_MS = 3200

export default function RevealPanel({ room, roomId, captains, students, readOnly }) {
  const sequence = room.sequence || []
  const total = sequence.length

  useEffect(() => {
    if (readOnly || !room.revealAutoplay) return
    if ((room.revealIndex || 0) >= total) return
    const timer = setInterval(() => {
      advanceReveal(roomId)
    }, AUTOPLAY_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [readOnly, room.revealAutoplay, room.revealIndex, roomId, total])

  const studentsById = Object.fromEntries(students.map((s) => [s.id, s]))

  return (
    <div className="card">
      <RevealStage
        sequence={sequence}
        revealIndex={room.revealIndex || 0}
        captains={captains}
        studentsById={studentsById}
        interactive={!readOnly}
        onAdvance={() => {
          primeAudio()
          advanceReveal(roomId)
        }}
        autoplay={room.revealAutoplay}
        onToggleAutoplay={(v) => setRevealAutoplay(roomId, v)}
        onFinish={() => finishReveal(roomId)}
        overflow={room.overflow || []}
      />
    </div>
  )
}
