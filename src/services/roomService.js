import {
  ref,
  get,
  set,
  update,
  remove,
  push,
  onValue,
  runTransaction,
} from 'firebase/database'
import { db } from '../firebase'
import { generateRoomCode } from '../lib/roomCode'
import { computeDraftResult, validateBids } from '../lib/draftAlgorithm'

function makeToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/** 중복되지 않는 입장 코드를 찾을 때까지 시도한다. */
async function reserveRoomCode() {
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = generateRoomCode()
    const snapshot = await get(ref(db, `rooms/${code}`))
    if (!snapshot.exists()) return code
  }
  throw new Error('입장 코드를 생성하지 못했습니다. 다시 시도해주세요.')
}

export async function createRoom({ roomName, captainCount, coinCount, minTeamSize, maxTeamSize }) {
  const roomId = await reserveRoomCode()
  const teacherToken = makeToken()

  await set(ref(db, `rooms/${roomId}`), {
    name: roomName,
    code: roomId,
    status: 'lobby',
    captainCount,
    coinCount,
    minTeamSize,
    maxTeamSize,
    teacherToken,
    createdAt: Date.now(),
    revealIndex: 0,
    revealAutoplay: false,
  })

  return { roomId, teacherToken }
}

export async function getRoomOnce(roomId) {
  const snapshot = await get(ref(db, `rooms/${roomId}`))
  if (!snapshot.exists()) return null
  return { id: roomId, ...snapshot.val() }
}

export function subscribeToRoom(roomId, callback) {
  const roomRef = ref(db, `rooms/${roomId}`)
  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }
    callback({ id: roomId, ...snapshot.val() })
  })
  return unsubscribe
}

export async function joinRoom(roomId, name) {
  const room = await getRoomOnce(roomId)
  if (!room) throw new Error('존재하지 않는 입장 코드입니다.')

  const memberRef = push(ref(db, `rooms/${roomId}/members`))
  const studentId = memberRef.key
  await set(memberRef, {
    name: name.trim(),
    joinedAt: Date.now(),
    isCaptain: false,
    bids: null,
    submittedAt: null,
    assignedCaptainId: null,
  })
  return studentId
}

export async function setCaptain(roomId, studentId, isCaptain) {
  await update(ref(db, `rooms/${roomId}/members/${studentId}`), { isCaptain })
}

export async function setTeamName(roomId, studentId, teamName) {
  await update(ref(db, `rooms/${roomId}/members/${studentId}`), { teamName })
}

export async function kickMember(roomId, studentId) {
  await remove(ref(db, `rooms/${roomId}/members/${studentId}`))
}

/** 대기실(lobby) 단계에서만 코인 개수/최소·최대 인원 등을 수정한다. */
export async function updateRoomSettings(roomId, patch) {
  await update(ref(db, `rooms/${roomId}`), patch)
}

export async function startBidding(roomId) {
  await update(ref(db, `rooms/${roomId}`), { status: 'bidding' })
}

export async function backToLobby(roomId) {
  await update(ref(db, `rooms/${roomId}`), { status: 'lobby' })
}

export async function submitBids(roomId, studentId, bids, captainIds, coinCount) {
  const { valid, errors } = validateBids(bids, captainIds, coinCount)
  if (!valid) throw new Error(errors[0])
  await update(ref(db, `rooms/${roomId}/members/${studentId}`), {
    bids,
    submittedAt: Date.now(),
  })
}

/** 제출 마감 후 결과를 계산하고 발표(revealing) 단계로 전환한다. */
export async function lockAndComputeResults(roomId) {
  const room = await getRoomOnce(roomId)
  if (!room) throw new Error('방을 찾을 수 없습니다.')

  const members = room.members || {}
  const captains = Object.entries(members)
    .filter(([, m]) => m.isCaptain)
    .map(([id, m]) => ({ id, name: m.name }))
  const students = Object.entries(members)
    .filter(([, m]) => !m.isCaptain)
    .map(([id, m]) => ({ id, name: m.name, bids: m.bids || {} }))

  const { sequence, assignments, overflow } = computeDraftResult({
    captains,
    students,
    maxTeamSize: room.maxTeamSize,
  })

  const memberUpdates = {}
  Object.entries(assignments).forEach(([studentId, captainId]) => {
    memberUpdates[`members/${studentId}/assignedCaptainId`] = captainId
  })

  await update(ref(db, `rooms/${roomId}`), {
    status: 'revealing',
    sequence,
    overflow,
    revealIndex: 0,
    revealAutoplay: false,
    ...memberUpdates,
  })
}

export async function advanceReveal(roomId) {
  const roomRef = ref(db, `rooms/${roomId}`)
  await runTransaction(roomRef, (room) => {
    if (!room) return room
    const total = (room.sequence || []).length
    const next = Math.min((room.revealIndex || 0) + 1, total)
    room.revealIndex = next
    // status는 여기서 바로 'done'으로 바꾸지 않는다. 마지막 학생의 발표 애니메이션이 채 끝나기도
    // 전에 화면이 결과 화면으로 바뀌어버리기 때문 — 애니메이션이 다 끝난 뒤 finishReveal()이
    // 명시적으로 호출됐을 때만 'done'으로 넘어간다.
    return room
  })
}

export async function setRevealAutoplay(roomId, autoplay) {
  await update(ref(db, `rooms/${roomId}`), { revealAutoplay: autoplay })
}

/** 발표가 실제로 끝까지 진행된 뒤에만 'done'으로 넘어가도록 서버 쪽에서도 한 번 더 확인한다. */
export async function finishReveal(roomId) {
  const roomRef = ref(db, `rooms/${roomId}`)
  await runTransaction(roomRef, (room) => {
    if (!room) return room
    const total = (room.sequence || []).length
    if ((room.revealIndex || 0) < total) return room
    room.status = 'done'
    return room
  })
}

/** 교사가 결과 발표 후 수동으로 팀을 조정한다. */
export async function manualAssign(roomId, studentId, captainId) {
  await update(ref(db, `rooms/${roomId}/members/${studentId}`), {
    assignedCaptainId: captainId,
  })
}

export async function deleteRoom(roomId) {
  await remove(ref(db, `rooms/${roomId}`))
}
