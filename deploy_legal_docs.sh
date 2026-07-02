#!/bin/bash

# Deploy Legal Documents Feature to Production Server
# This script deploys all backend changes for the legal documents management system

set -e  # Exit on error

SERVER="root@76.13.41.99"
SERVER_PATH="/var/www/digitalcoffee"
DB_PASSWORD="digitalcoffee2024"

echo "=========================================="
echo "Legal Documents Feature Deployment"
echo "=========================================="
echo ""

# Test server connectivity
echo "1. Testing server connectivity..."
if ! ping -c 3 76.13.41.99 > /dev/null 2>&1; then
    echo "❌ Error: Cannot reach server 76.13.41.99"
    echo "Please check your internet connection and try again."
    exit 1
fi
echo "✅ Server is reachable"
echo ""

# Copy migration file
echo "2. Copying database migration file..."
scp backend/migrations/create_legal_documents.sql $SERVER:$SERVER_PATH/backend/migrations/
echo "✅ Migration file copied"
echo ""

# Copy backend route files
echo "3. Copying backend route files..."
scp backend/routes/legal.js $SERVER:$SERVER_PATH/backend/routes/
scp backend/routes/auth.js $SERVER:$SERVER_PATH/backend/routes/
echo "✅ Route files copied"
echo ""

# Copy main index file
echo "4. Copying backend index.js..."
scp backend/index.js $SERVER:$SERVER_PATH/backend/
echo "✅ Index file copied"
echo ""

# Run database migration
echo "5. Running database migration..."
ssh $SERVER "cd $SERVER_PATH/backend && PGPASSWORD='$DB_PASSWORD' psql -h localhost -U postgres -d digitalcoffee -f migrations/create_legal_documents.sql"
echo "✅ Database migration completed"
echo ""

# Restart backend server
echo "6. Restarting backend server..."
ssh $SERVER "pm2 restart digitalcoffee-api"
echo "✅ Backend server restarted"
echo ""

# Check server status
echo "7. Checking server status..."
ssh $SERVER "pm2 status digitalcoffee-api"
echo ""

echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Test the API: curl https://digitalcoffee.cafe/api/legal/documents/terms_of_service"
echo "2. Build and deploy admin dashboard: cd admin && npm run build"
echo "3. Access admin panel: https://digitalcoffee.cafe/admin/legal-documents"
echo ""
