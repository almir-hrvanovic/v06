# Production Database Setup Guide

## Overview

This guide explains how to set up the production database for v06-production on Supabase.

## Production Database Details

- **Project Name**: v06-production
- **Project URL**: https://befqdelybliowmsgczph.supabase.co
- **Region**: EU Central 2 (Frankfurt)

## Setup Options

### Option 1: SQL Script (Recommended)

1. Go to your Supabase production dashboard
2. Navigate to SQL Editor
3. Copy the entire contents of `/scripts/production-db-setup.sql`
4. Paste and run the script
5. This will:
   - Create all tables and enums
   - Set up foreign key relationships
   - Add the SUPERUSER account
   - Initialize system settings
   - Set up basic RLS policies

### Option 2: Bash Script (Requires PostgreSQL tools)

If you have `pg_dump` and `psql` installed:

```bash
cd /home/hrvanovic_5510/Projects/GS_projects/v06
./scripts/setup-production-db.sh
```

This script will:
- Export schema from development
- Import to production
- Copy user data
- Initialize settings

### Option 3: Manual Prisma Migration

1. Update your `.env` file with production database URLs:
```env
DATABASE_URL="postgresql://postgres.befqdelybliowmsgczph:J153v6ELFgIgYMb9@aws-0-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:J153v6ELFgIgYMb9@db.befqdelybliowmsgczph.supabase.co:5432/postgres"
```

2. Run Prisma migration:
```bash
npx prisma migrate deploy
```

3. Manually insert the user via SQL:
```sql
INSERT INTO "users" (
    "id",
    "email",
    "name",
    "role",
    "isActive",
    "preferredLanguage"
) VALUES (
    'cm6mowgql0001z44bv6ywqmcw',
    'almir.hrvanovic@icloud.com',
    'Almir Hrvanovic',
    'SUPERUSER',
    true,
    'hr-HR'
);
```

## User Account

The following user has been set up:
- **Email**: almir.hrvanovic@icloud.com
- **Password**: QG'"^Ukj:_9~%9F
- **Role**: SUPERUSER
- **ID**: cm6mowgql0001z44bv6ywqmcw

## Environment Variables for Vercel

Add these to your Vercel project settings:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://befqdelybliowmsgczph.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZnFkZWx5Ymxpb3dtc2djenBoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTY4MzcsImV4cCI6MjA2OTQ3MjgzN30.gUVSoHbKarkOvYzS5fu1mFhuQSbBcJwVWOoOCcrITAc
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase dashboard]

# Database
DATABASE_URL=postgresql://postgres.befqdelybliowmsgczph:J153v6ELFgIgYMb9@aws-0-eu-central-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:J153v6ELFgIgYMb9@db.befqdelybliowmsgczph.supabase.co:5432/postgres

# Redis (if using Upstash)
UPSTASH_REDIS_REST_URL=[Your Upstash URL]
UPSTASH_REDIS_REST_TOKEN=[Your Upstash Token]
```

## Post-Setup Verification

1. **Test Authentication**:
   - Try logging in with almir.hrvanovic@icloud.com
   - Verify SUPERUSER permissions work

2. **Check Tables**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

3. **Verify System Settings**:
   ```sql
   SELECT * FROM system_settings;
   ```

4. **Test User Query**:
   ```sql
   SELECT id, email, role FROM users 
   WHERE email = 'almir.hrvanovic@icloud.com';
   ```

## Security Considerations

1. **Row Level Security (RLS)**:
   - Basic RLS policies are included
   - Review and enhance based on your needs
   - Enable RLS on all tables in production

2. **API Keys**:
   - Never expose service role key to client
   - Use anon key for client-side operations
   - Rotate keys periodically

3. **Database Access**:
   - Use pooled connections for applications
   - Direct connections only for migrations
   - Monitor connection limits

## Troubleshooting

### Common Issues

1. **Permission Denied**:
   - Ensure you're using correct database password
   - Check if RLS is blocking queries

2. **Table Already Exists**:
   - Drop existing tables or use fresh database
   - Or modify script to use `IF NOT EXISTS`

3. **User Login Fails**:
   - Verify Supabase Auth is enabled
   - Check user exists in auth.users table
   - Ensure email is verified

### Support

- Supabase Dashboard: Access via project URL
- Logs: Check Supabase dashboard > Logs
- Database: Use SQL Editor for queries

## Next Steps

1. Update Vercel environment variables
2. Deploy application to Vercel
3. Test all functionality
4. Set up monitoring and alerts
5. Configure backups