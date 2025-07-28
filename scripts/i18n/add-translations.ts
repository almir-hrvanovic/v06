#!/usr/bin/env tsx

/**
 * Script to add missing translation keys to all 4 language files
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const MESSAGES_DIR = join(process.cwd(), 'messages');
const LANGUAGES = ['en', 'hr', 'bs', 'de'];

// Additional sections to add
const ADDITIONAL_SECTIONS = {
  placeholders: {
    "_context": "Form placeholders and dropdown options",
    "selectVP": "Select a VP",
    "selectUser": "Select a user", 
    "selectCustomer": "Select a customer",
    "selectInquiry": "Select an inquiry",
    "allCustomers": "All Customers",
    "allInquiries": "All Inquiries",
    "allPriorities": "All Priorities",
    "allStatuses": "All Statuses",
    "companyLogo": "Company Logo",
    "search": "Search...",
    "filter": "Filter...",
    "noResults": "No results found",
    "loading": "Loading..."
  },
  
  notifications: {
    "_context": "System notifications and alerts",
    "inquiryCreated": "New Inquiry Created",
    "inquiryAssigned": "Inquiry Assigned", 
    "itemCosted": "Item Costed",
    "quoteGenerated": "Quote Generated",
    "costApproved": "Cost Approved",
    "messages": {
      "inquiryCreatedMsg": "Inquiry \"{title}\" has been submitted and requires review",
      "inquiryAssignedMsg": "You have been assigned inquiry \"{title}\"",
      "itemCostedMsg": "Item \"{name}\" has been costed and is ready for review",
      "quoteGeneratedMsg": "Quote {number} has been generated for \"{title}\""
    }
  },

  attachments: {
    "_context": "File attachments and media management",
    "title": "Attachments",
    "inquiryAttachments": "Inquiry Attachments",
    "itemAttachments": "Item Attachments", 
    "upload": "Upload File",
    "download": "Download",
    "delete": "Delete",
    "noAttachments": "No attachments"
  },

  actions: {
    "_context": "Action-specific buttons and operations",
    "assignToVP": "Assign to VP",
    "saveChanges": "Save Changes",
    "updateCostCalculation": "Update Cost Calculation",
    "saveCostCalculation": "Save Cost Calculation",
    "addCostBreakdown": "Add cost breakdown for this item",
    "updateCostBreakdown": "Update cost breakdown",
    "pendingApproval": "Pending approval",
    "approvedAt": "Approved At",
    "assignedTo": "Assigned To"
  },

  titles: {
    "_context": "Page and section titles",
    "navigationMenu": "Navigation Menu",
    "mainNavigation": "Main navigation menu for the application",
    "inquiriesSummaryReport": "Inquiries Summary Report",
    "userActivityReport": "User Activity Report", 
    "customerAnalysisReport": "Customer Analysis Report",
    "analyticsDashboardReport": "Analytics Dashboard Report"
  }
};

// Language-specific translations
const LANGUAGE_TRANSLATIONS = {
  hr: {
    placeholders: {
      "selectVP": "Odaberite VP",
      "selectUser": "Odaberite korisnika",
      "selectCustomer": "Odaberite kupca",
      "selectInquiry": "Odaberite upit",
      "allCustomers": "Svi kupci",
      "allInquiries": "Svi upiti", 
      "allPriorities": "Svi prioriteti",
      "allStatuses": "Svi statusi",
      "companyLogo": "Logo tvrtke",
      "search": "Pretraži...",
      "filter": "Filtriraj...",
      "noResults": "Nema rezultata",
      "loading": "Učitava..."
    },
    notifications: {
      "inquiryCreated": "Stvoren novi upit",
      "inquiryAssigned": "Upit dodijeljen",
      "itemCosted": "Stavka ocijenjena",
      "quoteGenerated": "Ponuda generirana",
      "costApproved": "Trošak odobren",
      "messages": {
        "inquiryCreatedMsg": "Upit \"{title}\" je poslan i čeka pregled",
        "inquiryAssignedMsg": "Dodijeljen vam je upit \"{title}\"",
        "itemCostedMsg": "Stavka \"{name}\" je ocijenjena i čeka pregled",
        "quoteGeneratedMsg": "Ponuda {number} je generirana za \"{title}\""
      }
    },
    attachments: {
      "title": "Prilozi",
      "inquiryAttachments": "Prilozi upita",
      "itemAttachments": "Prilozi stavke",
      "upload": "Učitaj datoteku",
      "download": "Preuzmi", 
      "delete": "Obriši",
      "noAttachments": "Nema priloga"
    },
    actions: {
      "assignToVP": "Dodijeli VP-u",
      "saveChanges": "Spremi promjene",
      "updateCostCalculation": "Ažuriraj kalkulaciju troška",
      "saveCostCalculation": "Spremi kalkulaciju troška",
      "addCostBreakdown": "Dodaj detaljan trošak za ovu stavku",
      "updateCostBreakdown": "Ažuriraj detaljan trošak",
      "pendingApproval": "Čeka odobrenje",
      "approvedAt": "Odobreno u",
      "assignedTo": "Dodijeljeno"
    },
    titles: {
      "navigationMenu": "Navigacijski izbornik",
      "mainNavigation": "Glavni navigacijski izbornik aplikacije",
      "inquiriesSummaryReport": "Izvještaj sažetka upita",
      "userActivityReport": "Izvještaj aktivnosti korisnika",
      "customerAnalysisReport": "Izvještaj analize kupaca",
      "analyticsDashboardReport": "Izvještaj analitičke ploče"
    }
  },

  bs: {
    placeholders: {
      "selectVP": "Odaberite VP",
      "selectUser": "Odaberite korisnika",
      "selectCustomer": "Odaberite kupca",
      "selectInquiry": "Odaberite upit",
      "allCustomers": "Svi kupci",
      "allInquiries": "Svi upiti",
      "allPriorities": "Svi prioriteti", 
      "allStatuses": "Svi statusi",
      "companyLogo": "Logo kompanije",
      "search": "Pretraži...",
      "filter": "Filtriraj...",
      "noResults": "Nema rezultata",
      "loading": "Učitava..."
    },
    notifications: {
      "inquiryCreated": "Stvoren novi upit",
      "inquiryAssigned": "Upit dodijeljen",
      "itemCosted": "Stavka ocijenjena",
      "quoteGenerated": "Ponuda generirana",
      "costApproved": "Trošak odobren",
      "messages": {
        "inquiryCreatedMsg": "Upit \"{title}\" je poslan i čeka pregled",
        "inquiryAssignedMsg": "Dodijeljen vam je upit \"{title}\"", 
        "itemCostedMsg": "Stavka \"{name}\" je ocijenjena i čeka pregled",
        "quoteGeneratedMsg": "Ponuda {number} je generirana za \"{title}\""
      }
    },
    attachments: {
      "title": "Prilozi",
      "inquiryAttachments": "Prilozi upita",
      "itemAttachments": "Prilozi stavke",
      "upload": "Učitaj datoteku",
      "download": "Preuzmi",
      "delete": "Obriši",
      "noAttachments": "Nema priloga"
    },
    actions: {
      "assignToVP": "Dodijeli VP-u",
      "saveChanges": "Sačuvaj promjene",
      "updateCostCalculation": "Ažuriraj kalkulaciju troška",
      "saveCostCalculation": "Sačuvaj kalkulaciju troška",
      "addCostBreakdown": "Dodaj detaljan trošak za ovu stavku",
      "updateCostBreakdown": "Ažuriraj detaljan trošak",
      "pendingApproval": "Čeka odobrenje",
      "approvedAt": "Odobreno u",
      "assignedTo": "Dodijeljeno"
    },
    titles: {
      "navigationMenu": "Navigacijski meni",
      "mainNavigation": "Glavni navigacijski meni aplikacije",
      "inquiriesSummaryReport": "Izvještaj sažetka upita",
      "userActivityReport": "Izvještaj aktivnosti korisnika",
      "customerAnalysisReport": "Izvještaj analize kupaca",
      "analyticsDashboardReport": "Izvještaj analitičke ploče"
    }
  },

  de: {
    placeholders: {
      "selectVP": "VP auswählen",
      "selectUser": "Benutzer auswählen",
      "selectCustomer": "Kunde auswählen",
      "selectInquiry": "Anfrage auswählen",
      "allCustomers": "Alle Kunden",
      "allInquiries": "Alle Anfragen",
      "allPriorities": "Alle Prioritäten",
      "allStatuses": "Alle Status",
      "companyLogo": "Unternehmens-Logo",
      "search": "Suchen...",
      "filter": "Filtern...",
      "noResults": "Keine Ergebnisse gefunden",
      "loading": "Wird geladen..."
    },
    notifications: {
      "inquiryCreated": "Neue Anfrage erstellt",
      "inquiryAssigned": "Anfrage zugewiesen",
      "itemCosted": "Artikel kalkuliert",
      "quoteGenerated": "Angebot generiert",
      "costApproved": "Kosten genehmigt",
      "messages": {
        "inquiryCreatedMsg": "Anfrage \"{title}\" wurde eingereicht und wartet auf Überprüfung",
        "inquiryAssignedMsg": "Ihnen wurde die Anfrage \"{title}\" zugewiesen",
        "itemCostedMsg": "Artikel \"{name}\" wurde kalkuliert und wartet auf Überprüfung",
        "quoteGeneratedMsg": "Angebot {number} wurde für \"{title}\" generiert"
      }
    },
    attachments: {
      "title": "Anhänge",
      "inquiryAttachments": "Anfrage-Anhänge",
      "itemAttachments": "Artikel-Anhänge",
      "upload": "Datei hochladen",
      "download": "Herunterladen",
      "delete": "Löschen",
      "noAttachments": "Keine Anhänge"
    },
    actions: {
      "assignToVP": "VP zuweisen",
      "saveChanges": "Änderungen speichern",
      "updateCostCalculation": "Kostenberechnung aktualisieren",
      "saveCostCalculation": "Kostenberechnung speichern",
      "addCostBreakdown": "Kostenaufschlüsselung für diesen Artikel hinzufügen",
      "updateCostBreakdown": "Kostenaufschlüsselung aktualisieren",
      "pendingApproval": "Wartet auf Genehmigung",
      "approvedAt": "Genehmigt am",
      "assignedTo": "Zugewiesen an"
    },
    titles: {
      "navigationMenu": "Navigationsmenü",
      "mainNavigation": "Hauptnavigationsmenü der Anwendung",
      "inquiriesSummaryReport": "Anfragen-Zusammenfassungsbericht",
      "userActivityReport": "Benutzeraktivitätsbericht",
      "customerAnalysisReport": "Kundenanalysebericht",
      "analyticsDashboardReport": "Analytics-Dashboard-Bericht"
    }
  }
};

function addTranslations() {
  console.log('🔧 Adding missing translations to all language files...');

  for (const lang of LANGUAGES) {
    const filePath = join(MESSAGES_DIR, `${lang}.json`);
    
    try {
      console.log(`📝 Processing ${lang}.json...`);
      
      // Read existing translations
      const content = readFileSync(filePath, 'utf-8');
      const translations = JSON.parse(content);

      // Add missing sections
      for (const [section, data] of Object.entries(ADDITIONAL_SECTIONS)) {
        if (!translations[section]) {
          // Use language-specific translations if available, otherwise English
          const langSpecific = LANGUAGE_TRANSLATIONS[lang as keyof typeof LANGUAGE_TRANSLATIONS];
          translations[section] = langSpecific?.[section as keyof typeof langSpecific] || data;
          console.log(`  ✅ Added section: ${section}`);
        }
      }

      // Add missing status translations
      if (translations.common?.status) {
        const statusUpdates = {
          assigned: lang === 'hr' ? 'Dodijeljen' : lang === 'bs' ? 'Dodijeljen' : lang === 'de' ? 'Zugewiesen' : 'Assigned',
          inProgress: lang === 'hr' ? 'U tijeku' : lang === 'bs' ? 'U tijeku' : lang === 'de' ? 'In Bearbeitung' : 'In Progress',
          costed: lang === 'hr' ? 'Ocijenjen' : lang === 'bs' ? 'Ocijenjen' : lang === 'de' ? 'Kalkuliert' : 'Costed',
          submitted: lang === 'hr' ? 'Poslan' : lang === 'bs' ? 'Poslan' : lang === 'de' ? 'Eingereicht' : 'Submitted',
          inReview: lang === 'hr' ? 'Na pregledu' : lang === 'bs' ? 'Na pregledu' : lang === 'de' ? 'In Überprüfung' : 'In Review',
          costing: lang === 'hr' ? 'Procjena' : lang === 'bs' ? 'Procjena' : lang === 'de' ? 'Kalkulation' : 'Costing',
          quoted: lang === 'hr' ? 'Ponuđen' : lang === 'bs' ? 'Ponuđen' : lang === 'de' ? 'Angeboten' : 'Quoted',
          converted: lang === 'hr' ? 'Pretvorjen' : lang === 'bs' ? 'Pretvorjen' : lang === 'de' ? 'Konvertiert' : 'Converted'
        };

        Object.assign(translations.common.status, statusUpdates);
        console.log(`  ✅ Updated status translations`);
      }

      // Write back to file
      writeFileSync(filePath, JSON.stringify(translations, null, 2));
      console.log(`  💾 Saved ${lang}.json`);
      
    } catch (error) {
      console.error(`❌ Failed to process ${lang}.json:`, error);
    }
  }

  console.log('✅ Translation update completed!');
}

// Run the script
if (require.main === module) {
  addTranslations();
}

export { addTranslations };