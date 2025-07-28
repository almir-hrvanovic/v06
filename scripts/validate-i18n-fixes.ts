#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

interface ValidationResult {
  language: string;
  totalKeys: number;
  missingKeys: string[];
  placeholderKeys: string[];
  passed: boolean;
}

// Keys that must exist in all languages
const requiredKeys = [
  'common.name',
  'common.email',
  'common.status.active',
  'common.status.inactive',
  'buttons.signIn',
  'pages.dashboard.title',
  'forms.validation.required',
  'customers.customerStats.total'
];

function checkForPlaceholders(obj: any, path: string = ''): string[] {
  const placeholders: string[] = [];
  
  if (typeof obj === 'string') {
    if (obj.includes('[Croatian:') || obj.includes('[TODO]') || obj.includes('TODO:')) {
      placeholders.push(path);
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      const newPath = path ? `${path}.${key}` : key;
      placeholders.push(...checkForPlaceholders(obj[key], newPath));
    }
  }
  
  return placeholders;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

async function validateI18n(): Promise<void> {
  console.log('🔍 Validating i18n fixes...\n');
  
  const languages = ['hr', 'bs', 'de', 'en'];
  const results: ValidationResult[] = [];
  let allPassed = true;
  
  for (const lang of languages) {
    try {
      const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const translations = JSON.parse(content);
      
      // Check for missing required keys
      const missingKeys = requiredKeys.filter(key => !getNestedValue(translations, key));
      
      // Check for placeholder values
      const placeholderKeys = checkForPlaceholders(translations);
      
      // Count total keys
      const countKeys = (obj: any): number => {
        let count = 0;
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            count += countKeys(obj[key]);
          } else {
            count++;
          }
        }
        return count;
      };
      
      const totalKeys = countKeys(translations);
      const passed = missingKeys.length === 0 && placeholderKeys.length === 0;
      
      results.push({
        language: lang,
        totalKeys,
        missingKeys,
        placeholderKeys,
        passed
      });
      
      if (!passed) allPassed = false;
      
    } catch (error) {
      console.error(`❌ Error validating ${lang}.json:`, error);
      allPassed = false;
    }
  }
  
  // Print results
  console.log('📊 Validation Results:\n');
  
  for (const result of results) {
    console.log(`${result.passed ? '✅' : '❌'} ${result.language.toUpperCase()}`);
    console.log(`   Total keys: ${result.totalKeys}`);
    
    if (result.missingKeys.length > 0) {
      console.log(`   Missing keys: ${result.missingKeys.length}`);
      result.missingKeys.forEach(key => console.log(`     - ${key}`));
    }
    
    if (result.placeholderKeys.length > 0) {
      console.log(`   Placeholder values: ${result.placeholderKeys.length}`);
      result.placeholderKeys.slice(0, 5).forEach(key => console.log(`     - ${key}`));
      if (result.placeholderKeys.length > 5) {
        console.log(`     ... and ${result.placeholderKeys.length - 5} more`);
      }
    }
    
    console.log('');
  }
  
  if (allPassed) {
    console.log('✨ All i18n validations passed!');
  } else {
    console.log('⚠️  Some validations failed. Please review the issues above.');
    process.exit(1);
  }
}

validateI18n().catch(console.error);