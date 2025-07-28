#!/usr/bin/env tsx

/**
 * Translation Validation Script for 4-Language GS-CMS
 * 
 * Validates completeness and consistency across:
 * - Croatian (hr.json)
 * - Bosnian (bs.json) 
 * - English (en.json)
 * - German (de.json)
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

type TranslationObject = Record<string, any>;

interface ValidationResult {
  language: string;
  locale: string;
  totalKeys: number;
  missingKeys: string[];
  extraKeys: string[];
  emptyValues: string[];
  completionPercentage: number;
}

const LANGUAGES = {
  'hr': { name: 'Croatian', locale: 'hr-HR', file: 'hr.json' },
  'bs': { name: 'Bosnian', locale: 'bs-BA', file: 'bs.json' },
  'en': { name: 'English', locale: 'en-US', file: 'en.json' },
  'de': { name: 'German', locale: 'de-DE', file: 'de.json' }
};

const MESSAGES_DIR = join(process.cwd(), 'messages');
const REFERENCE_LANGUAGE = 'en'; // English as reference

class TranslationValidator {
  private translations: Record<string, TranslationObject> = {};
  private referenceKeys: Set<string> = new Set();

  async validate(): Promise<ValidationResult[]> {
    console.log('🔍 Loading translation files...');
    this.loadTranslations();
    
    console.log('🔑 Extracting reference keys...');
    this.extractReferenceKeys();
    
    console.log('✅ Validating translations...');
    const results = this.validateAllLanguages();
    
    console.log('📊 Generating validation report...');
    this.generateReport(results);
    
    return results;
  }

  private loadTranslations(): void {
    for (const [langCode, config] of Object.entries(LANGUAGES)) {
      try {
        const filePath = join(MESSAGES_DIR, config.file);
        const content = readFileSync(filePath, 'utf-8');
        this.translations[langCode] = JSON.parse(content);
        console.log(`✓ Loaded ${config.name} (${config.file})`);
      } catch (error) {
        console.error(`❌ Failed to load ${config.name}: ${error}`);
        this.translations[langCode] = {};
      }
    }
  }

  private extractReferenceKeys(): void {
    const reference = this.translations[REFERENCE_LANGUAGE];
    this.extractKeysRecursivelyForReference(reference, '');
    console.log(`📋 Found ${this.referenceKeys.size} keys in reference language`);
  }

  private extractKeysRecursivelyForReference(obj: any, prefix: string): void {
    for (const [key, value] of Object.entries(obj || {})) {
      if (key.startsWith('_')) continue; // Skip metadata
      
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.extractKeysRecursivelyForReference(value, fullKey);
      } else {
        this.referenceKeys.add(fullKey);
      }
    }
  }

  private validateAllLanguages(): ValidationResult[] {
    const results: ValidationResult[] = [];
    
    for (const [langCode, config] of Object.entries(LANGUAGES)) {
      const result = this.validateLanguage(langCode, config);
      results.push(result);
      
      console.log(`📈 ${config.name}: ${result.completionPercentage.toFixed(1)}% complete`);
    }
    
    return results;
  }

  private validateLanguage(langCode: string, config: typeof LANGUAGES[keyof typeof LANGUAGES]): ValidationResult {
    const translation = this.translations[langCode];
    const availableKeys = new Set<string>();
    const emptyValues: string[] = [];
    
    // Extract available keys and find empty values
    this.extractKeysRecursively(translation, '', availableKeys, emptyValues);
    
    // Find missing and extra keys
    const missingKeys = Array.from(this.referenceKeys).filter(key => !availableKeys.has(key));
    const extraKeys = Array.from(availableKeys).filter(key => !this.referenceKeys.has(key));
    
    const totalKeys = this.referenceKeys.size;
    const presentKeys = totalKeys - missingKeys.length;
    const completionPercentage = (presentKeys / totalKeys) * 100;
    
    return {
      language: config.name,
      locale: config.locale,
      totalKeys: totalKeys,
      missingKeys,
      extraKeys,
      emptyValues,
      completionPercentage
    };
  }

  private extractKeysRecursively(obj: any, prefix: string, keySet?: Set<string>, emptyValues?: string[]): void {
    if (!keySet) keySet = new Set();
    if (!emptyValues) emptyValues = [];
    
    for (const [key, value] of Object.entries(obj || {})) {
      if (key.startsWith('_')) continue; // Skip metadata
      
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.extractKeysRecursively(value, fullKey, keySet, emptyValues);
      } else {
        keySet.add(fullKey);
        if (emptyValues && (!value || (typeof value === 'string' && value.trim() === ''))) {
          emptyValues.push(fullKey);
        }
      }
    }
  }

  private generateReport(results: ValidationResult[]): void {
    console.log('\n📊 TRANSLATION VALIDATION REPORT');
    console.log('=====================================\n');
    
    // Summary table
    console.log('📈 COMPLETION SUMMARY:');
    results.forEach(result => {
      const status = result.completionPercentage >= 100 ? '✅' : 
                   result.completionPercentage >= 90 ? '⚠️' : '❌';
      console.log(`${status} ${result.language.padEnd(10)} ${result.completionPercentage.toFixed(1)}% (${result.totalKeys - result.missingKeys.length}/${result.totalKeys} keys)`);
    });
    
    // Detailed issues
    console.log('\n🔍 DETAILED ISSUES:');
    results.forEach(result => {
      if (result.missingKeys.length > 0 || result.emptyValues.length > 0 || result.extraKeys.length > 0) {
        console.log(`\n📝 ${result.language} (${result.locale}):`);
        
        if (result.missingKeys.length > 0) {
          console.log(`  ❌ Missing ${result.missingKeys.length} keys:`);
          result.missingKeys.slice(0, 10).forEach(key => console.log(`     - ${key}`));
          if (result.missingKeys.length > 10) {
            console.log(`     ... and ${result.missingKeys.length - 10} more`);
          }
        }
        
        if (result.emptyValues.length > 0) {
          console.log(`  ⚠️  Empty ${result.emptyValues.length} values:`);
          result.emptyValues.slice(0, 5).forEach(key => console.log(`     - ${key}`));
          if (result.emptyValues.length > 5) {
            console.log(`     ... and ${result.emptyValues.length - 5} more`);
          }
        }
        
        if (result.extraKeys.length > 0) {
          console.log(`  ➕ Extra ${result.extraKeys.length} keys:`);
          result.extraKeys.slice(0, 5).forEach(key => console.log(`     - ${key}`));
          if (result.extraKeys.length > 5) {
            console.log(`     ... and ${result.extraKeys.length - 5} more`);
          }
        }
      }
    });
    
    // Save detailed report to file
    const reportPath = join(process.cwd(), 'translation-report.json');
    writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    
    // Overall status
    const allComplete = results.every(r => r.completionPercentage >= 100);
    const avgCompletion = results.reduce((sum, r) => sum + r.completionPercentage, 0) / results.length;
    
    console.log(`\n🎯 OVERALL STATUS: ${allComplete ? '✅ ALL COMPLETE' : `📊 ${avgCompletion.toFixed(1)}% AVERAGE`}`);
  }
}

// CLI execution
if (require.main === module) {
  const validator = new TranslationValidator();
  validator.validate()
    .then(() => {
      console.log('\n✅ Translation validation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export { TranslationValidator };