#!/usr/bin/env tsx

/**
 * Script to Find Orphaned Translation Keys
 * Identifies translation keys that exist in some languages but not others
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

// Configuration
const CONFIG = {
  translationDir: path.join(process.cwd(), 'messages'),
  supportedLanguages: ['en', 'hr', 'bs', 'de'],
  baseLanguage: 'en', // Reference language for comparisons
  outputFile: path.join(process.cwd(), 'orphaned-keys-report.json'),
  autoFix: process.argv.includes('--fix'),
  verbose: process.argv.includes('--verbose'),
  backupDir: path.join(process.cwd(), '.translation-backups'),
}

// Types
interface OrphanedKey {
  key: string
  presentIn: string[]
  missingFrom: string[]
  value?: string
  context?: string
}

interface KeyInconsistency {
  key: string
  type: 'structure' | 'type' | 'empty'
  details: Record<string, any>
}

interface OrphanedKeysReport {
  orphanedKeys: OrphanedKey[]
  inconsistencies: KeyInconsistency[]
  summary: {
    totalOrphaned: number
    totalInconsistencies: number
    affectedLanguages: string[]
    recommendedActions: string[]
  }
  languageComparison: Record<string, {
    totalKeys: number
    missingKeys: number
    extraKeys: number
    inconsistentKeys: number
  }>
  generatedAt: string
}

class OrphanedKeysFinder {
  private translations: Map<string, any> = new Map()
  private allKeys: Map<string, Set<string>> = new Map()

  async analyze(): Promise<OrphanedKeysReport> {
    console.log('🔍 Starting orphaned keys analysis...')
    
    await this.loadAllTranslations()
    await this.extractAllKeys()
    
    const report = this.generateReport()
    
    if (CONFIG.autoFix) {
      await this.autoFixIssues(report)
    }
    
    return report
  }

  private async loadAllTranslations(): Promise<void> {
    console.log('📝 Loading all translation files...')
    
    // Create backup directory if auto-fixing
    if (CONFIG.autoFix && !fs.existsSync(CONFIG.backupDir)) {
      fs.mkdirSync(CONFIG.backupDir, { recursive: true })
    }
    
    for (const lang of CONFIG.supportedLanguages) {
      const filePath = path.join(CONFIG.translationDir, `${lang}.json`)
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Translation file not found: ${filePath}`)
        this.translations.set(lang, {})
        continue
      }
      
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        this.translations.set(lang, content)
        
        // Create backup if auto-fixing
        if (CONFIG.autoFix) {
          const backupPath = path.join(CONFIG.backupDir, `${lang}-${Date.now()}.json`)
          fs.writeFileSync(backupPath, JSON.stringify(content, null, 2))
        }
        
        if (CONFIG.verbose) {
          console.log(`   ✅ Loaded ${lang} translations`)
        }
      } catch (error) {
        console.error(`❌ Failed to load ${lang} translations:`, error)
        this.translations.set(lang, {})
      }
    }
  }

  private async extractAllKeys(): Promise<void> {
    console.log('🔑 Extracting keys from all languages...')
    
    for (const [lang, content] of this.translations.entries()) {
      const keys = this.extractKeysFromObject(content)
      this.allKeys.set(lang, keys)
      
      if (CONFIG.verbose) {
        console.log(`   ${lang}: ${keys.size} keys found`)
      }
    }
  }

  private extractKeysFromObject(obj: any, prefix = ''): Set<string> {
    const keys = new Set<string>()
    
    for (const [key, value] of Object.entries(obj || {})) {
      if (key.startsWith('_')) continue // Skip metadata
      
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursive for nested objects
        const nestedKeys = this.extractKeysFromObject(value, fullKey)
        nestedKeys.forEach(k => keys.add(k))
      } else {
        keys.add(fullKey)
      }
    }
    
    return keys
  }

  private generateReport(): OrphanedKeysReport {
    console.log('📊 Analyzing key consistency...')
    
    const orphanedKeys: OrphanedKey[] = []
    const inconsistencies: KeyInconsistency[] = []
    const languageComparison: Record<string, any> = {}
    
    // Get all unique keys across all languages
    const allUniqueKeys = new Set<string>()
    this.allKeys.forEach(keys => keys.forEach(key => allUniqueKeys.add(key)))
    
    // Analyze each key across all languages
    for (const key of allUniqueKeys) {
      const presentIn: string[] = []
      const missingFrom: string[] = []
      
      for (const lang of CONFIG.supportedLanguages) {
        const langKeys = this.allKeys.get(lang) || new Set()
        
        if (langKeys.has(key)) {
          presentIn.push(lang)
        } else {
          missingFrom.push(lang)
        }
      }
      
      // If key is missing from any language, it's orphaned
      if (missingFrom.length > 0) {
        const baseValue = this.getKeyValue(key, CONFIG.baseLanguage)
        
        orphanedKeys.push({
          key,
          presentIn,
          missingFrom,
          value: baseValue,
          context: this.getKeyContext(key),
        })
      }
      
      // Check for value inconsistencies
      this.checkValueInconsistencies(key, presentIn, inconsistencies)
    }
    
    // Generate language comparison stats
    for (const lang of CONFIG.supportedLanguages) {
      const langKeys = this.allKeys.get(lang) || new Set()
      const baseKeys = this.allKeys.get(CONFIG.baseLanguage) || new Set()
      
      const missingKeys = Array.from(baseKeys).filter(key => !langKeys.has(key))
      const extraKeys = Array.from(langKeys).filter(key => !baseKeys.has(key))
      
      languageComparison[lang] = {
        totalKeys: langKeys.size,
        missingKeys: missingKeys.length,
        extraKeys: extraKeys.length,
        inconsistentKeys: inconsistencies.filter(inc => 
          inc.details[lang] !== undefined
        ).length,
      }
    }
    
    // Generate recommendations
    const recommendedActions = this.generateRecommendations(orphanedKeys, inconsistencies)
    const affectedLanguages = [...new Set(orphanedKeys.flatMap(k => k.missingFrom))]
    
    return {
      orphanedKeys,
      inconsistencies,
      summary: {
        totalOrphaned: orphanedKeys.length,
        totalInconsistencies: inconsistencies.length,
        affectedLanguages,
        recommendedActions,
      },
      languageComparison,
      generatedAt: new Date().toISOString(),
    }
  }

  private getKeyValue(key: string, lang: string): string | undefined {
    const translation = this.translations.get(lang)
    if (!translation) return undefined
    
    const keys = key.split('.')
    let current = translation
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        return undefined
      }
    }
    
    return typeof current === 'string' ? current : undefined
  }

  private getKeyContext(key: string): string {
    const parts = key.split('.')
    if (parts.length > 1) {
      return `Part of ${parts[0]} section`
    }
    return 'Top-level key'
  }

  private checkValueInconsistencies(
    key: string, 
    presentIn: string[], 
    inconsistencies: KeyInconsistency[]
  ): void {
    if (presentIn.length < 2) return
    
    const values: Record<string, any> = {}
    const types: Record<string, string> = {}
    
    for (const lang of presentIn) {
      const value = this.getKeyValue(key, lang)
      values[lang] = value
      types[lang] = typeof value
      
      // Check for empty values
      if (value === '' || value === null || value === undefined) {
        inconsistencies.push({
          key,
          type: 'empty',
          details: { [lang]: 'Empty or null value' },
        })
      }
    }
    
    // Check for type inconsistencies
    const uniqueTypes = new Set(Object.values(types))
    if (uniqueTypes.size > 1) {
      inconsistencies.push({
        key,
        type: 'type',
        details: types,
      })
    }
    
    // Check for structural inconsistencies (nested vs flat)
    const translation = this.translations.get(CONFIG.baseLanguage)
    if (translation) {
      const baseStructure = this.getKeyStructure(key, translation)
      
      for (const lang of presentIn) {
        if (lang === CONFIG.baseLanguage) continue
        
        const langTranslation = this.translations.get(lang)
        if (langTranslation) {
          const langStructure = this.getKeyStructure(key, langTranslation)
          
          if (JSON.stringify(baseStructure) !== JSON.stringify(langStructure)) {
            inconsistencies.push({
              key,
              type: 'structure',
              details: {
                [CONFIG.baseLanguage]: baseStructure,
                [lang]: langStructure,
              },
            })
          }
        }
      }
    }
  }

  private getKeyStructure(key: string, translation: any): any {
    const keys = key.split('.')
    let current = translation
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (current && typeof current === 'object' && keys[i] in current) {
        current = current[keys[i]]
      } else {
        return null
      }
    }
    
    const finalKey = keys[keys.length - 1]
    if (current && typeof current === 'object' && finalKey in current) {
      const value = current[finalKey]
      return {
        type: typeof value,
        isObject: typeof value === 'object' && value !== null,
        hasNestedKeys: typeof value === 'object' && value !== null ? Object.keys(value).length : 0,
      }
    }
    
    return null
  }

  private generateRecommendations(
    orphanedKeys: OrphanedKey[], 
    inconsistencies: KeyInconsistency[]
  ): string[] {
    const recommendations: string[] = []
    
    if (orphanedKeys.length > 0) {
      recommendations.push(`Add ${orphanedKeys.length} missing translation keys`)
      
      const mostAffectedLang = this.findMostAffectedLanguage(orphanedKeys)
      if (mostAffectedLang) {
        recommendations.push(`Focus on ${mostAffectedLang} - most missing keys`)
      }
    }
    
    if (inconsistencies.length > 0) {
      const emptyCount = inconsistencies.filter(i => i.type === 'empty').length
      const typeCount = inconsistencies.filter(i => i.type === 'type').length
      const structureCount = inconsistencies.filter(i => i.type === 'structure').length
      
      if (emptyCount > 0) {
        recommendations.push(`Fix ${emptyCount} empty translation values`)
      }
      
      if (typeCount > 0) {
        recommendations.push(`Resolve ${typeCount} type inconsistencies`)
      }
      
      if (structureCount > 0) {
        recommendations.push(`Fix ${structureCount} structural inconsistencies`)
      }
    }
    
    if (orphanedKeys.length === 0 && inconsistencies.length === 0) {
      recommendations.push('All translation keys are consistent across languages! 🎉')
    }
    
    return recommendations
  }

  private findMostAffectedLanguage(orphanedKeys: OrphanedKey[]): string | null {
    const langCounts: Record<string, number> = {}
    
    orphanedKeys.forEach(key => {
      key.missingFrom.forEach(lang => {
        langCounts[lang] = (langCounts[lang] || 0) + 1
      })
    })
    
    const sortedLangs = Object.entries(langCounts)
      .sort(([, a], [, b]) => b - a)
    
    return sortedLangs.length > 0 ? sortedLangs[0][0] : null
  }

  private async autoFixIssues(report: OrphanedKeysReport): Promise<void> {
    if (!CONFIG.autoFix) return
    
    console.log('🔧 Auto-fixing translation issues...')
    
    let fixedCount = 0
    
    // Fix orphaned keys by copying from base language
    for (const orphanedKey of report.orphanedKeys) {
      const baseValue = this.getKeyValue(orphanedKey.key, CONFIG.baseLanguage)
      
      if (baseValue) {
        for (const missingLang of orphanedKey.missingFrom) {
          this.setKeyValue(orphanedKey.key, missingLang, baseValue)
          fixedCount++
          
          if (CONFIG.verbose) {
            console.log(`   ✅ Added key ${orphanedKey.key} to ${missingLang}`)
          }
        }
      }
    }
    
    // Fix empty values
    for (const inconsistency of report.inconsistencies) {
      if (inconsistency.type === 'empty') {
        const baseValue = this.getKeyValue(inconsistency.key, CONFIG.baseLanguage)
        
        if (baseValue) {
          for (const [lang, issue] of Object.entries(inconsistency.details)) {
            if (issue === 'Empty or null value') {
              this.setKeyValue(inconsistency.key, lang, `[${lang.toUpperCase()}] ${baseValue}`)
              fixedCount++
              
              if (CONFIG.verbose) {
                console.log(`   ✅ Fixed empty value for ${inconsistency.key} in ${lang}`)
              }
            }
          }
        }
      }
    }
    
    // Save fixed translations
    for (const lang of CONFIG.supportedLanguages) {
      const filePath = path.join(CONFIG.translationDir, `${lang}.json`)
      const translation = this.translations.get(lang)
      
      if (translation) {
        fs.writeFileSync(filePath, JSON.stringify(translation, null, 2) + '\n')
      }
    }
    
    console.log(`   🎉 Fixed ${fixedCount} issues automatically`)
  }

  private setKeyValue(key: string, lang: string, value: string): void {
    const translation = this.translations.get(lang)
    if (!translation) return
    
    const keys = key.split('.')
    let current = translation
    
    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      
      if (!(k in current)) {
        current[k] = {}
      }
      
      current = current[k]
    }
    
    // Set the final value
    const finalKey = keys[keys.length - 1]
    current[finalKey] = value
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const finder = new OrphanedKeysFinder()
    const report = await finder.analyze()
    
    // Save report
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2))
    
    // Display summary
    console.log('\n📋 Orphaned Keys Report Summary')
    console.log('================================')
    console.log(`Total orphaned keys: ${report.summary.totalOrphaned}`)
    console.log(`Total inconsistencies: ${report.summary.totalInconsistencies}`)
    console.log(`Affected languages: ${report.summary.affectedLanguages.join(', ')}`)
    
    // Show language comparison
    console.log('\n📊 Language Comparison:')
    for (const [lang, stats] of Object.entries(report.languageComparison)) {
      console.log(`   ${lang}: ${stats.totalKeys} keys, ${stats.missingKeys} missing, ${stats.extraKeys} extra`)
    }
    
    // Show recommendations
    if (report.summary.recommendedActions.length > 0) {
      console.log('\n🎯 Recommended Actions:')
      report.summary.recommendedActions.forEach(action => {
        console.log(`   • ${action}`)
      })
    }
    
    // Show sample orphaned keys
    if (report.orphanedKeys.length > 0) {
      console.log('\n🔍 Sample Orphaned Keys:')
      report.orphanedKeys.slice(0, 5).forEach(key => {
        console.log(`   • ${key.key} (missing from: ${key.missingFrom.join(', ')})`)
      })
      
      if (report.orphanedKeys.length > 5) {
        console.log(`   ... and ${report.orphanedKeys.length - 5} more`)
      }
    }
    
    console.log(`\n📄 Full report saved to: ${CONFIG.outputFile}`)
    
    if (CONFIG.autoFix) {
      console.log(`\n💾 Backups saved to: ${CONFIG.backupDir}`)
    }
    
    // Exit with error if issues found (unless auto-fixed)
    if ((report.summary.totalOrphaned > 0 || report.summary.totalInconsistencies > 0) && !CONFIG.autoFix) {
      console.log('\n⚠️  Translation inconsistencies detected. Run with --fix to auto-resolve.')
      process.exit(1)
    }
    
    console.log('\n✅ Orphaned keys analysis completed successfully')
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { OrphanedKeysFinder, CONFIG }