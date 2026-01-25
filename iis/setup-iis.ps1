# PowerShell script to setup IIS for Hackermans project
# Services will run INSIDE IIS using iisnode (Node.js) and HttpPlatformHandler (Python/Flask)
# Run this script as Administrator

param(
    [string]$SiteName = "Hackermans",
    [string]$FrontendPort = "80",
    [string]$BackendPort = "8080",
    [string]$FlaskPort = "8081",
    [string]$ProjectPath = $PSScriptRoot + "\..",
    [string]$PythonPath = ""
)

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "[INFO] Setting up IIS for Hackermans project (Services run IN IIS)..." -ForegroundColor Green
Write-Host ""

# Import WebAdministration module
Import-Module WebAdministration -ErrorAction SilentlyContinue
if (-not (Get-Module WebAdministration)) {
    Write-Host "[ERROR] WebAdministration module not found. Installing IIS..." -ForegroundColor Red
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer -All
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures -All
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpErrors -All
    Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationInit -All
    Import-Module WebAdministration
}

# Install required IIS features
Write-Host "[INFO] Installing required IIS features..." -ForegroundColor Cyan
$features = @(
    "IIS-ApplicationInit",
    "IIS-ASPNET45"
)

foreach ($feature in $features) {
    $featureInstalled = Get-WindowsOptionalFeature -Online -FeatureName $feature -ErrorAction SilentlyContinue
    if ($featureInstalled.State -ne "Enabled") {
        Write-Host "  Installing $feature..." -ForegroundColor Yellow
        Enable-WindowsOptionalFeature -Online -FeatureName $feature -All -NoRestart
    } else {
        Write-Host "  [OK] $feature already installed" -ForegroundColor Green
    }
}

# Note: IIS-URLRewrite is a separate module, not a Windows feature
# It will be checked separately below

# Check for URL Rewrite module
$rewriteModule = Get-WebGlobalModule -Name "RewriteModule" -ErrorAction SilentlyContinue
if (-not $rewriteModule) {
    Write-Host ""
    Write-Host "[WARNING] URL Rewrite module not found!" -ForegroundColor Yellow
    Write-Host "Please download and install URL Rewrite 2.1 from:" -ForegroundColor Yellow
    Write-Host "https://www.iis.net/downloads/microsoft/url-rewrite" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
}

# Check for iisnode module
Write-Host ""
Write-Host "[INFO] Checking for iisnode module..." -ForegroundColor Cyan
$iisnodeModule = Get-WebGlobalModule -Name "iisnode" -ErrorAction SilentlyContinue
if (-not $iisnodeModule) {
    Write-Host "  [WARNING] iisnode module not found!" -ForegroundColor Yellow
    Write-Host "  Please download and install iisnode from:" -ForegroundColor Yellow
    Write-Host "  https://github.com/Azure/iisnode/releases" -ForegroundColor Cyan
    Write-Host "  Or: https://github.com/azure/iisnode/wiki" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "  [OK] iisnode module found" -ForegroundColor Green
}

# Check for HttpPlatformHandler
Write-Host ""
Write-Host "[INFO] Checking for HttpPlatformHandler..." -ForegroundColor Cyan
$httpPlatformHandler = Get-WebGlobalModule -Name "httpPlatformHandler" -ErrorAction SilentlyContinue
if (-not $httpPlatformHandler) {
    Write-Host "  [WARNING] HttpPlatformHandler not found!" -ForegroundColor Yellow
    Write-Host "  Please download and install HttpPlatformHandler from:" -ForegroundColor Yellow
    Write-Host "  https://www.iis.net/downloads/microsoft/httpplatformhandler" -ForegroundColor Cyan
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") {
        exit 1
    }
} else {
    Write-Host "  [OK] HttpPlatformHandler found" -ForegroundColor Green
}

# Find Python path
if ([string]::IsNullOrEmpty($PythonPath)) {
    Write-Host ""
    Write-Host "[INFO] Finding Python installation..." -ForegroundColor Cyan
    $pythonExe = Get-Command python -ErrorAction SilentlyContinue
    if ($pythonExe) {
        $PythonPath = $pythonExe.Source
        Write-Host "  [OK] Found Python: $PythonPath" -ForegroundColor Green
    } else {
        Write-Host "  [WARNING] Python not found in PATH" -ForegroundColor Yellow
        $PythonPath = Read-Host "  Enter full path to python.exe (e.g., C:\Python\python.exe)"
        if (-not (Test-Path $PythonPath)) {
            Write-Host "  [ERROR] Python path not found: $PythonPath" -ForegroundColor Red
            exit 1
        }
    }
}

# Build React frontend
Write-Host ""
Write-Host "[INFO] Building React frontend..." -ForegroundColor Cyan
$frontendPath = Join-Path $ProjectPath "frontend\terminal"
if (Test-Path $frontendPath) {
    Push-Location $frontendPath
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Host "  Installing frontend dependencies..." -ForegroundColor Yellow
            npm install
        }
        Write-Host "  Building production bundle..." -ForegroundColor Yellow
        $env:CI = "false"
        npm run build
        Write-Host "  [OK] Frontend built successfully" -ForegroundColor Green
    } catch {
        Write-Host "  [ERROR] Failed to build frontend: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
} else {
    Write-Host "  [ERROR] Frontend directory not found: $frontendPath" -ForegroundColor Red
    exit 1
}

# Install backend dependencies
Write-Host ""
Write-Host "[INFO] Installing backend dependencies..." -ForegroundColor Cyan
$backendPath = Join-Path $ProjectPath "backend"
if (Test-Path $backendPath) {
    Push-Location $backendPath
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Host "  Installing Node.js dependencies..." -ForegroundColor Yellow
            npm install
        } else {
            Write-Host "  [OK] Backend dependencies already installed" -ForegroundColor Green
        }
    } catch {
        Write-Host "  [ERROR] Failed to install backend dependencies: $_" -ForegroundColor Red
        exit 1
    } finally {
        Pop-Location
    }
}

# Create application pools
Write-Host ""
Write-Host "[INFO] Creating application pools..." -ForegroundColor Cyan

# Frontend app pool
$frontendPoolName = "${SiteName}-Frontend"
if (Get-WebAppPoolState -Name $frontendPoolName -ErrorAction SilentlyContinue) {
    Remove-WebAppPool -Name $frontendPoolName
    Write-Host "  Removed existing pool: $frontendPoolName" -ForegroundColor Yellow
}
New-WebAppPool -Name $frontendPoolName
Set-ItemProperty "IIS:\AppPools\$frontendPoolName" -Name managedRuntimeVersion -Value ""
Set-ItemProperty "IIS:\AppPools\$frontendPoolName" -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(0))
Write-Host "  [OK] Created app pool: $frontendPoolName" -ForegroundColor Green

# Backend app pool (for iisnode)
$backendPoolName = "${SiteName}-Backend"
if (Get-WebAppPoolState -Name $backendPoolName -ErrorAction SilentlyContinue) {
    Remove-WebAppPool -Name $backendPoolName
    Write-Host "  Removed existing pool: $backendPoolName" -ForegroundColor Yellow
}
New-WebAppPool -Name $backendPoolName
Set-ItemProperty "IIS:\AppPools\$backendPoolName" -Name managedRuntimeVersion -Value ""
Set-ItemProperty "IIS:\AppPools\$backendPoolName" -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(0))
Write-Host "  [OK] Created app pool: $backendPoolName" -ForegroundColor Green

# Flask app pool (for HttpPlatformHandler)
$flaskPoolName = "${SiteName}-Flask"
if (Get-WebAppPoolState -Name $flaskPoolName -ErrorAction SilentlyContinue) {
    Remove-WebAppPool -Name $flaskPoolName
    Write-Host "  Removed existing pool: $flaskPoolName" -ForegroundColor Yellow
}
New-WebAppPool -Name $flaskPoolName
Set-ItemProperty "IIS:\AppPools\$flaskPoolName" -Name managedRuntimeVersion -Value ""
Set-ItemProperty "IIS:\AppPools\$flaskPoolName" -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(0))
Write-Host "  [OK] Created app pool: $flaskPoolName" -ForegroundColor Green

# Create websites
Write-Host ""
Write-Host "[INFO] Creating IIS websites..." -ForegroundColor Cyan

# Frontend website
$frontendBuildPath = Join-Path $frontendPath "build"
$frontendIISPath = Join-Path $ProjectPath "iis\frontend"

if (Get-Website -Name "${SiteName}-Frontend" -ErrorAction SilentlyContinue) {
    Remove-Website -Name "${SiteName}-Frontend"
    Write-Host "  Removed existing site: ${SiteName}-Frontend" -ForegroundColor Yellow
}

# Copy web.config to build directory
Copy-Item (Join-Path $frontendIISPath "web.config") -Destination $frontendBuildPath -Force

New-Website -Name "${SiteName}-Frontend" `
    -Port $FrontendPort `
    -PhysicalPath $frontendBuildPath `
    -ApplicationPool $frontendPoolName
Write-Host "  [OK] Created website: ${SiteName}-Frontend on port $FrontendPort" -ForegroundColor Green

# Backend website (iisnode - runs Node.js in IIS)
$backendIISPath = Join-Path $ProjectPath "iis\backend"
if (Get-Website -Name "${SiteName}-Backend" -ErrorAction SilentlyContinue) {
    Remove-Website -Name "${SiteName}-Backend"
    Write-Host "  Removed existing site: ${SiteName}-Backend" -ForegroundColor Yellow
}

# Copy web.config to backend directory
Copy-Item (Join-Path $backendIISPath "web.config") -Destination $backendPath -Force

New-Website -Name "${SiteName}-Backend" `
    -Port $BackendPort `
    -PhysicalPath $backendPath `
    -ApplicationPool $backendPoolName
Write-Host "  [OK] Created website: ${SiteName}-Backend on port $BackendPort (iisnode)" -ForegroundColor Green

# Flask website (HttpPlatformHandler - runs Python in IIS)
$flaskIISPath = Join-Path $ProjectPath "iis\flask"
$aimlPath = Join-Path $ProjectPath "aiml"

if (Get-Website -Name "${SiteName}-Flask" -ErrorAction SilentlyContinue) {
    Remove-Website -Name "${SiteName}-Flask"
    Write-Host "  Removed existing site: ${SiteName}-Flask" -ForegroundColor Yellow
}

# Copy web.config and startup.py to aiml directory
Copy-Item (Join-Path $flaskIISPath "web.config") -Destination $aimlPath -Force
Copy-Item (Join-Path $flaskIISPath "startup.py") -Destination $aimlPath -Force

# Update web.config with Python path
$flaskWebConfig = Join-Path $aimlPath "web.config"
$webConfigContent = Get-Content $flaskWebConfig -Raw
$webConfigContent = $webConfigContent -replace "%PYTHON_PATH%", $PythonPath
Set-Content -Path $flaskWebConfig -Value $webConfigContent

New-Website -Name "${SiteName}-Flask" `
    -Port $FlaskPort `
    -PhysicalPath $aimlPath `
    -ApplicationPool $flaskPoolName
Write-Host "  [OK] Created website: ${SiteName}-Flask on port $FlaskPort (HttpPlatformHandler)" -ForegroundColor Green

# Create logs directory for Flask
$flaskLogsPath = Join-Path $aimlPath "logs"
if (-not (Test-Path $flaskLogsPath)) {
    New-Item -ItemType Directory -Path $flaskLogsPath -Force | Out-Null
    Write-Host "  [OK] Created logs directory for Flask" -ForegroundColor Green
}

# Update frontend API URLs
Write-Host ""
Write-Host "[INFO] Updating frontend API URLs..." -ForegroundColor Cyan
$updateScript = Join-Path $PSScriptRoot "update-frontend-api.ps1"
if (Test-Path $updateScript) {
    & $updateScript -BuildPath $frontendBuildPath
}

Write-Host ""
Write-Host "[SUCCESS] IIS setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:$FrontendPort" -ForegroundColor White
Write-Host "  Backend API (iisnode): http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  Flask API (HttpPlatformHandler): http://localhost:$FlaskPort" -ForegroundColor White
Write-Host ""
Write-Host "[INFO] Services are now running INSIDE IIS!" -ForegroundColor Green
Write-Host ""
Write-Host "[IMPORTANT] Make sure Ollama is running:" -ForegroundColor Yellow
Write-Host "  ollama serve (port 11434)" -ForegroundColor White
Write-Host ""
Write-Host "To start/stop IIS sites, use:" -ForegroundColor Cyan
Write-Host "  Start-Website -Name '${SiteName}-Frontend'" -ForegroundColor White
Write-Host "  Start-Website -Name '${SiteName}-Backend'" -ForegroundColor White
Write-Host "  Start-Website -Name '${SiteName}-Flask'" -ForegroundColor White
Write-Host ""
Write-Host "To view logs:" -ForegroundColor Cyan
Write-Host "  Backend: Check IIS logs and iisnode logs" -ForegroundColor White
Write-Host "  Flask: Check $flaskLogsPath\stdout.log" -ForegroundColor White
Write-Host ""
Write-Host "To restart services:" -ForegroundColor Cyan
Write-Host "  Restart-WebAppPool -Name '$backendPoolName'" -ForegroundColor White
Write-Host "  Restart-WebAppPool -Name '$flaskPoolName'" -ForegroundColor White
