#!/bin/bash

echo "🔧 Fixing final issues..."

# Fix any remaining session references
echo "Fixing session references..."
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "session\?\.user" {} \; | while read file; do
    echo "  Fixing: $file"
    sed -i.bak 's/session?\.user/user/g' "$file"
    sed -i.bak 's/if (!session)/if (!user)/g' "$file"
done

# Fix duplicate variable declarations
echo "Checking for duplicate variables..."
find src/app/api -name "*.ts" -exec grep -l "const user = await getAuthenticatedUser" {} \; | while read file; do
    # Check if there are multiple const user declarations
    count=$(grep -c "const user =" "$file")
    if [ "$count" -gt 1 ]; then
        echo "  Found duplicate 'user' declarations in: $file"
        # This needs manual fixing as context is important
    fi
done

# Clean up backup files
find src -name "*.bak" -delete

echo "✅ Fixes complete!"
echo ""
echo "⚠️  Manual checks needed for:"
echo "  - Files with duplicate variable declarations"
echo "  - Complex session reference patterns"