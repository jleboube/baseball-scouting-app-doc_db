# Baseball Scouting Reports - Production Ready

A modern, team-based baseball scouting application with SSL, authentication, and professional deployment using Nginx Proxy Manager.

## 🚀 Quick Production Setup

### 1. Configure Environment
```bash
cp .env.production .env
nano .env  # Update passwords and domain
```

### 2. Deploy
```bash
chmod +x *.sh
./deploy.sh
```

### 3. Configure Domain & SSL
- Access Nginx Proxy Manager: `http://YOUR_IP:81`
- Login: `admin@example.com` / `changeme` (change immediately!)
- Add proxy host for your domain pointing to `app:3000`
- Request SSL certificate

### 4. Done! 
Visit `https://your-domain.com` and login with `admin@demo.com` / `admin123`

## 🏗️ Architecture

- **Nginx Proxy Manager**: SSL certificates & reverse proxy (web UI)
- **Node.js App**: Baseball scouting application  
- **PostgreSQL**: Database with team-based access control
- **Docker**: Containerized deployment

## 🔧 Management

```bash
# View status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs app

# Create backup
./backup_database.sh

# Restore backup
./restore_database.sh backups/backup_file.sql.gz

# Update application  
./update.sh

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

## 🔒 Security Features

- ✅ **SSL/HTTPS** with auto-renewal
- ✅ **Team-based access control**  
- ✅ **Session management**
- ✅ **Password hashing (bcrypt)**
- ✅ **CORS protection**
- ✅ **Secure headers**

## 📊 Features

- **Team Management**: Users only see their team's reports
- **Complete Scouting Forms**: All 12U baseball evaluation criteria
- **Search & Filter**: Find reports by player, team, position
- **Auto-save Drafts**: Never lose work
- **Responsive Design**: Works on mobile, tablet, desktop
- **Automated Backups**: Daily database backups
- **Age Calculation**: Auto-calculates age from birth date

## 🗃️ Database Schema

- **users**: Team members with authentication
- **groups**: Teams/organizations  
- **scouting_reports**: Player evaluations (team-scoped)
- **session**: Secure session storage

## 📝 Default Accounts & Team Registration

- **Demo Team**: `admin@demo.com` / `admin123`
- Create your own team accounts after login

### Team Registration Codes
Each team has a unique registration code for new user registration:
- **Demo Team**: `DEMO2024`
- **Lions Baseball**: `LIONS2024`  
- **Eagles Baseball**: `EAGLES2024`

### Managing Teams
```bash
# View current teams
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -d baseball_scouting -c "SELECT id, name, registration_code FROM groups;"

# Add new team
docker-compose -f docker-compose.prod.yml exec db psql -U scout_user -d baseball_scouting -c "INSERT INTO groups (name, description, registration_code) VALUES ('Team Name', 'Description', 'TEAMCODE2024');"
```

## 🔄 Updates

```bash
git pull
./update.sh
```

Automatic backup is created before each update.

## 🆘 Troubleshooting

### Site not loading?
```bash
# Check services
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs
```

### SSL issues?
- Verify DNS points to your server
- Check domain configuration in Nginx Proxy Manager
- Ensure ports 80/443 are open

### Database issues?
```bash
# Check database
docker-compose -f docker-compose.prod.yml logs db

# Restart database
docker-compose -f docker-compose.prod.yml restart db
```

## 📁 File Structure

```
baseball-scouting-app/
├── docker-compose.prod.yml    # Production setup
├── .env                       # Your configuration
├── deploy.sh                  # Simple deployment
├── backup_database.sh         # Database backup
├── restore_database.sh        # Database restore  
├── update.sh                  # Application updates
├── server.js                  # Application server
├── init.sql                   # Database schema
└── public/                    # Web interface
```

## 💡 Why Nginx Proxy Manager?

- **Web UI**: No complex config files
- **SSL Management**: Automatic Let's Encrypt certificates  
- **Multi-site**: Easily add more domains/apps
- **Access Control**: Built-in authentication options
- **Monitoring**: View logs and stats in web interface

Simple, powerful, and professional. Perfect for production deployments! 🎉