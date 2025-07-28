# Environment Setup Guide

## Overview
This guide covers the complete environment setup for both local development and production deployment on Vercel.

## Quick Start

### Automated Setup (Recommended)
```bash
# Linux/Mac
./scripts/dev-setup.sh

# Windows
.\scripts\dev-setup.ps1
```

### Manual Setup
```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Edit .env.local with your credentials
# 3. Install dependencies
npm install

# 4. Set up database
npx prisma db push
npm run db:seed
```

## Service Configuration

### 1. Database (Required)

#### Local Development (Docker)
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gs_cms_v05?schema=public"
```

#### Production (Supabase/Neon/etc)
```env
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"
```

### 2. Redis Cache (Optional)

The application supports three Redis configurations with automatic fallback to in-memory cache:

#### Option 1: Local Redis (Docker)
```env
REDIS_URL="redis://localhost:6379"
```

#### Option 2: Upstash Redis (Cloud)
```env
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

Get credentials from: https://console.upstash.com/

#### Option 3: In-Memory Cache (Default)
No configuration needed - automatically used if Redis is not configured.

### 3. File Uploads (UploadThing)

Required for file upload functionality:

```env
UPLOADTHING_TOKEN="your-token"
UPLOADTHING_SECRET="your-secret"
```

Get credentials from: https://uploadthing.com/dashboard

### 4. Authentication (Required)

```env
NEXTAUTH_URL="http://localhost:3000"  # Your app URL
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### 5. Email (Optional)

For production email sending:

```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=app-specific-password
EMAIL_FROM="GS-CMS <noreply@gs-cms.com>"
```

Without configuration, emails are logged to console in development.

## Test Your Configuration

Run the connection test script:

```bash
npx tsx scripts/test-connections.ts
```

This will verify:
- ✅ Redis connection (Upstash/Local/In-memory)
- ✅ UploadThing credentials
- ✅ Database connection

## Environment Files

### `.env.local` (Development)
- Used for local development
- Never commit to version control
- Contains sensitive credentials

### `.env.example` (Template)
- Template for environment variables
- Committed to version control
- Contains placeholder values

### Vercel Environment Variables (Production)
Set in Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add all required variables
3. Select appropriate environments (Production/Preview/Development)

## Current Configuration Status

Based on your setup:
- ✅ **Upstash Redis**: Connected and working
- ✅ **UploadThing**: Credentials configured
- ✅ **Environment Files**: Properly structured
- ⚠️  **Database**: Using local URL (switch to remote DB or start Docker)

## Docker Services (Optional)

Start local services:
```bash
# Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## Troubleshooting

### Redis Issues
- If Upstash is down, app automatically falls back to in-memory cache
- Check credentials with test script
- Monitor Redis connection in server logs

### UploadThing Issues
- Verify credentials are correct
- Check UploadThing dashboard for usage
- Ensure file size limits match configuration

### Database Issues
- Ensure PostgreSQL is running
- Check connection string format
- Run `npx prisma db push` to sync schema

## Security Notes

1. **Never commit `.env.local`** - it contains sensitive credentials
2. **Use different credentials for production** - never reuse development secrets
3. **Rotate secrets regularly** - especially `NEXTAUTH_SECRET`
4. **Limit Redis access** - use connection strings with minimal permissions

## Next Steps

1. Start development server: `npm run dev`
2. Access application: http://localhost:3000
3. Monitor logs for any connection issues
4. Use Prisma Studio to view data: `npm run db:studio`