// 배경음악(BGM) 재생 제어.
// 브라우저 자동재생 정책 때문에 반드시 사용자 동작(클릭 등) 이후에 재생을 시작할 수 있다.
// 발표(reveal) 화면에서는 효과음(lib/sound.js)에 집중할 수 있도록 배경음악을 잠시 꺼둔다.

let audioEl = null
let wantsToPlay = false // 사용자가 배경음악을 켠 상태인지 (아직 재생 못 했더라도)
let ducked = false // 발표 중이라 잠시 꺼둔 상태인지

function getAudio() {
  if (typeof window === 'undefined') return null
  if (!audioEl) {
    audioEl = new Audio('/bgm.mp3')
    audioEl.loop = true
    audioEl.volume = 0.25
  }
  return audioEl
}

function syncPlayback() {
  const audio = getAudio()
  if (!audio) return
  if (wantsToPlay && !ducked) {
    audio.play().catch(() => {
      // 아직 사용자 동작이 없어서 자동재생이 막힌 경우: 다음 동작 때 다시 시도된다.
    })
  } else {
    audio.pause()
  }
}

/** 첫 사용자 동작(클릭 등) 이후 배경음악을 켠다. */
export function startBgm() {
  wantsToPlay = true
  syncPlayback()
}

export function stopBgm() {
  wantsToPlay = false
  syncPlayback()
}

/** 발표(reveal) 애니메이션이 나오는 동안 배경음악을 잠시 끈다. */
export function duckBgmForReveal() {
  ducked = true
  syncPlayback()
}

/** 발표가 끝나면 배경음악을 다시 켠다. */
export function restoreBgmAfterReveal() {
  ducked = false
  syncPlayback()
}
