#!/bin/bash

# Simple Database Restore Script
# Usage: ./restore_database.sh backup_file.sql.gz

if [ $# -eq 0 ]; then
    echo "❌ Usage: $0 <backup_file.sql.gz>"
    echo "📁 Available backups:"
    ls -la ./backups/*.sql.gz 2>/dev/null || echo "No backups found in ./backups/"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace ALL data in the database!"
echo "📁 Restoring from: $BACKUP_FILE"
read -p "Are you sure? Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

echo "🛑 Stopping application..."
docker-compose -f docker-compose.prod.yml stop app

echo "🗄️  Restoring database..."

# Drop and recreate database
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -h localhost -c "DROP DATABASE IF EXISTS baseball_scouting;"
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -h localhost -c "CREATE DATABASE baseball_scouting;"

# Restore from backup
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker-compose -f docker-compose.prod.yml exec -T db psql -U scout_user -h localhost -d baseball_scouting
else
    cat "$BACKUP_FILE" | docker-compose -f docker-compose.prod.yml exec -T db psql -U scout_user -h localhost -d baseball_scouting
fi

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully"
else
    echo "❌ Database restore failed"
    exit 1
fi

echo "🚀 Starting application..."
docker-compose -f docker-compose.prod.yml start app

echo "✅ Restore completed!"
echo "🌐 Test your site: https://scouting-report.com"