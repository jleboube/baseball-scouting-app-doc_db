#!/bin/bash

# Simple Update Script for Baseball Scouting App

set -e

echo "🔄 Updating Baseball Scouting App..."

# Create backup before update
echo "💾 Creating backup..."
mkdir -p backups

# Get database password from environment or use default
if [ -f ".env" ]; then
    source .env
    DB_PASSWORD=${DB_PASSWORD:-scout_pass}
else
    DB_PASSWORD="scout_pass"
fi

docker compose -f docker-compose.prod.yml exec -T db mongodump --username scout_user --password "$DB_PASSWORD" --authenticationDatabase admin --db baseball_scouting --archive > "backups/backup_before_update_$(date +%Y%m%d_%H%M%S).archive"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull

# Rebuild and restart
echo "🔨 Building and restarting services..."
docker compose -f docker-compose.prod.yml up --build -d

# Wait for services
echo "⏳ Waiting for services to restart..."
sleep 15

# Quick health check
echo "🔍 Checking if services are running..."
if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Services are running correctly"
else
    echo "⚠️  Some services may have issues - check logs if needed"
fi

# Show status
echo "📊 Service Status:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Update completed!"
echo "🔧 If issues occur, check logs: docker-compose -f docker-compose.prod.yml logs"