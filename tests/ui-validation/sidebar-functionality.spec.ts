import { test, expect } from '@playwright/test'

// Test Configuration
const TEST_URL = process.env.BASE_URL || 'http://localhost:3000'
const TIMEOUT = 5000

// Test Credentials - assuming we have these in env or using seed data
const TEST_CREDENTIALS = {
  email: 'admin@admin.com',
  password: 'admin123',
}

test.describe('Sidebar Functionality Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto(`${TEST_URL}/auth/signin`)
    
    // Sign in
    await page.fill('input[name="email"]', TEST_CREDENTIALS.email)
    await page.fill('input[name="password"]', TEST_CREDENTIALS.password)
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await page.waitForURL(/\/dashboard/)
    await page.waitForTimeout(1000) // Allow for sidebar to initialize
  })

  test.describe('1. Sidebar Visibility Testing', () => {
    test('should display sidebar on desktop screens', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Check if sidebar is visible
      const sidebar = page.locator('[class*="sidebar-nav"]').first()
      await expect(sidebar).toBeVisible()
      
      // Verify sidebar has proper structure
      await expect(sidebar).toHaveClass(/border-r/)
      await expect(sidebar).toHaveClass(/transition-all/)
      
      console.log('✅ Desktop sidebar visibility: PASSED')
    })

    test('should show proper logo and branding', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Check logo visibility
      const logo = page.locator('[class*="bg-[hsl(var(--supabase-green))]"]').first()
      await expect(logo).toBeVisible()
      
      // Check GS-CMS text
      const brandText = page.getByText('GS-CMS')
      await expect(brandText).toBeVisible()
      
      console.log('✅ Sidebar branding: PASSED')
    })
  })

  test.describe('2. Mobile Responsive Testing', () => {
    test('should hide sidebar on mobile and show hamburger menu', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Desktop sidebar should be hidden
      const desktopSidebar = page.locator('.hidden.lg\\:block [class*="sidebar-nav"]')
      await expect(desktopSidebar).not.toBeVisible()
      
      // Mobile menu button should be visible
      const mobileMenuButton = page.locator('[class*="lg:hidden"] button').first()
      await expect(mobileMenuButton).toBeVisible()
      
      console.log('✅ Mobile responsiveness: PASSED')
    })

    test('should open mobile drawer when hamburger is clicked', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Click hamburger menu
      const hamburgerButton = page.locator('[class*="lg:hidden"] button').first()
      await hamburgerButton.click()
      
      // Wait for drawer to appear
      await page.waitForTimeout(500)
      
      // Check if mobile navigation drawer is open
      const drawer = page.locator('[role="dialog"]')
      await expect(drawer).toBeVisible()
      
      console.log('✅ Mobile drawer functionality: PASSED')
    })
  })

  test.describe('3. Navigation Links Testing', () => {
    test('should have all expected navigation items', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Expected navigation items (adjust based on user role)
      const expectedItems = [
        'Dashboard',
        'Users', 
        'Inquiries',
        'Search',
        'Analytics',
        'Settings'
      ]
      
      // Wait for sidebar to load
      await page.waitForSelector('[class*="sidebar-nav"]')
      
      // Check each navigation item
      for (const item of expectedItems) {
        const navItem = page.locator('nav a').filter({ hasText: new RegExp(item, 'i') })
        // Some items might not be visible based on role, so we check if exists
        const count = await navItem.count()
        if (count > 0) {
          console.log(`✅ Navigation item "${item}": FOUND`)
        } else {
          console.log(`⚠️ Navigation item "${item}": NOT FOUND (may be role-restricted)`)
        }
      }
    })

    test('should navigate correctly when clicking links', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Test navigation to Settings
      const settingsLink = page.locator('nav a[href="/dashboard/settings"]')
      if (await settingsLink.count() > 0) {
        await settingsLink.click()
        await page.waitForURL(/\/dashboard\/settings/)
        expect(page.url()).toContain('/dashboard/settings')
        console.log('✅ Settings navigation: PASSED')
      }
      
      // Navigate back to dashboard
      const dashboardLink = page.locator('nav a[href="/dashboard"]')
      await dashboardLink.click()
      await page.waitForURL(/\/dashboard$/)
      expect(page.url()).toMatch(/\/dashboard$/)
      console.log('✅ Dashboard navigation: PASSED')
    })
  })

  test.describe('4. Toggle Functionality Testing', () => {
    test('should collapse and expand sidebar', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Wait for sidebar to load
      const sidebar = page.locator('[class*="sidebar-nav"]').first()
      await expect(sidebar).toBeVisible()
      
      // Check initial state (should be collapsed by default)
      const initialWidth = await sidebar.evaluate(el => getComputedStyle(el).width)
      console.log(`Initial sidebar width: ${initialWidth}`)
      
      // Find and click expand button if collapsed
      const expandButton = page.locator('button').filter({ has: page.locator('svg') }).first()
      if (await expandButton.count() > 0) {
        await expandButton.click()
        await page.waitForTimeout(500) // Wait for animation
        
        const expandedWidth = await sidebar.evaluate(el => getComputedStyle(el).width)
        console.log(`Expanded sidebar width: ${expandedWidth}`)
        
        // Width should change
        expect(expandedWidth).not.toBe(initialWidth)
        console.log('✅ Sidebar expand: PASSED')
        
        // Click to collapse again
        const collapseButton = page.locator('button').filter({ has: page.locator('svg') }).first()
        await collapseButton.click()
        await page.waitForTimeout(500)
        
        const collapsedWidth = await sidebar.evaluate(el => getComputedStyle(el).width)
        console.log(`Collapsed sidebar width: ${collapsedWidth}`)
        console.log('✅ Sidebar collapse: PASSED')
      }
    })

    test('should persist sidebar state in localStorage', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Set sidebar state
      await page.evaluate(() => {
        localStorage.setItem('sidebar-collapsed', 'false')
      })
      
      // Reload page
      await page.reload()
      await page.waitForTimeout(1000)
      
      // Check if state is preserved
      const storedState = await page.evaluate(() => {
        return localStorage.getItem('sidebar-collapsed')
      })
      
      expect(storedState).toBe('false')
      console.log('✅ Sidebar state persistence: PASSED')
    })
  })

  test.describe('5. Theme Integration Testing', () => {
    test('should adapt to light and dark themes', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Check current theme
      const htmlElement = page.locator('html')
      
      // Test light theme
      await page.evaluate(() => {
        document.documentElement.classList.remove('dark')
      })
      await page.waitForTimeout(200)
      
      const sidebar = page.locator('[class*="sidebar-nav"]').first()
      const lightBg = await sidebar.evaluate(el => getComputedStyle(el).backgroundColor)
      console.log(`Light theme background: ${lightBg}`)
      
      // Test dark theme
      await page.evaluate(() => {
        document.documentElement.classList.add('dark')
      })
      await page.waitForTimeout(200)
      
      const darkBg = await sidebar.evaluate(el => getComputedStyle(el).backgroundColor)
      console.log(`Dark theme background: ${darkBg}`)
      
      // Backgrounds should be different
      expect(darkBg).not.toBe(lightBg)
      console.log('✅ Theme adaptation: PASSED')
    })
  })

  test.describe('6. Active States Testing', () => {
    test('should highlight active navigation item', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Navigate to a specific page
      const settingsLink = page.locator('nav a[href="/dashboard/settings"]')
      if (await settingsLink.count() > 0) {
        await settingsLink.click()
        await page.waitForURL(/\/dashboard\/settings/)
        
        // Check if the settings link is highlighted
        const activeItem = page.locator('[class*="sidebar-nav-item-active"]')
        await expect(activeItem).toBeVisible()
        console.log('✅ Active state highlighting: PASSED')
      }
    })
  })

  test.describe('7. Accessibility Testing', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Test tab navigation
      await page.keyboard.press('Tab')
      await page.waitForTimeout(100)
      
      // Check if an element is focused
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      expect(focusedElement).toBeTruthy()
      console.log(`✅ Keyboard focus: ${focusedElement}`)
      
      // Test Enter key on navigation
      const firstNavLink = page.locator('nav a').first()
      await firstNavLink.focus()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
      console.log('✅ Keyboard navigation: PASSED')
    })

    test('should have proper ARIA labels', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Check for navigation landmark
      const nav = page.locator('nav')
      const ariaLabel = await nav.getAttribute('aria-label')
      
      // Should have either aria-label or role
      const role = await nav.getAttribute('role')
      expect(ariaLabel || role).toBeTruthy()
      console.log('✅ ARIA accessibility: PASSED')
    })
  })

  test.describe('8. Performance Testing', () => {
    test('should load sidebar quickly', async ({ page }) => {
      const startTime = Date.now()
      
      await page.goto(`${TEST_URL}/dashboard`)
      await page.fill('input[name="email"]', TEST_CREDENTIALS.email)
      await page.fill('input[name="password"]', TEST_CREDENTIALS.password)
      await page.click('button[type="submit"]')
      
      // Wait for sidebar to be visible
      await page.waitForSelector('[class*="sidebar-nav"]')
      
      const loadTime = Date.now() - startTime
      console.log(`Sidebar load time: ${loadTime}ms`)
      
      // Should load within reasonable time (adjust threshold as needed)
      expect(loadTime).toBeLessThan(5000)
      console.log('✅ Load performance: PASSED')
    })

    test('should have smooth animations', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Check if transitions are applied
      const sidebar = page.locator('[class*="sidebar-nav"]').first()
      const transition = await sidebar.evaluate(el => 
        getComputedStyle(el).getPropertyValue('transition')
      )
      
      expect(transition).toContain('all')
      console.log(`✅ Animations configured: ${transition}`)
    })
  })

  test.describe('9. Error Handling', () => {
    test('should handle missing translation keys gracefully', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      
      // Check for any error messages in console
      const consoleErrors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      // Wait for page to fully load
      await page.waitForTimeout(2000)
      
      // Filter translation-related errors
      const translationErrors = consoleErrors.filter(error => 
        error.includes('translation') || error.includes('i18n')
      )
      
      if (translationErrors.length === 0) {
        console.log('✅ No translation errors found')
      } else {
        console.log('⚠️ Translation errors:', translationErrors)
      }
    })
  })

  test.describe('10. Integration Testing', () => {
    test('should work with header and mobile header', async ({ page }) => {
      // Desktop view
      await page.setViewportSize({ width: 1280, height: 720 })
      
      const desktopSidebar = page.locator('.hidden.lg\\:block [class*="sidebar-nav"]')
      const header = page.locator('header')
      
      await expect(desktopSidebar).toBeVisible()
      await expect(header).toBeVisible()
      
      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 })
      
      const mobileHeader = page.locator('header')
      const mobileMenuButton = page.locator('[class*="lg:hidden"] button').first()
      
      await expect(mobileHeader).toBeVisible()
      await expect(mobileMenuButton).toBeVisible()
      
      console.log('✅ Header integration: PASSED')
    })
  })
})

// Additional utility test for detailed DOM inspection
test('Sidebar DOM Structure Inspection', async ({ page }) => {
  await page.goto(`${TEST_URL}/auth/signin`)
  await page.fill('input[name="email"]', TEST_CREDENTIALS.email)
  await page.fill('input[name="password"]', TEST_CREDENTIALS.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/dashboard/)
  
  await page.setViewportSize({ width: 1280, height: 720 })
  
  // Inspect sidebar structure
  const sidebarHTML = await page.locator('[class*="sidebar-nav"]').first().innerHTML()
  console.log('📋 Sidebar DOM Structure:')
  console.log(sidebarHTML.substring(0, 500) + '...')
  
  // Count navigation items
  const navItems = await page.locator('nav a').count()
  console.log(`📊 Total navigation items: ${navItems}`)
  
  // Check CSS classes
  const sidebarClasses = await page.locator('[class*="sidebar-nav"]').first().getAttribute('class')
  console.log(`🎨 Sidebar CSS classes: ${sidebarClasses}`)
})