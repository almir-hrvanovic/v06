#!/bin/bash

# GS-CMS Database Backup Script
# Creates backups of the remote PostgreSQL database
# Usage: ./backup-database.sh [--compress]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "💾 GS-CMS Database Backup"
echo "========================"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    export $(cat "$PROJECT_ROOT/.env.local" | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env.local not found!${NC}"
    exit 1
fi

# Parse command line arguments
COMPRESS=false
for arg in "$@"; do
    case $arg in
        --compress)
            COMPRESS=true
            shift
            ;;
    esac
done

# Parse database URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not found in environment!${NC}"
    exit 1
fi

# Extract database connection details
DB_URL="$DATABASE_URL"
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Create backup directory structure
BACKUP_DIR="$PROJECT_ROOT/backups"
DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"
MONTHLY_DIR="$BACKUP_DIR/monthly"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

# Generate backup filename
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)
DAY_OF_MONTH=$(date +%d)

BACKUP_FILE="$DAILY_DIR/backup_${TIMESTAMP}.sql"

echo "🔌 Connecting to database..."
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo ""

# Perform backup
echo "📥 Creating backup..."
PGPASSWORD=$DB_PASS pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --clean \
    --create \
    --if-exists \
    --verbose \
    -f "$BACKUP_FILE" 2>&1 | while read line; do
        echo "  $line"
    done

if [ ${PIPESTATUS[0]} -eq 0 ]; then
    echo -e "${GREEN}✅ Backup completed successfully${NC}"
    
    # Get backup size
    BACKUP_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
    echo "  File: $BACKUP_FILE"
    echo "  Size: $BACKUP_SIZE"
    
    # Compress if requested
    if [ "$COMPRESS" = true ]; then
        echo ""
        echo "🗜️  Compressing backup..."
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
        COMPRESSED_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
        echo -e "${GREEN}✅ Compressed to $COMPRESSED_SIZE${NC}"
    fi
    
    # Create weekly backup (on Sundays)
    if [ "$DAY_OF_WEEK" -eq 7 ]; then
        echo ""
        echo "📅 Creating weekly backup..."
        cp "$BACKUP_FILE" "$WEEKLY_DIR/weekly_${TIMESTAMP}.sql${COMPRESS:+.gz}"
        echo -e "${GREEN}✅ Weekly backup created${NC}"
    fi
    
    # Create monthly backup (on 1st of month)
    if [ "$DAY_OF_MONTH" -eq 01 ]; then
        echo ""
        echo "📅 Creating monthly backup..."
        cp "$BACKUP_FILE" "$MONTHLY_DIR/monthly_${TIMESTAMP}.sql${COMPRESS:+.gz}"
        echo -e "${GREEN}✅ Monthly backup created${NC}"
    fi
    
    # Cleanup old backups
    echo ""
    echo "🧹 Cleaning up old backups..."
    
    # Keep last 7 daily backups
    find "$DAILY_DIR" -name "backup_*.sql*" -type f -mtime +7 -delete
    
    # Keep last 4 weekly backups
    find "$WEEKLY_DIR" -name "weekly_*.sql*" -type f -mtime +28 -delete
    
    # Keep last 12 monthly backups
    find "$MONTHLY_DIR" -name "monthly_*.sql*" -type f -mtime +365 -delete
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
    
    # Show backup statistics
    echo ""
    echo "📊 Backup Statistics:"
    echo "  Daily backups: $(ls -1 $DAILY_DIR | wc -l)"
    echo "  Weekly backups: $(ls -1 $WEEKLY_DIR | wc -l)"
    echo "  Monthly backups: $(ls -1 $MONTHLY_DIR | wc -l)"
    echo "  Total size: $(du -sh $BACKUP_DIR | awk '{print $1}')"
    
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

echo ""
echo "🎯 Backup completed!"
echo ""
echo -e "${CYAN}💡 Tips:${NC}"
echo "  - Run with --compress to save disk space"
echo "  - Add to crontab for automated backups:"
echo "    0 2 * * * $SCRIPT_DIR/backup-database.sh --compress"
echo "  - Restore a backup with:"
echo "    psql -h <host> -U <user> -d <database> < backup_file.sql"