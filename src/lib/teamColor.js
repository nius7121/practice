// 팀(주장)마다 구분되는 생동감 있는 색을 순서대로 부여한다.
const PALETTE = [
  '#ff5d73', // 레드
  '#3ac2ff', // 스카이블루
  '#ffd23f', // 옐로우
  '#3ddc97', // 그린
  '#b980ff', // 퍼플
  '#ff9f43', // 오렌지
  '#4dd9e8', // 시안
  '#ff6fd8', // 핑크
]

export function teamColorAt(index) {
  return PALETTE[index % PALETTE.length]
}

export function buildTeamColorMap(captains) {
  const map = {}
  captains.forEach((captain, i) => {
    map[captain.id] = teamColorAt(i)
  })
  return map
}
