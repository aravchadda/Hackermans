# Quick Start - Services Running IN IIS

## Prerequisites

- [ ] Windows Server or Windows 10/11 Pro
- [ ] IIS installed
- [ ] Node.js 16+ installed
- [ ] Python 3.8+ installed
- [ ] **iisnode** installed ([Download](https://github.com/Azure/iisnode/releases))
- [ ] **HttpPlatformHandler** installed ([Download](https://www.iis.net/downloads/microsoft/httpplatformhandler))
- [ ] **URL Rewrite Module** installed ([Download](https://www.iis.net/downloads/microsoft/url-rewrite))
- [ ] Ollama installed and model pulled

## 5-Minute Setup

### Step 1: Install Required Modules

**iisnode:**
1. Download: https://github.com/Azure/iisnode/releases
2. Install the MSI
3. Restart IIS: `iisreset`

**HttpPlatformHandler:**
1. Download: https://www.iis.net/downloads/microsoft/httpplatformhandler
2. Install the MSI
3. Restart IIS: `iisreset`

### Step 2: Run Setup Script

```powershell
# Open PowerShell as Administrator
cd C:\Users\DevAdmin03\Desktop\Hackermans\iis
.\setup-iis.ps1
```

The script will:
- ✅ Check for required modules
- ✅ Build React frontend
- ✅ Install backend dependencies
- ✅ Create IIS websites
- ✅ Configure services to run IN IIS

### Step 3: Start Ollama

```bash
ollama serve
```

### Step 4: Access Application

Open browser: **http://localhost**

**That's it!** Services are now running inside IIS.

## Verify Services

```powershell
# Check websites are running
Get-Website | Where-Object { $_.Name -like "Hackermans*" }

# Check application pools
Get-WebAppPoolState | Where-Object { $_.Name -like "Hackermans*" }
```

## Troubleshooting

### Backend Not Working

1. Check iisnode is installed:
   ```powershell
   Get-WebGlobalModule -Name "iisnode"
   ```

2. Check logs:
   - `backend/iisnode/` directory

3. Restart application pool:
   ```powershell
   Restart-WebAppPool -Name "Hackermans-Backend"
   ```

### Flask Not Working

1. Check HttpPlatformHandler is installed:
   ```powershell
   Get-WebGlobalModule -Name "httpPlatformHandler"
   ```

2. Check logs:
   - `aiml/logs/stdout.log`

3. Verify Python path in `aiml/web.config`

4. Restart application pool:
   ```powershell
   Restart-WebAppPool -Name "Hackermans-Flask"
   ```

## Key Differences from Reverse Proxy

| Feature | Reverse Proxy | IIS-Hosted |
|---------|---------------|------------|
| Node.js | Standalone process | Runs in IIS |
| Flask | Standalone process | Runs in IIS |
| Start/Stop | Manual | IIS manages |
| Logs | Separate | Integrated |

## Next Steps

- See `README_IIS_HOSTED.md` for detailed documentation
- Configure SSL/HTTPS for production
- Set up monitoring and alerts
- Configure backup procedures

