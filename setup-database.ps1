# Setup MSSQL Database in Docker and Import Backup
# This script will:
# 1. Start the MSSQL Docker container
# 2. Wait for it to be ready
# 3. Import the database from the uploads folder

param(
    [string]$BackupFile = "",
    [switch]$SkipImport = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=== MSSQL Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check for docker-compose
Write-Host "Checking docker-compose..." -ForegroundColor Yellow
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue) -and -not (docker compose version 2>$null)) {
    Write-Host "Error: docker-compose not found. Please install Docker Compose." -ForegroundColor Red
    exit 1
}
Write-Host "docker-compose is available" -ForegroundColor Green

# Start the MSSQL container
Write-Host ""
Write-Host "Starting MSSQL container..." -ForegroundColor Yellow
if (docker compose version 2>$null) {
    docker compose up -d
} else {
    docker-compose up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to start MSSQL container" -ForegroundColor Red
    exit 1
}

Write-Host "MSSQL container started" -ForegroundColor Green

# Wait for MSSQL to be ready
Write-Host ""
Write-Host "Waiting for MSSQL to be ready (this may take 30-60 seconds)..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    Start-Sleep -Seconds 2
    $attempt++
    
    try {
        $result = docker exec hackermans-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -C -Q "SELECT 1" -h -1 2>&1
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            Write-Host "MSSQL is ready!" -ForegroundColor Green
        } else {
            Write-Host "." -NoNewline
        }
    } catch {
        Write-Host "." -NoNewline
    }
}

if (-not $ready) {
    Write-Host ""
    Write-Host "Error: MSSQL did not become ready within the timeout period" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Import database if not skipped
if (-not $SkipImport) {
    Write-Host ""
    Write-Host "=== Database Import ===" -ForegroundColor Cyan
    
    # Find backup file
    $uploadsPath = Join-Path $PSScriptRoot "backend\uploads"
    $backupFile = $null
    
    if ($BackupFile -ne "") {
        $backupFile = $BackupFile
        if (-not (Test-Path $backupFile)) {
            Write-Host "Error: Backup file not found: $backupFile" -ForegroundColor Red
            exit 1
        }
    } else {
        # Look for .bak files in uploads folder
        $bakFiles = Get-ChildItem -Path $uploadsPath -Filter "*.bak" -ErrorAction SilentlyContinue
        if ($bakFiles.Count -gt 0) {
            $backupFile = $bakFiles[0].FullName
            Write-Host "Found backup file: $backupFile" -ForegroundColor Green
        } else {
            # Check for files without extension (as expected by restore script)
            $files = Get-ChildItem -Path $uploadsPath -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -eq "" -or $_.Extension -eq ".bak" }
            if ($files.Count -gt 0) {
                $backupFile = $files[0].FullName
                Write-Host "Found backup file: $backupFile" -ForegroundColor Green
            }
        }
    }
    
    if ($null -eq $backupFile) {
        Write-Host "Warning: No backup file found in $uploadsPath" -ForegroundColor Yellow
        Write-Host "Please place your database backup file (.bak) in the backend/uploads folder" -ForegroundColor Yellow
        Write-Host "You can run the restore script later with: node backend/scripts/restore_backup.js" -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Importing database from: $backupFile" -ForegroundColor Yellow
        
        # Change to backend directory and run restore script
        Push-Location (Join-Path $PSScriptRoot "backend")
        try {
            node scripts/restore_backup.js
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "Database imported successfully!" -ForegroundColor Green
            } else {
                Write-Host ""
                Write-Host "Error: Database import failed" -ForegroundColor Red
                exit 1
            }
        } finally {
            Pop-Location
        }
    }
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "MSSQL is running on: localhost:1433" -ForegroundColor Green
Write-Host "Database name: hackermans" -ForegroundColor Green
Write-Host "Username: sa" -ForegroundColor Green
Write-Host "Password: YourStrong!Passw0rd" -ForegroundColor Green
Write-Host ""
Write-Host "To stop the container: docker-compose down" -ForegroundColor Yellow
Write-Host "To view logs: docker-compose logs -f mssql" -ForegroundColor Yellow
