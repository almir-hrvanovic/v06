#!/usr/bin/env tsx

/**
 * Script to replace hardcoded strings with translation keys
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

const ROOT_DIR = process.cwd();

// Mapping of hardcoded strings to translation keys
const STRING_REPLACEMENTS = [
  // Status-related
  { pattern: /"Pending"/g, replacement: 't("common.status.pending")' },
  { pattern: /'Pending'/g, replacement: 't("common.status.pending")' },
  { pattern: /"Assigned"/g, replacement: 't("common.status.assigned")' },
  { pattern: /'Assigned'/g, replacement: 't("common.status.assigned")' },
  { pattern: /"In Progress"/g, replacement: 't("common.status.inProgress")' },
  { pattern: /'In Progress'/g, replacement: 't("common.status.inProgress")' },
  { pattern: /"Costed"/g, replacement: 't("common.status.costed")' },
  { pattern: /'Costed'/g, replacement: 't("common.status.costed")' },
  { pattern: /"Approved"/g, replacement: 't("common.status.approved")' },
  { pattern: /'Approved'/g, replacement: 't("common.status.approved")' },
  { pattern: /"Completed"/g, replacement: 't("common.status.completed")' },
  { pattern: /'Completed'/g, replacement: 't("common.status.completed")' },
  { pattern: /"Saving\.\.\."/g, replacement: 't("common.status.saving")' },
  { pattern: /'Saving\.\.\.'/g, replacement: 't("common.status.saving")' },

  // Placeholder-related  
  { pattern: /"Select a VP"/g, replacement: 't("placeholders.selectVP")' },
  { pattern: /'Select a VP'/g, replacement: 't("placeholders.selectVP")' },
  { pattern: /"All Customers"/g, replacement: 't("placeholders.allCustomers")' },
  { pattern: /'All Customers'/g, replacement: 't("placeholders.allCustomers")' },
  { pattern: /"All Inquiries"/g, replacement: 't("placeholders.allInquiries")' },
  { pattern: /'All Inquiries'/g, replacement: 't("placeholders.allInquiries")' },
  { pattern: /"All Priorities"/g, replacement: 't("placeholders.allPriorities")' },
  { pattern: /'All Priorities'/g, replacement: 't("placeholders.allPriorities")' },
  { pattern: /"All Statuses"/g, replacement: 't("placeholders.allStatuses")' },
  { pattern: /'All Statuses'/g, replacement: 't("placeholders.allStatuses")' },
  { pattern: /"Company Logo"/g, replacement: 't("placeholders.companyLogo")' },
  { pattern: /'Company Logo'/g, replacement: 't("placeholders.companyLogo")' },

  // Action-related
  { pattern: /"Save Changes"/g, replacement: 't("actions.saveChanges")' },
  { pattern: /'Save Changes'/g, replacement: 't("actions.saveChanges")' },
  { pattern: /"Assign to VP"/g, replacement: 't("actions.assignToVP")' },
  { pattern: /'Assign to VP'/g, replacement: 't("actions.assignToVP")' },
  { pattern: /"Update Cost Calculation"/g, replacement: 't("actions.updateCostCalculation")' },
  { pattern: /'Update Cost Calculation'/g, replacement: 't("actions.updateCostCalculation")' },
  { pattern: /"Save Cost Calculation"/g, replacement: 't("actions.saveCostCalculation")' },
  { pattern: /'Save Cost Calculation'/g, replacement: 't("actions.saveCostCalculation")' },
  { pattern: /"Assigned To"/g, replacement: 't("actions.assignedTo")' },
  { pattern: /'Assigned To'/g, replacement: 't("actions.assignedTo")' },
  { pattern: /"Approved At"/g, replacement: 't("actions.approvedAt")' },
  { pattern: /'Approved At'/g, replacement: 't("actions.approvedAt")' },
  { pattern: /"Pending approval"/g, replacement: 't("actions.pendingApproval")' },
  { pattern: /'Pending approval'/g, replacement: 't("actions.pendingApproval")' },

  // Attachment-related
  { pattern: /"Inquiry Attachments"/g, replacement: 't("attachments.inquiryAttachments")' },
  { pattern: /'Inquiry Attachments'/g, replacement: 't("attachments.inquiryAttachments")' },
  { pattern: /"Item Attachments"/g, replacement: 't("attachments.itemAttachments")' },
  { pattern: /'Item Attachments'/g, replacement: 't("attachments.itemAttachments")' },

  // Title-related
  { pattern: /"Navigation Menu"/g, replacement: 't("titles.navigationMenu")' },
  { pattern: /'Navigation Menu'/g, replacement: 't("titles.navigationMenu")' },
  { pattern: /"Main navigation menu for the application"/g, replacement: 't("titles.mainNavigation")' },
  { pattern: /'Main navigation menu for the application'/g, replacement: 't("titles.mainNavigation")' },

  // Priority levels
  { pattern: /"Low"/g, replacement: 't("common.priority.low")' },
  { pattern: /'Low'/g, replacement: 't("common.priority.low")' },
  { pattern: /"Medium"/g, replacement: 't("common.priority.medium")' },
  { pattern: /'Medium'/g, replacement: 't("common.priority.medium")' },
  { pattern: /"High"/g, replacement: 't("common.priority.high")' },
  { pattern: /'High'/g, replacement: 't("common.priority.high")' },
  { pattern: /"Urgent"/g, replacement: 't("common.priority.urgent")' },
  { pattern: /'Urgent'/g, replacement: 't("common.priority.urgent")' }
];

// Files to process (TypeScript and TSX in src directory)
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

function processFiles() {
  console.log('🔧 Replacing hardcoded strings with translation keys...');

  // Get all TypeScript/TSX files
  let files: string[] = [];
  for (const pattern of INCLUDE_PATTERNS) {
    files.push(...glob.sync(pattern, { 
      ignore: EXCLUDE_PATTERNS,
      absolute: true
    }));
  }

  let totalReplacements = 0;
  let filesModified = 0;

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      let modifiedContent = content;
      let fileReplacements = 0;

      // Apply each replacement
      for (const { pattern, replacement } of STRING_REPLACEMENTS) {
        const before = modifiedContent;
        modifiedContent = modifiedContent.replace(pattern, replacement);
        
        // Count replacements
        const matches = before.match(pattern);
        if (matches) {
          fileReplacements += matches.length;
        }
      }

      // Write back if modified
      if (modifiedContent !== content) {
        // Check if file needs useTranslations import
        const needsTranslationImport = modifiedContent.includes('t("') && 
          !modifiedContent.includes("import { useTranslations }") &&
          !modifiedContent.includes("from 'next-intl'");

        if (needsTranslationImport) {
          // Add the import
          if (modifiedContent.includes("'use client'") || modifiedContent.includes('"use client"')) {
            // Client component - add after existing imports
            const importRegex = /(import .* from .*\n)/g;
            const imports = modifiedContent.match(importRegex) || [];
            const lastImportIndex = modifiedContent.lastIndexOf(imports[imports.length - 1] || '');
            
            if (lastImportIndex !== -1) {
              const insertPos = lastImportIndex + (imports[imports.length - 1] || '').length;
              modifiedContent = modifiedContent.slice(0, insertPos) + 
                "import { useTranslations } from 'next-intl'\n" +
                modifiedContent.slice(insertPos);
            }
          }
          
          // Add the hook declaration
          const componentRegex = /export default function (\w+)\([^)]*\) \{/;
          const match = modifiedContent.match(componentRegex);
          if (match) {
            const insertPos = modifiedContent.indexOf('{', match.index!) + 1;
            modifiedContent = modifiedContent.slice(0, insertPos) + 
              "\n  const t = useTranslations()" +
              modifiedContent.slice(insertPos);
          }
        }

        writeFileSync(filePath, modifiedContent);
        filesModified++;
        totalReplacements += fileReplacements;
        
        const relativePath = filePath.replace(ROOT_DIR, '');
        console.log(`  ✅ ${relativePath}: ${fileReplacements} replacements`);
      }
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Files processed: ${files.length}`);
  console.log(`  Files modified: ${filesModified}`);
  console.log(`  Total replacements: ${totalReplacements}`);
  console.log('✅ String replacement completed!');
}

// Run the script
if (require.main === module) {
  processFiles();
}

export { processFiles };