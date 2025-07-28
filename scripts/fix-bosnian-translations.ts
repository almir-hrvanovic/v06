#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

// Bosnian translations for missing stats
const bosnianStatsTranslations = {
  "customers": {
    "customerStats": {
      "topCustomers": "Najbolji kupci",
      "recentlyActive": "Nedavno aktivni",
      "growth": "Rast",
      "retention": "Zadržavanje"
    }
  },
  "inquiries": {
    "inquiryStats": {
      "totalInquiries": "Ukupno upita",
      "responseRate": "Stopa odgovora",
      "conversionRate": "Stopa konverzije",
      "pendingResponses": "Odgovori na čekanju",
      "averageResponseTime": "Prosječno vrijeme odgovora",
      "weeklyTrend": "Sedmični trend",
      "satisfaction": "Zadovoljstvo",
      "byCategory": "Po kategoriji"
    }
  }
};

async function fixBosnianTranslations() {
  console.log('🔧 Fixing Bosnian translation placeholders...\n');
  
  try {
    const filePath = path.join(MESSAGES_DIR, 'bs.json');
    const content = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(content);
    
    // Ensure customers.customerStats exists and update it
    if (!translations.customers) {
      translations.customers = {};
    }
    if (!translations.customers.customerStats) {
      translations.customers.customerStats = {};
    }
    Object.assign(translations.customers.customerStats, bosnianStatsTranslations.customers.customerStats);
    
    // Ensure inquiries.inquiryStats exists and update it
    if (!translations.inquiries) {
      translations.inquiries = {};
    }
    if (!translations.inquiries.inquiryStats) {
      translations.inquiries.inquiryStats = {};
    }
    Object.assign(translations.inquiries.inquiryStats, bosnianStatsTranslations.inquiries.inquiryStats);
    
    // Replace any remaining placeholders
    function replacePlaceholders(obj: any): any {
      if (typeof obj === 'string') {
        if (obj.includes('[TODO]') || obj.includes('TODO:')) {
          // Extract key name from placeholder
          const match = obj.match(/\[TODO[:\]]\s*(\w+)/);
          if (match) {
            const key = match[1];
            // Convert camelCase to readable text
            return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim();
          }
          return obj.replace('[TODO]', '').replace('TODO:', '').trim() || 'N/A';
        }
        return obj;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const result: any = Array.isArray(obj) ? [] : {};
        for (const key in obj) {
          result[key] = replacePlaceholders(obj[key]);
        }
        return result;
      }
      
      return obj;
    }
    
    // Replace all placeholders in the entire file
    const fixed = replacePlaceholders(translations);
    
    // Write back the fixed translations
    await fs.writeFile(filePath, JSON.stringify(fixed, null, 2) + '\n', 'utf-8');
    console.log('✅ Fixed Bosnian translations');
    
    // Show what was added
    console.log('\n📋 Added translations:');
    console.log('   Customer Stats:');
    Object.entries(bosnianStatsTranslations.customers.customerStats).forEach(([key, value]) => {
      console.log(`     - ${key}: "${value}"`);
    });
    console.log('   Inquiry Stats:');
    Object.entries(bosnianStatsTranslations.inquiries.inquiryStats).forEach(([key, value]) => {
      console.log(`     - ${key}: "${value}"`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing Bosnian translations:', error);
  }
}

fixBosnianTranslations().catch(console.error);