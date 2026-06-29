@echo off
REM Master setup script for Windows
REM Usage: Double-click this file or run: setup-all.bat
REM Run this from the project root folder

echo ======================================
echo VFlow Integration - Complete Setup
echo ======================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo Running from: %CD%
echo.

REM Verify we're in the right directory
if not exist "backend" (
    echo ERROR: backend folder not found!
    echo Please run this script from the project root folder
    echo Current folder: %CD%
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERROR: frontend folder not found!
    echo Please run this script from the project root folder
    echo Current folder: %CD%
    pause
    exit /b 1
)

if not exist "workflow" (
    echo ERROR: workflow folder not found!
    echo Please run this script from the project root folder
    echo Current folder: %CD%
    pause
    exit /b 1
)

echo Project structure verified!
echo.

REM Check if running in Git Bash/WSL
if not "%OS%"=="Windows_NT" (
    echo Please run: bash setup-all.sh
    pause
    exit /b 1
)

echo This will setup:
echo  1. Load environment variables
echo  2. Check prerequisites
echo  3. Install dependencies
echo  4. Create and migrate database
echo  5. Provision VFlow workflow
echo.

set /p CONTINUE="Continue? (Y/N): "
if /i not "%CONTINUE%"=="Y" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo ======================================
echo Step 1/5: Loading environment variables
echo ======================================
echo.

REM Set environment variables for current session
set VFLOW_BASE_URL=https://sqavflow.vastar.id
set VFLOW_TENANT=_default
set VFLOW_ADMIN_KEY=18539d565293b6476759a5e04cceeb5275971b136aa73a5bddfc10a4fb35d949
set LOGSTREAM_TOKEN=S8gZXQCDS9TWkol3ARO4Mw7TPtesGnAHIJlONCVcOVc=
set VFLOW_PACK_SECRET_KEY_B64=eoL945DRr40vXsjYrIhtP4C1xcxwGacZC1R6RspZN/Y=
set DATABASE_URL=postgresql://postgres:postgres123@127.0.0.1:5432/kelompok1_internship
set KELOMPOK1_DATABASE_URL=postgresql://postgres:postgres123@db-tunnel.vastar.id:15431/kelompok1_internship
set KELOMPOK1_DATABASE_NAME=kelompok1_internship
set KELOMPOK1_DATABASE_USER=postgres
set KELOMPOK1_DATABASE_PASSWORD=postgres123

echo Environment variables set!
echo.

REM Check Node.js
echo ======================================
echo Step 2/5: Checking prerequisites
echo ======================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found! Please install Node.js v16+
    pause
    exit /b 1
)
echo Node.js found
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: npm not found! Please install npm
    pause
    exit /b 1
)
echo npm found
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: PostgreSQL not found! Please install PostgreSQL
    pause
    exit /b 1
)
echo PostgreSQL found
echo.

REM Install dependencies
echo ======================================
echo Step 3/5: Installing dependencies
echo ======================================
echo.

echo Installing backend dependencies...
cd backend
call npm install pg --save
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend dependencies installed!
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo WARNING: Frontend dependencies installation failed
) else (
    echo Frontend dependencies installed!
)
cd ..

echo.

REM Setup database
echo ======================================
echo Step 4/5: Setting up database
echo ======================================
echo.

echo Creating database...
psql -U postgres -c "CREATE DATABASE kelompok1_internship;" 2>nul
if %errorlevel% equ 0 (
    echo Database created successfully!
) else (
    echo Database might already exist, continuing...
)

echo.
echo Running database migration...
cd backend
node scripts/migrate-to-postgresql.js
if %errorlevel% neq 0 (
    echo ERROR: Database migration failed
    pause
    exit /b 1
)
cd ..

echo.

REM Provision VFlow
echo ======================================
echo Step 5/5: Provisioning VFlow workflow
echo ======================================
echo.

echo Provisioning workflow to VFlow...
bash workflow/scripts/provision-vflow.sh
if %errorlevel% neq 0 (
    echo WARNING: VFlow provisioning failed
    echo You can try again later with: bash workflow/scripts/provision-vflow.sh
) else (
    echo VFlow workflow provisioned successfully!
)

echo.
echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Summary:
echo   - Dependencies installed
echo   - PostgreSQL database created
echo   - Database schema migrated (10 tables)
echo   - VFlow workflow provisioned
echo.
echo Next Steps:
echo   1. Test VFlow: bash workflow/scripts/smoke-vflow.sh
echo   2. Start backend: cd backend ^& npm run dev
echo   3. Start frontend: cd frontend ^& npm run dev
echo.
echo Access URLs:
echo   - Frontend: http://localhost:5173
echo   - Backend: http://localhost:3000
echo   - VFlow: https://sqavflow.vastar.id/webhook/kelompok1/internship/register-test
echo.
echo Default admin: admin@example.com / adminpass
echo.
echo Remember to run 'bash setup-env.sh' in new terminal sessions!
echo.
pause