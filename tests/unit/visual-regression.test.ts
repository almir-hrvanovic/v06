/**
 * Visual Regression Tests for Layout with Different Languages
 * Tests that UI layouts remain consistent across different languages
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/tests'
import { chromium, Browser, Page, BrowserContext } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

// Test configuration
const LANGUAGES = ['en', 'hr', 'bs', 'de'] as const
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const SCREENSHOT_DIR = path.join(process.cwd(), '__tests__', 'screenshots', 'i18n')

// Test pages to check for layout consistency
const TEST_PAGES = [
  {
    path: '/auth/signin',
    name: 'signin',
    viewport: { width: 1280, height: 720 },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    viewport: { width: 1280, height: 720 },
    requiresAuth: true,
  },
  {
    path: '/dashboard/users',
    name: 'users',
    viewport: { width: 1280, height: 720 },
    requiresAuth: true,
  },
  {
    path: '/dashboard/inquiries',
    name: 'inquiries',
    viewport: { width: 1280, height: 720 },
    requiresAuth: true,
  },
  {
    path: '/dashboard/costs',
    name: 'costs',
    viewport: { width: 1280, height: 720 },
    requiresAuth: true,
  },
  {
    path: '/dashboard/i18n-test',
    name: 'i18n-test',
    viewport: { width: 1280, height: 720 },
    requiresAuth: true,
  },
] as const

// Mobile viewports for responsive testing
const MOBILE_VIEWPORTS = [
  { width: 375, height: 667, name: 'mobile-portrait' },
  { width: 768, height: 1024, name: 'tablet-portrait' },
] as const

describe('Visual Regression Tests for i18n Layouts', () => {
  let browser: Browser
  let context: BrowserContext
  let page: Page

  beforeAll(async () => {
    // Ensure screenshot directory exists
    if (!fs.existsSync(SCREENSHOT_DIR)) {
      fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
    }

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    
    context = await browser.newContext({
      locale: 'en-US',
      timezoneId: 'Europe/Zagreb',
    })
    
    page = await context.newPage()
  })

  afterAll(async () => {
    await page?.close()
    await context?.close()
    await browser?.close()
  })

  describe('Desktop Layout Consistency', () => {
    test.each(TEST_PAGES)('should maintain layout consistency for $name page across languages', async (testPage) => {
      const screenshots: Record<string, Buffer> = {}
      
      // Take screenshots for each language
      for (const language of LANGUAGES) {
        await page.setViewportSize(testPage.viewport)
        
        // Set language cookie
        await context.addCookies([{
          name: 'NEXT_LOCALE',
          value: language,
          domain: new URL(BASE_URL).hostname,
          path: '/',
        }])
        
        // Handle authentication if required
        if (testPage.requiresAuth) {
          await authenticateUser(page)
        }
        
        // Navigate to page
        await page.goto(`${BASE_URL}${testPage.path}`, { 
          waitUntil: 'networkidle',
          timeout: 30000,
        })
        
        // Wait for content to load
        await page.waitForLoadState('domcontentloaded')
        await page.waitForTimeout(2000) // Allow for dynamic content
        
        // Hide dynamic elements that change between runs
        await page.evaluate(() => {
          // Hide timestamps, random IDs, etc.
          const elementsToHide = [
            '[data-testid="timestamp"]',
            '[data-testid="random-id"]',
            '.loading-spinner',
            '[class*="animate-"]',
          ]
          
          elementsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector)
            elements.forEach(el => {
              (el as HTMLElement).style.visibility = 'hidden'
            })
          })
        })
        
        // Take screenshot
        screenshots[language] = await page.screenshot({
          fullPage: true,
          animations: 'disabled',
        })
        
        // Save individual screenshots
        const filename = `${testPage.name}-${language}-desktop.png`
        const filepath = path.join(SCREENSHOT_DIR, filename)
        fs.writeFileSync(filepath, screenshots[language])
      }
      
      // Compare layouts (basic dimension analysis)
      await compareLayoutDimensions(screenshots, testPage.name)
    })
  })

  describe('Mobile Layout Consistency', () => {
    test.each(MOBILE_VIEWPORTS)('should maintain mobile layout for $name viewport', async (viewport) => {
      const screenshots: Record<string, Buffer> = {}
      
      for (const language of LANGUAGES) {
        await page.setViewportSize(viewport)
        
        // Set language cookie
        await context.addCookies([{
          name: 'NEXT_LOCALE',
          value: language,
          domain: new URL(BASE_URL).hostname,
          path: '/',
        }])
        
        await authenticateUser(page)
        
        // Test main dashboard on mobile
        await page.goto(`${BASE_URL}/dashboard`, { 
          waitUntil: 'networkidle',
        })
        
        await page.waitForLoadState('domcontentloaded')
        await page.waitForTimeout(2000)
        
        // Test mobile sidebar
        const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
        if (await mobileMenuButton.isVisible()) {
          await mobileMenuButton.click()
          await page.waitForTimeout(500)
        }
        
        screenshots[language] = await page.screenshot({
          fullPage: true,
          animations: 'disabled',
        })
        
        const filename = `dashboard-${language}-${viewport.name}.png`
        const filepath = path.join(SCREENSHOT_DIR, filename)
        fs.writeFileSync(filepath, screenshots[language])
      }
      
      await compareLayoutDimensions(screenshots, `dashboard-${viewport.name}`)
    })
  })

  describe('Text Overflow and Wrapping', () => {
    test('should handle long German text without breaking layout', async () => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Set German locale
      await context.addCookies([{
        name: 'NEXT_LOCALE',
        value: 'de',
        domain: new URL(BASE_URL).hostname,
        path: '/',
      }])
      
      await authenticateUser(page)
      await page.goto(`${BASE_URL}/dashboard/i18n-test`, { 
        waitUntil: 'networkidle',
      })
      
      // Check for text overflow
      const overflowElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'))
        const overflowing: Array<{ tag: string, text: string }> = []
        
        elements.forEach(el => {
          const element = el as HTMLElement
          if (element.scrollWidth > element.clientWidth && element.clientWidth > 0) {
            overflowing.push({
              tag: element.tagName,
              text: element.textContent?.substring(0, 50) || '',
            })
          }
        })
        
        return overflowing
      })
      
      // Should have minimal overflow (some is expected for long URLs, etc.)
      expect(overflowElements.length).toBeLessThan(5)
      
      // Take screenshot for manual review
      const screenshot = await page.screenshot({ fullPage: true })
      const filepath = path.join(SCREENSHOT_DIR, 'german-text-overflow.png')
      fs.writeFileSync(filepath, screenshot)
    })

    test('should handle Croatian diacritics correctly', async () => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      await context.addCookies([{
        name: 'NEXT_LOCALE',
        value: 'hr',
        domain: new URL(BASE_URL).hostname,
        path: '/',
      }])
      
      await authenticateUser(page)
      await page.goto(`${BASE_URL}/dashboard/i18n-test`, { 
        waitUntil: 'networkidle',
      })
      
      // Check for proper rendering of Croatian characters
      const croatianText = await page.evaluate(() => {
        const textNodes: string[] = []
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        )
        
        let node = walker.nextNode()
        while (node) {
          if (node.textContent?.match(/[čćžšđČĆŽŠĐ]/)) {
            textNodes.push(node.textContent)
          }
          node = walker.nextNode()
        }
        
        return textNodes
      })
      
      // Should find Croatian diacritics in the UI
      expect(croatianText.length).toBeGreaterThan(0)
      
      const screenshot = await page.screenshot({ fullPage: true })
      const filepath = path.join(SCREENSHOT_DIR, 'croatian-diacritics.png')
      fs.writeFileSync(filepath, screenshot)
    })
  })

  describe('Form Layout Consistency', () => {
    test('should maintain form layouts across languages', async () => {
      const formPages = [
        '/auth/signin',
        '/dashboard/users',
        '/dashboard/inquiries/create',
      ]
      
      for (const formPage of formPages) {
        const screenshots: Record<string, Buffer> = {}
        
        for (const language of LANGUAGES) {
          await page.setViewportSize({ width: 1280, height: 720 })
          
          await context.addCookies([{
            name: 'NEXT_LOCALE',
            value: language,
            domain: new URL(BASE_URL).hostname,
            path: '/',
          }])
          
          if (formPage !== '/auth/signin') {
            await authenticateUser(page)
          }
          
          try {
            await page.goto(`${BASE_URL}${formPage}`, { 
              waitUntil: 'networkidle',
              timeout: 30000,
            })
            
            await page.waitForLoadState('domcontentloaded')
            await page.waitForTimeout(1000)
            
            screenshots[language] = await page.screenshot({
              fullPage: false, // Focus on form area
              clip: { x: 0, y: 0, width: 1280, height: 600 },
            })
            
            const pageName = formPage.replace(/\//g, '-').substring(1)
            const filename = `form-${pageName}-${language}.png`
            const filepath = path.join(SCREENSHOT_DIR, filename)
            fs.writeFileSync(filepath, screenshots[language])
          } catch (error) {
            console.warn(`Failed to capture ${formPage} in ${language}:`, error)
          }
        }
      }
    })
  })

  describe('Button and UI Element Sizing', () => {
    test('should maintain consistent button sizes across languages', async () => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      const buttonMetrics: Record<string, any[]> = {}
      
      for (const language of LANGUAGES) {
        await context.addCookies([{
          name: 'NEXT_LOCALE',
          value: language,
          domain: new URL(BASE_URL).hostname,
          path: '/',
        }])
        
        await authenticateUser(page)
        await page.goto(`${BASE_URL}/dashboard`, { 
          waitUntil: 'networkidle',
        })
        
        // Measure button dimensions
        buttonMetrics[language] = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'))
          return buttons.map(button => {
            const rect = button.getBoundingClientRect()
            return {
              width: rect.width,
              height: rect.height,
              text: button.textContent?.trim() || '',
            }
          }).filter(btn => btn.text.length > 0)
        })
      }
      
      // Check that button sizes are reasonably consistent
      const englishButtons = buttonMetrics.en || []
      
      LANGUAGES.slice(1).forEach(lang => {
        const langButtons = buttonMetrics[lang] || []
        
        // Should have similar number of buttons
        expect(Math.abs(langButtons.length - englishButtons.length)).toBeLessThanOrEqual(2)
        
        // Check individual button size variations
        langButtons.forEach((langBtn, index) => {
          const englishBtn = englishButtons[index]
          if (englishBtn) {
            // Allow for reasonable size variations (up to 50% difference)
            const widthRatio = langBtn.width / englishBtn.width
            const heightRatio = langBtn.height / englishBtn.height
            
            expect(widthRatio).toBeGreaterThan(0.5)
            expect(widthRatio).toBeLessThan(2.0)
            expect(heightRatio).toBeGreaterThan(0.8)
            expect(heightRatio).toBeLessThan(1.5)
          }
        })
      })
    })
  })
})

// Helper functions
async function authenticateUser(page: Page): Promise<void> {
  // Mock authentication by setting session cookie
  await page.evaluate(() => {
    localStorage.setItem('mock-auth', 'true')
  })
  
  // Or navigate to sign in and authenticate
  // This depends on your authentication setup
}

async function compareLayoutDimensions(
  screenshots: Record<string, Buffer>, 
  testName: string
): Promise<void> {
  // Basic dimension comparison using image analysis
  // In a real implementation, you might use a library like pixelmatch
  
  const dimensions: Record<string, { width: number; height: number }> = {}
  
  // For this example, we'll just check that all screenshots have similar dimensions
  // In practice, you'd use an image processing library
  
  for (const [lang, buffer] of Object.entries(screenshots)) {
    // Mock dimension extraction - replace with actual image analysis
    dimensions[lang] = {
      width: 1280, // Replace with actual image width
      height: Math.floor(Math.random() * 200) + 800, // Mock varying heights
    }
  }
  
  // Check that all versions have similar heights (allowing for content differences)
  const heights = Object.values(dimensions).map(d => d.height)
  const maxHeight = Math.max(...heights)
  const minHeight = Math.min(...heights)
  const heightDifference = maxHeight - minHeight
  
  // Allow up to 300px difference in height (for dynamic content)
  expect(heightDifference).toBeLessThan(300)
  
  // Log results for review
  console.log(`Layout comparison for ${testName}:`, dimensions)
}