#!/bin/bash

# Digital Coffee Backend Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment (default to production)
ENV=${1:-production}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Digital Coffee Backend Deployment${NC}"
echo -e "${BLUE}  Environment: ${ENV}${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "${YELLOW}Please create .env file from .env.example${NC}"
    echo -e "${YELLOW}Run: cp .env.example .env${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm version: $(npm -v)${NC}"

# Check if PostgreSQL is accessible
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: psql command not found${NC}"
    echo -e "${YELLOW}   Make sure PostgreSQL is installed and running${NC}"
fi

# Install dependencies
echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
npm install --production=false

# Check if database needs initialization
echo -e "\n${BLUE}🗄️  Checking database status...${NC}"
if npm run db:check 2>/dev/null; then
    echo -e "${GREEN}✓ Database already initialized${NC}"
else
    echo -e "${YELLOW}Database not initialized. Initializing now...${NC}"

    read -p "$(echo -e ${YELLOW}Do you want to initialize the database? [y/N]: ${NC})" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm run db:init
        echo -e "${GREEN}✓ Database initialized${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping database initialization${NC}"
    fi
fi

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✓ Logs directory created${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "\n${YELLOW}PM2 is not installed. Installing globally...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 is already installed${NC}"
fi

# Stop existing PM2 process if running
echo -e "\n${BLUE}🔄 Managing PM2 processes...${NC}"
if pm2 describe digitalcoffee-v2 &> /dev/null; then
    echo -e "${YELLOW}Stopping existing process...${NC}"
    pm2 stop digitalcoffee-v2
    pm2 delete digitalcoffee-v2
    echo -e "${GREEN}✓ Existing process stopped${NC}"
fi

# Start the application with PM2
echo -e "\n${BLUE}🚀 Starting application...${NC}"
pm2 start ecosystem.config.js
echo -e "${GREEN}✓ Application started${NC}"

# Save PM2 process list
pm2 save
echo -e "${GREEN}✓ PM2 process list saved${NC}"

# Show status
echo -e "\n${BLUE}📊 Application Status:${NC}"
pm2 status

# Show logs (last 10 lines)
echo -e "\n${BLUE}📝 Recent Logs:${NC}"
pm2 logs digitalcoffee-v2 --lines 10 --nostream

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete! ✅${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Useful Commands:${NC}"
echo -e "  View logs:       ${YELLOW}pm2 logs digitalcoffee-v2${NC}"
echo -e "  Stop app:        ${YELLOW}pm2 stop digitalcoffee-v2${NC}"
echo -e "  Restart app:     ${YELLOW}pm2 restart digitalcoffee-v2${NC}"
echo -e "  App status:      ${YELLOW}pm2 status${NC}"
echo -e "  Monitor:         ${YELLOW}pm2 monit${NC}"

# Test health endpoint
echo -e "\n${BLUE}🏥 Testing health endpoint...${NC}"
sleep 2
if curl -f http://localhost:5000/health &> /dev/null; then
    echo -e "${GREEN}✓ Health check passed!${NC}"
    echo -e "\n${GREEN}Backend is running at: http://localhost:5000${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo -e "${YELLOW}Check logs with: pm2 logs digitalcoffee-v2${NC}"
fi

echo ""
