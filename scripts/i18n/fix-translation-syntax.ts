#!/usr/bin/env tsx

/**
 * Script to fix syntax issues in translation function calls
 */

import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const ROOT_DIR = process.cwd();

// Fix patterns for incorrect translation syntax
const SYNTAX_FIXES = [
  // Fix placeholder attributes without curly braces
  { pattern: /placeholder=t\("/g, replacement: 'placeholder={t("' },
  { pattern: /placeholder=t\('/g, replacement: 'placeholder={t(\'' },
  { pattern: /title=t\("/g, replacement: 'title={t("' },
  { pattern: /title=t\('/g, replacement: 'title={t(\'' },
  { pattern: /alt=t\("/g, replacement: 'alt={t("' },
  { pattern: /alt=t\('/g, replacement: 'alt={t(\'' },
  
  // Fix closing syntax - need to find the end of t() call and add }
  { pattern: /placeholder=\{t\("([^"]+)"\)\}/g, replacement: 'placeholder={t("$1")}' },
  { pattern: /placeholder=\{t\('([^']+)'\)\}/g, replacement: 'placeholder={t(\'$1\')}' },
  { pattern: /title=\{t\("([^"]+)"\)\}/g, replacement: 'title={t("$1")}' },
  { pattern: /title=\{t\('([^']+)'\)\}/g, replacement: 'title={t(\'$1\')}' },
  { pattern: /alt=\{t\("([^"]+)"\)\}/g, replacement: 'alt={t("$1")}' },
  { pattern: /alt=\{t\('([^']+)'\)\}/g, replacement: 'alt={t(\'$1\')}' }
];

// Files to process
const INCLUDE_PATTERNS = [
  'src/**/*.ts',
  'src/**/*.tsx'
];

const EXCLUDE_PATTERNS = [
  'src/**/*.d.ts',
  'src/**/node_modules/**',
  'src/**/*.test.ts',
  'src/**/*.test.tsx'
];

function fixSyntaxIssues() {
  console.log('🔧 Fixing translation syntax issues...');

  // Get all TypeScript/TSX files
  let files: string[] = [];
  for (const pattern of INCLUDE_PATTERNS) {
    files.push(...globSync(pattern, { 
      ignore: EXCLUDE_PATTERNS,
      absolute: true
    }));
  }

  let totalFixes = 0;
  let filesModified = 0;

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      let modifiedContent = content;
      let fileFixes = 0;

      // Apply each fix
      for (const { pattern, replacement } of SYNTAX_FIXES) {
        const before = modifiedContent;
        modifiedContent = modifiedContent.replace(pattern, replacement);
        
        // Count fixes
        const beforeMatches = before.match(pattern);
        const afterMatches = modifiedContent.match(pattern);
        const fixCount = (beforeMatches?.length || 0) - (afterMatches?.length || 0);
        if (fixCount > 0) {
          fileFixes += fixCount;
        }
      }

      // Manual fixes for specific patterns that need more complex handling
      
      // Fix placeholder=t("...") without closing }
      modifiedContent = modifiedContent.replace(
        /placeholder=\{t\("([^"]+)"\) \/>/g, 
        'placeholder={t("$1")} />'
      );
      
      // Fix title=t("...") without closing }
      modifiedContent = modifiedContent.replace(
        /title=\{t\("([^"]+)"\)/g, 
        'title={t("$1")}'
      );

      // Write back if modified
      if (modifiedContent !== content) {
        writeFileSync(filePath, modifiedContent);
        filesModified++;
        totalFixes += fileFixes;
        
        const relativePath = filePath.replace(ROOT_DIR, '');
        console.log(`  ✅ ${relativePath}: ${fileFixes} fixes`);
      }
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Files processed: ${files.length}`);
  console.log(`  Files modified: ${filesModified}`);
  console.log(`  Total fixes: ${totalFixes}`);
  console.log('✅ Syntax fixes completed!');
}

// Run the script
if (require.main === module) {
  fixSyntaxIssues();
}

export { fixSyntaxIssues };