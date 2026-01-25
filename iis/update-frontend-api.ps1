# PowerShell script to update frontend API URLs after build
# This script updates the hardcoded API URLs in the React build to use relative paths

param(
    [string]$BuildPath = "..\frontend\terminal\build"
)

$BuildPath = Resolve-Path $BuildPath -ErrorAction SilentlyContinue

if (-not $BuildPath -or -not (Test-Path $BuildPath)) {
    Write-Host "[ERROR] Build directory not found: $BuildPath" -ForegroundColor Red
    Write-Host "Please build the frontend first: cd frontend\terminal && npm run build" -ForegroundColor Yellow
    exit 1
}

Write-Host "[INFO] Updating API URLs in frontend build..." -ForegroundColor Cyan

$jsFiles = Get-ChildItem -Path $BuildPath -Filter "*.js" -Recurse -File

$replacements = @{
    "http://localhost:4000/api" = "/api"
    "http://127.0.0.1:4000/api" = "/api"
    "http://localhost:5001" = "/flask-api"
    "http://127.0.0.1:5001" = "/flask-api"
}

$totalUpdated = 0

foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    foreach ($key in $replacements.Keys) {
        if ($content -match [regex]::Escape($key)) {
            $content = $content -replace [regex]::Escape($key), $replacements[$key]
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline -Encoding UTF8
        $totalUpdated++
        Write-Host "  [OK] Updated: $($file.Name)" -ForegroundColor Green
    }
}

if ($totalUpdated -eq 0) {
    Write-Host "  [INFO] No files needed updating (URLs may already be relative)" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "[SUCCESS] Updated $totalUpdated file(s)" -ForegroundColor Green
}
