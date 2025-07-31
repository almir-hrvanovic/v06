#!/bin/bash

# Script to migrate from direct prisma imports to dynamic db imports
# This updates all files to use the new database abstraction layer

echo "🔄 Starting migration to dynamic database imports..."

# Find all TypeScript files with prisma imports from @/lib/db
FILES=$(find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "import.*prisma.*from.*@/lib/db" {} \;)

TOTAL_FILES=$(echo "$FILES" | wc -l)
echo "📁 Found $TOTAL_FILES files to migrate"

# Counter for progress
COUNT=0

# Process each file
for FILE in $FILES; do
    COUNT=$((COUNT + 1))
    echo "[$COUNT/$TOTAL_FILES] Processing: $FILE"
    
    # Replace the import statement
    # Handle various import patterns
    sed -i.bak 's/import { prisma } from '\''@\/lib\/db'\''/import { db } from '\''@\/lib\/db'\''/g' "$FILE"
    sed -i.bak 's/import { prisma } from "@\/lib\/db"/import { db } from "@\/lib\/db"/g' "$FILE"
    
    # Replace prisma usage with db
    # This is more complex as we need to preserve the method calls
    sed -i.bak 's/prisma\./db\./g' "$FILE"
    
    # Handle any @prisma/client imports
    sed -i.bak 's/from '\''@prisma\/client'\''/from '\''@\/lib\/db\/types'\''/g' "$FILE"
    sed -i.bak 's/from "@prisma\/client"/from "@\/lib\/db\/types"/g' "$FILE"
    
    # Remove backup files
    rm -f "${FILE}.bak"
done

echo "✅ Migration complete!"
echo ""
echo "📋 Summary:"
echo "- Updated $TOTAL_FILES files"
echo "- Replaced prisma imports with db imports"
echo "- Updated @prisma/client imports to use @/lib/db/types"
echo ""
echo "⚠️  Please review the changes and run tests to ensure everything works correctly."
echo "🔍 You may need to manually check for:"
echo "   - Complex Prisma-specific features (raw queries, etc.)"
echo "   - Type imports that might need adjustment"
echo "   - Transaction usage patterns"