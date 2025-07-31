#!/bin/bash

echo "🔧 Fixing all remaining auth issues..."

# Fix all files with getServerAuth
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "getServerAuth" | while read file; do
    echo "Fixing getServerAuth in: $file"
    
    # Add import if not present
    if ! grep -q "import.*getAuthenticatedUser" "$file"; then
        # Add after the last import
        sed -i.bak '/^import/!b;:a;n;/^import/ba;i\import { getAuthenticatedUser } from '\''@\/utils\/supabase\/api-auth'\''' "$file"
    fi
    
    # Replace getServerAuth with getAuthenticatedUser
    sed -i.bak 's/getServerAuth/getAuthenticatedUser/g' "$file"
    sed -i.bak 's/const session = await getAuthenticatedUser()/const user = await getAuthenticatedUser()/g' "$file"
done

# Fix all files that still have session references
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "session\." | while read file; do
    echo "Fixing session references in: $file"
    sed -i.bak 's/session\.user/user/g' "$file"
    sed -i.bak 's/session?.user/user/g' "$file"
done

# Fix auth() calls
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "await auth()" | while read file; do
    echo "Fixing auth() in: $file"
    sed -i.bak 's/await auth()/await getAuthenticatedUser()/g' "$file"
done

# Clean up backup files
find src -name "*.bak" -delete

echo "✅ All auth issues fixed!"