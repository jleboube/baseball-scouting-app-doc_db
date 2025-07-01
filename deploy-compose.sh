#!/bin/bash
set -e

echo "🚀 Deploying with Docker Compose..."

# Stop existing containers (keep volumes)
docker compose -f docker-compose.prod.yml down

# Start services
docker compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database..."
sleep 10

# Check database connectivity
echo "📊 Checking database connectivity..."
docker compose -f docker-compose.prod.yml exec -T db mongosh --eval "db.adminCommand('ping')" --quiet

echo "✅ Deployment complete!"
echo "📋 Access points:"
echo "   - App: http://localhost (via nginx-proxy-manager)"
echo "   - Nginx Proxy Manager: http://localhost:81"
echo "   - Default login: admin@example.com / changeme"
echo "📸 New feature: Spray Chart image upload now available!"