#!/bin/bash

# GS-CMS Development Setup Script
# This script sets up the development environment

set -e

echo "🚀 GS-CMS Development Setup"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate secure secret
generate_secret() {
    if command_exists openssl; then
        openssl rand -base64 32
    else
        # Fallback to using Node.js
        node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    fi
}

echo "📋 Checking prerequisites..."

# Check Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION} detected${NC}"
fi

# Check npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
else
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm ${NPM_VERSION} detected${NC}"
fi

# Check Docker (optional)
if command_exists docker; then
    echo -e "${GREEN}✅ Docker detected${NC}"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Docker not found - you'll need to set up PostgreSQL and Redis manually${NC}"
    DOCKER_AVAILABLE=false
fi

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local already exists${NC}"
    read -p "Do you want to backup and create a new one? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        mv .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
        echo -e "${GREEN}✅ Backed up existing .env.local${NC}"
    else
        echo "Keeping existing .env.local"
    fi
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local..."
    
    # Generate NextAuth secret
    NEXTAUTH_SECRET=$(generate_secret)
    
    # Determine database URL based on Docker availability
    if [ "$DOCKER_AVAILABLE" = true ]; then
        DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gs_cms_v05?schema=public"
        REDIS_URL="redis://localhost:6379"
    else
        DATABASE_URL="postgresql://user:password@localhost:5432/gs_cms_v05?schema=public"
        REDIS_URL=""
    fi
    
    # Ask for optional credentials
    echo ""
    echo "🔐 Optional Service Credentials"
    echo "================================"
    
    # Redis choice
    echo ""
    echo "Redis Configuration:"
    echo "1) Use local Redis (Docker)"
    echo "2) Use Upstash Redis (cloud)"
    echo "3) Skip (use in-memory cache)"
    read -p "Choose an option (1-3): " REDIS_CHOICE
    
    UPSTASH_URL=""
    UPSTASH_TOKEN=""
    
    if [ "$REDIS_CHOICE" = "2" ]; then
        echo ""
        echo "Get your Upstash credentials from: https://console.upstash.com/"
        read -p "Enter UPSTASH_REDIS_REST_URL: " UPSTASH_URL
        read -p "Enter UPSTASH_REDIS_REST_TOKEN: " UPSTASH_TOKEN
    elif [ "$REDIS_CHOICE" = "3" ]; then
        REDIS_URL=""
    fi
    
    # UploadThing credentials
    echo ""
    echo "UploadThing Configuration (for file uploads):"
    echo "Get your credentials from: https://uploadthing.com/dashboard"
    read -p "Enter UPLOADTHING_TOKEN (or press Enter to skip): " UT_TOKEN
    read -p "Enter UPLOADTHING_SECRET (or press Enter to skip): " UT_SECRET
    
    cat > .env.local << EOF
# ===========================================
# Local Development Environment Configuration
# Generated on $(date)
# ===========================================

# Database Configuration
DATABASE_URL="${DATABASE_URL}"

# Authentication
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Redis Cache (Optional)
EOF

    if [ "$REDIS_CHOICE" = "1" ]; then
        echo "REDIS_URL=\"${REDIS_URL}\"" >> .env.local
    elif [ "$REDIS_CHOICE" = "2" ] && [ -n "$UPSTASH_URL" ]; then
        echo "UPSTASH_REDIS_REST_URL=\"${UPSTASH_URL}\"" >> .env.local
        echo "UPSTASH_REDIS_REST_TOKEN=\"${UPSTASH_TOKEN}\"" >> .env.local
    else
        echo "# Using in-memory cache (no Redis configured)" >> .env.local
    fi
    
    cat >> .env.local << EOF

# File Upload (UploadThing)
UPLOADTHING_TOKEN="${UT_TOKEN}"
UPLOADTHING_SECRET="${UT_SECRET}"

# Development Features
ENABLE_CRON=false
DEBUG=true
SEED_DATABASE=false

# Feature Flags
NEXT_PUBLIC_ENABLE_EXPERIMENTAL=false
NEXT_PUBLIC_MAINTENANCE_MODE=false
EOF

    echo -e "${GREEN}✅ Created .env.local${NC}"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Docker setup (if available)
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "🐳 Setting up Docker containers..."
    
    read -p "Do you want to start Docker containers for PostgreSQL and Redis? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "docker-compose.dev.yml" ]; then
            docker-compose -f docker-compose.dev.yml up -d
            echo -e "${GREEN}✅ Docker containers started${NC}"
            
            # Wait for PostgreSQL to be ready
            echo "⏳ Waiting for PostgreSQL to be ready..."
            sleep 5
            
            # Push database schema
            echo "🗄️  Setting up database schema..."
            npx prisma db push
            
            # Seed database
            read -p "Do you want to seed the database with test data? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                npm run db:seed
                echo -e "${GREEN}✅ Database seeded${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  docker-compose.dev.yml not found${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Skipping Docker setup${NC}"
    echo "Please ensure PostgreSQL is running and accessible at the DATABASE_URL specified in .env.local"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p logs

# Git setup
if [ -d ".git" ]; then
    echo "🔒 Ensuring .env.local is in .gitignore..."
    if ! grep -q "^\.env\.local$" .gitignore 2>/dev/null; then
        echo ".env.local" >> .gitignore
        echo -e "${GREEN}✅ Added .env.local to .gitignore${NC}"
    fi
fi

echo ""
echo "✨ Development setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update .env.local with your specific settings"
echo "2. If not using Docker, ensure PostgreSQL is running"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  npm run dev          - Start development server"
echo "  npm run db:studio    - Open Prisma Studio"
echo "  npm run db:push      - Push schema changes"
echo "  npm run db:seed      - Seed database"
echo "  npm run type-check   - Check TypeScript"
echo "  npm run lint         - Run ESLint"
echo ""

# Check if database needs migration
if [ "$DOCKER_AVAILABLE" = true ] || [ -n "$DATABASE_URL" ]; then
    echo "🔍 Checking database status..."
    npx prisma db push --skip-generate 2>/dev/null && echo -e "${GREEN}✅ Database is up to date${NC}" || echo -e "${YELLOW}⚠️  Database may need migration${NC}"
fi