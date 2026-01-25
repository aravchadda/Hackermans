@echo off
REM Batch script to stop all Hackermans services

echo Stopping Hackermans Services...
echo.

REM Kill Node.js processes (backend)
echo Stopping Node.js Backend...
taskkill /FI "WINDOWTITLE eq Hackermans Backend*" /T /F >nul 2>&1
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill Python processes (Flask)
echo Stopping Flask AI Service...
taskkill /FI "WINDOWTITLE eq Hackermans Flask*" /T /F >nul 2>&1
for /f "tokens=2" %%a in ('netstat -ano ^| findstr :5001 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo.
echo Services stopped!
echo.
pause



