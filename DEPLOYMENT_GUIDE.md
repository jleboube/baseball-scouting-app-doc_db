# Baseball Scouting App - Deployment Guide

## Quick Summary
This repo contains a **complete, production-ready baseball scouting web application** with:
- ✅ User authentication and team-based access control
- ✅ Complete scouting report CRUD functionality  
- ✅ Docker containerization for easy deployment
- ✅ MongoDB database with automatic initialization
- ✅ SSL/HTTPS support via Nginx Proxy Manager
- ✅ Backup/restore scripts
- ✅ Health monitoring tools

## Two Deployment Options

### Option 1: Simple Deployment (HTTP only)
For testing or internal use without SSL:

```bash
# 1. Copy environment template
cp .env.production .env

# 2. Edit .env file with your settings
nano .env

# 3. Deploy with Docker Compose
docker compose up -d

# 4. Access the app
# Visit: http://localhost:3000
# Login: admin@demo.com / admin123
```

### Option 2: Production Deployment (HTTPS with SSL)
For public-facing deployment with SSL certificates:

```bash
# 1. Copy and configure environment
cp .env.production .env
nano .env  # Set DB_PASSWORD, SESSION_SECRET, DOMAIN

# 2. Make scripts executable
chmod +x *.sh

# 3. Deploy with Nginx Proxy Manager
./deploy-compose.sh

# 4. Configure SSL via web interface
# Visit: http://YOUR_IP:81
# Login: admin@example.com / changeme (change immediately!)
# Add proxy host for your domain → app:3000
# Request SSL certificate
```

## Required Configuration

### Minimum .env Setup
```bash
DB_PASSWORD=your_secure_database_password_here
SESSION_SECRET=your_32_character_session_secret_key_here
DOMAIN=your-domain.com
```

### DNS Configuration
Point your domain to your server's IP address:
```
A    your-domain.com    → YOUR_SERVER_IP
```

## Default Accounts

### Demo Team Access
- **Email:** admin@demo.com  
- **Password:** admin123
- **Team Code:** DEMO2025

### Other Teams Available
- **Rampage 12U Baseball** - Code: RAMPAGE2025
- **Venom 11U Baseball** - Code: VENOM2025

## Management Commands

```bash
# View status
docker compose -f docker-compose.prod.yml ps

# View logs  
docker compose -f docker-compose.prod.yml logs app

# Create backup
./backup_database.sh

# Restore backup
./restore_database.sh backups/backup_file.archive.gz

# Update application
./update.sh

# Health check
./health_check.sh

# Stop services
docker compose -f docker-compose.prod.yml down
```

## Application Features

### User Management
- Team-based registration with registration codes
- Secure authentication with bcrypt password hashing
- Session management with MongoDB store

### Scouting Reports
- Complete baseball evaluation forms (12U focused)
- Player information, physical development, hitting, fielding, pitching
- Baseball IQ and intangibles assessment
- Spray chart image upload
- Development recommendations and projections

### Data Security  
- Team-based data isolation (users only see their team's reports)
- Input validation and sanitization
- CORS protection
- Secure headers

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up --build -d
```

### Database connection issues
```bash
# Check database status
docker-compose exec db mongosh --eval "db.adminCommand('ping')"

# Check environment variables
cat .env
```

### SSL/Domain issues
- Verify DNS points to your server
- Check ports 80/443 are open
- Review Nginx Proxy Manager configuration
- Check domain in .env file

### Performance issues
```bash
# Check system resources
./health_check.sh

# View detailed logs
docker-compose logs --tail=100 app
```

## File Structure

```
baseball-scouting-app/
├── server.js                  # Main application server
├── package.json              # Node.js dependencies
├── Dockerfile                # Container configuration
├── docker-compose.yml        # Simple deployment
├── docker-compose.prod.yml   # Production with Nginx Proxy Manager
├── .env.production           # Environment template
├── init-mongo.js            # Database initialization
├── deploy-compose.sh        # Production deployment script
├── backup_database.sh       # Backup utility
├── restore_database.sh      # Restore utility
├── health_check.sh          # System health monitor
├── update.sh               # Update application
├── public/                 # Web interface
│   ├── index.html         # Main HTML
│   ├── app.js            # Frontend JavaScript
│   └── styles.css        # Styling
└── nginx/                # Reverse proxy config
    └── nginx.conf
```

## Security Notes

1. **Change default passwords** in .env file
2. **Use strong session secrets** (32+ characters)  
3. **Configure firewall** to only allow ports 22, 80, 443
4. **Keep Docker images updated** 
5. **Monitor logs** for suspicious activity
6. **Regular backups** are essential

## Support

If you encounter issues:
1. Check this deployment guide
2. Review application logs
3. Run health check script
4. Verify environment configuration