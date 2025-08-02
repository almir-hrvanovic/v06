#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Find all API route files
const apiDir = path.join(__dirname, '../src/app/api');
const pattern = '**/*.ts';

console.log('Searching for API route files...');

glob(pattern, { cwd: apiDir }, (err, files) => {
  if (err) {
    console.error('Error finding files:', err);
    return;
  }

  console.log(`Found ${files.length} TypeScript files in API directory`);
  
  let updatedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(apiDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Check if file imports the old auth function
    if (content.includes("import { getAuthenticatedUser } from '@/utils/supabase/api-auth'")) {
      // Replace the import
      content = content.replace(
        "import { getAuthenticatedUser } from '@/utils/supabase/api-auth'",
        "import { getAuthenticatedUserFromRequest } from '@/utils/supabase/api-helpers'"
      );
      
      // Replace all function calls
      content = content.replace(/getAuthenticatedUser\(/g, 'getAuthenticatedUserFromRequest(');
      
      updated = true;
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Updated: ${file}`);
      updatedCount++;
    }
  });
  
  console.log(`\nCompleted! Updated ${updatedCount} files.`);
});