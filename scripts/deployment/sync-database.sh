#!/bin/bash

# GS-CMS Database Synchronization Script
# Syncs data from remote PostgreSQL to local Docker PostgreSQL
# Usage: ./sync-database.sh [options]
# Options:
#   --full    Perform full database sync (drop and recreate)
#   --data    Sync data only (preserve schema)
#   --schema  Sync schema only (no data)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "🔄 GS-CMS Database Synchronization"
echo "=================================="

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    export $(cat "$PROJECT_ROOT/.env.local" | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env.local not found!${NC}"
    echo "Please create .env.local with your database configuration"
    exit 1
fi

# Parse command line arguments
SYNC_MODE="full"
for arg in "$@"; do
    case $arg in
        --full)
            SYNC_MODE="full"
            shift
            ;;
        --data)
            SYNC_MODE="data"
            shift
            ;;
        --schema)
            SYNC_MODE="schema"
            shift
            ;;
        *)
            echo "Unknown option: $arg"
            echo "Usage: $0 [--full|--data|--schema]"
            exit 1
            ;;
    esac
done

# Parse remote database URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not found in environment!${NC}"
    exit 1
fi

# Extract remote database connection details
REMOTE_DB_URL="$DATABASE_URL"
# Parse PostgreSQL URL: postgresql://user:password@host:port/database
REMOTE_USER=$(echo $REMOTE_DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
REMOTE_PASS=$(echo $REMOTE_DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
REMOTE_HOST=$(echo $REMOTE_DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
REMOTE_PORT=$(echo $REMOTE_DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
REMOTE_DB=$(echo $REMOTE_DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Local database configuration (Docker)
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_USER="postgres"
LOCAL_PASS="postgres"
LOCAL_DB="gs_cms_v05_dev"

echo "📊 Sync Configuration:"
echo "  Mode: $SYNC_MODE"
echo "  Source: $REMOTE_HOST:$REMOTE_PORT/$REMOTE_DB"
echo "  Target: $LOCAL_HOST:$LOCAL_PORT/$LOCAL_DB"
echo ""

# Check if Docker PostgreSQL is running
echo "🐳 Checking Docker services..."
if ! docker ps | grep -q "gs-cms-postgres-dev"; then
    echo -e "${YELLOW}⚠️  Local PostgreSQL container not running${NC}"
    echo "Starting Docker services..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d postgres
    
    # Wait for PostgreSQL to be ready
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    # Wait until PostgreSQL is ready
    until docker exec gs-cms-postgres-dev pg_isready -U postgres; do
        echo "   Waiting for PostgreSQL..."
        sleep 2
    done
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL container is running${NC}"
fi

# Create backup directory
BACKUP_DIR="$PROJECT_ROOT/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/remote_backup_${TIMESTAMP}.sql"

# Function to check database connection
check_connection() {
    local host=$1
    local port=$2
    local user=$3
    local pass=$4
    local db=$5
    
    PGPASSWORD=$pass psql -h $host -p $port -U $user -d $db -c '\q' 2>/dev/null
    return $?
}

# Check remote database connection
echo ""
echo "🔌 Checking database connections..."
if check_connection "$REMOTE_HOST" "$REMOTE_PORT" "$REMOTE_USER" "$REMOTE_PASS" "$REMOTE_DB"; then
    echo -e "${GREEN}✅ Connected to remote database${NC}"
else
    echo -e "${RED}❌ Failed to connect to remote database${NC}"
    echo "Please check your DATABASE_URL in .env.local"
    exit 1
fi

# Check local database connection
if check_connection "$LOCAL_HOST" "$LOCAL_PORT" "$LOCAL_USER" "$LOCAL_PASS" "postgres"; then
    echo -e "${GREEN}✅ Connected to local database${NC}"
else
    echo -e "${RED}❌ Failed to connect to local database${NC}"
    exit 1
fi

# Perform database sync based on mode
echo ""
echo "🚀 Starting database sync..."

case $SYNC_MODE in
    "full")
        echo "📥 Performing full database backup from remote..."
        PGPASSWORD=$REMOTE_PASS pg_dump \
            -h $REMOTE_HOST \
            -p $REMOTE_PORT \
            -U $REMOTE_USER \
            -d $REMOTE_DB \
            --clean \
            --create \
            --if-exists \
            -f "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Backup completed: $BACKUP_FILE${NC}"
        else
            echo -e "${RED}❌ Backup failed!${NC}"
            exit 1
        fi
        
        echo "📤 Restoring to local database..."
        # Drop and recreate local database
        PGPASSWORD=$LOCAL_PASS psql \
            -h $LOCAL_HOST \
            -p $LOCAL_PORT \
            -U $LOCAL_USER \
            -d postgres \
            -c "DROP DATABASE IF EXISTS $LOCAL_DB;"
        
        PGPASSWORD=$LOCAL_PASS psql \
            -h $LOCAL_HOST \
            -p $LOCAL_PORT \
            -U $LOCAL_USER \
            -d postgres \
            -c "CREATE DATABASE $LOCAL_DB;"
        
        # Restore backup
        PGPASSWORD=$LOCAL_PASS psql \
            -h $LOCAL_HOST \
            -p $LOCAL_PORT \
            -U $LOCAL_USER \
            -d $LOCAL_DB \
            -f "$BACKUP_FILE"
        ;;
        
    "data")
        echo "📥 Backing up data only from remote..."
        PGPASSWORD=$REMOTE_PASS pg_dump \
            -h $REMOTE_HOST \
            -p $REMOTE_PORT \
            -U $REMOTE_USER \
            -d $REMOTE_DB \
            --data-only \
            --disable-triggers \
            -f "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Data backup completed${NC}"
        else
            echo -e "${RED}❌ Data backup failed!${NC}"
            exit 1
        fi
        
        echo "🧹 Truncating local tables..."
        # Get all tables and truncate them
        TABLES=$(PGPASSWORD=$LOCAL_PASS psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public';")
        
        for table in $TABLES; do
            PGPASSWORD=$LOCAL_PASS psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "TRUNCATE TABLE \"$table\" CASCADE;"
        done
        
        echo "📤 Restoring data to local database..."
        PGPASSWORD=$LOCAL_PASS psql \
            -h $LOCAL_HOST \
            -p $LOCAL_PORT \
            -U $LOCAL_USER \
            -d $LOCAL_DB \
            -f "$BACKUP_FILE"
        ;;
        
    "schema")
        echo "📥 Backing up schema only from remote..."
        PGPASSWORD=$REMOTE_PASS pg_dump \
            -h $REMOTE_HOST \
            -p $REMOTE_PORT \
            -U $REMOTE_USER \
            -d $REMOTE_DB \
            --schema-only \
            -f "$BACKUP_FILE"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Schema backup completed${NC}"
        else
            echo -e "${RED}❌ Schema backup failed!${NC}"
            exit 1
        fi
        
        echo "📤 Restoring schema to local database..."
        # Drop and recreate local database for clean schema
        PGPASSWORD=$LOCAL_PASS psql \
            -h $LOCAL_HOST \
            -p $LOCAL_PORT \
            -U $LOCAL_USER \
            -d postgres \
            -c "DROP DATABASE IF EXISTS $LOCAL_DB;"
        
        PGPASSWORD=$LOCAL_PASS psql \
            -h $LOCAL_HOST \
            -p $LOCAL_PORT \
            -U $LOCAL_USER \
            -d postgres \
            -c "CREATE DATABASE $LOCAL_DB;"
        
        PGPASSWORD=$LOCAL_PASS psql \
            -h $LOCAL_HOST \
            -p $LOCAL_PORT \
            -U $LOCAL_USER \
            -d $LOCAL_DB \
            -f "$BACKUP_FILE"
        ;;
esac

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database sync completed successfully!${NC}"
    
    # Show database statistics
    echo ""
    echo "📊 Local Database Statistics:"
    PGPASSWORD=$LOCAL_PASS psql -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB -c "
    SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        n_live_tup AS row_count
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 10;"
    
    # Clean up old backups (keep last 5)
    echo ""
    echo "🧹 Cleaning up old backups..."
    cd "$BACKUP_DIR"
    ls -t remote_backup_*.sql | tail -n +6 | xargs -r rm
    echo -e "${GREEN}✅ Cleanup completed${NC}"
    
else
    echo -e "${RED}❌ Database sync failed!${NC}"
    exit 1
fi

echo ""
echo "🎯 Sync Summary:"
echo "  - Backup saved to: $BACKUP_FILE"
echo "  - Local database: postgresql://$LOCAL_USER:$LOCAL_PASS@$LOCAL_HOST:$LOCAL_PORT/$LOCAL_DB"
echo "  - To use local database, set DATABASE_URL to the local connection string"
echo ""
echo -e "${CYAN}💡 Tip: Add this to your .env.local to switch to local database:${NC}"
echo "   DATABASE_URL=\"postgresql://$LOCAL_USER:$LOCAL_PASS@$LOCAL_HOST:$LOCAL_PORT/$LOCAL_DB?schema=public\""