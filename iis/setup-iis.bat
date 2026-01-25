@echo off
REM Batch file wrapper to run setup-iis.ps1 script
REM This ensures the script runs in PowerShell instead of opening in Notepad

echo Running IIS Setup Script...
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

REM Run the PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "%~dp0setup-iis.ps1"

pause

