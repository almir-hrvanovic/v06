# GS-CMS Development Setup Script for Windows
# This script sets up the development environment on Windows

Write-Host "🚀 GS-CMS Development Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan

# Check if running from project root
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Function to check if command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Function to generate secure secret
function New-Secret {
    $bytes = New-Object byte[] 32
    [Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
} else {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
}

# Check npm
if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed" -ForegroundColor Red
    exit 1
} else {
    $npmVersion = npm -v
    Write-Host "✅ npm $npmVersion detected" -ForegroundColor Green
}

# Check Docker (optional)
$dockerAvailable = Test-Command "docker"
if ($dockerAvailable) {
    Write-Host "✅ Docker detected" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker not found - you'll need to set up PostgreSQL and Redis manually" -ForegroundColor Yellow
}

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local already exists" -ForegroundColor Yellow
    $backup = Read-Host "Do you want to backup and create a new one? (y/n)"
    if ($backup -eq 'y') {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        Move-Item ".env.local" ".env.local.backup.$timestamp"
        Write-Host "✅ Backed up existing .env.local" -ForegroundColor Green
    }
}

# Create .env.local if it doesn't exist
if (-not (Test-Path ".env.local")) {
    Write-Host "📝 Creating .env.local..." -ForegroundColor Yellow
    
    # Generate NextAuth secret
    $nextAuthSecret = New-Secret
    
    # Determine database URL based on Docker availability
    if ($dockerAvailable) {
        $databaseUrl = "postgresql://postgres:postgres@localhost:5432/gs_cms_v05?schema=public"
        $redisUrl = "redis://localhost:6379"
    } else {
        $databaseUrl = "postgresql://user:password@localhost:5432/gs_cms_v05?schema=public"
        $redisUrl = ""
    }
    
    # Ask for optional credentials
    Write-Host ""
    Write-Host "🔐 Optional Service Credentials" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    
    # Redis choice
    Write-Host ""
    Write-Host "Redis Configuration:" -ForegroundColor Yellow
    Write-Host "1) Use local Redis (Docker)"
    Write-Host "2) Use Upstash Redis (cloud)"
    Write-Host "3) Skip (use in-memory cache)"
    $redisChoice = Read-Host "Choose an option (1-3)"
    
    $upstashUrl = ""
    $upstashToken = ""
    
    if ($redisChoice -eq "2") {
        Write-Host ""
        Write-Host "Get your Upstash credentials from: https://console.upstash.com/" -ForegroundColor Yellow
        $upstashUrl = Read-Host "Enter UPSTASH_REDIS_REST_URL"
        $upstashToken = Read-Host "Enter UPSTASH_REDIS_REST_TOKEN"
    } elseif ($redisChoice -eq "3") {
        $redisUrl = ""
    }
    
    # UploadThing credentials
    Write-Host ""
    Write-Host "UploadThing Configuration (for file uploads):" -ForegroundColor Yellow
    Write-Host "Get your credentials from: https://uploadthing.com/dashboard" -ForegroundColor Yellow
    $utToken = Read-Host "Enter UPLOADTHING_TOKEN (or press Enter to skip)"
    $utSecret = Read-Host "Enter UPLOADTHING_SECRET (or press Enter to skip)"
    
    $envContent = @"
# ===========================================
# Local Development Environment Configuration
# Generated on $(Get-Date)
# ===========================================

# Database Configuration
DATABASE_URL="$databaseUrl"

# Authentication
NEXTAUTH_SECRET="$nextAuthSecret"
NEXTAUTH_URL="http://localhost:3000"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# Redis Cache (Optional)
"@

    if ($redisChoice -eq "1") {
        $envContent += "`nREDIS_URL=`"$redisUrl`""
    } elseif ($redisChoice -eq "2" -and $upstashUrl) {
        $envContent += "`nUPSTASH_REDIS_REST_URL=`"$upstashUrl`""
        $envContent += "`nUPSTASH_REDIS_REST_TOKEN=`"$upstashToken`""
    } else {
        $envContent += "`n# Using in-memory cache (no Redis configured)"
    }
    
    $envContent += @"

# File Upload (UploadThing)
UPLOADTHING_TOKEN="$utToken"
UPLOADTHING_SECRET="$utSecret"

# Development Features
ENABLE_CRON=false
DEBUG=true
SEED_DATABASE=false

# Feature Flags
NEXT_PUBLIC_ENABLE_EXPERIMENTAL=false
NEXT_PUBLIC_MAINTENANCE_MODE=false
"@

    Set-Content -Path ".env.local" -Value $envContent
    Write-Host "✅ Created .env.local" -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Docker setup (if available)
if ($dockerAvailable) {
    Write-Host "🐳 Setting up Docker containers..." -ForegroundColor Yellow
    
    $startDocker = Read-Host "Do you want to start Docker containers for PostgreSQL and Redis? (y/n)"
    if ($startDocker -eq 'y') {
        if (Test-Path "docker-compose.dev.yml") {
            docker-compose -f docker-compose.dev.yml up -d
            Write-Host "✅ Docker containers started" -ForegroundColor Green
            
            # Wait for PostgreSQL to be ready
            Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            
            # Push database schema
            Write-Host "🗄️  Setting up database schema..." -ForegroundColor Yellow
            npx prisma db push
            
            # Seed database
            $seedDb = Read-Host "Do you want to seed the database with test data? (y/n)"
            if ($seedDb -eq 'y') {
                npm run db:seed
                Write-Host "✅ Database seeded" -ForegroundColor Green
            }
        } else {
            Write-Host "⚠️  docker-compose.dev.yml not found" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "⚠️  Skipping Docker setup" -ForegroundColor Yellow
    Write-Host "Please ensure PostgreSQL is running and accessible at the DATABASE_URL specified in .env.local" -ForegroundColor Yellow
}

# Create necessary directories
Write-Host "📁 Creating necessary directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "logs" | Out-Null

# Git setup
if (Test-Path ".git") {
    Write-Host "🔒 Ensuring .env.local is in .gitignore..." -ForegroundColor Yellow
    $gitignore = Get-Content .gitignore -ErrorAction SilentlyContinue
    if ($gitignore -notcontains ".env.local") {
        Add-Content -Path .gitignore -Value ".env.local"
        Write-Host "✅ Added .env.local to .gitignore" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✨ Development setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review and update .env.local with your specific settings"
Write-Host "2. If not using Docker, ensure PostgreSQL is running"
Write-Host "3. Run 'npm run dev' to start the development server"
Write-Host "4. Visit http://localhost:3000"
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  npm run dev          - Start development server"
Write-Host "  npm run db:studio    - Open Prisma Studio"
Write-Host "  npm run db:push      - Push schema changes"
Write-Host "  npm run db:seed      - Seed database"
Write-Host "  npm run type-check   - Check TypeScript"
Write-Host "  npm run lint         - Run ESLint"
Write-Host ""

# Check if database needs migration
if ($dockerAvailable -or $databaseUrl) {
    Write-Host "🔍 Checking database status..." -ForegroundColor Yellow
    try {
        npx prisma db push --skip-generate 2>$null
        Write-Host "✅ Database is up to date" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Database may need migration" -ForegroundColor Yellow
    }
}