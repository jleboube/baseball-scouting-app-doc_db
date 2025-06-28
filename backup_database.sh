#!/bin/bash

# Simple MongoDB Backup Script

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="baseball_scouting_backup_${DATE}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "💾 Creating MongoDB backup..."

# Check if containers are running
if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "❌ Containers are not running. Starting them..."
    docker-compose -f docker-compose.prod.yml up -d
    sleep 10
fi

# Create MongoDB backup using mongodump
if docker-compose -f docker-compose.prod.yml exec -T db mongodump --username scout_user --password scout_pass --authenticationDatabase admin --db baseball_scouting --archive > "$BACKUP_DIR/$BACKUP_FILE.archive"; then
    # Compress the backup
    gzip "$BACKUP_DIR/$BACKUP_FILE.archive"
    echo "✅ Backup created: $BACKUP_DIR/${BACKUP_FILE}.archive.gz"
    
    # Keep only last 30 backups
    find "$BACKUP_DIR" -name "baseball_scouting_backup_*.archive.gz" -mtime +30 -delete 2>/dev/null || true
    
    echo "📊 Recent backups:"
    ls -lah "$BACKUP_DIR"/*.archive.gz 2>/dev/null | tail -5 || echo "No previous backups found"
else
    echo "❌ Backup failed!"
    echo "🔍 Checking database status..."
    docker-compose -f docker-compose.prod.yml exec db mongosh --eval "db.adminCommand('ping')"
    exit 1
fi