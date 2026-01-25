# How to Run the IIS Setup Script

## Problem
If double-clicking `setup-iis.ps1` opens it in Notepad, Windows has `.ps1` files associated with Notepad instead of PowerShell.

## Solutions

### Option 1: Use the Batch File (Easiest)
Double-click `setup-iis.bat` - it will run the PowerShell script correctly.

### Option 2: Right-Click Method
1. Right-click on `setup-iis.ps1`
2. Select **"Run with PowerShell"**
3. If prompted, click "Yes" to allow the script to run

### Option 3: Run from PowerShell
1. Open PowerShell as Administrator (Right-click → Run as Administrator)
2. Navigate to the iis folder:
   ```powershell
   cd C:\Users\DevAdmin03\Desktop\Hackermans\iis
   ```
3. Run the script:
   ```powershell
   .\setup-iis.ps1
   ```

### Option 4: Run with Full Command
Open PowerShell as Administrator and run:
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\DevAdmin03\Desktop\Hackermans\iis\setup-iis.ps1"
```

## Important Notes

- **Must run as Administrator** - The script needs admin privileges to configure IIS
- If you get execution policy errors, use `-ExecutionPolicy Bypass` flag
- The script will check for required modules (iisnode, HttpPlatformHandler) and guide you if they're missing

## Troubleshooting

### "Execution Policy" Error
Run with bypass flag:
```powershell
powershell -ExecutionPolicy Bypass -File .\setup-iis.ps1
```

### "Cannot be loaded because running scripts is disabled"
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy RemoteSigned`
3. Then run the script again

### Script Opens in Notepad
Use one of the solutions above - the batch file is the easiest option.



