// 입장 코드 생성 유틸리티
// 헷갈리기 쉬운 글자(0/O, 1/I/L 등)를 빼서 학생들이 실수 없이 입력하게 합니다.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 5

export function generateRoomCode() {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

export function normalizeRoomCode(input) {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}
