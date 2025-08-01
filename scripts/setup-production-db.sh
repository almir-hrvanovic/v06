#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up production database...${NC}"

# Database credentials from the supabase file
DEV_DB_HOST="db.qaakctjbseauaybfavth.supabase.co"
DEV_DB_USER="postgres"
DEV_DB_NAME="postgres"
DEV_DB_PASS="c6nzPXKm3kDxVLaj"

PROD_DB_HOST="db.befqdelybliowmsgczph.supabase.co"
PROD_DB_USER="postgres"
PROD_DB_NAME="postgres"
PROD_DB_PASS="J153v6ELFgIgYMb9"

# Export development schema (structure only, no data)
echo -e "${YELLOW}Step 1: Exporting development database schema...${NC}"
PGPASSWORD="$DEV_DB_PASS" pg_dump \
  -h "$DEV_DB_HOST" \
  -U "$DEV_DB_USER" \
  -d "$DEV_DB_NAME" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --exclude-schema=supabase_functions \
  --exclude-schema=pgbouncer \
  -f /tmp/dev_schema.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to export development schema${NC}"
    exit 1
fi

echo -e "${GREEN}Schema exported successfully${NC}"

# Import schema to production
echo -e "${YELLOW}Step 2: Importing schema to production database...${NC}"
PGPASSWORD="$PROD_DB_PASS" psql \
  -h "$PROD_DB_HOST" \
  -U "$PROD_DB_USER" \
  -d "$PROD_DB_NAME" \
  -f /tmp/dev_schema.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to import schema to production${NC}"
    exit 1
fi

echo -e "${GREEN}Schema imported successfully${NC}"

# Export user data from development
echo -e "${YELLOW}Step 3: Exporting user data from development...${NC}"
PGPASSWORD="$DEV_DB_PASS" psql \
  -h "$DEV_DB_HOST" \
  -U "$DEV_DB_USER" \
  -d "$DEV_DB_NAME" \
  -c "\COPY (SELECT * FROM users WHERE email = 'almir.hrvanovic@icloud.com') TO '/tmp/user_data.csv' WITH CSV HEADER"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to export user data${NC}"
    exit 1
fi

echo -e "${GREEN}User data exported successfully${NC}"

# Import user data to production
echo -e "${YELLOW}Step 4: Importing user data to production...${NC}"
PGPASSWORD="$PROD_DB_PASS" psql \
  -h "$PROD_DB_HOST" \
  -U "$PROD_DB_USER" \
  -d "$PROD_DB_NAME" \
  -c "\COPY users FROM '/tmp/user_data.csv' WITH CSV HEADER"

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to import user data${NC}"
    exit 1
fi

echo -e "${GREEN}User data imported successfully${NC}"

# Initialize system settings
echo -e "${YELLOW}Step 5: Initializing system settings...${NC}"
PGPASSWORD="$PROD_DB_PASS" psql \
  -h "$PROD_DB_HOST" \
  -U "$PROD_DB_USER" \
  -d "$PROD_DB_NAME" \
  -c "INSERT INTO system_settings (id, \"mainCurrency\", \"additionalCurrency1\", \"additionalCurrency2\", \"exchangeRate1\", \"exchangeRate2\", \"storageProvider\") 
      VALUES ('default', 'EUR', 'BAM', 'USD', 1.95583, 0.9, 'UPLOADTHING') 
      ON CONFLICT DO NOTHING;"

# Clean up temporary files
rm -f /tmp/dev_schema.sql /tmp/user_data.csv

echo -e "${GREEN}Production database setup completed successfully!${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo "- Schema imported from development"
echo "- User almir.hrvanovic@icloud.com copied to production"
echo "- System settings initialized"