# Script to fix IIS website physical path
# Run as Administrator

param(
    [string]$SiteName = "Hackermans-Frontend"
)

Write-Host "[INFO] Checking IIS website configuration..." -ForegroundColor Cyan

# Import WebAdministration module
Import-Module WebAdministration -ErrorAction SilentlyContinue
if (-not (Get-Module WebAdministration)) {
    Write-Host "[ERROR] WebAdministration module not found!" -ForegroundColor Red
    Write-Host "Please run this script as Administrator" -ForegroundColor Yellow
    exit 1
}

# Check if website exists
$website = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if (-not $website) {
    Write-Host "[ERROR] Website '$SiteName' not found!" -ForegroundColor Red
    Write-Host "Available websites:" -ForegroundColor Yellow
    Get-Website | Select-Object Name, PhysicalPath | Format-Table
    exit 1
}

$currentPath = $website.PhysicalPath
$expectedPath = "C:\Users\DevAdmin03\Desktop\Hackermans\frontend\terminal\build"

Write-Host "Current Physical Path: $currentPath" -ForegroundColor Yellow
Write-Host "Expected Physical Path: $expectedPath" -ForegroundColor Yellow

if ($currentPath -ne $expectedPath) {
    Write-Host ""
    Write-Host "[INFO] Physical path is incorrect. Fixing..." -ForegroundColor Cyan
    
    # Remove and recreate website with correct path
    $port = $website.Bindings[0].BindingInformation.Split(':')[1]
    $appPool = $website.ApplicationPool
    
    Write-Host "  Port: $port" -ForegroundColor White
    Write-Host "  App Pool: $appPool" -ForegroundColor White
    
    Remove-Website -Name $SiteName
    Write-Host "  [OK] Removed website" -ForegroundColor Green
    
    New-Website -Name $SiteName `
        -Port $port `
        -PhysicalPath $expectedPath `
        -ApplicationPool $appPool
    
    Write-Host "  [OK] Recreated website with correct path" -ForegroundColor Green
} else {
    Write-Host "[OK] Physical path is correct" -ForegroundColor Green
}

# Verify web.config exists
$webConfigPath = Join-Path $expectedPath "web.config"
if (Test-Path $webConfigPath) {
    Write-Host "[OK] web.config exists at: $webConfigPath" -ForegroundColor Green
    
    # Validate XML
    try {
        [xml]$xml = Get-Content $webConfigPath
        Write-Host "[OK] web.config XML is valid" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] web.config XML is invalid: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[ERROR] web.config not found at: $webConfigPath" -ForegroundColor Red
    exit 1
}

# Check permissions
Write-Host ""
Write-Host "[INFO] Checking file permissions..." -ForegroundColor Cyan
$acl = Get-Acl $expectedPath
$hasIISAccess = $acl.Access | Where-Object { 
    $_.IdentityReference -like "*IIS_IUSRS*" -or 
    $_.IdentityReference -like "*IIS AppPool*" 
}

if (-not $hasIISAccess) {
    Write-Host "[WARNING] IIS_IUSRS may not have access. Adding permissions..." -ForegroundColor Yellow
    $permission = "IIS_IUSRS","ReadAndExecute","ContainerInherit,ObjectInherit","None","Allow"
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
    $acl.SetAccessRule($accessRule)
    Set-Acl $expectedPath $acl
    Write-Host "  [OK] Added IIS_IUSRS permissions" -ForegroundColor Green
} else {
    Write-Host "[OK] Permissions look good" -ForegroundColor Green
}

Write-Host ""
Write-Host "[SUCCESS] Website configuration fixed!" -ForegroundColor Green
Write-Host "Try accessing http://localhost:$port now" -ForegroundColor Cyan

