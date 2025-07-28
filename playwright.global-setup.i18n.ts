import { FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

async function globalSetup(config: FullConfig) {
  console.log('🎭 Setting up i18n visual regression tests...')
  
  // Ensure screenshots directory exists
  const screenshotDir = path.join(process.cwd(), '__tests__', 'screenshots', 'i18n')
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
    console.log(`📁 Created screenshots directory: ${screenshotDir}`)
  }
  
  // Ensure translation files exist
  const translationDir = path.join(process.cwd(), 'messages')
  const requiredLanguages = ['en', 'hr', 'bs', 'de']
  
  for (const lang of requiredLanguages) {
    const filePath = path.join(translationDir, `${lang}.json`)
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  Translation file missing: ${filePath}`)
    }
  }
  
  // Create baseline screenshots directory if it doesn't exist
  const baselineDir = path.join(screenshotDir, 'baseline')
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true })
    console.log(`📁 Created baseline directory: ${baselineDir}`)
  }
  
  console.log('✅ i18n visual test setup complete')
}

export default globalSetup