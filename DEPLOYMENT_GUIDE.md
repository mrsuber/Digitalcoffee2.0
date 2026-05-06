# Digital Coffee 2.0 - VPS Deployment Guide

## Prerequisites
- VPS running Ubuntu/Debian with root access
- IP Address: 76.13.41.99
- Domain: digitalcoffee.cafe (DNS properly configured)
- PostgreSQL installed
- Node.js v16+ installed
- Nginx installed
- PM2 installed globally

## Deployment Steps

### 1. SSH into VPS
```bash
ssh root@76.13.41.99
```

### 2. Navigate to Deployment Directory
```bash
cd /var/www
```

### 3. Clone or Update Repository
If first time:
```bash
git clone git@github.com:mrsuber/Digitalcoffee2.0.git
cd Digitalcoffee2.0/backend
```

If updating:
```bash
cd /var/www/Digitalcoffee2.0
git pull origin main
cd backend
```

### 4. Install Dependencies
```bash
npm install --production
```

### 5. Configure Environment Variables
The `.env` file is already configured with production settings. Verify the following:

```bash
cat .env
```

**Important Settings:**
- `PORT=5000` - Make sure this port is not in use by other applications
- `NODE_ENV=production`
- `EMAIL_HOST=mail.privateemail.com`
- `EMAIL_USER=abbaabdouraman@digitalcoffee.cafe`
- `EMAIL_FROM=info@digitalcoffee.cafe`
- `APP_URL=https://digitalcoffee.cafe`

**IMPORTANT:** If port 5000 is already in use, change it to an available port (e.g., 5001, 5002) and update the Nginx configuration accordingly.

To check if port is in use:
```bash
sudo lsof -i :5000
# or
sudo netstat -tulpn | grep :5000
```

### 6. Setup PostgreSQL Database

#### Create Database User
```bash
sudo -u postgres psql
```

In PostgreSQL:
```sql
CREATE USER digitalcoffee_user WITH PASSWORD 'DigitalCoffee2024!SecurePass';
CREATE DATABASE digitalcoffee OWNER digitalcoffee_user;
GRANT ALL PRIVILEGES ON DATABASE digitalcoffee TO digitalcoffee_user;
\q
```

#### Initialize Database Schema
```bash
npm run db:init
```

This will:
- Create the database if it doesn't exist
- Run the schema setup (creates tables)
- Run migrations (adds password_reset_tokens table)

### 7. Configure Nginx

#### Copy Nginx Configuration
```bash
sudo cp /var/www/Digitalcoffee2.0/backend/nginx-digitalcoffee.conf /etc/nginx/sites-available/digitalcoffee
```

#### Enable the Site
```bash
sudo ln -s /etc/nginx/sites-available/digitalcoffee /etc/nginx/sites-enabled/
```

#### Test Nginx Configuration
```bash
sudo nginx -t
```

#### Reload Nginx (don't restart yet - wait for SSL)
```bash
sudo systemctl reload nginx
```

### 8. Setup SSL Certificate with Certbot

#### Install Certbot (if not already installed)
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

#### Obtain SSL Certificate
```bash
sudo certbot --nginx -d digitalcoffee.cafe -d www.digitalcoffee.cafe
```

Follow the prompts:
1. Enter email address
2. Agree to terms
3. Choose whether to share email with EFF
4. Certbot will automatically configure SSL in Nginx

#### Verify Auto-Renewal
```bash
sudo certbot renew --dry-run
```

### 9. Start Application with PM2

#### Stop existing process (if any)
```bash
pm2 stop digitalcoffee-v2
pm2 delete digitalcoffee-v2
```

#### Start the application
```bash
pm2 start ecosystem.config.js
```

#### Save PM2 Process List
```bash
pm2 save
```

#### Enable PM2 Startup on Boot
```bash
pm2 startup
# Follow the command it outputs
```

### 10. Verify Deployment

#### Check PM2 Status
```bash
pm2 status
pm2 logs digitalcoffee-v2 --lines 50
```

#### Check Backend Health
```bash
curl http://localhost:5000/health
```

#### Check via Domain (HTTPS)
```bash
curl https://digitalcoffee.cafe/health
```

#### Test from Browser
Open in browser: https://digitalcoffee.cafe/health

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-06T..."
}
```

### 11. Test Email Functionality

#### Test Password Reset Email
You can test this via the API:

```bash
curl -X POST https://digitalcoffee.cafe/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Or test from the mobile app once it's connected.

### 12. Mobile App Configuration

The mobile app is already configured to use production URL when built in production mode:
- Development: `http://localhost:5000/api`
- Production: `https://digitalcoffee.cafe/api`

When testing with Expo:
1. Make sure you're on the same network
2. The app will auto-detect production/development mode

## Troubleshooting

### Port Already in Use
If port 5000 is in use:
1. Find available port: `sudo netstat -tulpn | grep LISTEN`
2. Update `backend/.env`: `PORT=5001` (or another free port)
3. Update `backend/ecosystem.config.js`: Change port in env section
4. Update `backend/nginx-digitalcoffee.conf`: Change `proxy_pass http://localhost:5001;`
5. Reload Nginx: `sudo systemctl reload nginx`
6. Restart PM2: `pm2 restart digitalcoffee-v2`

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -h localhost -U digitalcoffee_user -d digitalcoffee
# Enter password when prompted
```

### Email Not Sending
Check logs:
```bash
pm2 logs digitalcoffee-v2 | grep -i email
```

Verify Private Email settings:
- Host: mail.privateemail.com
- Port: 587
- Make sure DNS records (MX, SPF, TXT) are configured properly

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Force renew if needed
sudo certbot renew --force-renewal
```

### Nginx Issues
```bash
# Check nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/digitalcoffee-error.log

# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx
```

### PM2 Issues
```bash
# View all logs
pm2 logs digitalcoffee-v2

# Restart application
pm2 restart digitalcoffee-v2

# Monitor resources
pm2 monit

# Clear logs
pm2 flush
```

## Useful Commands

### View Application Logs
```bash
pm2 logs digitalcoffee-v2 --lines 100
```

### Restart Application
```bash
pm2 restart digitalcoffee-v2
```

### Stop Application
```bash
pm2 stop digitalcoffee-v2
```

### Update Application
```bash
cd /var/www/Digitalcoffee2.0
git pull origin main
cd backend
npm install --production
pm2 restart digitalcoffee-v2
```

### Database Backup
```bash
pg_dump -h localhost -U digitalcoffee_user digitalcoffee > backup-$(date +%Y%m%d).sql
```

### Database Restore
```bash
psql -h localhost -U digitalcoffee_user digitalcoffee < backup-20260506.sql
```

## Security Checklist

- [x] Production .env file configured
- [x] Strong database password set
- [x] Strong JWT secret set
- [x] SSL certificate installed
- [x] Email credentials secured
- [x] CORS properly configured
- [x] Nginx security headers enabled
- [ ] Firewall configured (only allow 22, 80, 443)
- [ ] Regular database backups scheduled
- [ ] PM2 monitoring setup

## Post-Deployment Testing

1. **Test Signup**: Create a new account via mobile app
2. **Test Login**: Login with created account
3. **Test Forgot Password**: Request password reset
4. **Check Email**: Verify reset email is received
5. **Test Reset Password**: Complete password reset flow
6. **Test API Endpoints**: Verify all endpoints work via HTTPS

## Next Steps

1. Deploy the backend following this guide
2. Test all authentication flows
3. Monitor logs for any errors
4. Setup automated backups
5. Configure monitoring/alerts (optional)
6. Update mobile app with any final changes
7. Submit mobile app to app stores

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs digitalcoffee-v2`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/digitalcoffee-error.log`
3. Verify DNS records for email delivery
4. Ensure all ports are properly configured

---

**Last Updated**: May 6, 2026
**Version**: 2.0.0
