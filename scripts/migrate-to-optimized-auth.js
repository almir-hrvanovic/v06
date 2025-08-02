#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function findAllApiRoutes() {
  const apiDir = path.join(process.cwd(), 'src/app/api');
  const routes = [];
  
  async function scanDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        routes.push(fullPath);
      }
    }
  }
  
  await scanDirectory(apiDir);
  return routes;
}

async function analyzeRoute(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  const issues = [];
  
  // Check for basic auth imports
  if (content.includes('getAuthenticatedUserFromRequest')) {
    issues.push('Uses getAuthenticatedUserFromRequest (basic auth)');
  }
  
  if (content.includes('@/utils/supabase/api-helpers')) {
    issues.push('Imports from api-helpers (basic auth)');
  }
  
  if (content.includes('getAuthenticatedUser')) {
    issues.push('Uses getAuthenticatedUser');
  }
  
  // Check for optimized auth
  const hasOptimizedAuth = content.includes('optimizedAuth') || 
                          content.includes('withOptimizedAuth') ||
                          content.includes('apiAuth.withPermission') ||
                          content.includes('apiAuth.withAuth');
  
  // Check for mixed auth patterns
  const hasMixedAuth = hasOptimizedAuth && issues.length > 0;
  
  return {
    path: relativePath,
    issues,
    hasOptimizedAuth,
    hasMixedAuth,
    needsMigration: issues.length > 0 && !hasOptimizedAuth
  };
}

async function main() {
  console.log('🔍 Scanning for API routes using basic auth...\n');
  
  const routes = await findAllApiRoutes();
  console.log(`Found ${routes.length} API routes\n`);
  
  const results = [];
  
  for (const route of routes) {
    const analysis = await analyzeRoute(route);
    results.push(analysis);
  }
  
  // Group results
  const needsMigration = results.filter(r => r.needsMigration);
  const hasMixedAuth = results.filter(r => r.hasMixedAuth);
  const alreadyOptimized = results.filter(r => r.hasOptimizedAuth && !r.hasMixedAuth);
  
  console.log('📊 Analysis Results:\n');
  console.log(`✅ Already using optimized auth: ${alreadyOptimized.length}`);
  console.log(`⚠️  Mixed auth patterns: ${hasMixedAuth.length}`);
  console.log(`❌ Needs migration: ${needsMigration.length}\n`);
  
  if (needsMigration.length > 0) {
    console.log('🔴 Routes that need migration to optimized auth:\n');
    needsMigration.forEach(route => {
      console.log(`  ${route.path}`);
      route.issues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
    });
  }
  
  if (hasMixedAuth.length > 0) {
    console.log('\n⚠️  Routes with mixed auth patterns:\n');
    hasMixedAuth.forEach(route => {
      console.log(`  ${route.path}`);
      route.issues.forEach(issue => {
        console.log(`    - ${issue}`);
      });
    });
  }
  
  // Output migration commands
  if (needsMigration.length > 0) {
    console.log('\n📝 Migration Script:\n');
    console.log('# Run this to create migration script:');
    console.log('node scripts/apply-optimized-auth-migration.js');
    
    // Save list of files to migrate
    const migrationList = needsMigration.map(r => r.path);
    await fs.writeFile(
      path.join(process.cwd(), 'scripts/auth-migration-list.json'),
      JSON.stringify(migrationList, null, 2)
    );
    console.log('\nSaved migration list to scripts/auth-migration-list.json');
  }
}

main().catch(console.error);