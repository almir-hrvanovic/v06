#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

// Additional Croatian translations for remaining placeholders
const additionalCroatianTranslations = {
  "quoted": "Ponuđeno",
  "converted": "Pretvoreno",
  "customerStats": {
    "topCustomers": "Najbolji kupci",
    "recentlyActive": "Nedavno aktivni",
    "growth": "Rast",
    "retention": "Zadržavanje"
  },
  "inquiryStats": {
    "totalInquiries": "Ukupno upita",
    "responseRate": "Stopa odgovora",
    "conversionRate": "Stopa konverzije",
    "pendingResponses": "Odgovori na čekanju",
    "averageResponseTime": "Prosječno vrijeme odgovora"
  }
};

// Plurals for all languages
const pluralTranslations = {
  "hr": {
    "few": "nekoliko",
    "many": "mnogo"
  },
  "bs": {
    "few": "nekoliko",
    "many": "mnogo"
  },
  "de": {
    "few": "einige",
    "many": "viele"
  },
  "en": {
    "few": "few",
    "many": "many"
  }
};

// Fix missing basic keys
const missingBasicKeys = {
  "bs": {
    "common": {
      "status": {
        "active": "Aktivan",
        "inactive": "Neaktivan"
      }
    },
    "pages": {
      "dashboard": {
        "title": "Kontrolna tabla"
      }
    }
  },
  "de": {
    "common": {
      "status": {
        "active": "Aktiv",
        "inactive": "Inaktiv"
      }
    },
    "pages": {
      "dashboard": {
        "title": "Dashboard"
      }
    }
  },
  "en": {
    "pages": {
      "dashboard": {
        "title": "Dashboard"
      }
    }
  }
};

// Replace all remaining placeholders
function fixPlaceholders(obj: any, language: string, path: string = ''): any {
  if (typeof obj === 'string') {
    // Croatian placeholders
    if (language === 'hr' && obj.includes('[Croatian:')) {
      const match = obj.match(/\[Croatian: (\w+)\]/);
      if (match) {
        const key = match[1];
        // Check in additional translations
        if (additionalCroatianTranslations[key]) {
          return additionalCroatianTranslations[key];
        }
        // Generic fallback
        return key.charAt(0).toUpperCase() + key.slice(1);
      }
    }
    
    // TODO placeholders
    if (obj.includes('[TODO]') || obj.includes('TODO:')) {
      // Extract the key from path
      const parts = path.split('.');
      const lastPart = parts[parts.length - 1];
      
      // Handle plurals
      if (path.includes('plurals') && (lastPart === 'few' || lastPart === 'many')) {
        return pluralTranslations[language]?.[lastPart] || lastPart;
      }
      
      // Handle stats
      if (path.includes('customerStats')) {
        const statsKey = lastPart;
        return additionalCroatianTranslations.customerStats?.[statsKey] || lastPart;
      }
      
      if (path.includes('inquiryStats')) {
        const statsKey = lastPart;
        return additionalCroatianTranslations.inquiryStats?.[statsKey] || lastPart;
      }
      
      // Generic fallback - create proper text from key
      return lastPart.charAt(0).toUpperCase() + lastPart.slice(1).replace(/([A-Z])/g, ' $1').trim();
    }
    
    return obj;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      const newPath = path ? `${path}.${key}` : key;
      result[key] = fixPlaceholders(obj[key], language, newPath);
    }
    return result;
  }
  
  return obj;
}

// Deep merge without overwriting existing values
function safeMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = safeMerge(result[key] || {}, source[key]);
    } else if (result[key] === undefined) {
      result[key] = source[key];
    }
  }
  
  return result;
}

async function fixRemainingI18n() {
  console.log('🔧 Fixing remaining i18n issues...\n');
  
  const languages = ['hr', 'bs', 'de', 'en'];
  
  for (const lang of languages) {
    try {
      const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      let translations = JSON.parse(content);
      
      console.log(`\n📝 Processing ${lang}.json...`);
      
      // Add missing basic keys
      if (missingBasicKeys[lang]) {
        console.log(`   ➕ Adding missing basic keys`);
        translations = safeMerge(translations, missingBasicKeys[lang]);
      }
      
      // Fix all remaining placeholders
      console.log(`   🔄 Fixing placeholder values`);
      translations = fixPlaceholders(translations, lang);
      
      // Special handling for Croatian stats
      if (lang === 'hr') {
        // Fix customer stats
        if (translations.customers?.customerStats) {
          Object.assign(translations.customers.customerStats, {
            topCustomers: "Najbolji kupci",
            recentlyActive: "Nedavno aktivni", 
            growth: "Rast",
            retention: "Zadržavanje"
          });
        }
        
        // Fix inquiry stats
        if (translations.inquiries?.inquiryStats) {
          Object.assign(translations.inquiries.inquiryStats, {
            totalInquiries: "Ukupno upita",
            responseRate: "Stopa odgovora",
            conversionRate: "Stopa konverzije",
            pendingResponses: "Odgovori na čekanju",
            averageResponseTime: "Prosječno vrijeme odgovora"
          });
        }
      }
      
      // Write back the fixed translations
      await fs.writeFile(filePath, JSON.stringify(translations, null, 2) + '\n', 'utf-8');
      console.log(`   ✅ Fixed ${lang}.json`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${lang}.json:`, error);
    }
  }
  
  console.log('\n✨ All remaining i18n issues fixed!');
}

fixRemainingI18n().catch(console.error);