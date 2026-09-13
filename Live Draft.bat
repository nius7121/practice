@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo   Live Draft 실행 중...
echo ============================================
echo.
echo 이 창들은 서버가 실행되는 동안 열려 있어야 합니다.
echo 종료하려면 열린 검은 창들을 닫으세요.
echo.

start "Live Draft - Realtime DB Emulator" cmd /k "npm run emulators"
start "Live Draft - Dev Server" cmd /k "npm run dev"

echo 서버가 켜질 때까지 잠시 기다립니다...
timeout /t 5 /nobreak >nul

start "" "http://localhost:5173"
