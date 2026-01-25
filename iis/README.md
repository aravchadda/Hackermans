# IIS Deployment Guide for Hackermans

This guide explains how to deploy the Hackermans Terminal Analytics Dashboard on Microsoft IIS (Internet Information Services).

## Architecture Overview

The IIS deployment uses reverse proxy configuration to route requests:
- **Frontend (Port 80)**: Serves React static files and proxies API requests
- **Backend API (Port 8080)**: Reverse proxy to Node.js backend (port 4000)
- **Flask API (Port 8081)**: Reverse proxy to Flask AI service (port 5001)

## Prerequisites

### Required Software

1. **Windows Server** or **Windows 10/11 Pro** with IIS installed
2. **Node.js 16+** installed and in PATH
3. **Python 3.8+** installed and in PATH
4. **IIS URL Rewrite Module 2.1** ([Download here](https://www.iis.net/downloads/microsoft/url-rewrite))
5. **Ollama** installed and running

### Required IIS Features

The setup script will install these automatically, but you can also install them manually:

- IIS Management Console
- IIS URL Rewrite Module
- Application Request Routing (ARR) - Optional but recommended
- Static Content
- Default Document
- HTTP Errors

## Quick Setup

### Option 1: Automated Setup (Recommended)

1. **Open PowerShell as Administrator**

2. **Run the setup script:**
   ```powershell
   cd C:\Users\DevAdmin03\Desktop\Hackermans\iis
   .\setup-iis.ps1
   ```

3. **The script will:**
   - Install required IIS features
   - Build the React frontend
   - Create application pools
   - Create IIS websites
   - Configure reverse proxy rules

### Option 2: Manual Setup

#### Step 1: Install IIS Features

```powershell
# Run as Administrator
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-CommonHttpFeatures -All
Enable-WindowsOptionalFeature -Online -FeatureName IIS-URLRewrite -All
```

#### Step 2: Install URL Rewrite Module

Download and install from: https://www.iis.net/downloads/microsoft/url-rewrite

#### Step 3: Build Frontend

```powershell
cd frontend\terminal
npm install
npm run build
```

#### Step 4: Copy Configuration Files

Copy the `web.config` files from the `iis` directory to their respective locations:
- `iis\frontend\web.config` → `frontend\terminal\build\web.config`
- `iis\backend\web.config` → `iis\backend\dummy\web.config`
- `iis\flask\web.config` → `iis\flask\dummy\web.config`

#### Step 5: Create IIS Websites

**Frontend Website:**
```powershell
New-WebAppPool -Name "Hackermans-Frontend"
Set-ItemProperty "IIS:\AppPools\Hackermans-Frontend" -Name managedRuntimeVersion -Value ""
New-Website -Name "Hackermans-Frontend" -Port 80 -PhysicalPath "C:\Users\DevAdmin03\Desktop\Hackermans\frontend\terminal\build" -ApplicationPool "Hackermans-Frontend"
```

**Backend API Website:**
```powershell
New-WebAppPool -Name "Hackermans-Backend"
Set-ItemProperty "IIS:\AppPools\Hackermans-Backend" -Name managedRuntimeVersion -Value ""
New-Website -Name "Hackermans-Backend" -Port 8080 -PhysicalPath "C:\Users\DevAdmin03\Desktop\Hackermans\iis\backend\dummy" -ApplicationPool "Hackermans-Backend"
```

**Flask API Website:**
```powershell
New-WebAppPool -Name "Hackermans-Flask"
Set-ItemProperty "IIS:\AppPools\Hackermans-Flask" -Name managedRuntimeVersion -Value ""
New-Website -Name "Hackermans-Flask" -Port 8081 -PhysicalPath "C:\Users\DevAdmin03\Desktop\Hackermans\iis\flask\dummy" -ApplicationPool "Hackermans-Flask"
```

## Starting the Services

Before accessing the IIS websites, you must start the backend services:

### 1. Start Ollama (Terminal 1)
```bash
ollama serve
```

### 2. Start Node.js Backend (Terminal 2)
```powershell
cd backend
npm start
```
The backend should run on port 4000.

### 3. Start Flask AI Service (Terminal 3)
```powershell
cd aiml
python flask-ollama-app.py
```
The Flask service should run on port 5001.

### 4. Verify IIS Websites are Running
```powershell
Get-Website | Where-Object { $_.Name -like "Hackermans*" }
```

## Accessing the Application

Once all services are running:

- **Frontend**: http://localhost (or http://your-server-ip)
- **Backend API**: http://localhost:8080/api
- **Flask API**: http://localhost:8081

## Configuration

### Changing Ports

Edit the `setup-iis.ps1` script parameters or manually update the `web.config` files:

```powershell
.\setup-iis.ps1 -FrontendPort 80 -BackendPort 8080 -FlaskPort 8081
```

### Updating API Endpoints

If you change the backend ports, update the reverse proxy rules in:
- `iis\frontend\web.config` - Update the proxy URL for `/api/*` requests
- `iis\backend\web.config` - Update the rewrite URL
- `iis\flask\web.config` - Update the rewrite URL

### Environment Variables

Ensure your backend `.env` file is configured correctly:
```env
PORT=4000
NODE_ENV=production
DB_PATH=./data/hackermans.db
```

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause**: Backend service not running or wrong port

**Solution**:
1. Verify Node.js backend is running on port 4000
2. Check firewall rules allow connections
3. Verify the port in `web.config` matches the actual service port

### Issue: 404 Not Found on API Routes

**Cause**: URL Rewrite module not installed or misconfigured

**Solution**:
1. Verify URL Rewrite module is installed: `Get-WebGlobalModule -Name "RewriteModule"`
2. Check `web.config` syntax is correct
3. Restart IIS: `iisreset`

### Issue: Frontend Shows Blank Page

**Cause**: React build failed or wrong path

**Solution**:
1. Rebuild frontend: `cd frontend\terminal && npm run build`
2. Verify `build` folder exists and contains `index.html`
3. Check IIS website physical path points to `build` folder

### Issue: CORS Errors

**Cause**: Backend CORS configuration

**Solution**: Update `backend/index.js` to allow your IIS domain:
```javascript
app.use(cors({
    origin: ['http://localhost', 'http://your-server-ip', 'http://your-domain.com'],
    credentials: true
}));
```

### Issue: Static Files Not Loading

**Cause**: MIME types not configured

**Solution**: The `web.config` includes MIME type mappings. If issues persist, add manually in IIS Manager:
- JSON: `application/json`
- WOFF: `application/font-woff`
- WOFF2: `application/font-woff2`

## Performance Optimization

### Enable Compression

Compression is enabled by default in `web.config`. To disable:
```xml
<urlCompression doStaticCompression="false" doDynamicCompression="false" />
```

### Application Pool Settings

For production, consider:
- Setting idle timeout to prevent shutdowns
- Configuring recycling schedules
- Setting memory limits

```powershell
Set-ItemProperty "IIS:\AppPools\Hackermans-Frontend" -Name processModel.idleTimeout -Value ([TimeSpan]::FromMinutes(20))
```

### Static File Caching

Add caching headers in `web.config`:
```xml
<staticContent>
  <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
</staticContent>
```

## Security Considerations

### SSL/HTTPS Setup

1. Install SSL certificate in IIS
2. Create HTTPS bindings for all websites
3. Update `web.config` to redirect HTTP to HTTPS:
```xml
<rule name="Redirect to HTTPS" stopProcessing="true">
  <match url="(.*)" />
  <conditions>
    <add input="{HTTPS}" pattern="off" />
  </conditions>
  <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" />
</rule>
```

### Firewall Rules

Ensure ports are open:
- Port 80 (HTTP) or 443 (HTTPS) for frontend
- Port 8080 for backend API (or use internal only)
- Port 8081 for Flask API (or use internal only)

### Application Pool Identity

For production, use a dedicated service account:
```powershell
Set-ItemProperty "IIS:\AppPools\Hackermans-Frontend" -Name processModel.identityType -Value SpecificUser
Set-ItemProperty "IIS:\AppPools\Hackermans-Frontend" -Name processModel.userName -Value "DOMAIN\ServiceAccount"
Set-ItemProperty "IIS:\AppPools\Hackermans-Frontend" -Name processModel.password -Value "Password"
```

## Monitoring

### Check Website Status
```powershell
Get-Website | Where-Object { $_.Name -like "Hackermans*" } | Format-Table Name, State, PhysicalPath
```

### View Application Pool Status
```powershell
Get-WebAppPoolState | Where-Object { $_.Name -like "Hackermans*" } | Format-Table Name, State
```

### View Logs

IIS logs are located at: `C:\inetpub\logs\LogFiles\`

Application logs:
- Node.js: Check console output or use PM2
- Flask: Check console output or configure logging
- Ollama: Check console output

## Maintenance

### Updating the Application

1. Pull latest code
2. Rebuild frontend: `cd frontend\terminal && npm run build`
3. Restart backend services
4. Restart IIS websites if needed: `iisreset`

### Backup

Regularly backup:
- Database: `backend/data/hackermans.db`
- Configuration files: `iis/*/web.config`
- Environment files: `backend/.env`

## Support

For issues or questions:
- Check the main README.md for general troubleshooting
- Review IIS logs: `C:\inetpub\logs\LogFiles\`
- Check Windows Event Viewer for IIS errors

## Additional Resources

- [IIS Documentation](https://docs.microsoft.com/en-us/iis/)
- [URL Rewrite Module](https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/)
- [Application Request Routing](https://docs.microsoft.com/en-us/iis/extensions/planning-for-arr/using-the-application-request-routing-module)



