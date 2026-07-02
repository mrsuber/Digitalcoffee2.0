# Quick Deployment Guide - Legal Documents Feature

## Server Connection Issues
The server (76.13.41.99) has intermittent connectivity. Deploy when you have a stable connection.

## Option 1: Automated Deployment (Recommended)

Run the deployment script:

```bash
cd /Users/camsoltechnology/dev/camsol_company/Digitalcoffee2.0
./deploy_legal_docs.sh
```

The script will:
1. Test server connectivity
2. Copy all backend files
3. Run database migration
4. Restart the backend server

## Option 2: Manual Deployment

If the script fails, deploy manually:

### Step 1: Backend Files

```bash
# Copy migration
scp backend/migrations/create_legal_documents.sql root@76.13.41.99:/var/www/digitalcoffee/backend/migrations/

# Copy routes
scp backend/routes/legal.js root@76.13.41.99:/var/www/digitalcoffee/backend/routes/
scp backend/routes/auth.js root@76.13.41.99:/var/www/digitalcoffee/backend/routes/
scp backend/index.js root@76.13.41.99:/var/www/digitalcoffee/backend/
```

### Step 2: Run Migration

```bash
ssh root@76.13.41.99 "cd /var/www/digitalcoffee/backend && PGPASSWORD='digitalcoffee2024' psql -h localhost -U postgres -d digitalcoffee -f migrations/create_legal_documents.sql"
```

### Step 3: Restart Backend

```bash
ssh root@76.13.41.99 "pm2 restart digitalcoffee-api && pm2 logs digitalcoffee-api --lines 50"
```

## Step 4: Deploy Admin Dashboard

```bash
cd admin
npm run build
rsync -avz --delete build/ root@76.13.41.99:/var/www/digitalcoffee/admin/
```

## Testing After Deployment

### 1. Test Backend API

```bash
# Test public endpoint (should work without auth)
curl https://digitalcoffee.cafe/api/legal/documents/terms_of_service
```

### 2. Test Admin Dashboard

1. Go to: https://digitalcoffee.cafe/admin
2. Login with admin credentials
3. Click "Legal Documents" in the sidebar
4. Try editing and saving a document

### 3. Test Mobile App

1. Open the mobile app  
2. Go to Settings > Terms of Service
3. Verify content loads from API
4. Verify markdown formatting renders properly

## Troubleshooting

### Backend not starting

```bash
ssh root@76.13.41.99 "pm2 logs digitalcoffee-api --lines 100"
```

### Database verification

```bash
ssh root@76.13.41.99 "PGPASSWORD='digitalcoffee2024' psql -h localhost -U postgres -d digitalcoffee -c 'SELECT * FROM legal_documents;'"
```

For detailed implementation, see `LEGAL_DOCUMENTS_IMPLEMENTATION.md`
