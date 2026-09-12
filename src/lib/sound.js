// 발표 연출용 효과음
// 외부 오디오 파일 없이 Web Audio API로 그 자리에서 합성한다.
// (브라우저 자동재생 정책 때문에 반드시 버튼 클릭 등 사용자 동작 이후에 호출해야 소리가 난다)

let ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return null
    ctx = new AudioCtx()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, duration, { type = 'sine', gain = 0.2, delay = 0 } = {}) {
  const audio = getCtx()
  if (!audio) return
  const osc = audio.createOscillator()
  const g = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  osc.connect(g)
  g.connect(audio.destination)

  const start = audio.currentTime + delay
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(gain, start + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.start(start)
  osc.stop(start + duration + 0.03)
}

/** 버튼 클릭 등 가벼운 조작음 */
export function playClick() {
  tone(880, 0.06, { type: 'square', gain: 0.06 })
}

/** 룰렛이 돌아가는 동안 나는 딸깍음 */
export function playTick() {
  tone(700, 0.045, { type: 'square', gain: 0.07 })
}

/** 발표 직전 긴장감을 위한 드럼롤 */
export function playDrumroll(duration = 1.1) {
  const audio = getCtx()
  if (!audio) return
  const stepMs = 55
  const steps = Math.floor((duration * 1000) / stepMs)
  for (let i = 0; i < steps; i++) {
    tone(140 + Math.random() * 30, 0.05, {
      type: 'square',
      gain: 0.05 + (i / steps) * 0.05,
      delay: (i * stepMs) / 1000,
    })
  }
}

/** 한 명이 팀에 배정될 때 나는 짧은 차임 */
export function playReveal() {
  tone(523.25, 0.14, { gain: 0.16 })
  tone(783.99, 0.2, { delay: 0.09, gain: 0.16 })
}

/** 모든 발표가 끝났을 때 나는 팡파레 */
export function playFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((freq, i) =>
    tone(freq, 0.32, { delay: i * 0.12, gain: 0.18, type: 'triangle' })
  )
}

/** 최초 사용자 동작 시 오디오 컨텍스트를 깨워둔다. */
export function primeAudio() {
  getCtx()
}
