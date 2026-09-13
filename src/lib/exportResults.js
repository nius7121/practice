// 최종 팀 명단을 CSV(엑셀) 또는 이미지 파일로 내려받게 해준다.

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function csvCell(value) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

/**
 * @param {string} roomName
 * @param {{teamName: string, members: {name: string, isCaptain: boolean}[]}[]} teams
 */
export function exportResultsAsCsv(roomName, teams) {
  const rows = [['팀', '이름', '역할']]
  teams.forEach((team) => {
    team.members.forEach((m) => {
      rows.push([team.teamName, m.name, m.isCaptain ? '주장' : '팀원'])
    })
  })
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  // 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM을 붙인다.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${roomName || '팀결과'}.csv`)
}

/** 결과 화면 DOM 요소를 그대로 캡처해서 PNG로 내려받는다. */
export async function exportElementAsImage(element, roomName) {
  const { default: html2canvas } = await import('html2canvas')
  const canvas = await html2canvas(element, {
    backgroundColor: '#f2f4f9',
    scale: Math.min(2, window.devicePixelRatio || 1.5),
  })
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('이미지를 만들지 못했습니다.')
  triggerDownload(blob, `${roomName || '팀결과'}.png`)
}
