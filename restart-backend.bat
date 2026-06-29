@echo off
echo ==========================================
echo Restarting Backend Server
echo ==========================================
echo.

echo Step 1: Stopping any running Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo Step 2: Starting backend server...
cd backend
start "Backend Server" cmd /k "node app.js"
echo.

echo ==========================================
echo Backend server is starting...
echo Check the new terminal window for status
echo ==========================================
echo.
echo After server is ready:
echo 1. Refresh your browser (F5)
echo 2. The warnings should be gone
echo 3. Student names and data should appear
echo.
pause