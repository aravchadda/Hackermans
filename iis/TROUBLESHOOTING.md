# Troubleshooting IIS Setup

## Error 500.19 - Cannot read configuration file (Error Code: 0x8007007b)

This error typically occurs when:

### 1. iisnode Module Not Installed

**Symptom:** Error when accessing backend website (port 8080)

**Solution:**
1. Download iisnode from: https://github.com/Azure/iisnode/releases
2. Install the MSI package
3. Restart IIS: `iisreset` (run as Administrator)
4. Verify installation:
   ```powershell
   # Run PowerShell as Administrator
   Import-Module WebAdministration
   Get-WebGlobalModule -Name "iisnode"
   ```

### 2. HttpPlatformHandler Not Installed

**Symptom:** Error when accessing Flask website (port 8081)

**Solution:**
1. Download HttpPlatformHandler from: https://www.iis.net/downloads/microsoft/httpplatformhandler
2. Install the MSI package
3. Restart IIS: `iisreset` (run as Administrator)
4. Verify installation:
   ```powershell
   # Run PowerShell as Administrator
   Import-Module WebAdministration
   Get-WebGlobalModule -Name "httpPlatformHandler"
   ```

### 3. URL Rewrite Module Not Installed

**Symptom:** Error when accessing frontend or backend

**Solution:**
1. Download URL Rewrite from: https://www.iis.net/downloads/microsoft/url-rewrite
2. Install the MSI package
3. Restart IIS: `iisreset` (run as Administrator)

### 4. Permission Issues

**Symptom:** Cannot read configuration file

**Solution:**
1. Ensure IIS_IUSRS has read access to project directories
2. Run as Administrator:
   ```powershell
   $path = "C:\Users\DevAdmin03\Desktop\Hackermans"
   $acl = Get-Acl $path
   $permission = "IIS_IUSRS","ReadAndExecute","ContainerInherit,ObjectInherit","None","Allow"
   $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
   $acl.SetAccessRule($accessRule)
   Set-Acl $path $acl
   ```

### 5. Invalid XML in web.config

**Symptom:** Configuration file parse errors

**Solution:**
1. Validate XML:
   ```powershell
   [System.Xml.XmlDocument]$xml = New-Object System.Xml.XmlDocument
   $xml.Load("C:\Users\DevAdmin03\Desktop\Hackermans\backend\web.config")
   ```
2. Check for:
   - Unclosed tags
   - Invalid characters
   - Encoding issues

## Error 502 Bad Gateway

### Backend (iisnode)

**Causes:**
- Node.js not installed or not in PATH
- Missing node_modules (run `npm install` in backend folder)
- Application pool not running
- Port conflict

**Solution:**
1. Check Node.js:
   ```powershell
   node --version
   ```
2. Install dependencies:
   ```powershell
   cd backend
   npm install
   ```
3. Check application pool:
   ```powershell
   Get-WebAppPoolState -Name "Hackermans-Backend"
   ```
4. Restart application pool:
   ```powershell
   Restart-WebAppPool -Name "Hackermans-Backend"
   ```
5. Check iisnode logs:
   - Location: `backend/iisnode/`
   - Look for error messages

### Flask (HttpPlatformHandler)

**Causes:**
- Python not installed or wrong path
- Missing Python dependencies
- Application pool not running
- Port conflict

**Solution:**
1. Check Python:
   ```powershell
   python --version
   ```
2. Verify Python path in `aiml/web.config`:
   ```xml
   <httpPlatform processPath="C:\Python\python.exe" ... />
   ```
3. Install dependencies:
   ```powershell
   cd aiml
   pip install -r requirements.txt
   ```
4. Check application pool:
   ```powershell
   Get-WebAppPoolState -Name "Hackermans-Flask"
   ```
5. Check Flask logs:
   - Location: `aiml/logs/stdout.log`
   - Look for error messages

## Module Installation Checklist

Before running the setup, ensure these are installed:

- [ ] **URL Rewrite Module 2.1**
  - Download: https://www.iis.net/downloads/microsoft/url-rewrite
  - Install MSI, restart IIS

- [ ] **iisnode** (for Node.js backend)
  - Download: https://github.com/Azure/iisnode/releases
  - Install MSI, restart IIS

- [ ] **HttpPlatformHandler** (for Flask)
  - Download: https://www.iis.net/downloads/microsoft/httpplatformhandler
  - Install MSI, restart IIS

## Quick Verification Commands

Run these in PowerShell as Administrator:

```powershell
# Import module
Import-Module WebAdministration

# Check modules
Get-WebGlobalModule | Where-Object { $_.Name -in @("RewriteModule", "iisnode", "httpPlatformHandler") }

# Check websites
Get-Website | Where-Object { $_.Name -like "Hackermans*" }

# Check application pools
Get-WebAppPoolState | Where-Object { $_.Name -like "Hackermans*" }

# Check if services are running
Get-Process | Where-Object { $_.ProcessName -in @("node", "python") }
```

## Common Issues

### "Module not found" errors

**Solution:** Install the required module and restart IIS

### "Access denied" errors

**Solution:** Run PowerShell as Administrator and check file permissions

### "Port already in use" errors

**Solution:** Change ports in setup script or stop conflicting services

### Services not starting

**Solution:** 
1. Check logs (iisnode, Flask stdout.log)
2. Verify dependencies are installed
3. Check application pool status
4. Restart IIS: `iisreset`

## Getting Help

1. Check IIS logs: `C:\inetpub\logs\LogFiles\`
2. Check application logs:
   - Backend: `backend/iisnode/`
   - Flask: `aiml/logs/stdout.log`
3. Check Windows Event Viewer for IIS errors
4. Verify all modules are installed
5. Check file permissions



