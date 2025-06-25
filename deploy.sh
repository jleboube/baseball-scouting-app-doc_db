#!/bin/bash

# Simple Baseball Scouting App Deployment
# Uses Nginx Proxy Manager for SSL and reverse proxy

set -e

echo "🚀 Deploying Baseball Scouting App with Nginx Proxy Manager..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found!"
    echo "📝 Please create .env file:"
    echo "   cp .env.production .env"
    echo "   nano .env  # Update with your values"
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
if [ -z "$DB_PASSWORD" ] || [ -z "$SESSION_SECRET" ] || [ -z "$DOMAIN" ]; then
    echo "❌ Missing required environment variables in .env file"
    echo "   Required: DB_PASSWORD, SESSION_SECRET, DOMAIN"
    exit 1
fi

echo "✅ Environment variables validated"

# Create backup directory
mkdir -p backups

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Build and start the application
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 15

# Check if services are running
echo "🔍 Checking service status..."
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "✅ Services are running!"
    docker-compose -f docker-compose.prod.yml ps
else
    echo "❌ Some services failed to start. Check logs:"
    docker-compose -f docker-compose.prod.yml logs
    exit 1
fi

# Get server IP for user
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s icanhazip.com 2>/dev/null || echo "YOUR_SERVER_IP")

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "   1. 🌐 Configure DNS: Point $DOMAIN to $SERVER_IP"
echo "   2. 🔧 Access Nginx Proxy Manager: http://$SERVER_IP:81"
echo "      - Default login: admin@example.com / changeme"
echo "      - ⚠️  CHANGE THESE CREDENTIALS IMMEDIATELY!"
echo "   3. 🔒 Add proxy host for $DOMAIN pointing to 'app:3000'"
echo "   4. 📜 Request SSL certificate in Nginx Proxy Manager"
echo "   5. 🎯 Test your site: https://$DOMAIN"
echo ""
echo "📝 Default app login: admin@demo.com / admin123"
echo ""
echo "🔧 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs"
echo "   Restart: docker-compose -f docker-compose.prod.yml restart"
echo "   Stop: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "📖 Full setup guide: see PRODUCTION_SETUP.md"