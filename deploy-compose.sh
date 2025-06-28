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

# Run database migration for spray chart
echo "📊 Running database migration..."
docker compose -f docker-compose.prod.yml exec -T db psql -U scout_user -d baseball_scouting -c "ALTER TABLE scouting_reports ADD COLUMN IF NOT EXISTS spray_chart_image VARCHAR(255);"

echo "✅ Deployment complete!"
echo "📋 Access points:"
echo "   - App: http://localhost (via nginx-proxy-manager)"
echo "   - Nginx Proxy Manager: http://localhost:81"
echo "   - Default login: admin@example.com / changeme"
echo "📸 New feature: Spray Chart image upload now available!"