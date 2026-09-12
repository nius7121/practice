import { initializeApp } from 'firebase/app'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'

// 실제 Firebase 프로젝트를 만들었다면 .env.local 에 값을 채워 넣으세요.
// 값이 없으면 로컬 에뮬레이터에서만 동작하는 데모 설정으로 대체됩니다.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'live-draft-demo.firebaseapp.com',
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ||
    'https://live-draft-demo-default-rtdb.firebaseio.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'live-draft-demo',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:000000000000:web:demo',
}

export const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

const useEmulator = import.meta.env.VITE_USE_EMULATOR !== 'false'

let emulatorConnected = false
if (useEmulator && !emulatorConnected) {
  try {
    connectDatabaseEmulator(db, '127.0.0.1', 9000)
    emulatorConnected = true
  } catch (err) {
    // 이미 연결되어 있거나(HMR) 에뮬레이터가 꺼져 있으면 여기로 옵니다.
    console.warn('Realtime Database 에뮬레이터 연결 실패:', err.message)
  }
}
