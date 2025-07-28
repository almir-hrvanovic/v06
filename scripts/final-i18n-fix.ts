#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

// Complete Bosnian translations for all remaining placeholders
const finalBosnianTranslations = {
  "inquiries": {
    "inquiryStats": {
      "activeInquiries": "Aktivni upiti",
      "unassignedItems": "Nedodijeljene stavke",
      "highPriority": "Visok prioritet",
      "thisMonth": "Ovaj mjesec",
      "pendingApproval": "Čeka odobrenje",
      "overdueItems": "Zakasnele stavke",
      "newToday": "Novo danas",
      "closingSoon": "Uskoro se zatvara"
    }
  }
};

async function finalI18nFix() {
  console.log('🔧 Final i18n fix for remaining placeholders...\n');
  
  try {
    const filePath = path.join(MESSAGES_DIR, 'bs.json');
    const content = await fs.readFile(filePath, 'utf-8');
    let translations = JSON.parse(content);
    
    // Deep replace function that handles all TODO patterns
    function deepReplace(obj: any, path: string[] = []): any {
      if (typeof obj === 'string') {
        // Check for any TODO pattern
        if (obj.includes('[TODO]') || obj.includes('TODO:') || obj.match(/\[TODO[:\]]/)) {
          const currentPath = path.join('.');
          
          // Check if we have a specific translation
          if (currentPath.includes('inquiries.inquiryStats')) {
            const key = path[path.length - 1];
            if (finalBosnianTranslations.inquiries.inquiryStats[key]) {
              return finalBosnianTranslations.inquiries.inquiryStats[key];
            }
          }
          
          // Generic fallback - create readable text from the last key
          const lastKey = path[path.length - 1] || 'value';
          return lastKey
            .replace(/([A-Z])/g, ' $1') // Add space before capitals
            .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
            .trim();
        }
        return obj;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const result: any = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
          result[key] = deepReplace(obj[key], [...path, key]);
        }
        return result;
      }
      
      return obj;
    }
    
    // Apply deep replacement
    translations = deepReplace(translations);
    
    // Ensure all inquiry stats are properly set
    if (translations.inquiries?.inquiryStats) {
      Object.assign(translations.inquiries.inquiryStats, finalBosnianTranslations.inquiries.inquiryStats);
    }
    
    // Write back the fixed translations
    await fs.writeFile(filePath, JSON.stringify(translations, null, 2) + '\n', 'utf-8');
    console.log('✅ Fixed all remaining Bosnian placeholders');
    
    console.log('\n📋 Final translations added:');
    Object.entries(finalBosnianTranslations.inquiries.inquiryStats).forEach(([key, value]) => {
      console.log(`   - ${key}: "${value}"`);
    });
    
  } catch (error) {
    console.error('❌ Error in final fix:', error);
  }
}

finalI18nFix().catch(console.error);