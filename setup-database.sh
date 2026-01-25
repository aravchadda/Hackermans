#!/bin/bash
# Setup MSSQL Database in Docker and Import Backup
# This script will:
# 1. Start the MSSQL Docker container
# 2. Wait for it to be ready
# 3. Import the database from the uploads folder

set -e

BACKUP_FILE="${1:-}"
SKIP_IMPORT="${2:-}"

echo "=== MSSQL Database Setup ==="
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker ps > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker."
    exit 1
fi
echo "Docker is running"

# Check for docker-compose
echo "Checking docker-compose..."
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: docker-compose not found. Please install Docker Compose."
    exit 1
fi
echo "docker-compose is available"

# Start the MSSQL container
echo ""
echo "Starting MSSQL container..."
if docker compose version &> /dev/null; then
    docker compose up -d
else
    docker-compose up -d
fi

echo "MSSQL container started"

# Wait for MSSQL to be ready
echo ""
echo "Waiting for MSSQL to be ready (this may take 30-60 seconds)..."
MAX_ATTEMPTS=60
ATTEMPT=0
READY=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ "$READY" = false ]; do
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
    
    if docker exec hackermans-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "YourStrong!Passw0rd" -C -Q "SELECT 1" -h -1 > /dev/null 2>&1; then
        READY=true
        echo "MSSQL is ready!"
    else
        echo -n "."
    fi
done

if [ "$READY" = false ]; then
    echo ""
    echo "Error: MSSQL did not become ready within the timeout period"
    exit 1
fi

echo ""

# Import database if not skipped
if [ "$SKIP_IMPORT" != "skip" ]; then
    echo ""
    echo "=== Database Import ==="
    
    # Find backup file
    UPLOADS_PATH="backend/uploads"
    BACKUP_FILE_FOUND=""
    
    if [ -n "$BACKUP_FILE" ]; then
        if [ -f "$BACKUP_FILE" ]; then
            BACKUP_FILE_FOUND="$BACKUP_FILE"
        else
            echo "Error: Backup file not found: $BACKUP_FILE"
            exit 1
        fi
    else
        # Look for .bak files in uploads folder
        if [ -d "$UPLOADS_PATH" ]; then
            BAK_FILE=$(find "$UPLOADS_PATH" -name "*.bak" -type f | head -n 1)
            if [ -n "$BAK_FILE" ]; then
                BACKUP_FILE_FOUND="$BAK_FILE"
                echo "Found backup file: $BACKUP_FILE_FOUND"
            else
                # Check for files without extension
                FILE=$(find "$UPLOADS_PATH" -type f \( -name "*.bak" -o ! -name "*.*" \) | head -n 1)
                if [ -n "$FILE" ]; then
                    BACKUP_FILE_FOUND="$FILE"
                    echo "Found backup file: $BACKUP_FILE_FOUND"
                fi
            fi
        fi
    fi
    
    if [ -z "$BACKUP_FILE_FOUND" ]; then
        echo "Warning: No backup file found in $UPLOADS_PATH"
        echo "Please place your database backup file (.bak) in the backend/uploads folder"
        echo "You can run the restore script later with: node backend/scripts/restore_backup.js"
    else
        echo ""
        echo "Importing database from: $BACKUP_FILE_FOUND"
        
        # Change to backend directory and run restore script
        cd backend
        node scripts/restore_backup.js
        cd ..
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "Database imported successfully!"
        else
            echo ""
            echo "Error: Database import failed"
            exit 1
        fi
    fi
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "MSSQL is running on: localhost:1433"
echo "Database name: hackermans"
echo "Username: sa"
echo "Password: YourStrong!Passw0rd"
echo ""
echo "To stop the container: docker-compose down"
echo "To view logs: docker-compose logs -f mssql"
