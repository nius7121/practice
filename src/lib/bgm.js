// 배경음악(BGM) 재생 제어.
// 브라우저 자동재생 정책 및 화면 전환 시 오디오 겹침 방지.

let audioEl = null
let isStoppedForReveal = false
let playPromise = null

function getAudio() {
  if (typeof window === 'undefined') return null
  if (!audioEl) {
    audioEl = new Audio('/bgm.mp3')
    audioEl.loop = true
    audioEl.volume = 0.25
  }
  return audioEl
}

/** 첫 사용자 동작(클릭 등) 이후 배경음악을 켠다. 발표 중에는 재생되지 않는다. */
export function startBgm() {
  if (isStoppedForReveal) return
  const audio = getAudio()
  if (!audio) return

  try {
    playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // 자동재생 차단 등 처리
      })
    }
  } catch {
    // ignore
  }
}

/**
 * 화면 전환 시 기존 오디오 객체를 확실하게 정지(stop/pause 및 시간 초기화)시킨다.
 */
export function forceStopBgm() {
  isStoppedForReveal = true
  const audio = getAudio()
  if (!audio) return

  if (playPromise !== undefined && playPromise !== null) {
    playPromise
      .then(() => {
        audio.pause()
        audio.currentTime = 0
      })
      .catch(() => {
        audio.pause()
        audio.currentTime = 0
      })
      .finally(() => {
        playPromise = null
      })
  } else {
    try {
      audio.pause()
      audio.currentTime = 0
    } catch {
      // ignore
    }
  }
}

export function stopBgm() {
  forceStopBgm()
}

/** 발표(reveal) 화면에서는 효과음에 집중할 수 있도록 배경음악을 확실히 끈다. */
export function duckBgmForReveal() {
  forceStopBgm()
}

/** 발표가 완전히 끝난 후 복구 시 호출 */
export function restoreBgmAfterReveal() {
  isStoppedForReveal = false
}
