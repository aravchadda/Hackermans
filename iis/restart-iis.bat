@echo off
REM Restart IIS Server
REM Run this file as Administrator

echo Restarting IIS Server...
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

iisreset

echo.
echo IIS Server has been restarted.
pause

