#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function migrateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const originalContent = content;
    
    // Replace imports
    content = content.replace(
      /import\s*{\s*getAuthenticatedUserFromRequest\s*(?:,\s*hasPermission\s*)?(?:,\s*[^}]+)?}\s*from\s*['"]@\/utils\/supabase\/api-helpers['"]/g,
      "import { optimizedAuth } from '@/utils/supabase/optimized-auth'"
    );
    
    // Also handle cases where hasPermission is imported separately
    content = content.replace(
      /import\s*{\s*hasPermission\s*}\s*from\s*['"]@\/utils\/supabase\/api-helpers['"]/g,
      "import { optimizedAuth } from '@/utils/supabase/optimized-auth'"
    );
    
    // Replace getAuthenticatedUserFromRequest calls
    content = content.replace(
      /const\s+(\w+)\s*=\s*await\s+getAuthenticatedUserFromRequest\s*\(\s*request\s*\)/g,
      'const $1 = await optimizedAuth.getUser(request)'
    );
    
    // Replace hasPermission calls
    content = content.replace(
      /hasPermission\s*\(\s*(\w+)\.role\s*,\s*['"](\w+)['"]\s*,\s*['"](\w+)['"]\s*\)/g,
      "optimizedAuth.hasPermission($1.role, '$2', '$3')"
    );
    
    // Handle simple GET/POST/PUT/DELETE exports that use basic auth
    const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    for (const method of httpMethods) {
      // Pattern 1: Simple auth check at the beginning of function
      const pattern1 = new RegExp(
        `export\\s+async\\s+function\\s+${method}\\s*\\([^)]+\\)\\s*{\\s*` +
        `try\\s*{\\s*` +
        `(?:\\/\\/[^\\n]*\\n\\s*)?` + // Optional comment
        `const\\s+(\\w+)\\s*=\\s*await\\s+optimizedAuth\\.getUser\\(request\\);?\\s*` +
        `(?:\\/\\/[^\\n]*\\n\\s*)?` + // Optional comment  
        `if\\s*\\(!\\s*\\1\\s*\\)\\s*{\\s*` +
        `return\\s+NextResponse\\.json\\([^}]+}\\s*\\)\\s*;?\\s*}`,
        'gs'
      );
      
      // Check if this pattern exists
      if (pattern1.test(content)) {
        // Extract the handler logic
        const handlerMatch = content.match(
          new RegExp(
            `export\\s+async\\s+function\\s+${method}\\s*\\(([^)]+)\\)\\s*{([\\s\\S]+)}$`,
            'm'
          )
        );
        
        if (handlerMatch) {
          const params = handlerMatch[1];
          let handlerBody = handlerMatch[2];
          
          // Remove the auth check from handler body
          handlerBody = handlerBody.replace(
            /try\s*{\s*(?:\/\/[^\n]*\n\s*)?const\s+\w+\s*=\s*await\s+optimizedAuth\.getUser\(request\);?\s*(?:\/\/[^\n]*\n\s*)?if\s*\(!\s*\w+\s*\)\s*{\s*return\s+NextResponse\.json\([^}]+}\s*\)\s*;?\s*}/,
            'try {'
          );
          
          // Create optimized handler
          const optimizedExport = `export const ${method} = apiAuth.withAuth(async (${params}, user) => {${handlerBody}});`;
          
          // Replace the original export
          content = content.replace(handlerMatch[0], optimizedExport);
          
          // Add apiAuth import if not present
          if (!content.includes("import { apiAuth }")) {
            content = content.replace(
              /import\s*{\s*optimizedAuth\s*}\s*from\s*['"]@\/utils\/supabase\/optimized-auth['"]/,
              "import { optimizedAuth } from '@/utils/supabase/optimized-auth'\nimport { apiAuth } from '@/utils/api/optimized-auth-wrapper'"
            );
          }
        }
      }
    }
    
    // If content changed, write it back
    if (content !== originalContent) {
      await fs.writeFile(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error migrating ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting optimized auth migration...\n');
  
  // Read migration list
  const migrationList = JSON.parse(
    await fs.readFile(path.join(process.cwd(), 'scripts/auth-migration-list.json'), 'utf8')
  );
  
  console.log(`Found ${migrationList.length} files to migrate\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const relativePath of migrationList) {
    const fullPath = path.join(process.cwd(), relativePath);
    console.log(`Migrating: ${relativePath}`);
    
    const success = await migrateFile(fullPath);
    if (success) {
      console.log(`  ✅ Success`);
      successCount++;
    } else {
      console.log(`  ❌ Failed`);
      failCount++;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  📁 Total: ${migrationList.length}`);
  
  if (successCount > 0) {
    console.log('\n✨ Migration complete! Run the analysis script again to verify:');
    console.log('  node scripts/migrate-to-optimized-auth.js');
  }
}

main().catch(console.error);