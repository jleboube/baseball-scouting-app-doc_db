#!/bin/bash

# Baseball Scouting App - Health Check Script
# Run this script to check the health of all services

echo "🏥 Baseball Scouting App - Health Check"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

# Function to check and report status
check_status() {
    local service=$1
    local command=$2
    local description=$3
    
    if eval $command &>/dev/null; then
        echo -e "✅ $description: ${GREEN}OK${NC}"
    else
        echo -e "❌ $description: ${RED}FAILED${NC}"
        ((ERRORS++))
    fi
}

# Function to check port
check_port() {
    local port=$1
    local description=$2
    
    if netstat -tuln | grep -q ":$port "; then
        echo -e "✅ $description (port $port): ${GREEN}LISTENING${NC}"
    else
        echo -e "❌ $description (port $port): ${RED}NOT LISTENING${NC}"
        ((ERRORS++))
    fi
}

# Check Docker services
echo "🐳 Docker Services"
echo "==================="
check_status "docker" "docker info" "Docker daemon"
check_status "compose" "docker-compose --version" "Docker Compose"

# Check running containers
echo ""
echo "📦 Container Status"
echo "==================="
if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo -e "✅ Containers: ${GREEN}RUNNING${NC}"
    docker-compose -f docker-compose.prod.yml ps
else
    echo -e "❌ Containers: ${RED}NOT RUNNING${NC}"
    ((ERRORS++))
fi

# Check specific services
echo ""
echo "🔧 Service Health"
echo "=================="
check_status "app" "docker-compose -f docker-compose.prod.yml exec -T app echo 'OK'" "Application container"
check_status "db" "docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U scout_user" "Database container"
check_status "nginx" "docker-compose -f docker-compose.prod.yml exec -T nginx nginx -t" "Nginx configuration"

# Check network connectivity
echo ""
echo "🌐 Network & SSL"
echo "=================="
check_status "http" "curl -f -s http://scouting-report.com" "HTTP redirect"
check_status "https" "curl -f -s https://scouting-report.com" "HTTPS website"
check_status "ssl" "echo | openssl s_client -connect scouting-report.com:443 -servername scouting-report.com 2>/dev/null | openssl x509 -noout -dates" "SSL certificate"

# Check ports
echo ""
echo "🔌 Port Status"
echo "==============="
check_port "80" "HTTP"
check_port "443" "HTTPS"
check_port "22" "SSH"

# Check system resources
echo ""
echo "💾 System Resources"
echo "===================="

# Disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 80 ]; then
    echo -e "✅ Disk usage: ${GREEN}${DISK_USAGE}%${NC}"
else
    echo -e "⚠️  Disk usage: ${YELLOW}${DISK_USAGE}%${NC} (Warning: >80%)"
    if [ $DISK_USAGE -gt 90 ]; then
        echo -e "❌ Disk usage: ${RED}CRITICAL${NC}"
        ((ERRORS++))
    fi
fi

# Memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -lt 80 ]; then
    echo -e "✅ Memory usage: ${GREEN}${MEMORY_USAGE}%${NC}"
else
    echo -e "⚠️  Memory usage: ${YELLOW}${MEMORY_USAGE}%${NC} (Warning: >80%)"
    if [ $MEMORY_USAGE -gt 90 ]; then
        echo -e "❌ Memory usage: ${RED}CRITICAL${NC}"
        ((ERRORS++))
    fi
fi

# Load average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
LOAD_THRESHOLD="2.0"
if (( $(echo "$LOAD_AVG < $LOAD_THRESHOLD" | bc -l) )); then
    echo -e "✅ Load average: ${GREEN}${LOAD_AVG}${NC}"
else
    echo -e "⚠️  Load average: ${YELLOW}${LOAD_AVG}${NC} (High load)"
fi

# Check database connectivity
echo ""
echo "🗄️  Database Health"
echo "===================="
if DB_SIZE=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U scout_user -d baseball_scouting -t -c "SELECT pg_size_pretty(pg_database_size('baseball_scouting'));" 2>/dev/null); then
    echo -e "✅ Database connection: ${GREEN}OK${NC}"
    echo "📊 Database size: $(echo $DB_SIZE | xargs)"
    
    # Check table counts
    USER_COUNT=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U scout_user -d baseball_scouting -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs)
    REPORT_COUNT=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U scout_user -d baseball_scouting -t -c "SELECT COUNT(*) FROM scouting_reports;" 2>/dev/null | xargs)
    
    echo "👥 Users: $USER_COUNT"
    echo "📝 Reports: $REPORT_COUNT"
else
    echo -e "❌ Database connection: ${RED}FAILED${NC}"
    ((ERRORS++))
fi

# Check backup status
echo ""
echo "💾 Backup Status"
echo "================="
BACKUP_DIR="$HOME/baseball-scouting-backups"
if [ -d "$BACKUP_DIR" ]; then
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.sql.gz 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_AGE=$(find "$LATEST_BACKUP" -mtime -1)
        if [ -n "$BACKUP_AGE" ]; then
            echo -e "✅ Latest backup: ${GREEN}$(basename $LATEST_BACKUP)${NC}"
            echo "📅 Created: $(date -r $LATEST_BACKUP)"
        else
            echo -e "⚠️  Latest backup: ${YELLOW}$(basename $LATEST_BACKUP)${NC} (>24h old)"
        fi
    else
        echo -e "❌ No backups found in: ${RED}$BACKUP_DIR${NC}"
        ((ERRORS++))
    fi
else
    echo -e "❌ Backup directory not found: ${RED}$BACKUP_DIR${NC}"
    ((ERRORS++))
fi

# Check fail2ban status
echo ""
echo "🔒 Security Status"
echo "=================="
if sudo fail2ban-client status >/dev/null 2>&1; then
    echo -e "✅ Fail2ban: ${GREEN}ACTIVE${NC}"
    BANNED_IPS=$(sudo fail2ban-client status | grep "Banned" | awk '{print $4}')
    echo "🚫 Currently banned IPs: $BANNED_IPS"
else
    echo -e "⚠️  Fail2ban: ${YELLOW}NOT RUNNING${NC}"
fi

# UFW firewall status
if sudo ufw status | grep -q "Status: active"; then
    echo -e "✅ UFW Firewall: ${GREEN}ACTIVE${NC}"
else
    echo -e "⚠️  UFW Firewall: ${YELLOW}INACTIVE${NC}"
fi

# SSL certificate expiration
echo ""
echo "🔐 SSL Certificate"
echo "=================="
if CERT_INFO=$(echo | openssl s_client -connect scouting-report.com:443 -servername scouting-report.com 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
    EXPIRY_DATE=$(echo "$CERT_INFO" | grep "notAfter" | cut -d= -f2)
    EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
    CURRENT_TIMESTAMP=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_TIMESTAMP - $CURRENT_TIMESTAMP) / 86400 ))
    
    if [ $DAYS_UNTIL_EXPIRY -gt 30 ]; then
        echo -e "✅ SSL Certificate: ${GREEN}Valid for $DAYS_UNTIL_EXPIRY days${NC}"
    elif [ $DAYS_UNTIL_EXPIRY -gt 7 ]; then
        echo -e "⚠️  SSL Certificate: ${YELLOW}Expires in $DAYS_UNTIL_EXPIRY days${NC}"
    else
        echo -e "❌ SSL Certificate: ${RED}Expires in $DAYS_UNTIL_EXPIRY days${NC}"
        ((ERRORS++))
    fi
else
    echo -e "❌ SSL Certificate: ${RED}Cannot retrieve certificate info${NC}"
    ((ERRORS++))
fi

# Summary
echo ""
echo "📋 Health Check Summary"
echo "======================="
if [ $ERRORS -eq 0 ]; then
    echo -e "🎉 Overall Status: ${GREEN}HEALTHY${NC}"
    echo "All systems are operating normally."
else
    echo -e "⚠️  Overall Status: ${RED}$ERRORS ISSUES DETECTED${NC}"
    echo "Please review the failed checks above and take appropriate action."
fi

echo ""
echo "📅 Check completed: $(date)"
echo "🔄 Next check recommended: Run this script daily or set up cron job"

# Exit with error code if issues found
exit $ERRORS