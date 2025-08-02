#!/bin/bash

# Script to migrate API routes by category
# Usage: ./migrate-auth-category.sh <category>

CATEGORY=$1

if [ -z "$CATEGORY" ]; then
    echo "Usage: $0 <category>"
    echo "Categories: users, business, items, files, reports, utility"
    exit 1
fi

echo "Migrating $CATEGORY routes..."

# Define file patterns for each category
case $CATEGORY in
    "users")
        FILES=(
            "src/app/api/users/route.ts"
            "src/app/api/users/[id]/route.ts"
            "src/app/api/users/[id]/toggle-active/route.ts"
            "src/app/api/users/[id]/language/route.ts"
            "src/app/api/users/[id]/reset-password/route.ts"
            "src/app/api/user/language/route.ts"
            "src/app/api/users/language/route.ts"
        )
        ;;
    "business")
        FILES=(
            "src/app/api/customers/route.ts"
            "src/app/api/customers/[id]/route.ts"
            "src/app/api/quotes/route.ts"
            "src/app/api/quotes/[id]/send/route.ts"
            "src/app/api/production-orders/route.ts"
            "src/app/api/production-orders/[id]/status/route.ts"
            "src/app/api/inquiries/[id]/route.ts"
            "src/app/api/business-partners/route.ts"
            "src/app/api/business-partners/[id]/route.ts"
        )
        ;;
    "items")
        FILES=(
            "src/app/api/items/route.ts"
            "src/app/api/items/[id]/route.ts"
            "src/app/api/items/assign/route.ts"
            "src/app/api/items/unassign/route.ts"
        )
        ;;
    "files")
        FILES=(
            "src/app/api/files/[...path]/route.ts"
            "src/app/api/attachments/route.ts"
            "src/app/api/upload/local/route.ts"
            "src/app/api/uploadthing/test/route.ts"
            "src/app/api/inquiries/[id]/documents/route.ts"
            "src/app/api/inquiries/[id]/documents/open/route.ts"
            "src/app/api/inquiries/[id]/documents/browse/route.ts"
            "src/app/api/inquiries/[id]/documents/download/route.ts"
        )
        ;;
    "reports")
        FILES=(
            "src/app/api/excel/customers/route.ts"
            "src/app/api/excel/inquiries/route.ts"
            "src/app/api/excel/users/route.ts"
            "src/app/api/pdf/report/route.ts"
            "src/app/api/pdf/quote/route.ts"
            "src/app/api/analytics/route.ts"
            "src/app/api/analytics/workload/route.ts"
            "src/app/api/analytics/workload-optimized/route.ts"
            "src/app/api/analytics/export/route.ts"
        )
        ;;
    "utility")
        FILES=(
            "src/app/api/search/route.ts"
            "src/app/api/cache/stats/route.ts"
            "src/app/api/workload/[userId]/route.ts"
            "src/app/api/costs/route.ts"
            "src/app/api/approvals/route.ts"
            "src/app/api/automation/rules/route.ts"
            "src/app/api/automation/rules/[ruleId]/route.ts"
        )
        ;;
    *)
        echo "Unknown category: $CATEGORY"
        exit 1
        ;;
esac

# Process each file
for FILE in "${FILES[@]}"; do
    if [ -f "$FILE" ]; then
        echo "Processing: $FILE"
        
        # Check if file needs updating
        if grep -q "getAuthenticatedUser" "$FILE"; then
            # Make backup
            cp "$FILE" "${FILE}.backup"
            
            # Replace import
            sed -i "s/import { getAuthenticatedUser } from '@\/utils\/supabase\/api-auth'/import { getAuthenticatedUserFromRequest } from '@\/utils\/supabase\/api-helpers'/g" "$FILE"
            
            # Replace function calls
            sed -i "s/getAuthenticatedUser(/getAuthenticatedUserFromRequest(/g" "$FILE"
            
            echo "✓ Updated: $FILE"
        else
            echo "- Skipped: $FILE (no changes needed)"
        fi
    else
        echo "✗ Not found: $FILE"
    fi
done

echo ""
echo "Migration complete for $CATEGORY category!"
echo "Remember to test the updated routes."