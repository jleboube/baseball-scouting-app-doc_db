#!/bin/bash

# Simple MongoDB Restore Script
# Usage: ./restore_database.sh backup_file.archive.gz

if [ $# -eq 0 ]; then
    echo "❌ Usage: $0 <backup_file.archive.gz>"
    echo "📁 Available backups:"
    ls -la ./backups/*.archive.gz 2>/dev/null || echo "No backups found in ./backups/"
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

# Get database password from environment or use default
if [ -f ".env" ]; then
    source .env
    DB_PASSWORD=${DB_PASSWORD:-scout_pass}
else
    DB_PASSWORD="scout_pass"
fi

echo "🛑 Stopping application..."
docker-compose -f docker-compose.prod.yml stop app

echo "🗄️  Restoring MongoDB database..."

# Drop existing database
docker-compose -f docker-compose.prod.yml exec db mongosh --username scout_user --password "$DB_PASSWORD" --authenticationDatabase admin --eval "db.getSiblingDB('baseball_scouting').dropDatabase()"

# Restore from backup
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker-compose -f docker-compose.prod.yml exec -T db mongorestore --username scout_user --password "$DB_PASSWORD" --authenticationDatabase admin --archive
else
    cat "$BACKUP_FILE" | docker-compose -f docker-compose.prod.yml exec -T db mongorestore --username scout_user --password "$DB_PASSWORD" --authenticationDatabase admin --archive
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
echo "🌐 Test your site: Check your configured domain"