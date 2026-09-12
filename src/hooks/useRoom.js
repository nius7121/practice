import { useEffect, useState } from 'react'
import { subscribeToRoom } from '../services/roomService'

/** 방 데이터를 실시간으로 구독한다. loading이 끝난 뒤 room이 null이면 존재하지 않는 방이다. */
export function useRoom(roomId) {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!roomId) {
      setRoom(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = subscribeToRoom(roomId, (data) => {
      setRoom(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [roomId])

  return { room, loading }
}

export function membersOf(room) {
  if (!room?.members) return []
  return Object.entries(room.members).map(([id, m]) => ({ id, ...m }))
}

export function captainsOf(room) {
  return membersOf(room).filter((m) => m.isCaptain)
}

export function studentsOf(room) {
  return membersOf(room).filter((m) => !m.isCaptain)
}
