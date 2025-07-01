# Baseball Scouting Reports - Production Ready

A modern, team-based baseball scouting application with SSL, authentication, and professional deployment using Nginx Proxy Manager.

## 🚀 Quick Production Setup

### 1. Configure Environment
```bash
cp .env.production .env
nano .env  # Update passwords and domain
```

Create passwords for .env file.

#### 1A. Create hashed passwords to insert into .env file.

#### OpenSSL
```
# With a random random salt
openssl passwd -6 '<password>'
# Choosing both password and salt
openssl passwd -6 --salt '<salt>' '<password>'
# Read password from stdin to avoid leaking it in shell command history
openssl passwd -6 -stdin
openssl passwd -6
```
#### mkpasswd
```
# With a random password and random salt
mkpasswd -m sha-512
# With a random random salt
mkpasswd -m sha-512 '<password>'
# Choosing both password and salt
mkpasswd -m sha-512 '<password>' '<salt>'
# Read password from stdin to avoid leaking it in shell command history
mkpasswd -m sha-512 --stdin
```

### 2. Deploy
```bash
chmod +x *.sh
./deploy-compose.sh
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
- **MongoDB**: Database with team-based access control
- **Docker**: Containerized deployment

## 🔧 Management

```bash
# View status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs app

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop services
docker compose -f docker-compose.prod.yml down

# Update and redeploy
./deploy-compose.sh
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
- **Spray Chart Upload**: Upload and display spray chart images
- **Search & Filter**: Find reports by player, team, position
- **Auto-save Drafts**: Never lose work
- **Responsive Design**: Works on mobile, tablet, desktop
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
- **Demo Team**: `DEMO2025`
- **Rampage 12U Baseball**: `RAMPAGE2025`  
- **Venom 11U Baseball**: `VENOM2025`

### Managing Teams
```bash
# View current teams
docker compose -f docker-compose.prod.yml exec db mongosh baseball_scouting --eval "db.groups.find({}, {name: 1, registration_code: 1}).pretty()"

# Add new team
docker compose -f docker-compose.prod.yml exec db mongosh baseball_scouting --eval "db.groups.insertOne({name: 'Team Name', description: 'Description', registration_code: 'TEAMCODE2025', created_at: new Date()})"
```

## 🔄 Updates

```bash
./deploy-compose.sh
```

This will update the application and run any necessary database migrations.

## 🆘 Troubleshooting

### Site not loading?
```bash
# Check services
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs
```

### SSL issues?
- Verify DNS points to your server
- Check domain configuration in Nginx Proxy Manager
- Ensure ports 80/443 are open

### Database issues?
```bash
# Check database
docker compose -f docker-compose.prod.yml logs db

# Restart database
docker compose -f docker-compose.prod.yml restart db
```

## 📁 File Structure

```
baseball-scouting-app/
├── docker-compose.prod.yml    # Production setup
├── docker-compose.yml         # Simple setup (no proxy)
├── .env                       # Your configuration
├── deploy-compose.sh          # Docker Compose deployment
├── server.js                  # Application server
├── init-mongo.js              # Database initialization
├── uploads/                   # Spray chart images
└── public/                    # Web interface
```

## 💡 Why Nginx Proxy Manager?

- **Web UI**: No complex config files
- **SSL Management**: Automatic Let's Encrypt certificates  
- **Multi-site**: Easily add more domains/apps
- **Access Control**: Built-in authentication options
- **Monitoring**: View logs and stats in web interface

Simple, powerful, and professional. Perfect for production deployments! 🎉
