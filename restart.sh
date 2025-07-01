#!/bin/bash

echo "🔄 Restarting Baseball Scouting App..."

# Stop containers
echo "🛑 Stopping containers..."
docker-compose down

# Remove any orphaned containers
echo "🧹 Cleaning up..."
docker-compose rm -f

# Rebuild and start
echo "🔨 Building and starting..."
docker-compose up --build -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 20

# Check status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🔍 Checking logs:"
docker-compose logs --tail=10

echo ""
echo "✅ Restart complete! Check logs above for any errors."
echo "🌐 Access the app at: http://localhost:3000"
echo "🔑 Default login: admin@demo.com / admin123"