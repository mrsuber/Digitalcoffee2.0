# Quick Deployment Steps for VPS

## What's Ready
✅ Production environment file configured with Private Email
✅ Nginx configuration for digitalcoffee.cafe
✅ SSL setup instructions included
✅ Password reset API integrated in mobile app
✅ Deployment script ready
✅ All code pushed to GitHub

## Quick Deploy on VPS (76.13.41.99)

### 1. SSH into VPS
```bash
ssh root@76.13.41.99
```

### 2. Clone/Update Repository
```bash
cd /var/www
# If first time:
git clone git@github.com:mrsuber/Digitalcoffee2.0.git
# If updating:
cd Digitalcoffee2.0 && git pull origin main
```

### 3. Setup Environment
```bash
cd backend
cp .env.production .env
# Edit if needed: nano .env
```

### 4. Install & Initialize
```bash
npm install --production

# Setup database (first time only)
npm run db:init
```

### 5. Configure Nginx
```bash
# Copy nginx config
sudo cp nginx-digitalcoffee.conf /etc/nginx/sites-available/digitalcoffee

# Enable site
sudo ln -s /etc/nginx/sites-available/digitalcoffee /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Install SSL certificate
sudo certbot --nginx -d digitalcoffee.cafe -d www.digitalcoffee.cafe

# Reload nginx
sudo systemctl reload nginx
```

### 6. Deploy with PM2
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh production
```

### 7. Verify
```bash
# Check PM2
pm2 status
pm2 logs digitalcoffee-v2

# Test API
curl https://digitalcoffee.cafe/health
```

## Important Email Settings

**Email Service**: Private Email (mail.privateemail.com)
**Sending Address**: info@digitalcoffee.cafe
**SMTP Credentials**: Already configured in .env.production

Make sure your DNS MX, SPF, and TXT records are properly set up (from the screenshot you shared).

## Port Configuration

Default port: **5000**
If port 5000 is in use, change to another port:
1. Edit `.env`: Change `PORT=5001`
2. Edit `ecosystem.config.js`: Update port in env section
3. Edit nginx config: Change `proxy_pass http://localhost:5001;`
4. Reload: `sudo systemctl reload nginx && pm2 restart digitalcoffee-v2`

## Testing Checklist

After deployment, test:
- [ ] Health endpoint: `https://digitalcoffee.cafe/health`
- [ ] Signup: Create new account via mobile app
- [ ] Login: Login with test account
- [ ] Forgot Password: Request password reset
- [ ] Check Email: Verify email arrives from info@digitalcoffee.cafe
- [ ] Reset Password: Complete the password reset

## Troubleshooting

**Logs**:
```bash
pm2 logs digitalcoffee-v2
sudo tail -f /var/log/nginx/digitalcoffee-error.log
```

**Restart**:
```bash
pm2 restart digitalcoffee-v2
```

**Full details**: See DEPLOYMENT_GUIDE.md

---

**Ready to deploy!** 🚀
