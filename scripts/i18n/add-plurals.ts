#!/usr/bin/env tsx

/**
 * Script to add pluralization sections to all translation files
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const MESSAGES_DIR = join(process.cwd(), 'messages');

// Pluralization patterns for each language
const PLURALS = {
  en: {
    items: {
      zero: "No items",
      one: "1 item",
      other: "{count} items"
    },
    inquiries: {
      zero: "No inquiries",
      one: "1 inquiry", 
      other: "{count} inquiries"
    },
    users: {
      zero: "No users",
      one: "1 user",
      other: "{count} users"
    },
    assignments: {
      zero: "No assignments",
      one: "1 assignment",
      other: "{count} assignments"
    },
    customers: {
      zero: "No customers",
      one: "1 customer",
      other: "{count} customers"
    },
    notifications: {
      zero: "No notifications",
      one: "1 notification",
      other: "{count} notifications"
    },
    files: {
      zero: "No files",
      one: "1 file",
      other: "{count} files"
    },
    results: {
      zero: "No results",
      one: "1 result", 
      other: "{count} results"
    }
  },

  hr: {
    items: {
      zero: "Nema stavaka",
      one: "1 stavka",
      few: "{count} stavke",
      other: "{count} stavaka"
    },
    inquiries: {
      zero: "Nema upita",
      one: "1 upit",
      few: "{count} upita",
      other: "{count} upita"
    },
    users: {
      zero: "Nema korisnika",
      one: "1 korisnik",
      few: "{count} korisnika",
      other: "{count} korisnika"
    },
    assignments: {
      zero: "Nema zadataka",
      one: "1 zadatak",
      few: "{count} zadatka",
      other: "{count} zadataka"
    },
    customers: {
      zero: "Nema kupaca",
      one: "1 kupac",
      few: "{count} kupca",
      other: "{count} kupaca"
    },
    notifications: {
      zero: "Nema obavijesti",
      one: "1 obavijest",
      few: "{count} obavijesti",
      other: "{count} obavijesti"
    },
    files: {
      zero: "Nema datoteka",
      one: "1 datoteka",
      few: "{count} datoteke",
      other: "{count} datoteka"
    },
    results: {
      zero: "Nema rezultata",
      one: "1 rezultat",
      few: "{count} rezultata",
      other: "{count} rezultata"
    }
  },

  bs: {
    items: {
      zero: "Nema stavaka",
      one: "1 stavka",
      few: "{count} stavke",
      other: "{count} stavaka"
    },
    inquiries: {
      zero: "Nema upita",
      one: "1 upit",
      few: "{count} upita",
      other: "{count} upita"
    },
    users: {
      zero: "Nema korisnika",
      one: "1 korisnik",
      few: "{count} korisnika",
      other: "{count} korisnika"
    },
    assignments: {
      zero: "Nema zadataka",
      one: "1 zadatak",
      few: "{count} zadatka",
      other: "{count} zadataka"
    },
    customers: {
      zero: "Nema kupaca",
      one: "1 kupac",
      few: "{count} kupca",
      other: "{count} kupaca"
    },
    notifications: {
      zero: "Nema obavještenja",
      one: "1 obavještenje",
      few: "{count} obavještenja",
      other: "{count} obavještenja"
    },
    files: {
      zero: "Nema datoteka",
      one: "1 datoteka",
      few: "{count} datoteke",
      other: "{count} datoteka"
    },
    results: {
      zero: "Nema rezultata",
      one: "1 rezultat",
      few: "{count} rezultata",
      other: "{count} rezultata"
    }
  },

  de: {
    items: {
      zero: "Keine Elemente",
      one: "1 Element",
      other: "{count} Elemente"
    },
    inquiries: {
      zero: "Keine Anfragen",
      one: "1 Anfrage",
      other: "{count} Anfragen"
    },
    users: {
      zero: "Keine Benutzer",
      one: "1 Benutzer",
      other: "{count} Benutzer"
    },
    assignments: {
      zero: "Keine Aufgaben",
      one: "1 Aufgabe",
      other: "{count} Aufgaben"
    },
    customers: {
      zero: "Keine Kunden",
      one: "1 Kunde",
      other: "{count} Kunden"
    },
    notifications: {
      zero: "Keine Benachrichtigungen",
      one: "1 Benachrichtigung",
      other: "{count} Benachrichtigungen"
    },
    files: {
      zero: "Keine Dateien",
      one: "1 Datei",
      other: "{count} Dateien"
    },
    results: {
      zero: "Keine Ergebnisse",
      one: "1 Ergebnis",
      other: "{count} Ergebnisse"
    }
  }
};

function addPluralsToTranslations() {
  console.log('🔢 Adding pluralization support to all translation files...');

  for (const [lang, plurals] of Object.entries(PLURALS)) {
    const filePath = join(MESSAGES_DIR, `${lang}.json`);
    
    try {
      console.log(`📝 Processing ${lang}.json...`);
      
      // Read existing translations
      const content = readFileSync(filePath, 'utf-8');
      const translations = JSON.parse(content);

      // Add plurals section if it doesn't exist
      if (!translations.plurals) {
        translations.plurals = {
          "_context": "Pluralization rules for dynamic content",
          ...plurals
        };
        console.log(`  ✅ Added plurals section with ${Object.keys(plurals).length} categories`);
      } else {
        // Update existing plurals
        Object.assign(translations.plurals, plurals);
        console.log(`  ✅ Updated existing plurals section`);
      }

      // Write back to file
      writeFileSync(filePath, JSON.stringify(translations, null, 2));
      console.log(`  💾 Saved ${lang}.json`);
      
    } catch (error) {
      console.error(`❌ Failed to process ${lang}.json:`, error);
    }
  }

  console.log('✅ Pluralization setup completed!');
}

// Run the script
if (require.main === module) {
  addPluralsToTranslations();
}

export { addPluralsToTranslations };