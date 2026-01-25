@echo off
REM Batch script to start all Hackermans services
REM This script starts the Node.js backend and Flask AI service

echo Starting Hackermans Services...
echo.

REM Get the script directory
set SCRIPT_DIR=%~dp0
set PROJECT_DIR=%SCRIPT_DIR%..

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Start Node.js Backend
echo Starting Node.js Backend (Port 4000)...
start "Hackermans Backend" cmd /k "cd /d %PROJECT_DIR%\backend && npm start"
timeout /t 3 /nobreak >nul

REM Start Flask AI Service
echo Starting Flask AI Service (Port 5001)...
start "Hackermans Flask" cmd /k "cd /d %PROJECT_DIR%\aiml && python flask-ollama-app.py"
timeout /t 3 /nobreak >nul

echo.
echo Services started!
echo.
echo Backend API: http://localhost:4000
echo Flask API: http://localhost:5001
echo.
echo Make sure Ollama is also running: ollama serve
echo.
echo Press any key to exit...
pause >nul



