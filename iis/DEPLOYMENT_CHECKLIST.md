# IIS Deployment Checklist

Use this checklist to ensure a successful deployment.

## Pre-Deployment

- [ ] **System Requirements**
  - [ ] Windows Server or Windows 10/11 Pro
  - [ ] IIS installed and running
  - [ ] Node.js 16+ installed and in PATH
  - [ ] Python 3.8+ installed and in PATH
  - [ ] Ollama installed
  - [ ] Required Ollama model pulled: `ollama pull microsoft/phi-3.5-mini`

- [ ] **IIS Features**
  - [ ] IIS Management Console installed
  - [ ] URL Rewrite Module 2.1 installed ([Download](https://www.iis.net/downloads/microsoft/url-rewrite))
  - [ ] Static Content feature enabled
  - [ ] Default Document feature enabled

- [ ] **Project Dependencies**
  - [ ] Backend dependencies installed: `cd backend && npm install`
  - [ ] Frontend dependencies installed: `cd frontend/terminal && npm install`
  - [ ] Python dependencies installed: `cd aiml && pip install -r requirements.txt`

## Deployment Steps

- [ ] **Run Setup Script**
  ```powershell
  cd iis
  .\setup-iis.ps1
  ```
  - [ ] Script completed without errors
  - [ ] Frontend built successfully
  - [ ] IIS websites created
  - [ ] Application pools created

- [ ] **Configuration**
  - [ ] Backend CORS updated (already done in `backend/index.js`)
  - [ ] Environment variables set in `backend/.env`
  - [ ] Database path configured correctly
  - [ ] Ports verified (4000 for backend, 5001 for Flask)

- [ ] **Start Services**
  - [ ] Ollama running: `ollama serve`
  - [ ] Backend running: `cd backend && npm start`
  - [ ] Flask running: `cd aiml && python flask-ollama-app.py`
  - [ ] All services accessible on their ports

- [ ] **IIS Verification**
  - [ ] Frontend website started: `Get-Website -Name "Hackermans-Frontend"`
  - [ ] Backend website started: `Get-Website -Name "Hackermans-Backend"`
  - [ ] Flask website started: `Get-Website -Name "Hackermans-Flask"`
  - [ ] Application pools running: `Get-WebAppPoolState | Where-Object { $_.Name -like "Hackermans*" }`

## Testing

- [ ] **Frontend Access**
  - [ ] http://localhost loads correctly
  - [ ] No console errors in browser
  - [ ] Static assets (CSS, JS, images) load correctly

- [ ] **API Endpoints**
  - [ ] Backend API accessible: http://localhost:8080/api/health
  - [ ] Flask API accessible: http://localhost:8081/health
  - [ ] Frontend can call backend APIs (check Network tab)
  - [ ] No CORS errors in browser console

- [ ] **Functionality**
  - [ ] Dashboard loads
  - [ ] Charts render correctly
  - [ ] Chatbot/AI features work
  - [ ] Data upload works
  - [ ] Views management works

## Post-Deployment

- [ ] **Security**
  - [ ] Firewall rules configured (if needed)
  - [ ] SSL/HTTPS configured (for production)
  - [ ] Application pool identity set (for production)
  - [ ] Unnecessary ports closed

- [ ] **Monitoring**
  - [ ] IIS logs location known: `C:\inetpub\logs\LogFiles\`
  - [ ] Application logs configured
  - [ ] Health check endpoints working

- [ ] **Documentation**
  - [ ] Deployment notes documented
  - [ ] Service accounts documented (if used)
  - [ ] Backup procedures documented

## Troubleshooting Reference

### Common Issues

1. **502 Bad Gateway**
   - Check backend services are running
   - Verify ports in `web.config` match service ports
   - Check firewall rules

2. **404 on API Routes**
   - Verify URL Rewrite module installed
   - Check `web.config` syntax
   - Restart IIS: `iisreset`

3. **CORS Errors**
   - Verify CORS configuration in `backend/index.js`
   - Check allowed origins include IIS URL
   - Restart backend service

4. **Blank Frontend**
   - Rebuild frontend: `cd frontend/terminal && npm run build`
   - Verify IIS website points to `build` folder
   - Check browser console for errors

### Useful Commands

```powershell
# Check services
Get-Process | Where-Object { $_.ProcessName -in @("node", "python") }

# Check ports
netstat -ano | findstr ":4000"
netstat -ano | findstr ":5001"

# Check IIS
Get-Website | Where-Object { $_.Name -like "Hackermans*" }
Get-WebAppPoolState | Where-Object { $_.Name -like "Hackermans*" }

# Restart IIS
iisreset

# View logs
Get-Content C:\inetpub\logs\LogFiles\W3SVC*\*.log -Tail 50
```

## Production Considerations

- [ ] **Performance**
  - [ ] Static file caching configured
  - [ ] Compression enabled
  - [ ] Application pool recycling configured
  - [ ] Memory limits set appropriately

- [ ] **Reliability**
  - [ ] Services configured as Windows Services (optional)
  - [ ] Auto-restart on failure configured
  - [ ] Monitoring/alerting set up
  - [ ] Backup procedures in place

- [ ] **Security**
  - [ ] SSL certificate installed
  - [ ] HTTPS redirect configured
  - [ ] Security headers configured
  - [ ] Access logs reviewed regularly

## Support

If you encounter issues:
1. Check the main `README.md` for troubleshooting
2. Review `iis/README.md` for detailed documentation
3. Check IIS logs and application logs
4. Verify all services are running and accessible



