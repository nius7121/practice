// 선생님 정보는 localStorage(브라우저 전체 공유)에, 학생 세션은 sessionStorage(탭 단위)에 저장한다.
// 학생 세션을 localStorage에 두면 같은 컴퓨터에서 새 탭을 열었을 때도 직전 학생으로 자동 로그인되어
// 여러 명이 한 컴퓨터에서 각자 다른 탭으로 입장하는 걸 테스트/사용할 수 없기 때문이다.
// sessionStorage는 탭마다 독립적이라, 새 탭에서는 항상 새 이름을 입력하고 같은 탭 새로고침에서는
// 그대로 유지된다.

const TEACHER_KEY = 'liveDraft.teacherRooms'
const STUDENT_KEY = 'liveDraft.studentSessions'

function readJson(storage, key, fallback) {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // storage를 쓸 수 없는 환경(사생활 보호 모드 등)이면 조용히 무시
  }
}

/** 방을 만들 때 토큰과 함께 이름 등을 같이 저장해서, 나중에 "내가 만든 방" 목록에 띄울 수 있게 한다. */
export function saveTeacherRoom(roomId, { token, name }) {
  const all = readJson(window.localStorage, TEACHER_KEY, {})
  all[roomId] = { token, name, createdAt: Date.now() }
  writeJson(window.localStorage, TEACHER_KEY, all)
}

export function getTeacherToken(roomId) {
  const all = readJson(window.localStorage, TEACHER_KEY, {})
  const entry = all[roomId]
  // 예전 버전에서는 토큰 문자열만 저장했었기 때문에 두 형태 모두 지원한다.
  return (typeof entry === 'string' ? entry : entry?.token) || null
}

/** 이 브라우저에서 만든 방 목록을 최근 생성 순으로 돌려준다. */
export function getTeacherRooms() {
  const all = readJson(window.localStorage, TEACHER_KEY, {})
  return Object.entries(all)
    .map(([roomId, entry]) => ({
      roomId,
      name: typeof entry === 'string' ? null : entry?.name,
      createdAt: typeof entry === 'string' ? 0 : entry?.createdAt || 0,
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

/** 실제 방을 지우는 것과 별개로, 목록에서만 이 방을 제거한다(이미 삭제된 방 정리용). */
export function forgetTeacherRoom(roomId) {
  const all = readJson(window.localStorage, TEACHER_KEY, {})
  delete all[roomId]
  writeJson(window.localStorage, TEACHER_KEY, all)
}

// 학생 세션은 탭 단위로 분리되어야 하므로 sessionStorage를 쓴다.
export function saveStudentSession(roomId, session) {
  const all = readJson(window.sessionStorage, STUDENT_KEY, {})
  all[roomId] = session
  writeJson(window.sessionStorage, STUDENT_KEY, all)
}

export function getStudentSession(roomId) {
  const all = readJson(window.sessionStorage, STUDENT_KEY, {})
  return all[roomId] || null
}

export function clearStudentSession(roomId) {
  const all = readJson(window.sessionStorage, STUDENT_KEY, {})
  delete all[roomId]
  writeJson(window.sessionStorage, STUDENT_KEY, all)
}
