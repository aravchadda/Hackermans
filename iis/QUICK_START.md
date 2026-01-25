# Quick Start Guide - IIS Deployment

## Prerequisites Checklist

- [ ] Windows Server or Windows 10/11 Pro
- [ ] IIS installed
- [ ] Node.js 16+ installed
- [ ] Python 3.8+ installed
- [ ] Ollama installed and model pulled (`ollama pull microsoft/phi-3.5-mini`)

## 5-Minute Setup

### Step 1: Install URL Rewrite Module

Download and install from: https://www.iis.net/downloads/microsoft/url-rewrite

### Step 2: Run Setup Script

```powershell
# Open PowerShell as Administrator
cd C:\Users\DevAdmin03\Desktop\Hackermans\iis
.\setup-iis.ps1
```

### Step 3: Update Backend CORS

Edit `backend/index.js` and update the CORS configuration:

```javascript
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost', 'http://127.0.0.1'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### Step 4: Start Services

**Option A: Use Batch Script**
```cmd
cd iis
start-services.bat
```

**Option B: Start Manually**

Terminal 1 - Ollama:
```bash
ollama serve
```

Terminal 2 - Backend:
```powershell
cd backend
npm start
```

Terminal 3 - Flask:
```powershell
cd aiml
python flask-ollama-app.py
```

### Step 5: Access Application

Open browser: **http://localhost**

## Troubleshooting

### Services Won't Start

1. Check ports are available:
   ```powershell
   netstat -ano | findstr ":4000"
   netstat -ano | findstr ":5001"
   ```

2. Check Node.js and Python are in PATH:
   ```powershell
   node --version
   python --version
   ```

### 502 Bad Gateway

- Backend services not running
- Wrong port in `web.config`
- Firewall blocking connections

### CORS Errors

- Update CORS in `backend/index.js` (see Step 3)
- Restart backend service

### Frontend Shows Blank Page

- Rebuild frontend: `cd frontend\terminal && npm run build`
- Check IIS website points to `build` folder
- Check browser console for errors

## Common Commands

```powershell
# Check IIS websites
Get-Website | Where-Object { $_.Name -like "Hackermans*" }

# Start/Stop websites
Start-Website -Name "Hackermans-Frontend"
Stop-Website -Name "Hackermans-Frontend"

# Restart IIS
iisreset

# Check services
Get-Process | Where-Object { $_.ProcessName -eq "node" }
Get-Process | Where-Object { $_.ProcessName -eq "python" }
```

## Next Steps

- See `README.md` for detailed documentation
- Configure SSL/HTTPS for production
- Set up Windows Services for auto-start
- Configure firewall rules



