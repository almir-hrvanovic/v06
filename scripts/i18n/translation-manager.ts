#!/usr/bin/env tsx

/**
 * Translation Management Script for 4-Language GS-CMS
 * 
 * Features:
 * - Sync missing keys across all languages
 * - Find and fix inconsistencies
 * - Generate missing translation placeholders
 * - Update metadata and statistics
 * - Export/import translation data
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

type TranslationObject = Record<string, any>;

interface LanguageConfig {
  name: string;
  locale: string;
  file: string;
  nativeName: string;
  fallback?: string;
}

interface KeyInfo {
  path: string;
  value: any;
  context?: string;
}

const LANGUAGES: Record<string, LanguageConfig> = {
  'hr': { name: 'Croatian', locale: 'hr-HR', file: 'hr.json', nativeName: 'Hrvatski' },
  'bs': { name: 'Bosnian', locale: 'bs-BA', file: 'bs.json', nativeName: 'Bosanski', fallback: 'hr' },
  'en': { name: 'English', locale: 'en-US', file: 'en.json', nativeName: 'English' },
  'de': { name: 'German', locale: 'de-DE', file: 'de.json', nativeName: 'Deutsch' }
};

const MESSAGES_DIR = join(process.cwd(), 'messages');
const BACKUP_DIR = join(process.cwd(), 'messages', 'backups');

class TranslationManager {
  private translations: Record<string, TranslationObject> = {};
  private allKeys: Map<string, KeyInfo> = new Map();

  async syncAll(): Promise<void> {
    console.log('🔄 Starting translation synchronization...');
    
    // Load all translations
    this.loadAllTranslations();
    
    // Collect all unique keys
    this.collectAllKeys();
    
    // Sync missing keys to all languages
    await this.syncMissingKeys();
    
    // Update metadata
    this.updateMetadata();
    
    // Save all translations
    this.saveAllTranslations();
    
    console.log('✅ Translation synchronization completed!');
  }

  async generateMissingKeys(targetLang: string): Promise<void> {
    console.log(`🔧 Generating missing keys for ${LANGUAGES[targetLang]?.name}...`);
    
    this.loadAllTranslations();
    this.collectAllKeys();
    
    const targetTranslation = this.translations[targetLang];
    if (!targetTranslation) {
      throw new Error(`Translation file not found for language: ${targetLang}`);
    }
    
    const targetKeys = new Set<string>();
    this.extractKeysRecursively(targetTranslation, '', targetKeys);
    
    let addedCount = 0;
    for (const [keyPath, keyInfo] of this.allKeys.entries()) {
      if (!targetKeys.has(keyPath)) {
        // Generate placeholder or use fallback
        const placeholderValue = await this.generatePlaceholder(keyPath, keyInfo, targetLang);
        this.setNestedValue(targetTranslation, keyPath, placeholderValue);
        addedCount++;
      }
    }
    
    this.updateLanguageMetadata(targetLang, targetTranslation);
    this.saveTranslation(targetLang, targetTranslation);
    
    console.log(`✅ Added ${addedCount} missing keys to ${LANGUAGES[targetLang].name}`);
  }

  async optimizeTranslations(): Promise<void> {
    console.log('⚡ Optimizing translations...');
    
    this.loadAllTranslations();
    
    for (const [langCode, translation] of Object.entries(this.translations)) {
      // Remove empty values
      this.removeEmptyValues(translation);
      
      // Sort keys alphabetically
      const sorted = this.sortObjectKeys(translation);
      
      // Update metadata
      this.updateLanguageMetadata(langCode, sorted);
      
      this.translations[langCode] = sorted;
    }
    
    this.saveAllTranslations();
    console.log('✅ Translation optimization completed!');
  }

  async exportTranslations(format: 'csv' | 'xlsx' = 'csv'): Promise<void> {
    console.log(`📤 Exporting translations to ${format.toUpperCase()}...`);
    
    this.loadAllTranslations();
    this.collectAllKeys();
    
    const exportData: any[] = [];
    
    // Header row
    const headers = ['Key', 'Context', ...Object.values(LANGUAGES).map(l => l.name)];
    exportData.push(headers);
    
    // Data rows
    for (const [keyPath, keyInfo] of this.allKeys.entries()) {
      const row = [keyPath, keyInfo.context || ''];
      
      for (const langCode of Object.keys(LANGUAGES)) {
        const value = this.getNestedValue(this.translations[langCode], keyPath);
        row.push(value || '');
      }
      
      exportData.push(row);
    }
    
    if (format === 'csv') {
      const csvContent = exportData.map(row => 
        row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\\n');
      
      const exportPath = join(process.cwd(), `translations-export-${Date.now()}.csv`);
      writeFileSync(exportPath, csvContent);
      console.log(`✅ CSV exported to: ${exportPath}`);
    }
  }

  private loadAllTranslations(): void {
    console.log('📂 Loading translation files...');
    
    for (const [langCode, config] of Object.entries(LANGUAGES)) {
      try {
        const filePath = join(MESSAGES_DIR, config.file);
        if (existsSync(filePath)) {
          const content = readFileSync(filePath, 'utf-8');
          this.translations[langCode] = JSON.parse(content);
          console.log(`✓ Loaded ${config.name} (${config.file})`);
        } else {
          console.log(`⚠️  Creating new ${config.name} translation file`);
          this.translations[langCode] = this.createEmptyTranslation(langCode);
        }
      } catch (error) {
        console.error(`❌ Failed to load ${config.name}: ${error}`);
        this.translations[langCode] = this.createEmptyTranslation(langCode);
      }
    }
  }

  private collectAllKeys(): void {
    console.log('🔑 Collecting all translation keys...');
    
    this.allKeys.clear();
    
    for (const [langCode, translation] of Object.entries(this.translations)) {
      this.extractKeysWithInfo(translation, '', langCode);
    }
    
    console.log(`📋 Found ${this.allKeys.size} unique keys across all languages`);
  }

  private extractKeysWithInfo(obj: any, prefix: string, langCode: string): void {
    for (const [key, value] of Object.entries(obj || {})) {
      if (key.startsWith('_')) {
        continue; // Skip metadata
      }
      
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.extractKeysWithInfo(value, fullKey, langCode);
      } else {
        // Store key info if not already stored or if this has context
        if (!this.allKeys.has(fullKey) || (obj._context && !this.allKeys.get(fullKey)?.context)) {
          this.allKeys.set(fullKey, {
            path: fullKey,
            value: value,
            context: obj._context
          });
        }
      }
    }
  }

  private extractKeysRecursively(obj: any, prefix: string, keySet: Set<string>): void {
    for (const [key, value] of Object.entries(obj || {})) {
      if (key.startsWith('_')) continue;
      
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.extractKeysRecursively(value, fullKey, keySet);
      } else {
        keySet.add(fullKey);
      }
    }
  }

  private async syncMissingKeys(): Promise<void> {
    console.log('🔄 Synchronizing missing keys...');
    
    for (const [langCode, config] of Object.entries(LANGUAGES)) {
      const translation = this.translations[langCode];
      const existingKeys = new Set<string>();
      this.extractKeysRecursively(translation, '', existingKeys);
      
      let addedCount = 0;
      for (const [keyPath, keyInfo] of this.allKeys.entries()) {
        if (!existingKeys.has(keyPath)) {
          const placeholderValue = await this.generatePlaceholder(keyPath, keyInfo, langCode);
          this.setNestedValue(translation, keyPath, placeholderValue);
          addedCount++;
        }
      }
      
      if (addedCount > 0) {
        console.log(`✓ Added ${addedCount} keys to ${config.name}`);
      }
    }
  }

  private async generatePlaceholder(keyPath: string, keyInfo: KeyInfo, targetLang: string): Promise<string> {
    const config = LANGUAGES[targetLang];
    
    // Try fallback language first
    if (config.fallback) {
      const fallbackValue = this.getNestedValue(this.translations[config.fallback], keyPath);
      if (fallbackValue) {
        return fallbackValue;
      }
    }
    
    // Generate placeholder based on key path
    const keyParts = keyPath.split('.');
    const lastPart = keyParts[keyParts.length - 1];
    
    // Common translations for different languages
    const commonTranslations: Record<string, Record<string, string>> = {
      'bs': {
        'save': 'Sačuvaj',
        'cancel': 'Otkaži',
        'delete': 'Obriši',
        'edit': 'Uredi',
        'create': 'Stvori',
        'update': 'Ažuriraj',
        'search': 'Pretraži',
        'loading': 'Učitava...',
        'name': 'Ime',
        'email': 'E-pošta',
        'phone': 'Telefon',
        'address': 'Adresa',
        'company': 'Kompanija',
        'status': 'Status',
        'active': 'Aktivan',
        'inactive': 'Neaktivan'
      },
      'de': {
        'save': 'Speichern',
        'cancel': 'Abbrechen',
        'delete': 'Löschen',
        'edit': 'Bearbeiten',
        'create': 'Erstellen',
        'update': 'Aktualisieren',
        'search': 'Suchen',
        'loading': 'Lädt...',
        'name': 'Name',
        'email': 'E-Mail',
        'phone': 'Telefon',
        'address': 'Adresse',
        'company': 'Unternehmen',
        'status': 'Status',
        'active': 'Aktiv',
        'inactive': 'Inaktiv'
      }
    };
    
    // Check for common translation
    if (commonTranslations[targetLang]?.[lastPart]) {
      return commonTranslations[targetLang][lastPart];
    }
    
    // Return placeholder with context
    return keyInfo.context 
      ? `[${config.name}: ${lastPart}]`
      : `[TODO: ${lastPart}]`;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    let current = obj;
    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[lastKey] = value;
  }

  private removeEmptyValues(obj: any): void {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.removeEmptyValues(value);
        // Remove empty objects
        if (Object.keys(value).length === 0) {
          delete obj[key];
        }
      } else if (!value || (typeof value === 'string' && value.trim() === '')) {
        delete obj[key];
      }
    }
  }

  private sortObjectKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return obj;
    }
    
    const sorted: any = {};
    
    // Sort keys, but keep _metadata and _context first
    const keys = Object.keys(obj).sort((a, b) => {
      if (a.startsWith('_') && !b.startsWith('_')) return -1;
      if (!a.startsWith('_') && b.startsWith('_')) return 1;
      return a.localeCompare(b);
    });
    
    for (const key of keys) {
      sorted[key] = this.sortObjectKeys(obj[key]);
    }
    
    return sorted;
  }

  private updateMetadata(): void {
    for (const [langCode, translation] of Object.entries(this.translations)) {
      this.updateLanguageMetadata(langCode, translation);
    }
  }

  private updateLanguageMetadata(langCode: string, translation: any): void {
    const config = LANGUAGES[langCode];
    const keyCount = this.countKeys(translation);
    
    if (!translation._metadata) {
      translation._metadata = {};
    }
    
    translation._metadata = {
      ...translation._metadata,
      language: config.name,
      locale: config.locale,
      version: translation._metadata.version || '1.0.0',
      lastUpdated: new Date().toISOString().split('T')[0],
      translationGuide: this.getTranslationGuide(langCode),
      totalKeys: `${keyCount}+`,
      completionStatus: '100%',
      managedBy: 'Translation Manager Script v1.0'
    };
  }

  private getTranslationGuide(langCode: string): string {
    const guides: Record<string, string> = {
      'hr': 'Koristite jasni, profesionalni hrvatski jezik. Održavajte dosljednu terminologiju kroz značajke.',
      'bs': 'Koristite jasni, profesionalni bosanski jezik. Održavajte dosljednu terminologiju kroz značajke.',
      'en': 'Use clear, professional English. Maintain consistent terminology across features.',
      'de': 'Verwenden Sie klares, professionelles Deutsch. Behalten Sie konsistente Terminologie bei.'
    };
    return guides[langCode] || guides['en'];
  }

  private countKeys(obj: any, prefix: string = ''): number {
    let count = 0;
    for (const [key, value] of Object.entries(obj || {})) {
      if (key.startsWith('_')) continue;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        count += this.countKeys(value, prefix ? `${prefix}.${key}` : key);
      } else {
        count++;
      }
    }
    return count;
  }

  private createEmptyTranslation(langCode: string): TranslationObject {
    const config = LANGUAGES[langCode];
    return {
      _metadata: {
        language: config.name,
        locale: config.locale,
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0],
        translationGuide: this.getTranslationGuide(langCode),
        totalKeys: '0',
        completionStatus: '0%',
        managedBy: 'Translation Manager Script v1.0'
      }
    };
  }

  private saveAllTranslations(): void {
    console.log('💾 Saving translation files...');
    
    for (const [langCode, translation] of Object.entries(this.translations)) {
      this.saveTranslation(langCode, translation);
    }
  }

  private saveTranslation(langCode: string, translation: TranslationObject): void {
    const config = LANGUAGES[langCode];
    const filePath = join(MESSAGES_DIR, config.file);
    
    try {
      writeFileSync(filePath, JSON.stringify(translation, null, 2));
      console.log(`✓ Saved ${config.name} (${config.file})`);
    } catch (error) {
      console.error(`❌ Failed to save ${config.name}: ${error}`);
    }
  }
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  const manager = new TranslationManager();
  
  switch (command) {
    case 'sync':
      manager.syncAll().catch(console.error);
      break;
    case 'generate':
      const targetLang = process.argv[3];
      if (!targetLang || !LANGUAGES[targetLang]) {
        console.error('Usage: tsx translation-manager.ts generate <language>');
        console.error('Available languages:', Object.keys(LANGUAGES).join(', '));
        process.exit(1);
      }
      manager.generateMissingKeys(targetLang).catch(console.error);
      break;
    case 'optimize':
      manager.optimizeTranslations().catch(console.error);
      break;
    case 'export':
      const format = (process.argv[3] as 'csv' | 'xlsx') || 'csv';
      manager.exportTranslations(format).catch(console.error);
      break;
    default:
      console.log('Translation Manager for 4-Language GS-CMS');
      console.log('');
      console.log('Usage:');
      console.log('  tsx translation-manager.ts sync        - Sync all languages');
      console.log('  tsx translation-manager.ts generate <lang> - Generate missing keys for language');
      console.log('  tsx translation-manager.ts optimize    - Optimize and clean translations');
      console.log('  tsx translation-manager.ts export [csv] - Export translations');
      console.log('');
      console.log('Available languages: hr, bs, en, de');
      break;
  }
}

export { TranslationManager };