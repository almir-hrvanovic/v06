#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all route.ts files in the API directory
const apiDir = path.join(__dirname, '../src/app/api');
const routeFiles = glob.sync('**/route.ts', { 
  cwd: apiDir,
  ignore: ['**/node_modules/**', '**/*.original']
});

console.log(`Found ${routeFiles.length} API route files`);

let updatedCount = 0;
let skippedCount = 0;

routeFiles.forEach(file => {
  const filePath = path.join(apiDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file uses old getAuthenticatedUser
  if (content.includes('getAuthenticatedUser') && 
      content.includes('@/utils/supabase/api-auth') &&
      !content.includes('getAuthenticatedUserFromRequest')) {
    
    console.log(`\n📝 Updating: ${file}`);
    
    // Replace import statement
    content = content.replace(
      /import\s*{\s*getAuthenticatedUser[^}]*}\s*from\s*['"]@\/utils\/supabase\/api-auth['"]/g,
      "import { getAuthenticatedUserFromRequest } from '@/utils/supabase/api-helpers'"
    );
    
    // Replace function calls
    content = content.replace(
      /getAuthenticatedUser\(/g,
      'getAuthenticatedUserFromRequest('
    );
    
    // Write updated content
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Updated successfully`);
    updatedCount++;
  } else if (content.includes('getAuthenticatedUserFromRequest')) {
    console.log(`\n✅ Already updated: ${file}`);
    skippedCount++;
  } else if (content.includes('getAuthenticatedUser')) {
    console.log(`\n⚠️  Needs manual review: ${file}`);
    console.log(`   Contains getAuthenticatedUser but different import`);
  }
});

console.log('\n📊 Summary:');
console.log(`   Updated: ${updatedCount} files`);
console.log(`   Already updated: ${skippedCount} files`);
console.log(`   Total processed: ${routeFiles.length} files`);

// Also check for any hasPermission imports that need updating
console.log('\n🔍 Checking for hasPermission imports...');

routeFiles.forEach(file => {
  const filePath = path.join(apiDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('hasPermission') && content.includes('@/utils/supabase/api-auth')) {
    console.log(`\n📝 Updating hasPermission import in: ${file}`);
    
    // Add hasPermission to the import from api-helpers
    content = content.replace(
      /import\s*{\s*hasPermission[^}]*}\s*from\s*['"]@\/utils\/supabase\/api-auth['"]/g,
      "import { hasPermission } from '@/utils/supabase/api-helpers'"
    );
    
    // If the file already imports from api-helpers, merge the imports
    if (content.includes("from '@/utils/supabase/api-helpers'")) {
      // Find existing import
      const importMatch = content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/utils\/supabase\/api-helpers['"]/);
      if (importMatch) {
        const existingImports = importMatch[1].split(',').map(s => s.trim());
        if (!existingImports.includes('hasPermission')) {
          existingImports.push('hasPermission');
          const newImport = `import { ${existingImports.join(', ')} } from '@/utils/supabase/api-helpers'`;
          content = content.replace(importMatch[0], newImport);
          
          // Remove duplicate hasPermission import
          content = content.replace(/import\s*{\s*hasPermission\s*}\s*from\s*['"]@\/utils\/supabase\/api-helpers['"]\n/g, '');
        }
      }
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`   ✅ Updated hasPermission import`);
  }
});

console.log('\n✨ Migration complete!');