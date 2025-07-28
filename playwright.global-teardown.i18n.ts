import { FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up i18n visual regression tests...')
  
  // Clean up temporary files if needed
  const tempDir = path.join(process.cwd(), '__tests__', 'screenshots', 'i18n', 'temp')
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true })
    console.log('🗑️  Cleaned up temporary files')
  }
  
  // Generate summary report of visual tests
  const screenshotDir = path.join(process.cwd(), '__tests__', 'screenshots', 'i18n')
  if (fs.existsSync(screenshotDir)) {
    const screenshots = fs.readdirSync(screenshotDir)
      .filter(file => file.endsWith('.png'))
    
    const summary = {
      totalScreenshots: screenshots.length,
      languages: ['en', 'hr', 'bs', 'de'],
      screenshotsPerLanguage: Math.floor(screenshots.length / 4),
      generatedAt: new Date().toISOString(),
    }
    
    const summaryPath = path.join(screenshotDir, 'visual-test-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    
    console.log(`📊 Visual test summary: ${screenshots.length} screenshots generated`)
    console.log(`📄 Summary saved to: ${summaryPath}`)
  }
  
  console.log('✅ i18n visual test cleanup complete')
}

export default globalTeardown