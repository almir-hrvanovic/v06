#!/bin/bash

# Fix authentication imports and usage across the codebase

echo "🔧 Fixing auth imports and usage..."

# Add getAuthenticatedUser import where needed
find src/app/api -name "*.ts" -exec grep -l "await auth()" {} \; | while read file; do
    echo "Fixing auth in: $file"
    
    # Check if getAuthenticatedUser is already imported
    if ! grep -q "import.*getAuthenticatedUser" "$file"; then
        # Add the import at the top after other imports
        sed -i.bak '1s/^/import { getAuthenticatedUser } from '\''@\/utils\/supabase\/api-auth'\''\n/' "$file"
    fi
    
    # Replace auth() calls with getAuthenticatedUser()
    sed -i.bak 's/const session = await auth()/const user = await getAuthenticatedUser()/g' "$file"
    sed -i.bak 's/const { user } = await auth()/const user = await getAuthenticatedUser()/g' "$file"
    sed -i.bak 's/if (!session)/if (!user)/g' "$file"
    sed -i.bak 's/session\.user/user/g' "$file"
    sed -i.bak 's/session?.user/user/g' "$file"
done

# Fix UserRole imports - it should be imported as a value, not just a type
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "UserRole" | while read file; do
    echo "Fixing UserRole in: $file"
    sed -i.bak 's/import { UserRole } from '\''@\/lib\/db\/types'\''/import { UserRole } from '\''@\/lib\/db\/types'\''/g' "$file"
done

# Remove backup files
find src -name "*.bak" -delete

echo "✅ Auth import fixes complete!"