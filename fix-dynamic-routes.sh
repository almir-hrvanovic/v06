#!/bin/bash

# Script to fix Next.js 15 dynamic route signatures

echo "Fixing dynamic route signatures for Next.js 15..."

# Find all route.ts files in paths containing square brackets
routes=$(find /home/hrvanovic_5510/Projects/GS_projects/v06/src/app/api -name "route.ts" -path "*\[*\]*")

for route in $routes; do
    echo "Processing: $route"
    
    # Create a backup
    cp "$route" "$route.bak"
    
    # Fix the route signature using sed
    # This handles single parameter routes
    sed -i 's/export async function \(GET\|POST\|PUT\|DELETE\|PATCH\)(\s*request: NextRequest,\s*{ params }: { params: { \([^}]*\) } }\s*)/export async function \1(\n  request: NextRequest,\n  context: { params: Promise<{ \2 }> }\n) {\n  const params = await context.params;/g' "$route"
    
    # Also fix multiline versions
    sed -i '/export async function \(GET\|POST\|PUT\|DELETE\|PATCH\)(/{
        N
        N
        s/export async function \(GET\|POST\|PUT\|DELETE\|PATCH\)(\s*\n\s*request: NextRequest,\s*\n\s*{ params }: { params: { \([^}]*\) } }\s*\n)/export async function \1(\n  request: NextRequest,\n  context: { params: Promise<{ \2 }> }\n) {\n  const params = await context.params;\n/
    }' "$route"
    
    # Check if the file was modified
    if ! diff -q "$route" "$route.bak" > /dev/null; then
        echo "  ✓ Fixed"
        rm "$route.bak"
    else
        echo "  - No changes needed"
        rm "$route.bak"
    fi
done

echo "Done!"