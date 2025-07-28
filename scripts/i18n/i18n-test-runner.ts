#!/usr/bin/env tsx

/**
 * i18n Test Runner - Master Orchestration Script
 * Runs comprehensive i18n testing protocol with reporting
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const CONFIG = {
  categories: ['keys', 'switching', 'visual', 'performance', 'usage', 'orphaned'] as const,
  outputDir: path.join(process.cwd(), 'i18n-test-results'),
  reportFile: path.join(process.cwd(), 'i18n-test-results', 'comprehensive-report.json'),
  verbose: process.argv.includes('--verbose'),
  generateReport: process.argv.includes('--report'),
  category: process.argv.find(arg => arg.startsWith('--category='))?.split('=')[1],
  fix: process.argv.includes('--fix'),
}

type TestCategory = typeof CONFIG.categories[number]

// Test result interfaces
interface TestResult {
  category: TestCategory
  name: string
  status: 'pass' | 'fail' | 'skip'
  duration: number
  output?: string
  error?: string
  metrics?: Record<string, any>
}

interface ComprehensiveReport {
  summary: {
    totalTests: number
    passed: number
    failed: number
    skipped: number
    duration: number
    successRate: number
  }
  categories: Record<TestCategory, {
    tests: TestResult[]
    status: 'pass' | 'fail' | 'partial'
    duration: number
  }>
  recommendations: string[]
  healthScore: number
  generatedAt: string
}

class I18nTestRunner {
  private results: TestResult[] = []
  private startTime: number = 0

  async run(): Promise<ComprehensiveReport> {
    console.log('🧪 Starting Comprehensive i18n Testing Protocol')
    console.log('='.repeat(50))
    
    this.startTime = Date.now()
    
    // Ensure output directory exists
    this.ensureOutputDirectory()
    
    // Run test categories
    if (CONFIG.category) {
      await this.runCategory(CONFIG.category as TestCategory)
    } else {
      for (const category of CONFIG.categories) {
        await this.runCategory(category)
      }
    }
    
    // Generate comprehensive report
    const report = this.generateReport()
    
    // Save report
    if (CONFIG.generateReport) {
      this.saveReport(report)
    }
    
    // Display results
    this.displayResults(report)
    
    return report
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true })
    }
  }

  private async runCategory(category: TestCategory): Promise<void> {
    console.log(`\n📂 Running ${category.toUpperCase()} tests...`)
    console.log('-'.repeat(30))
    
    switch (category) {
      case 'keys':
        await this.runTranslationKeyTests()
        break
      case 'switching':
        await this.runLanguageSwitchingTests()
        break
      case 'visual':
        await this.runVisualRegressionTests()
        break
      case 'performance':
        await this.runPerformanceTests()
        break
      case 'usage':
        await this.runUsageAnalysis()
        break
      case 'orphaned':
        await this.runOrphanedKeysAnalysis()
        break
      default:
        console.warn(`⚠️  Unknown category: ${category}`)
    }
  }

  private async runTranslationKeyTests(): Promise<void> {
    try {
      const startTime = Date.now()
      
      const output = execSync(
        'npx jest __tests__/i18n/translation-keys.test.ts --json --verbose',
        { encoding: 'utf-8', timeout: 60000 }
      )
      
      const duration = Date.now() - startTime
      const jestResult = JSON.parse(output)
      
      this.results.push({
        category: 'keys',
        name: 'Translation Key Existence Tests',
        status: jestResult.success ? 'pass' : 'fail',
        duration,
        output: CONFIG.verbose ? output : undefined,
        metrics: {
          testsRun: jestResult.numTotalTests,
          testsPassed: jestResult.numPassedTests,
          testsFailed: jestResult.numFailedTests,
        },
      })
      
      console.log(`✅ Translation key tests completed (${duration}ms)`)
      
    } catch (error: any) {
      this.results.push({
        category: 'keys',
        name: 'Translation Key Existence Tests',
        status: 'fail',
        duration: Date.now() - Date.now(),
        error: error.message,
      })
      
      console.log(`❌ Translation key tests failed: ${error.message}`)
    }
  }

  private async runLanguageSwitchingTests(): Promise<void> {
    try {
      const startTime = Date.now()
      
      const output = execSync(
        'npx jest __tests__/i18n/language-switching.test.tsx --json --verbose',
        { encoding: 'utf-8', timeout: 90000 }
      )
      
      const duration = Date.now() - startTime
      const jestResult = JSON.parse(output)
      
      this.results.push({
        category: 'switching',
        name: 'Language Switching Integration Tests',
        status: jestResult.success ? 'pass' : 'fail',
        duration,
        output: CONFIG.verbose ? output : undefined,
        metrics: {
          testsRun: jestResult.numTotalTests,
          testsPassed: jestResult.numPassedTests,
          testsFailed: jestResult.numFailedTests,
        },
      })
      
      console.log(`✅ Language switching tests completed (${duration}ms)`)
      
    } catch (error: any) {
      this.results.push({
        category: 'switching',
        name: 'Language Switching Integration Tests',
        status: 'fail',
        duration: Date.now() - Date.now(),
        error: error.message,
      })
      
      console.log(`❌ Language switching tests failed: ${error.message}`)
    }
  }

  private async runVisualRegressionTests(): Promise<void> {
    try {
      const startTime = Date.now()
      
      // Check if Playwright is available
      try {
        execSync('npx playwright --version', { encoding: 'utf-8' })
      } catch {
        console.log('⚠️  Playwright not available, skipping visual tests')
        this.results.push({
          category: 'visual',
          name: 'Visual Regression Tests',
          status: 'skip',
          duration: 0,
          output: 'Playwright not installed',
        })
        return
      }
      
      const output = execSync(
        'npx playwright test __tests__/i18n/visual-regression.test.ts --reporter=json',
        { encoding: 'utf-8', timeout: 300000 }
      )
      
      const duration = Date.now() - startTime
      const playwrightResult = JSON.parse(output)
      
      const allPassed = playwrightResult.suites?.every((suite: any) => 
        suite.specs?.every((spec: any) => 
          spec.tests?.every((test: any) => test.results?.[0]?.status === 'passed')
        )
      ) ?? false
      
      this.results.push({
        category: 'visual',
        name: 'Visual Regression Tests',
        status: allPassed ? 'pass' : 'fail',
        duration,
        output: CONFIG.verbose ? output : undefined,
        metrics: {
          testsRun: playwrightResult.stats?.total || 0,
          testsPassed: playwrightResult.stats?.passed || 0,
          testsFailed: playwrightResult.stats?.failed || 0,
        },
      })
      
      console.log(`✅ Visual regression tests completed (${duration}ms)`)
      
    } catch (error: any) {
      this.results.push({
        category: 'visual',
        name: 'Visual Regression Tests',
        status: 'fail',
        duration: Date.now() - Date.now(),
        error: error.message,
      })
      
      console.log(`❌ Visual regression tests failed: ${error.message}`)
    }
  }

  private async runPerformanceTests(): Promise<void> {
    try {
      const startTime = Date.now()
      
      const output = execSync(
        'npx jest __tests__/i18n/translation-performance.test.ts --json --verbose',
        { encoding: 'utf-8', timeout: 120000 }
      )
      
      const duration = Date.now() - startTime
      const jestResult = JSON.parse(output)
      
      this.results.push({
        category: 'performance',
        name: 'Translation Performance Tests',
        status: jestResult.success ? 'pass' : 'fail',
        duration,
        output: CONFIG.verbose ? output : undefined,
        metrics: {
          testsRun: jestResult.numTotalTests,
          testsPassed: jestResult.numPassedTests,
          testsFailed: jestResult.numFailedTests,
        },
      })
      
      console.log(`✅ Performance tests completed (${duration}ms)`)
      
    } catch (error: any) {
      this.results.push({
        category: 'performance',
        name: 'Translation Performance Tests',
        status: 'fail',
        duration: Date.now() - Date.now(),
        error: error.message,
      })
      
      console.log(`❌ Performance tests failed: ${error.message}`)
    }
  }

  private async runUsageAnalysis(): Promise<void> {
    try {
      const startTime = Date.now()
      
      const output = execSync(
        'npx tsx scripts/verify-translation-usage.ts',
        { encoding: 'utf-8', timeout: 60000 }
      )
      
      const duration = Date.now() - startTime
      
      // Parse usage report
      let usageReport: any = {}
      try {
        const reportPath = path.join(process.cwd(), 'translation-usage-report.json')
        if (fs.existsSync(reportPath)) {
          usageReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
        }
      } catch {
        // Report file might not exist or be invalid
      }
      
      const usagePercentage = usageReport.summary?.usagePercentage || 0
      const status = usagePercentage > 70 ? 'pass' : 'fail'
      
      this.results.push({
        category: 'usage',
        name: 'Translation Usage Analysis',
        status,
        duration,
        output: CONFIG.verbose ? output : undefined,
        metrics: {
          usagePercentage,
          totalKeys: usageReport.totalKeys || 0,
          usedKeys: usageReport.usedKeys || 0,
          unusedKeys: usageReport.summary?.unusedCount || 0,
          missingKeys: usageReport.summary?.missingCount || 0,
        },
      })
      
      console.log(`✅ Usage analysis completed (${duration}ms) - ${usagePercentage}% utilization`)
      
    } catch (error: any) {
      this.results.push({
        category: 'usage',
        name: 'Translation Usage Analysis',
        status: 'fail',
        duration: Date.now() - Date.now(),
        error: error.message,
      })
      
      console.log(`❌ Usage analysis failed: ${error.message}`)
    }
  }

  private async runOrphanedKeysAnalysis(): Promise<void> {
    try {
      const startTime = Date.now()
      
      const command = CONFIG.fix 
        ? 'npx tsx scripts/find-orphaned-keys.ts --fix'
        : 'npx tsx scripts/find-orphaned-keys.ts'
      
      const output = execSync(command, { encoding: 'utf-8', timeout: 60000 })
      
      const duration = Date.now() - startTime
      
      // Parse orphaned keys report
      let orphanedReport: any = {}
      try {
        const reportPath = path.join(process.cwd(), 'orphaned-keys-report.json')
        if (fs.existsSync(reportPath)) {
          orphanedReport = JSON.parse(fs.readFileSync(reportPath, 'utf-8'))
        }
      } catch {
        // Report file might not exist or be invalid
      }
      
      const orphanedCount = orphanedReport.summary?.totalOrphaned || 0
      const inconsistencyCount = orphanedReport.summary?.totalInconsistencies || 0
      const status = (orphanedCount === 0 && inconsistencyCount === 0) ? 'pass' : 'fail'
      
      this.results.push({
        category: 'orphaned',
        name: 'Orphaned Keys Analysis',
        status,
        duration,
        output: CONFIG.verbose ? output : undefined,
        metrics: {
          orphanedKeys: orphanedCount,
          inconsistencies: inconsistencyCount,
          affectedLanguages: orphanedReport.summary?.affectedLanguages?.length || 0,
        },
      })
      
      const actionText = CONFIG.fix ? 'fixed' : 'analyzed'
      console.log(`✅ Orphaned keys ${actionText} (${duration}ms) - ${orphanedCount} orphaned, ${inconsistencyCount} inconsistencies`)
      
    } catch (error: any) {
      this.results.push({
        category: 'orphaned',
        name: 'Orphaned Keys Analysis',
        status: 'fail',
        duration: Date.now() - Date.now(),
        error: error.message,
      })
      
      console.log(`❌ Orphaned keys analysis failed: ${error.message}`)
    }
  }

  private generateReport(): ComprehensiveReport {
    const totalDuration = Date.now() - this.startTime
    const passed = this.results.filter(r => r.status === 'pass').length
    const failed = this.results.filter(r => r.status === 'fail').length
    const skipped = this.results.filter(r => r.status === 'skip').length
    const total = this.results.length
    
    // Group results by category
    const categories: Record<TestCategory, any> = {} as any
    
    for (const category of CONFIG.categories) {
      const categoryResults = this.results.filter(r => r.category === category)
      const categoryPassed = categoryResults.filter(r => r.status === 'pass').length
      const categoryFailed = categoryResults.filter(r => r.status === 'fail').length
      const categoryDuration = categoryResults.reduce((sum, r) => sum + r.duration, 0)
      
      let status: 'pass' | 'fail' | 'partial'
      if (categoryResults.length === 0) {
        status = 'fail'
      } else if (categoryFailed === 0) {
        status = 'pass'
      } else if (categoryPassed > 0) {
        status = 'partial'
      } else {
        status = 'fail'
      }
      
      categories[category] = {
        tests: categoryResults,
        status,
        duration: categoryDuration,
      }
    }
    
    // Generate recommendations
    const recommendations = this.generateRecommendations()
    
    // Calculate health score (0-100)
    const healthScore = this.calculateHealthScore()
    
    return {
      summary: {
        totalTests: total,
        passed,
        failed,
        skipped,
        duration: totalDuration,
        successRate: total > 0 ? (passed / total) * 100 : 0,
      },
      categories,
      recommendations,
      healthScore,
      generatedAt: new Date().toISOString(),
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = []
    
    // Check each category for specific recommendations
    const failedResults = this.results.filter(r => r.status === 'fail')
    
    if (failedResults.length === 0) {
      recommendations.push('🎉 All i18n tests passing! Excellent internationalization health.')
    } else {
      failedResults.forEach(result => {
        switch (result.category) {
          case 'keys':
            recommendations.push('🔑 Fix missing or inconsistent translation keys')
            break
          case 'switching':
            recommendations.push('🔄 Review language switching functionality')
            break
          case 'visual':
            recommendations.push('👀 Check visual layouts for different languages')
            break
          case 'performance':
            recommendations.push('⚡ Optimize translation loading performance')
            break
          case 'usage':
            recommendations.push('📊 Remove unused translation keys or add missing ones')
            break
          case 'orphaned':
            recommendations.push('🔍 Fix orphaned keys with --fix flag')
            break
        }
      })
    }
    
    // Performance-specific recommendations
    const performanceResult = this.results.find(r => r.category === 'performance')
    if (performanceResult?.metrics) {
      if (performanceResult.status === 'fail') {
        recommendations.push('🚀 Consider implementing translation caching')
        recommendations.push('📦 Review bundle sizes for translation files')
      }
    }
    
    // Usage-specific recommendations
    const usageResult = this.results.find(r => r.category === 'usage')
    if (usageResult?.metrics) {
      const usagePercentage = usageResult.metrics.usagePercentage || 0
      if (usagePercentage < 50) {
        recommendations.push('🧹 Clean up unused translation keys to reduce bundle size')
      }
      if (usageResult.metrics.missingKeys > 0) {
        recommendations.push('➕ Add missing translation keys referenced in code')
      }
    }
    
    return recommendations
  }

  private calculateHealthScore(): number {
    const weights = {
      keys: 25,        // Critical for functionality
      switching: 20,   // Important for UX
      usage: 20,       // Important for maintenance
      orphaned: 15,    // Important for consistency
      performance: 10, // Nice to have
      visual: 10,      // Nice to have
    }
    
    let score = 0
    let totalWeight = 0
    
    for (const [category, weight] of Object.entries(weights)) {
      const result = this.results.find(r => r.category === category)
      if (result) {
        totalWeight += weight
        if (result.status === 'pass') {
          score += weight
        } else if (result.status === 'fail') {
          score += 0
        } else {
          score += weight * 0.5 // Skip counts as half
        }
      }
    }
    
    return totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0
  }

  private saveReport(report: ComprehensiveReport): void {
    fs.writeFileSync(CONFIG.reportFile, JSON.stringify(report, null, 2))
    console.log(`\n📄 Comprehensive report saved to: ${CONFIG.reportFile}`)
  }

  private displayResults(report: ComprehensiveReport): void {
    console.log('\n🏆 i18n Testing Protocol Results')
    console.log('='.repeat(50))
    
    console.log(`\n📊 Summary:`)
    console.log(`   Total Tests: ${report.summary.totalTests}`)
    console.log(`   Passed: ${report.summary.passed} ✅`)
    console.log(`   Failed: ${report.summary.failed} ❌`)
    console.log(`   Skipped: ${report.summary.skipped} ⏭️`)
    console.log(`   Success Rate: ${report.summary.successRate.toFixed(1)}%`)
    console.log(`   Duration: ${(report.summary.duration / 1000).toFixed(1)}s`)
    console.log(`   Health Score: ${report.healthScore}/100`)
    
    console.log('\n📂 Category Breakdown:')
    for (const [category, data] of Object.entries(report.categories)) {
      const statusIcon = data.status === 'pass' ? '✅' : data.status === 'fail' ? '❌' : '⚠️'
      console.log(`   ${statusIcon} ${category.toUpperCase()}: ${data.tests.length} tests, ${(data.duration / 1000).toFixed(1)}s`)
    }
    
    if (report.recommendations.length > 0) {
      console.log('\n🎯 Recommendations:')
      report.recommendations.forEach(rec => {
        console.log(`   ${rec}`)
      })
    }
    
    // Show health status
    console.log('\n🏥 Health Status:')
    if (report.healthScore >= 90) {
      console.log('   🟢 EXCELLENT - i18n implementation is in excellent condition')
    } else if (report.healthScore >= 70) {
      console.log('   🟡 GOOD - Minor issues detected, consider addressing recommendations')
    } else if (report.healthScore >= 50) {
      console.log('   🟠 NEEDS ATTENTION - Several issues detected, review failed tests')
    } else {
      console.log('   🔴 CRITICAL - Major i18n issues detected, immediate attention required')
    }
    
    // Exit code based on critical failures
    const criticalFailures = report.categories.keys?.status === 'fail' || 
                           report.categories.switching?.status === 'fail'
    
    if (criticalFailures) {
      console.log('\n🚨 Critical i18n failures detected!')
      process.exit(1)
    } else if (report.summary.failed > 0) {
      console.log('\n⚠️ Some tests failed - review and fix issues')
      process.exit(1)
    } else {
      console.log('\n🎉 All critical i18n tests passed!')
    }
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    const runner = new I18nTestRunner()
    await runner.run()
  } catch (error) {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { I18nTestRunner, CONFIG }