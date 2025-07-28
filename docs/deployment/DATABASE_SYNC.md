# Database Synchronization Guide

This guide explains how to set up and use database synchronization between your remote production database and local Docker PostgreSQL instance.

## Overview

The GS-CMS project now supports dual database configuration:
- **Remote Database**: Your primary production/development database
- **Local Database**: Docker-based PostgreSQL for offline development and backup

## Prerequisites

1. Docker and Docker Compose installed
2. PostgreSQL client tools (`psql`, `pg_dump`, `pg_restore`)
3. Access to remote database (credentials in `.env.local`)

## Configuration

### Environment Variables

Add these to your `.env.local`:

```bash
# Remote database (primary)
DATABASE_URL="postgresql://user:password@remote-host:5432/database?schema=public"

# Local database (backup/offline)
LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gs_cms_v05_dev?schema=public"
```

## Usage

### 1. Start Docker Services

Start local PostgreSQL, Redis, and Adminer:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

Or use the app startup script:

```bash
./appup
```

### 2. Database Synchronization

#### Full Sync (Schema + Data)

```bash
./scripts/sync-database.sh --full
```

This will:
- Export complete database from remote
- Drop and recreate local database
- Import all schema and data

#### Data Only Sync

```bash
./scripts/sync-database.sh --data
```

This will:
- Export only data from remote
- Truncate local tables
- Import fresh data (preserves schema)

#### Schema Only Sync

```bash
./scripts/sync-database.sh --schema
```

This will:
- Export only schema from remote
- Recreate local database with new schema
- No data is transferred

### 3. Backup Remote Database

Create timestamped backups:

```bash
./scripts/backup-database.sh
```

With compression:

```bash
./scripts/backup-database.sh --compress
```

Backups are organized in:
- `backups/daily/` - Last 7 days
- `backups/weekly/` - Last 4 weeks (created on Sundays)
- `backups/monthly/` - Last 12 months (created on 1st of month)

### 4. Automated Sync with App Startup

Start the app with automatic database sync:

```bash
./appup --sync
```

Skip Docker services:

```bash
./appup --no-docker
```

Sync and seed database:

```bash
./appup --sync --seed
```

## Switching Between Databases

### Use Remote Database (Default)

Ensure your `.env.local` has:

```bash
DATABASE_URL="postgresql://user:password@remote-host:5432/database?schema=public"
```

### Use Local Database

Update your `.env.local` to point to local:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gs_cms_v05_dev?schema=public"
```

## Automated Backups

Add to your crontab for automated backups:

```bash
# Daily backup at 2 AM
0 2 * * * /path/to/project/scripts/backup-database.sh --compress

# Sync to local every 6 hours
0 */6 * * * /path/to/project/scripts/sync-database.sh --data
```

## Docker Services

### PostgreSQL
- **Port**: 5432
- **Database**: gs_cms_v05_dev
- **User**: postgres
- **Password**: postgres

### Redis
- **Port**: 6379
- **Purpose**: Caching layer (optional)

### Adminer
- **Port**: 8080
- **URL**: http://localhost:8080
- **Purpose**: Database management UI

## Troubleshooting

### Connection Issues

1. Check Docker services are running:
   ```bash
   docker ps
   ```

2. Test remote connection:
   ```bash
   psql $DATABASE_URL -c '\q'
   ```

3. Test local connection:
   ```bash
   psql "postgresql://postgres:postgres@localhost:5432/gs_cms_v05_dev" -c '\q'
   ```

### Sync Failures

1. Check disk space for backups
2. Verify remote database credentials
3. Ensure PostgreSQL client tools are installed
4. Check Docker logs:
   ```bash
   docker logs gs-cms-postgres-dev
   ```

### Performance Tips

1. Use `--data` sync for faster updates (preserves indexes)
2. Schedule syncs during low-traffic periods
3. Compress backups to save disk space
4. Clean up old backups regularly

## Security Considerations

1. Never commit `.env.local` to version control
2. Use strong passwords for local PostgreSQL
3. Restrict Docker port exposure in production
4. Encrypt sensitive backups
5. Regularly rotate database credentials

## Best Practices

1. **Development Workflow**:
   - Sync from production weekly
   - Use local database for feature development
   - Test migrations on local first

2. **Backup Strategy**:
   - Daily automated backups
   - Weekly full syncs to local
   - Monthly archives for compliance

3. **Performance**:
   - Use local database for faster development
   - Sync only when needed
   - Keep backup retention reasonable

## Common Commands

```bash
# Quick sync from remote to local
./scripts/sync-database.sh --data

# Backup before major changes
./scripts/backup-database.sh --compress

# Start app with local database
./appup --no-docker  # If using remote
./appup --sync       # Sync then start

# Check database sizes
docker exec gs-cms-postgres-dev psql -U postgres -d gs_cms_v05_dev -c "SELECT pg_database_size('gs_cms_v05_dev');"

# Access local database
docker exec -it gs-cms-postgres-dev psql -U postgres -d gs_cms_v05_dev
```

## Support

For issues or questions:
1. Check Docker and PostgreSQL logs
2. Verify environment variables
3. Ensure network connectivity
4. Review this documentation

Remember: The local database is for development and backup purposes. Always test thoroughly before applying changes to production.