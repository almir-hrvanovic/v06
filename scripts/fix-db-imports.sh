#!/bin/bash

# Fix remaining database import issues

echo "🔧 Fixing remaining database import issues..."

# Fix { db } imports that should be default imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/import { db } from '\''@\/lib\/db'\''/import { db } from '\''@\/lib\/db\/index'\''/g' {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/import { db } from "@\/lib\/db"/import { db } from "@\/lib\/db\/index"/g' {} \;

# Fix auth() calls that should be getAuthenticatedUser()
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/const session = await auth()/const user = await getAuthenticatedUser()/g' {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/if (!session)/if (!user)/g' {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i.bak 's/session\.user/user/g' {} \;

# Remove backup files
find src -name "*.bak" -delete

echo "✅ Import fixes complete!"