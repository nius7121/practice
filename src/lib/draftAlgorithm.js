// 코인 드래프트 결과 계산 알고리즘
//
// 규칙: 주장이 아닌 학생들은 각자 받은 코인을 원하는 만큼 나눠서 여러 주장에게 걸 수 있다.
// (단, 자신이 건 코인의 총합은 반드시 지급받은 코인 개수와 같아야 한다 — 제출 시점에 검증)
// 모든 학생-주장 조합을 통틀어 가장 높은 코인을 건 학생이 그 주장의 팀에 먼저 들어간다.
// 그 학생은 확정되었으니 후보에서 빠지고, 그 주장의 자리가 다 찼으면 주장도 후보에서 빠진다.
// 이 과정을 자리가 남은 주장이 없거나 배정할 학생이 없을 때까지 반복한다.
//
// 동시에 최고 코인이 여러 건 나오면(동점) 그 중 하나를 무작위로 뽑아 순서를 정한다.
// (실제 추첨은 화면에서 룰렛/뽑기 애니메이션으로 연출하고, 그 결과가 정답으로 저장된다.)

/**
 * @param {Object} params
 * @param {{id: string, name: string}[]} params.captains
 * @param {{id: string, name: string, bids: Record<string, number>}[]} params.students - 주장이 아닌 학생만
 * @param {number} params.maxTeamSize - 주장을 포함한 팀 최대 인원
 * @param {() => number} [params.rng] - 0 이상 1 미만 난수 생성 함수 (테스트용으로 주입 가능)
 * @returns {{
 *   sequence: Array<{order: number, studentId: string, captainId: string, amount: number, tie: boolean, tiedCandidates?: Array<{studentId: string, captainId: string}>}>,
 *   assignments: Record<string, string>,
 *   overflow: string[],
 * }}
 */
export function computeDraftResult({ captains, students, maxTeamSize, rng = Math.random }) {
  const remainingSlots = {}
  captains.forEach((c) => {
    remainingSlots[c.id] = Math.max(0, maxTeamSize - 1)
  })

  const pending = new Map(students.map((s) => [s.id, s]))
  const sequence = []
  const assignments = {}
  let order = 0

  while (pending.size > 0) {
    let bestAmount = -1
    let candidates = []

    for (const [studentId, student] of pending) {
      for (const captain of captains) {
        if (remainingSlots[captain.id] <= 0) continue
        const amount = student.bids?.[captain.id] ?? 0
        if (amount > bestAmount) {
          bestAmount = amount
          candidates = [{ studentId, captainId: captain.id }]
        } else if (amount === bestAmount) {
          candidates.push({ studentId, captainId: captain.id })
        }
      }
    }

    // 남은 학생은 있지만 자리가 있는 주장이 하나도 없는 경우 (설정 오류) -> 중단
    if (candidates.length === 0) break

    const tie = candidates.length > 1
    const winner = tie ? candidates[Math.floor(rng() * candidates.length)] : candidates[0]

    sequence.push({
      order: order++,
      studentId: winner.studentId,
      captainId: winner.captainId,
      amount: bestAmount,
      tie,
      ...(tie ? { tiedCandidates: candidates } : {}),
    })

    assignments[winner.studentId] = winner.captainId
    remainingSlots[winner.captainId] -= 1
    pending.delete(winner.studentId)
  }

  return {
    sequence,
    assignments,
    overflow: Array.from(pending.keys()),
  }
}

/** 학생이 제출한 코인 배분이 유효한지 검사한다. */
export function validateBids(bids, captainIds, coinCount) {
  const errors = []
  let total = 0
  for (const id of captainIds) {
    const value = bids[id]
    if (value === undefined || value === null) continue
    if (!Number.isInteger(value) || value < 0) {
      errors.push('코인은 0 이상의 정수여야 합니다.')
      break
    }
    total += value
  }
  if (total !== coinCount) {
    errors.push(`코인 합계가 ${coinCount}개가 되어야 합니다. (현재 ${total}개)`)
  }
  return { valid: errors.length === 0, total, errors }
}
