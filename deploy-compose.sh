#!/bin/bash
set -e

echo "🚀 Deploying with Docker Compose..."

# Stop existing containers and remove volumes
docker-compose -f docker-compose.prod.yml down -v

# Start services
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment complete!"
echo "📋 Access points:"
echo "   - App: http://localhost (via nginx-proxy-manager)"
echo "   - Nginx Proxy Manager: http://localhost:81"
echo "   - Default login: admin@example.com / changeme"