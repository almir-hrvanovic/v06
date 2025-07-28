#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

interface TranslationKeys {
  [key: string]: any;
}

// Define proper Croatian translations to replace placeholders
const croatianTranslations = {
  "common": {
    "status": {
      "active": "Aktivan",
      "inactive": "Neaktivan",
      "enabled": "Omogućen",
      "disabled": "Onemogućen",
      "pending": "Na čekanju",
      "approved": "Odobren",
      "rejected": "Odbijen",
      "completed": "Završen",
      "inProgress": "U tijeku",
      "cancelled": "Otkazan",
      "paused": "Pauziran",
      "resumed": "Nastavljen",
      "scheduled": "Zakazan",
      "draft": "Nacrt",
      "published": "Objavljen",
      "archived": "Arhiviran",
      "deleted": "Obrisan",
      "available": "Dostupan",
      "unavailable": "Nedostupan",
      "online": "Online",
      "offline": "Offline",
      "connected": "Povezan",
      "disconnected": "Nepovezan",
      "loading": "Učitavanje",
      "saving": "Spremanje",
      "error": "Greška",
      "success": "Uspjeh",
      "warning": "Upozorenje",
      "info": "Informacija",
      "assigned": "Dodijeljen",
      "costed": "Koštanje završeno",
      "submitted": "Poslano",
      "inReview": "Na pregledu",
      "costing": "Koštanje"
    }
  }
};

// Missing keys that need to be added to multiple languages
const missingKeys = {
  // Croatian missing keys
  "hr": {
    "forms": {
      "validation": {
        "required": "Ovo polje je obavezno",
        "invalid": "Neispravna vrijednost",
        "emailInvalid": "Neispravna email adresa",
        "passwordMismatch": "Lozinke se ne podudaraju",
        "nameRequired": "Ime je obavezno",
        "emailRequired": "Email je obavezan",
        "statusRequired": "Status je obavezan"
      }
    },
    "customers": {
      "customerStats": {
        "total": "Ukupno kupaca",
        "active": "Aktivni kupci",
        "inactive": "Neaktivni kupci",
        "newThisMonth": "Novi ovaj mjesec",
        "withInquiries": "Sa upitima"
      }
    },
    // Add buttons and pages keys
    "buttons": {
      "signIn": "Prijavi se",
      "signOut": "Odjavi se",
      "submit": "Pošalji",
      "cancel": "Otkaži",
      "save": "Spremi",
      "delete": "Obriši",
      "edit": "Uredi",
      "add": "Dodaj"
    },
    "pages": {
      "dashboard": {
        "title": "Nadzorna ploča"
      },
      "users": {
        "title": "Upravljanje korisnicima"
      },
      "customers": {
        "title": "Upravljanje kupcima"
      }
    }
  },
  // Bosnian missing keys
  "bs": {
    "common": {
      "name": "Ime",
      "email": "Email",
      "status": "Status",
      "all": "Sve"
    },
    "navigation": {
      "users": "Korisnici"
    },
    "customers": {
      "customerStats": {
        "total": "Ukupno kupaca",
        "active": "Aktivni kupci",
        "inactive": "Neaktivni kupci",
        "newThisMonth": "Novi ovaj mjesec",
        "withInquiries": "Sa upitima"
      }
    }
  },
  // German missing keys
  "de": {
    "common": {
      "name": "Name",
      "email": "E-Mail",
      "status": "Status",
      "all": "Alle"
    },
    "navigation": {
      "users": "Benutzer"
    },
    "customers": {
      "customerStats": {
        "total": "Kunden gesamt",
        "active": "Aktive Kunden",
        "inactive": "Inaktive Kunden",
        "newThisMonth": "Neu diesen Monat",
        "withInquiries": "Mit Anfragen"
      }
    }
  }
};

// Replace placeholders with actual translations
function replacePlaceholders(obj: any, language: string): any {
  if (typeof obj === 'string') {
    // Replace Croatian placeholders
    if (language === 'hr' && obj.startsWith('[Croatian:')) {
      const key = obj.match(/\[Croatian: (\w+)\]/)?.[1];
      if (key && croatianTranslations.common.status[key]) {
        return croatianTranslations.common.status[key];
      }
    }
    return obj;
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      result[key] = replacePlaceholders(obj[key], language);
    }
    return result;
  }
  
  return obj;
}

// Deep merge objects
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

async function fixI18nErrors() {
  console.log('🔧 Fixing i18n errors...\n');
  
  const languages = ['hr', 'bs', 'de', 'en'];
  
  for (const lang of languages) {
    try {
      const filePath = path.join(MESSAGES_DIR, `${lang}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      let translations = JSON.parse(content);
      
      console.log(`\n📝 Processing ${lang}.json...`);
      
      // Replace placeholders with actual translations
      translations = replacePlaceholders(translations, lang);
      
      // Add missing keys
      if (missingKeys[lang]) {
        console.log(`   ➕ Adding missing keys for ${lang}`);
        translations = deepMerge(translations, missingKeys[lang]);
      }
      
      // Fix key path inconsistencies for Croatian
      if (lang === 'hr' && translations.customers?.stats) {
        console.log('   🔄 Fixing key path: customers.stats → customers.customerStats');
        if (!translations.customers.customerStats) {
          translations.customers.customerStats = translations.customers.stats;
        }
      }
      
      // Ensure all languages have consistent structure
      if (!translations.buttons) {
        translations.buttons = {
          signIn: lang === 'de' ? 'Anmelden' : lang === 'bs' ? 'Prijavite se' : lang === 'en' ? 'Sign In' : 'Prijavi se',
          signOut: lang === 'de' ? 'Abmelden' : lang === 'bs' ? 'Odjavite se' : lang === 'en' ? 'Sign Out' : 'Odjavi se'
        };
      }
      
      if (!translations.pages) {
        translations.pages = {
          dashboard: {
            title: lang === 'de' ? 'Dashboard' : lang === 'bs' ? 'Kontrolna tabla' : lang === 'en' ? 'Dashboard' : 'Nadzorna ploča'
          },
          users: {
            title: lang === 'de' ? 'Benutzerverwaltung' : lang === 'bs' ? 'Upravljanje korisnicima' : lang === 'en' ? 'User Management' : 'Upravljanje korisnicima'
          }
        };
      }
      
      // Write back the fixed translations
      await fs.writeFile(filePath, JSON.stringify(translations, null, 2) + '\n', 'utf-8');
      console.log(`   ✅ Fixed ${lang}.json`);
      
    } catch (error) {
      console.error(`   ❌ Error processing ${lang}.json:`, error);
    }
  }
  
  console.log('\n✨ i18n fixes completed!');
  console.log('\n📋 Summary:');
  console.log('   - Replaced placeholder values with actual translations');
  console.log('   - Added missing form validation keys');
  console.log('   - Added missing customer stats keys');
  console.log('   - Fixed key path inconsistencies');
  console.log('   - Ensured consistent structure across all languages');
}

// Run the fix
fixI18nErrors().catch(console.error);