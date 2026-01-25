# IIS Deployment Guide - Services Running IN IIS

This guide explains how to deploy Hackermans with **services running directly inside IIS** using:
- **iisnode** for Node.js backend
- **HttpPlatformHandler** for Python/Flask service

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Browser                           │
│              http://localhost (Port 80)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              IIS Frontend Website (Port 80)                  │
│  - Serves React static files                                │
│  - Proxies /api/* to Backend (Port 8080)                   │
│  - Proxies /flask-api/* to Flask (Port 8081)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌──────────────────┐        ┌──────────────────┐
│ IIS Backend Site │        │  IIS Flask Site  │
│   (Port 8080)    │        │   (Port 8081)    │
│                  │        │                  │
│  iisnode Module  │        │ HttpPlatform     │
│  Runs Node.js    │        │ Handler          │
│  INSIDE IIS      │        │ Runs Python      │
│                  │        │ INSIDE IIS       │
└──────────────────┘        └──────────────────┘
```

## Prerequisites

### Required Software

1. **Windows Server** or **Windows 10/11 Pro** with IIS installed
2. **Node.js 16+** installed
3. **Python 3.8+** installed
4. **iisnode** module ([Download](https://github.com/Azure/iisnode/releases))
5. **HttpPlatformHandler** ([Download](https://www.iis.net/downloads/microsoft/httpplatformhandler))
6. **IIS URL Rewrite Module 2.1** ([Download](https://www.iis.net/downloads/microsoft/url-rewrite))
7. **Ollama** installed and running

### Installation Order

1. Install IIS and required features
2. Install URL Rewrite Module
3. Install iisnode
4. Install HttpPlatformHandler
5. Run setup script

## Quick Setup

### Step 1: Install Required Modules

**iisnode:**
1. Download from: https://github.com/Azure/iisnode/releases
2. Install the MSI package
3. Restart IIS: `iisreset`

**HttpPlatformHandler:**
1. Download from: https://www.iis.net/downloads/microsoft/httpplatformhandler
2. Install the MSI package
3. Restart IIS: `iisreset`

### Step 2: Run Setup Script

```powershell
# Open PowerShell as Administrator
cd C:\Users\DevAdmin03\Desktop\Hackermans\iis
.\setup-iis.ps1
```

The script will:
- Check for required modules
- Build React frontend
- Install backend dependencies
- Create IIS application pools
- Create IIS websites
- Configure services to run in IIS

### Step 3: Start Ollama

```bash
ollama serve
```

### Step 4: Access Application

Open browser: **http://localhost**

## How It Works

### Node.js Backend (iisnode)

**iisnode** is an IIS module that allows Node.js applications to run directly inside IIS.

**Configuration** (`iis/backend/web.config`):
- Uses `iisnode` handler for `index.js`
- URL Rewrite routes all requests to `index.js`
- Node.js process runs inside IIS worker process

**Benefits:**
- Integrated with IIS process management
- Automatic process recycling
- Integrated logging
- No separate Node.js process to manage

### Flask Service (HttpPlatformHandler)

**HttpPlatformHandler** allows any executable (Python, Node.js, etc.) to run as an IIS application.

**Configuration** (`iis/flask/web.config`):
- Uses `httpPlatformHandler` to run Python
- Executes `startup.py` which imports and runs Flask app
- IIS manages the Python process lifecycle

**Benefits:**
- Integrated with IIS
- Automatic restart on failure
- Process management
- Integrated logging

## Configuration Files

### Backend web.config (iisnode)

Located at: `backend/web.config`

Key settings:
- Handler: `iisnode` for `index.js`
- URL Rewrite: Routes all requests to `index.js`
- Logging: Enabled in `iisnode` directory

### Flask web.config (HttpPlatformHandler)

Located at: `aiml/web.config`

Key settings:
- Handler: `httpPlatformHandler`
- Process: Python executable path
- Arguments: `startup.py`
- Logs: `aiml/logs/stdout.log`

### Flask startup.py

Located at: `aiml/startup.py`

This script:
- Imports Flask app from `flask-ollama-app.py`
- Binds to port provided by IIS (`HTTP_PLATFORM_PORT`)
- Runs Flask server

## Managing Services

### Start/Stop Websites

```powershell
# Start all sites
Start-Website -Name "Hackermans-Frontend"
Start-Website -Name "Hackermans-Backend"
Start-Website -Name "Hackermans-Flask"

# Stop all sites
Stop-Website -Name "Hackermans-Frontend"
Stop-Website -Name "Hackermans-Backend"
Stop-Website -Name "Hackermans-Flask"
```

### Restart Application Pools

```powershell
# Restart backend (Node.js)
Restart-WebAppPool -Name "Hackermans-Backend"

# Restart Flask (Python)
Restart-WebAppPool -Name "Hackermans-Flask"
```

### Check Status

```powershell
# Check websites
Get-Website | Where-Object { $_.Name -like "Hackermans*" }

# Check application pools
Get-WebAppPoolState | Where-Object { $_.Name -like "Hackermans*" }
```

## Logging

### Backend Logs (iisnode)

- Location: `backend/iisnode/`
- Files: `iisnode-*.log`
- Contains: Node.js console output and errors

### Flask Logs (HttpPlatformHandler)

- Location: `aiml/logs/`
- File: `stdout.log`
- Contains: Python/Flask console output

### IIS Logs

- Location: `C:\inetpub\logs\LogFiles\`
- Contains: HTTP request logs

## Troubleshooting

### Backend Not Starting (iisnode)

**Symptoms:**
- 502 Bad Gateway
- Website shows error

**Solutions:**
1. Check iisnode is installed: `Get-WebGlobalModule -Name "iisnode"`
2. Check `backend/web.config` exists
3. Check `backend/index.js` exists
4. Check application pool is running
5. Check iisnode logs: `backend/iisnode/`

**Common Issues:**
- Missing `node_modules`: Run `npm install` in `backend/`
- Port conflict: Check no other service on port 8080
- Permissions: Ensure IIS_IUSRS has read access to `backend/`

### Flask Not Starting (HttpPlatformHandler)

**Symptoms:**
- 502 Bad Gateway
- Website shows error

**Solutions:**
1. Check HttpPlatformHandler is installed: `Get-WebGlobalModule -Name "httpPlatformHandler"`
2. Check Python path in `aiml/web.config` is correct
3. Check `aiml/startup.py` exists
4. Check `aiml/flask-ollama-app.py` exists
5. Check Flask logs: `aiml/logs/stdout.log`

**Common Issues:**
- Wrong Python path: Update `processPath` in `web.config`
- Missing dependencies: Run `pip install -r requirements.txt` in `aiml/`
- Import errors: Check Python path in `startup.py`
- Port conflict: Check no other service on port 8081

### Module Not Found Errors

**iisnode:**
```powershell
# Verify installation
Get-WebGlobalModule -Name "iisnode"

# Reinstall if needed
# Download from: https://github.com/Azure/iisnode/releases
```

**HttpPlatformHandler:**
```powershell
# Verify installation
Get-WebGlobalModule -Name "httpPlatformHandler"

# Reinstall if needed
# Download from: https://www.iis.net/downloads/microsoft/httpplatformhandler
```

### Permission Issues

Ensure IIS application pool identity has:
- Read access to project directories
- Write access to log directories
- Execute access to Node.js and Python

```powershell
# Grant permissions (run as Administrator)
$acl = Get-Acl "C:\Users\DevAdmin03\Desktop\Hackermans"
$permission = "IIS_IUSRS","FullControl","ContainerInherit,ObjectInherit","None","Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl "C:\Users\DevAdmin03\Desktop\Hackermans" $acl
```

## Performance Tuning

### Application Pool Settings

```powershell
# Increase idle timeout (prevent shutdowns)
Set-ItemProperty "IIS:\AppPools\Hackermans-Backend" -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(20))

# Set memory limits
Set-ItemProperty "IIS:\AppPools\Hackermans-Backend" -Name processModel.maxProcesses -Value 1
```

### iisnode Settings

Edit `backend/web.config`:
```xml
<iisnode
  nodeProcessCountPerApplication="1"
  maxConcurrentRequestsPerProcess="1024"
  />
```

### HttpPlatformHandler Settings

Edit `aiml/web.config`:
```xml
<httpPlatform
  startupTimeLimit="20"
  startupRetryCount="10"
  requestTimeout="00:04:00"
  />
```

## Security Considerations

1. **Application Pool Identity**: Use dedicated service account in production
2. **File Permissions**: Restrict access to project directories
3. **Environment Variables**: Don't expose secrets in `web.config`
4. **HTTPS**: Configure SSL certificates for production
5. **Firewall**: Restrict access to necessary ports only

## Differences from Reverse Proxy Setup

| Aspect | Reverse Proxy | IIS-Hosted |
|--------|---------------|------------|
| Node.js | Standalone process | Runs in IIS (iisnode) |
| Flask | Standalone process | Runs in IIS (HttpPlatformHandler) |
| Management | Manual start/stop | IIS manages lifecycle |
| Logging | Separate logs | Integrated with IIS |
| Process Control | Manual | Automatic recycling |
| Setup Complexity | Simpler | More complex |
| Performance | Slightly better | Integrated overhead |

## Advantages of IIS-Hosted

1. **Integrated Management**: All services managed by IIS
2. **Automatic Restart**: IIS handles process failures
3. **Unified Logging**: All logs in one place
4. **Process Recycling**: Automatic memory management
5. **Windows Integration**: Better integration with Windows services

## Migration from Reverse Proxy

If you previously used reverse proxy setup:

1. Stop standalone services
2. Install iisnode and HttpPlatformHandler
3. Run `setup-iis.ps1`
4. Services will now run in IIS
5. No code changes needed!

## Support

For issues:
1. Check logs (iisnode, HttpPlatformHandler, IIS)
2. Verify modules are installed
3. Check permissions
4. Review `web.config` files
5. Check application pool status

## Additional Resources

- [iisnode Documentation](https://github.com/Azure/iisnode/wiki)
- [HttpPlatformHandler Documentation](https://docs.microsoft.com/en-us/iis/extensions/httpplatformhandler/)
- [IIS Documentation](https://docs.microsoft.com/en-us/iis/)



