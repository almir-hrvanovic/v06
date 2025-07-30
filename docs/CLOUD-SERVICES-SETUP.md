# Cloud Services Setup Documentation

## Overview

This project is configured to use cloud services for both development and production environments, eliminating the need for local Docker containers or database installations.

## Services Used

### 1. Supabase (PostgreSQL Database)

#### Development Environment
- **Project**: v06-development
- **URL**: https://qaakctjbseauaybfavth.supabase.co
- **Region**: EU North 1

#### Production Environment
- **Project**: v06-production
- **URL**: https://befqdelybliowmsgczph.supabase.co
- **Region**: EU Central 2

### 2. Upstash Redis (Caching & Sessions)

- **URL**: https://bursting-mongrel-5074.upstash.io
- **Used for**: Session management, caching, and temporary data storage

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

The `.env.local` file is already configured with development credentials. For production, use `.env.production` or set environment variables in your hosting platform.

### 3. Initialize Database

```bash
# Generate Prisma client and push schema to Supabase
bash scripts/init-database.sh
```

This script will:
- Generate the Prisma client
- Push the schema to Supabase
- Seed the database with initial data

### 4. Test Connections

```bash
# Test all cloud services
npx tsx scripts/test-cloud-services.ts

# Test only database connections
npx tsx scripts/test-supabase-connection.ts
```

## Database Management

### Running Migrations

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

### Connection Strings

The project uses two connection strings for Supabase:

1. **DATABASE_URL**: Connection pooler URL (for application queries)
2. **DIRECT_URL**: Direct connection (for migrations only)

## Redis Usage

Redis is used for:
- Session storage
- API response caching
- Temporary data storage
- Rate limiting

Example usage:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Set a value
await redis.set('key', 'value');

// Get a value
const value = await redis.get('key');

// Set with expiration
await redis.setex('cache:user:123', 3600, userData);
```

## Development Workflow

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Make Schema Changes**
   - Edit `prisma/schema.prisma`
   - Run `npm run db:push` to apply changes

3. **View Database**
   - Use `npm run db:studio` for Prisma Studio
   - Or access Supabase dashboard directly

## Security Notes

- Never commit `.env.local` or `.env.production` files
- Keep database passwords and API keys secure
- Use environment variables in production hosting
- Regularly rotate credentials

## Troubleshooting

### Database Connection Issues

1. Check environment variables are loaded:
   ```bash
   npx tsx scripts/test-cloud-services.ts
   ```

2. Verify Supabase project is active (not paused)

3. Check network connectivity

### Redis Connection Issues

1. Verify Upstash Redis instance is active
2. Check REST URL and token are correct
3. Ensure no firewall blocking HTTPS requests

## Demo Credentials

After seeding, these accounts are available:

- **Superuser**: almir@al-star.im / password123
- **Admin**: admin@al-star.im / password123
- **Manager**: snjezana@al-star.im / password123
- **Sales**: haris@al-star.im / password123
- **Tech**: tech@al-star.im / password123

## Support

For issues with:
- **Supabase**: Check https://supabase.com/dashboard
- **Upstash**: Visit https://console.upstash.com/
- **Application**: Check logs and error messages