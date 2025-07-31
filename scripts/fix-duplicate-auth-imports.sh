#!/bin/bash

echo "🔧 Fixing duplicate auth imports..."

# Find all files with duplicate imports and fix them
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "getAuthenticatedUser.*@/lib/auth-helpers" {} \; | while read file; do
    if grep -q "getAuthenticatedUser.*@/utils/supabase/api-auth" "$file"; then
        echo "Fixing duplicate imports in: $file"
        
        # Remove the import from @/lib/auth-helpers
        sed -i.bak '/import.*getAuthenticatedUser.*from.*@\/lib\/auth-helpers/d' "$file"
        
        # Make sure we have the correct import
        if ! grep -q "import.*getAuthenticatedUser.*from.*@/utils/supabase/api-auth" "$file"; then
            # Add the correct import after the first import line
            sed -i.bak '1,/^import/{/^import/a\
import { getAuthenticatedUser } from '\''@/utils/supabase/api-auth'\''
}' "$file"
        fi
    fi
done

# Clean up backup files
find src -name "*.bak" -delete

echo "✅ Fixed all duplicate auth imports!"