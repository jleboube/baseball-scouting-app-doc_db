#!/bin/bash

# Simple Database Backup Script

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="baseball_scouting_backup_${DATE}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "💾 Creating database backup..."

# Check if containers are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "❌ Containers are not running. Starting them..."
    docker-compose -f docker-compose.prod.yml up -d
    sleep 10
fi

# Create database backup
if docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U scout_user -h localhost baseball_scouting > "$BACKUP_DIR/$BACKUP_FILE"; then
    # Compress the backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    echo "✅ Backup created: $BACKUP_DIR/${BACKUP_FILE}.gz"
    
    # Keep only last 30 backups
    find "$BACKUP_DIR" -name "baseball_scouting_backup_*.sql.gz" -mtime +30 -delete 2>/dev/null || true
    
    echo "📊 Recent backups:"
    ls -lah "$BACKUP_DIR"/*.sql.gz 2>/dev/null | tail -5 || echo "No previous backups found"
else
    echo "❌ Backup failed!"
    echo "🔍 Checking database status..."
    docker-compose -f docker-compose.prod.yml exec db pg_isready -U scout_user -h localhost
    exit 1
fi