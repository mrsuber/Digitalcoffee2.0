# Digital Coffee Backend Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Database Setup

### Option 1: Quick Setup (macOS/Linux)

1. **Install PostgreSQL** (if not already installed):
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

2. **Create Database and User**:
```bash
# Connect to PostgreSQL as superuser
psql postgres

# Run these SQL commands:
CREATE DATABASE digitalcoffee;
CREATE USER digitalcoffee_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE digitalcoffee TO digitalcoffee_user;
\q
```

### Option 2: Simplified Setup (Use Default PostgreSQL User)

If you want to use the default PostgreSQL user, update your `.env` file:

```env
DB_USER=postgres  # or your PostgreSQL username
DB_PASSWORD=      # leave empty if no password set
```

## Backend Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required Environment Variables:**

```env
# Server
PORT=5000
NODE_ENV=development

# Database - OPTION A: Custom user
DB_HOST=localhost
DB_PORT=5432
DB_NAME=digitalcoffee
DB_USER=digitalcoffee_user
DB_PASSWORD=your_secure_password

# Database - OPTION B: Default postgres user
# DB_USER=postgres
# DB_PASSWORD=

# JWT
JWT_SECRET=your-very-long-random-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:19006,http://localhost:3000

# App
APP_NAME=Digital Coffee
APP_URL=http://localhost:19006

# Email (Optional for development)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@digitalcoffee.cafe
```

### 3. Initialize Database

```bash
# Run the schema setup
npm run db:setup
```

This will create all tables and seed default data.

### 4. Add Password Reset Table

```bash
# Run the password reset migration
npm run db:migrate add_password_reset.sql
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## Testing the Setup

### Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-06T10:00:00.000Z"
}
```

### Test Registration

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { ... },
    "token": "eyJhbGc..."
  }
}
```

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

## Troubleshooting

### Database Connection Issues

**Error:** `role "digitalcoffee_user" does not exist`

**Solution:** Create the database user or use the postgres default user:
```bash
psql postgres
CREATE USER digitalcoffee_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE digitalcoffee TO digitalcoffee_user;
\q
```

**Error:** `database "digitalcoffee" does not exist`

**Solution:** Create the database:
```bash
psql postgres
CREATE DATABASE digitalcoffee;
\q
```

**Error:** `connection refused`

**Solution:** Start PostgreSQL:
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:** Change the PORT in `.env` or kill the process using port 5000:
```bash
# Find process
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Email Not Sending (Development)

In development mode, emails are logged to the console instead of actually being sent. Check the terminal output for the reset URL.

For production, configure a real SMTP service (Gmail, SendGrid, etc.)

## Project Structure

```
backend/
├── config/
│   └── database.js          # PostgreSQL connection
├── middleware/
│   └── auth.js              # JWT authentication
├── routes/
│   ├── auth.js              # Auth endpoints
│   ├── mood.js              # Mood tracking
│   ├── courses.js           # Courses
│   ├── audio.js             # Audio content
│   ├── progress.js          # User progress
│   └── journal.js           # Journal entries
├── utils/
│   └── emailService.js      # Email sending
├── scripts/
│   ├── setupDatabase.js     # Initial setup
│   └── runMigration.js      # Migrations
├── migrations/
│   └── add_password_reset.sql
├── docs/
│   └── AUTH_API.md          # API documentation
├── index.js                 # Server entry point
├── schema.sql               # Database schema
├── package.json
└── .env                     # Configuration
```

## API Documentation

See `docs/AUTH_API.md` for complete API documentation.

## Production Deployment

### Environment Variables

Make sure to set secure values for production:

- `NODE_ENV=production`
- `JWT_SECRET`: Use a long random string (64+ characters)
- `DB_PASSWORD`: Use a strong password
- Configure real email service (EMAIL_* variables)
- Set `ALLOWED_ORIGINS` to your actual domain(s)

### Security Checklist

- [ ] Strong JWT_SECRET
- [ ] Strong database password
- [ ] HTTPS enabled
- [ ] CORS configured for specific origins
- [ ] Email service configured
- [ ] Database backups scheduled
- [ ] Rate limiting implemented (recommended)
- [ ] Logging and monitoring set up

### PM2 Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Start the app
pm2 start ecosystem.config.js

# View logs
pm2 logs

# Restart
pm2 restart digitalcoffee-api

# Stop
pm2 stop digitalcoffee-api
```

## Support

For issues or questions, check:
- API Documentation: `docs/AUTH_API.md`
- Database Schema: `schema.sql`
- Example Environment: `.env.example`
