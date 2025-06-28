# Database Migration: PostgreSQL to MongoDB

This application has been refactored to use MongoDB instead of PostgreSQL as the database backend.

## Key Changes

### Dependencies
- Replaced `pg` with `mongodb`
- Replaced `connect-pg-simple` with `connect-mongo`

### Database Connection
- MongoDB connection string format: `mongodb://user:pass@host:port/database`
- Automatic database initialization with sample data
- Collection indexes created automatically

### Data Structure
- PostgreSQL tables → MongoDB collections
- SQL queries → MongoDB operations (find, aggregate, insertOne, updateOne, deleteOne)
- Auto-generated ObjectIds instead of serial integers

### Docker Configuration
- PostgreSQL container → MongoDB container (mongo:7-jammy)
- Port 5432 → Port 27017
- `init.sql` → `init-mongo.js`

### Backup/Restore Scripts
- `pg_dump`/`psql` → `mongodump`/`mongorestore`
- `.sql.gz` files → `.archive.gz` files

## Collections Structure

### groups
- `_id`: ObjectId (auto-generated)
- `name`: String (unique)
- `description`: String
- `registration_code`: String (unique)
- `created_at`: Date

### users
- `_id`: ObjectId (auto-generated)
- `email`: String (unique)
- `password_hash`: String
- `first_name`: String
- `last_name`: String
- `group_id`: ObjectId (references groups._id)
- `is_active`: Boolean
- `created_at`: Date
- `updated_at`: Date

### scouting_reports
- `_id`: ObjectId (auto-generated)
- `user_id`: ObjectId (references users._id)
- `group_id`: ObjectId (references groups._id)
- `created_at`: Date
- `updated_at`: Date
- All scouting fields (same as before)

## Running the Application

1. Install new dependencies:
   ```bash
   npm install
   ```

2. Start with Docker:
   ```bash
   docker-compose up -d
   ```

3. The MongoDB initialization script will automatically:
   - Create collections with validation
   - Set up indexes
   - Insert sample groups and admin user

## Default Login
- Email: `admin@demo.com`
- Password: `admin123`

## Backup/Restore
- Backup: `./backup_database.sh`
- Restore: `./restore_database.sh backup_file.archive.gz`