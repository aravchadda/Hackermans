# MSSQL Database Setup Guide

This guide will help you set up the MSSQL database in Docker and import your database backup.

## Prerequisites

1. **Docker Desktop** must be installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Make sure Docker Desktop is started before proceeding

2. **Node.js** installed (for running the restore script)

## Quick Start

### Option 1: Using the Setup Script (Recommended)

1. **Start Docker Desktop** if it's not already running

2. **Place your database backup file** in the `backend/uploads/` folder
   - Supported formats: `.bak` files
   - The script will automatically find `.bak` files in the uploads folder
   - Or you can specify the path: `node backend/scripts/restore_backup.js "path/to/backup.bak"`

3. **Run the setup script:**
   ```powershell
   # Windows PowerShell
   .\setup-database.ps1
   
   # Linux/Mac
   chmod +x setup-database.sh
   ./setup-database.sh
   ```

   The script will:
   - Start the MSSQL Docker container
   - Wait for it to be ready
   - Automatically import the database if a backup file is found

### Option 2: Manual Setup

1. **Start Docker Desktop**

2. **Start the MSSQL container:**
   ```bash
   docker-compose up -d
   ```

3. **Wait for MSSQL to be ready** (about 30-60 seconds):
   ```bash
   docker-compose logs -f mssql
   ```
   Wait until you see the message that MSSQL is ready.

4. **Place your database backup file** in `backend/uploads/` folder

5. **Import the database:**
   ```bash
   cd backend
   node scripts/restore_backup.js
   ```

## Configuration

### Environment Variables

Create a `.env` file in the `backend/` folder (copy from `env.example`):

```env
# Server
PORT=4000

# MSSQL Database
DB_HOST=127.0.0.1
DB_PORT=1433
DB_USER=sa
DB_PASSWORD=YourStrong!Passw0rd
DB_NAME=hackermans

# For docker-compose (MSSQL SA password)
SA_PASSWORD=YourStrong!Passw0rd
```

### Docker Compose Configuration

The `docker-compose.yml` file is configured with:
- **Image**: `mcr.microsoft.com/mssql/server:2022-latest`
- **Port**: `1433` (mapped to host)
- **Volume**: `backend/uploads` is mounted to `/var/opt/mssql/backup` in the container
- **Health Check**: Automatically checks if MSSQL is ready

## Database Connection Details

Once the container is running:

- **Host**: `localhost` or `127.0.0.1`
- **Port**: `1433`
- **Database**: `hackermans`
- **Username**: `sa`
- **Password**: `YourStrong!Passw0rd` (default, change in `.env`)

## Troubleshooting

### Docker Desktop not starting
- Make sure Docker Desktop is installed
- Check if virtualization is enabled in BIOS
- Restart your computer if needed

### Container fails to start
- Check logs: `docker-compose logs mssql`
- Make sure port 1433 is not already in use
- Try: `docker-compose down` then `docker-compose up -d`

### Database import fails
- Make sure the backup file is a valid `.bak` file
- Check that the file is in `backend/uploads/` folder
- Verify the file is not corrupted
- Check container logs: `docker-compose logs mssql`

### Connection timeout
- Wait a bit longer (MSSQL can take 30-60 seconds to start)
- Check if the container is running: `docker ps`
- Verify health check: `docker-compose ps`

## Useful Commands

```bash
# Start the container
docker-compose up -d

# Stop the container
docker-compose down

# View logs
docker-compose logs -f mssql

# Check container status
docker-compose ps

# Access MSSQL command line
docker exec -it hackermans-mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd"

# Restart the container
docker-compose restart mssql
```

## File Structure

```
Hackermans/
├── docker-compose.yml          # Docker configuration
├── setup-database.ps1          # Windows setup script
├── setup-database.sh            # Linux/Mac setup script
└── backend/
    ├── uploads/                 # Place your .bak files here
    │   └── *.bak
    ├── scripts/
    │   └── restore_backup.js    # Database restore script
    └── .env                     # Environment variables
```

## Notes

- The `uploads` folder is mounted as read-only in the container for security
- Backup files are automatically copied into the container if not already in the mounted volume
- The database name is set to `hackermans` by default (change in `.env`)
- The restore script automatically finds `.bak` files in the uploads folder
