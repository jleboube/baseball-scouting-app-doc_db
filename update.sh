#!/bin/bash

# Simple Update Script for Baseball Scouting App

set -e

echo "🔄 Updating Baseball Scouting App..."

# Create backup before update
echo "💾 Creating backup..."
docker-compose -f docker-compose.prod.yml exec db pg_dump -U scout_user baseball_scouting > "backups/backup_before_update_$(date +%Y%m%d_%H%M%S).sql"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull

# Rebuild and restart
echo "🔨 Building and restarting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services
echo "⏳ Waiting for services to restart..."
sleep 15

# Quick health check
echo "🔍 Checking if site is responding..."
if curl -f -s https://scouting-report.com >/dev/null 2>&1; then
    echo "✅ Site is responding correctly"
else
    echo "⚠️  Site check failed - check logs if needed"
fi

# Show status
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Update completed!"
echo "🔧 If issues occur, check logs: docker-compose -f docker-compose.prod.yml logs"