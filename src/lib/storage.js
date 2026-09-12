// 브라우저 localStorage에 최소한의 세션 정보를 저장해서
// 새로고침해도 "내가 누구였는지", "내 방이 어디였는지"를 잃어버리지 않게 한다.

const TEACHER_KEY = 'liveDraft.teacherRooms'
const STUDENT_KEY = 'liveDraft.studentSessions'

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage를 쓸 수 없는 환경(사생활 보호 모드 등)이면 조용히 무시
  }
}

export function saveTeacherToken(roomId, token) {
  const all = readJson(TEACHER_KEY, {})
  all[roomId] = token
  writeJson(TEACHER_KEY, all)
}

export function getTeacherToken(roomId) {
  const all = readJson(TEACHER_KEY, {})
  return all[roomId] || null
}

export function saveStudentSession(roomId, session) {
  const all = readJson(STUDENT_KEY, {})
  all[roomId] = session
  writeJson(STUDENT_KEY, all)
}

export function getStudentSession(roomId) {
  const all = readJson(STUDENT_KEY, {})
  return all[roomId] || null
}

export function clearStudentSession(roomId) {
  const all = readJson(STUDENT_KEY, {})
  delete all[roomId]
  writeJson(STUDENT_KEY, all)
}
