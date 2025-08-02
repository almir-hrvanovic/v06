#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const apiDir = path.join(__dirname, '../src/app/api');
const routeFiles = glob.sync('**/route.ts', { 
  cwd: apiDir,
  ignore: ['**/node_modules/**', '**/*.original']
});

// Routes that don't need auth
const publicRoutes = [
  'health/route.ts',
  'auth/health/route.ts',
  'auth/performance/route.ts',
  'auth/logout/route.ts',
  'auth/signout/route.ts',
  'console-monitor/status/route.ts',
  'debug-cookies/route.ts',
  'test-auth-new/route.ts',
  'test-auth/route.ts',
  'dev-auto-login/route.ts',
  'seed/route.ts',
  'batch/route.ts',
  'ws/route.ts',
  'uploadthing/route.ts'
];

console.log('🔍 Checking for API routes without authentication...\n');

let missingAuthCount = 0;

routeFiles.forEach(file => {
  // Skip public routes
  if (publicRoutes.some(publicRoute => file.endsWith(publicRoute))) {
    return;
  }
  
  const filePath = path.join(apiDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file has any authentication
  const hasAuth = content.includes('getAuthenticatedUserFromRequest') || 
                  content.includes('getAuthenticatedUser') ||
                  content.includes('requireAuth') ||
                  content.includes('auth.getUser') ||
                  content.includes('createServerClient');
  
  if (!hasAuth) {
    // Check if it's a GET/POST/PUT/DELETE handler
    const hasHandler = content.match(/export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)/);
    
    if (hasHandler) {
      console.log(`⚠️  No auth found in: ${file}`);
      console.log(`   Handlers: ${hasHandler[1]}`);
      missingAuthCount++;
    }
  }
});

console.log(`\n📊 Summary: ${missingAuthCount} routes may need authentication added`);