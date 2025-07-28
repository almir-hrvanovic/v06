#!/usr/bin/env tsx

/**
 * Script to Verify Translation Key Usage
 * Scans the codebase to ensure all translation keys are actually used
 */

import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'
import { execSync } from 'child_process'

// Configuration
const CONFIG = {
  translationDir: path.join(process.cwd(), 'messages'),
  sourceDir: path.join(process.cwd(), 'src'),
  supportedLanguages: ['en', 'hr', 'bs', 'de'],
  outputFile: path.join(process.cwd(), 'translation-usage-report.json'),
  verbose: process.argv.includes('--verbose'),
}

// Types
interface TranslationKey {
  key: string
  file: string
  line: number
  context: string
}

interface UsageReport {
  totalKeys: number
  usedKeys: number
  unusedKeys: TranslationKey[]
  missingKeys: TranslationKey[]
  summary: {
    usagePercentage: number
    unusedCount: number
    missingCount: number
    recommendedActions: string[]
  }
  languageStats: Record<string, {
    totalKeys: number
    keyStructure: Record<string, number>
  }>
  generatedAt: string
}

class TranslationUsageAnalyzer {
  private translationKeys: Map<string, TranslationKey[]> = new Map()
  private usedKeys: Set<string> = new Set()
  private sourceFiles: string[] = []

  async analyze(): Promise<UsageReport> {
    console.log('🔍 Starting translation usage analysis...')
    
    await this.loadTranslationKeys()
    await this.findSourceFiles()
    await this.scanForUsedKeys()
    
    return this.generateReport()
  }

  private async loadTranslationKeys(): Promise<void> {
    console.log('📝 Loading translation keys...')
    
    for (const lang of CONFIG.supportedLanguages) {
      const filePath = path.join(CONFIG.translationDir, `${lang}.json`)
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  Translation file not found: ${filePath}`)
        continue
      }
      
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        const keys = this.extractKeysFromObject(content, '', lang, filePath)
        this.translationKeys.set(lang, keys)
        
        if (CONFIG.verbose) {
          console.log(`   ${lang}: ${keys.length} keys loaded`)
        }
      } catch (error) {
        console.error(`❌ Failed to load ${lang} translations:`, error)
      }
    }
  }

  private extractKeysFromObject(
    obj: any, 
    prefix: string, 
    lang: string, 
    file: string,
    lineNumber = 1
  ): TranslationKey[] {
    const keys: TranslationKey[] = []
    
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('_')) continue // Skip metadata
      
      const fullKey = prefix ? `${prefix}.${key}` : key
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        keys.push(...this.extractKeysFromObject(value, fullKey, lang, file, lineNumber))
      } else if (typeof value === 'string') {
        keys.push({
          key: fullKey,
          file,
          line: lineNumber,
          context: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
        })
      }
      
      lineNumber++
    }
    
    return keys
  }

  private async findSourceFiles(): Promise<void> {
    console.log('📁 Finding source files...')
    
    const patterns = [
      path.join(CONFIG.sourceDir, '**/*.{ts,tsx,js,jsx}'),
      path.join(process.cwd(), '__tests__/**/*.{ts,tsx,js,jsx}'),
      path.join(process.cwd(), 'scripts/**/*.{ts,tsx,js,jsx}'),
    ]
    
    for (const pattern of patterns) {
      try {
        const files = glob.sync(pattern, {
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
          ],
        })
        this.sourceFiles.push(...files)
      } catch (error) {
        console.warn(`⚠️  Error finding files with pattern ${pattern}:`, error)
      }
    }
    
    console.log(`   Found ${this.sourceFiles.length} source files`)
  }

  private async scanForUsedKeys(): Promise<void> {
    console.log('🔍 Scanning for used translation keys...')
    
    const translationPatterns = [
      // useTranslations hook usage
      /useTranslations\s*\(\s*['"](.*?)['"]\s*\)/g,
      // Direct t() calls with string literals
      /\bt\s*\(\s*['"](.*?)['"]\s*\)/g,
      // getPlural calls
      /getPlural\s*\(\s*['"](.*?)['"]\s*,/g,
      // formatMessage calls
      /formatMessage\s*\(\s*['"](.*?)['"]\s*\)/g,
      // Next.js useTranslations with namespace
      /const\s+t\s*=\s*useTranslations\s*\(\s*['"](.*?)['"]\s*\)/g,
    ]
    
    let totalMatches = 0
    
    for (const filePath of this.sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const relativeFile = path.relative(process.cwd(), filePath)
        
        // Find all translation key usage patterns
        for (const pattern of translationPatterns) {
          let match
          while ((match = pattern.exec(content)) !== null) {
            const keyOrNamespace = match[1]
            
            // Handle namespace extraction (e.g., "common.actions")
            if (keyOrNamespace) {
              this.addUsedKey(keyOrNamespace, relativeFile)
              totalMatches++
              
              // Also scan for keys used with this namespace
              this.scanNamespaceUsage(content, keyOrNamespace, relativeFile)
            }
          }
        }
        
        // Scan for dynamic key construction
        this.scanDynamicKeys(content, relativeFile)
        
      } catch (error) {
        if (CONFIG.verbose) {
          console.warn(`⚠️  Error reading file ${filePath}:`, error)
        }
      }
    }
    
    console.log(`   Found ${totalMatches} translation key references`)
    console.log(`   Identified ${this.usedKeys.size} unique keys`)
  }

  private scanNamespaceUsage(content: string, namespace: string, file: string): void {
    // Look for t("key") patterns after useTranslations(namespace)
    const namespacePattern = new RegExp(
      `useTranslations\\s*\\(\\s*['"]${this.escapeRegex(namespace)}['"]\\s*\\)[\\s\\S]*?` +
      `t\\s*\\(\\s*['"]([^'"]+)['"]\\s*\\)`,
      'g'
    )
    
    let match
    while ((match = namespacePattern.exec(content)) !== null) {
      const key = match[1]
      const fullKey = `${namespace}.${key}`
      this.addUsedKey(fullKey, file)
    }
    
    // Also look for simpler t("key") patterns in files that use the namespace
    if (content.includes(`useTranslations("${namespace}")`)) {
      const simplePattern = /\bt\s*\(\s*['"](.*?)['"]\s*\)/g
      let simpleMatch
      while ((simpleMatch = simplePattern.exec(content)) !== null) {
        const key = simpleMatch[1]
        if (!key.includes('.')) {
          // Assume it's using the namespace
          const fullKey = `${namespace}.${key}`
          this.addUsedKey(fullKey, file)
        }
      }
    }
  }

  private scanDynamicKeys(content: string, file: string): void {
    // Look for dynamic key construction patterns
    const dynamicPatterns = [
      // Template literals with translation keys
      /t\s*\(\s*`([^`]*\$\{[^}]+\}[^`]*)`\s*\)/g,
      // String concatenation
      /t\s*\(\s*['"](.*?)['"]\s*\+\s*.*?\)/g,
      // Variable-based keys
      /t\s*\(\s*(\w+Key|\w+Path)\s*\)/g,
    ]
    
    for (const pattern of dynamicPatterns) {
      let match
      while ((match = pattern.exec(content)) !== null) {
        if (CONFIG.verbose) {
          console.log(`   🔄 Dynamic key usage found in ${file}: ${match[1] || match[0]}`)
        }
        // For dynamic keys, we can't determine exact usage, so we'll note them separately
      }
    }
  }

  private addUsedKey(key: string, file: string): void {
    this.usedKeys.add(key)
    
    if (CONFIG.verbose && !this.usedKeys.has(key)) {
      console.log(`   ✅ Used key: ${key} (in ${file})`)
    }
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  private generateReport(): UsageReport {
    console.log('📊 Generating usage report...')
    
    // Get all unique keys from English (base language)
    const baseKeys = this.translationKeys.get('en') || []
    const allKeyNames = new Set(baseKeys.map(k => k.key))
    
    // Find unused keys
    const unusedKeys = baseKeys.filter(key => !this.usedKeys.has(key.key))
    
    // Find missing keys (referenced but not defined)
    const missingKeys: TranslationKey[] = []
    for (const usedKey of this.usedKeys) {
      if (!allKeyNames.has(usedKey)) {
        missingKeys.push({
          key: usedKey,
          file: 'unknown',
          line: 0,
          context: 'Referenced in code but not found in translation files',
        })
      }
    }
    
    const usagePercentage = (this.usedKeys.size / allKeyNames.size) * 100
    
    // Generate language statistics
    const languageStats: Record<string, any> = {}
    for (const [lang, keys] of this.translationKeys.entries()) {
      const keyStructure: Record<string, number> = {}
      
      keys.forEach(key => {
        const topLevel = key.key.split('.')[0]
        keyStructure[topLevel] = (keyStructure[topLevel] || 0) + 1
      })
      
      languageStats[lang] = {
        totalKeys: keys.length,
        keyStructure,
      }
    }
    
    // Generate recommendations
    const recommendedActions: string[] = []
    
    if (unusedKeys.length > 0) {
      recommendedActions.push(`Remove ${unusedKeys.length} unused translation keys`)
    }
    
    if (missingKeys.length > 0) {
      recommendedActions.push(`Add ${missingKeys.length} missing translation keys`)
    }
    
    if (usagePercentage < 80) {
      recommendedActions.push('Review translation key usage - low utilization detected')
    }
    
    if (usagePercentage > 95) {
      recommendedActions.push('Excellent translation key utilization!')
    }
    
    const report: UsageReport = {
      totalKeys: allKeyNames.size,
      usedKeys: this.usedKeys.size,
      unusedKeys,
      missingKeys,
      summary: {
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        unusedCount: unusedKeys.length,
        missingCount: missingKeys.length,
        recommendedActions,
      },
      languageStats,
      generatedAt: new Date().toISOString(),
    }
    
    return report
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const analyzer = new TranslationUsageAnalyzer()
    const report = await analyzer.analyze()
    
    // Save report
    fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2))
    
    // Display summary
    console.log('\n📋 Translation Usage Report Summary')
    console.log('=====================================')
    console.log(`Total translation keys: ${report.totalKeys}`)
    console.log(`Used keys: ${report.usedKeys}`)
    console.log(`Usage percentage: ${report.summary.usagePercentage}%`)
    console.log(`Unused keys: ${report.summary.unusedCount}`)
    console.log(`Missing keys: ${report.summary.missingCount}`)
    
    if (report.summary.recommendedActions.length > 0) {
      console.log('\n🎯 Recommended Actions:')
      report.summary.recommendedActions.forEach(action => {
        console.log(`   • ${action}`)
      })
    }
    
    // Show some unused keys as examples
    if (report.unusedKeys.length > 0) {
      console.log('\n🔍 Sample Unused Keys:')
      report.unusedKeys.slice(0, 5).forEach(key => {
        console.log(`   • ${key.key} (${key.context})`)
      })
      
      if (report.unusedKeys.length > 5) {
        console.log(`   ... and ${report.unusedKeys.length - 5} more`)
      }
    }
    
    // Show missing keys
    if (report.missingKeys.length > 0) {
      console.log('\n❌ Missing Keys:')
      report.missingKeys.forEach(key => {
        console.log(`   • ${key.key}`)
      })
    }
    
    console.log(`\n📄 Full report saved to: ${CONFIG.outputFile}`)
    
    // Exit with error code if there are issues
    if (report.missingKeys.length > 0) {
      console.log('\n❌ Translation validation failed - missing keys detected')
      process.exit(1)
    }
    
    if (report.summary.usagePercentage < 50) {
      console.log('\n⚠️  Warning: Low translation key utilization')
      process.exit(1)
    }
    
    console.log('\n✅ Translation usage analysis completed successfully')
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { TranslationUsageAnalyzer, CONFIG }