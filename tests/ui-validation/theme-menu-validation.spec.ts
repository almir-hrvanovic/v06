/**
 * UX Validation Tests for Enhanced Menu and Theme System
 * Tests theme toggle in user menu, language switching, sidebar sync, and responsiveness
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

test.describe('Enhanced Menu and Theme System Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3002')
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Theme Toggle in User Menu', () => {
    test('should have theme toggle accessible in header', async ({ page }) => {
      // Look for theme toggle button in header
      const themeToggle = page.locator('[data-testid="theme-toggle"], button[aria-label*="theme" i], button:has(.lucide-sun), button:has(.lucide-moon)')
      
      await expect(themeToggle.first()).toBeVisible()
      
      // Click theme toggle and verify dropdown appears
      await themeToggle.first().click()
      
      // Check for theme options
      const lightOption = page.locator('text=Light, text=light').first()
      const darkOption = page.locator('text=Dark, text=dark').first()
      const systemOption = page.locator('text=System, text=system').first()
      
      await expect(lightOption).toBeVisible({ timeout: 2000 })
      await expect(darkOption).toBeVisible({ timeout: 2000 })
      await expect(systemOption).toBeVisible({ timeout: 2000 })
    })

    test('should switch to dark theme and update UI colors', async ({ page }) => {
      // Open theme toggle
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      await themeToggle.first().click()
      
      // Select dark theme
      await page.locator('text=Dark, text=dark').first().click()
      
      // Wait for theme change
      await page.waitForTimeout(500)
      
      // Verify dark theme is applied
      const htmlElement = page.locator('html')
      await expect(htmlElement).toHaveClass(/dark/)
      
      // Check if background colors have changed
      const body = page.locator('body')
      const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor)
      
      // Dark theme should have dark background
      expect(bgColor).toMatch(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      
      // Verify the RGB values are low (dark)
      const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number)
        expect(r + g + b).toBeLessThan(100) // Dark theme should have low RGB sum
      }
    })

    test('should switch to light theme and update UI colors', async ({ page }) => {
      // First switch to dark, then to light to test the transition
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucipe-moon)')
      await themeToggle.first().click()
      await page.locator('text=Dark, text=dark').first().click()
      await page.waitForTimeout(300)
      
      // Now switch to light
      await themeToggle.first().click()
      await page.locator('text=Light, text=light').first().click()
      await page.waitForTimeout(500)
      
      // Verify light theme is applied
      const htmlElement = page.locator('html')
      await expect(htmlElement).not.toHaveClass(/dark/)
      
      // Check if background is light
      const body = page.locator('body')
      const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor)
      
      // Light theme should have light background
      const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch.map(Number)
        expect(r + g + b).toBeGreaterThan(600) // Light theme should have high RGB sum
      }
    })

    test('should maintain dropdown state during theme changes', async ({ page }) => {
      // Open theme dropdown
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      await themeToggle.first().click()
      
      // Verify dropdown is open
      const dropdown = page.locator('[role="menu"], .dropdown-menu, [data-radix-popper-content-wrapper]')
      await expect(dropdown.first()).toBeVisible()
      
      // Switch theme while dropdown is open
      await page.locator('text=Dark, text=dark').first().click()
      
      // Verify theme changed but test the interaction flow
      await page.waitForTimeout(300)
      const htmlElement = page.locator('html')
      await expect(htmlElement).toHaveClass(/dark/)
    })
  })

  test.describe('Language Switching Validation', () => {
    test('should have language switcher in header', async ({ page }) => {
      // Look for language button
      const languageBtn = page.locator('button:has(.lucide-languages), button:has(text("🇭🇷")), button:has(text("🇺🇸")), button:has(text("🇩🇪")), button:has(text("🇧🇦"))')
      
      await expect(languageBtn.first()).toBeVisible()
      
      // Click and verify dropdown
      await languageBtn.first().click()
      
      // Check for language options
      const croatian = page.locator('text=Hrvatski, text=Croatian, text=🇭🇷')
      const english = page.locator('text=English, text=🇺🇸')
      const german = page.locator('text=Deutsch, text=German, text=🇩🇪')
      const bosnian = page.locator('text=Bosanski, text=Bosnian, text=🇧🇦')
      
      await expect(croatian.first()).toBeVisible({ timeout: 2000 })
      await expect(english.first()).toBeVisible({ timeout: 2000 })
    })

    test('should switch language without visual flashing', async ({ page }) => {
      // Monitor for flash by checking rapid style changes
      let styleChanges = 0
      
      page.on('response', response => {
        if (response.url().includes('css') || response.url().includes('locale')) {
          styleChanges++
        }
      })
      
      // Open language menu
      const languageBtn = page.locator('button:has(.lucide-languages), button:has(text("🇭🇷")), button:has(text("🇺🇸"))')
      await languageBtn.first().click()
      
      // Switch to English
      const englishOption = page.locator('text=English, text=🇺🇸').first()
      
      if (await englishOption.isVisible()) {
        await englishOption.click()
        
        // Wait for page reload if it happens
        try {
          await page.waitForLoadState('networkidle', { timeout: 5000 })
        } catch (e) {
          // Page might not reload, that's fine
        }
        
        // Check that interface elements are still visible (no major flashing)
        await expect(page.locator('header')).toBeVisible()
        await expect(page.locator('nav, .sidebar')).toBeVisible()
      }
    })

    test('should preserve theme during language switch', async ({ page }) => {
      // Set dark theme first
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      await themeToggle.first().click()
      await page.locator('text=Dark, text=dark').first().click()
      await page.waitForTimeout(500)
      
      // Verify dark theme
      let htmlElement = page.locator('html')
      await expect(htmlElement).toHaveClass(/dark/)
      
      // Switch language
      const languageBtn = page.locator('button:has(.lucide-languages), button:has(text("🇭🇷"))')
      if (await languageBtn.first().isVisible()) {
        await languageBtn.first().click()
        const englishOption = page.locator('text=English, text=🇺🇸').first()
        
        if (await englishOption.isVisible()) {
          await englishOption.click()
          
          // Wait for potential reload
          try {
            await page.waitForLoadState('networkidle', { timeout: 5000 })
          } catch (e) {
            // Continue
          }
          
          // Verify theme is still dark after language change
          htmlElement = page.locator('html')
          await expect(htmlElement).toHaveClass(/dark/)
        }
      }
    })
  })

  test.describe('Sidebar Color Synchronization', () => {
    test('should sync sidebar colors with light theme', async ({ page }) => {
      // Ensure light theme is active
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      await themeToggle.first().click()
      await page.locator('text=Light, text=light').first().click()
      await page.waitForTimeout(500)
      
      // Check sidebar colors
      const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first()
      
      if (await sidebar.isVisible()) {
        const sidebarBg = await sidebar.evaluate(el => getComputedStyle(el).backgroundColor)
        
        // Light theme sidebar should have light background
        const rgbMatch = sidebarBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number)
          expect(r + g + b).toBeGreaterThan(500) // Light sidebar
        }
      }
    })

    test('should sync sidebar colors with dark theme', async ({ page }) => {
      // Set dark theme
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      await themeToggle.first().click()
      await page.locator('text=Dark, text=dark').first().click()
      await page.waitForTimeout(500)
      
      // Check sidebar colors
      const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]').first()
      
      if (await sidebar.isVisible()) {
        const sidebarBg = await sidebar.evaluate(el => getComputedStyle(el).backgroundColor)
        
        // Dark theme sidebar should have dark background
        const rgbMatch = sidebarBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
        if (rgbMatch) {
          const [, r, g, b] = rgbMatch.map(Number)
          expect(r + g + b).toBeLessThan(150) // Dark sidebar
        }
      }
    })

    test('should have smooth transitions between themes', async ({ page }) => {
      // Test transition smoothness by rapidly switching themes
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      
      // Switch to dark
      await themeToggle.first().click()
      await page.locator('text=Dark, text=dark').first().click()
      await page.waitForTimeout(200)
      
      // Switch to light
      await themeToggle.first().click()
      await page.locator('text=Light, text=light').first().click()
      await page.waitForTimeout(200)
      
      // Verify no broken states
      await expect(page.locator('body')).toBeVisible()
      await expect(page.locator('header')).toBeVisible()
      
      // Check for CSS transition properties
      const body = page.locator('body')
      const transition = await body.evaluate(el => getComputedStyle(el).transition)
      expect(transition).toContain('color') // Should have color transitions
    })
  })

  test.describe('Menu Navigation and Accessibility', () => {
    test('should support keyboard navigation in user menu', async ({ page }) => {
      // Focus on user menu button
      const userMenuBtn = page.locator('button:has(.avatar), button:has(text("U")), [data-testid="user-menu"]')
      
      if (await userMenuBtn.first().isVisible()) {
        await userMenuBtn.first().focus()
        
        // Press Enter to open menu
        await page.keyboard.press('Enter')
        
        // Verify menu is open
        const menuItems = page.locator('[role="menuitem"], .dropdown-menu button, .dropdown-menu a')
        await expect(menuItems.first()).toBeVisible({ timeout: 2000 })
        
        // Use arrow keys to navigate
        await page.keyboard.press('ArrowDown')
        await page.keyboard.press('ArrowUp')
        
        // Press Escape to close
        await page.keyboard.press('Escape')
      }
    })

    test('should support keyboard navigation in theme menu', async ({ page }) => {
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      
      await themeToggle.first().focus()
      await page.keyboard.press('Enter')
      
      // Verify theme menu is open
      const themeOptions = page.locator('text=Light, text=Dark, text=System')
      await expect(themeOptions.first()).toBeVisible({ timeout: 2000 })
      
      // Navigate with keyboard
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('Enter')
      
      await page.waitForTimeout(300)
    })

    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check theme toggle accessibility
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      
      if (await themeToggle.first().isVisible()) {
        const ariaLabel = await themeToggle.first().getAttribute('aria-label')
        const srOnly = page.locator('.sr-only')
        
        // Should have either aria-label or screen reader only text
        const hasAccessibleLabel = ariaLabel !== null || await srOnly.count() > 0
        expect(hasAccessibleLabel).toBeTruthy()
      }
      
      // Check language switcher accessibility
      const languageBtn = page.locator('button:has(.lucide-languages)')
      
      if (await languageBtn.first().isVisible()) {
        const ariaLabel = await languageBtn.first().getAttribute('aria-label')
        expect(ariaLabel).toBeTruthy()
      }
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test('should adapt theme toggle for mobile screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Check if theme toggle is still accessible
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      await expect(themeToggle.first()).toBeVisible()
      
      // Test functionality on mobile
      await themeToggle.first().click()
      const darkOption = page.locator('text=Dark, text=dark')
      await expect(darkOption.first()).toBeVisible({ timeout: 2000 })
    })

    test('should show mobile-friendly language switcher', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Language switcher should be compact on mobile
      const languageBtn = page.locator('button:has(.lucide-languages), button:has(text("🇭🇷"))')
      
      if (await languageBtn.first().isVisible()) {
        const buttonSize = await languageBtn.first().boundingBox()
        expect(buttonSize?.width).toBeLessThan(100) // Should be compact
        
        // Test dropdown functionality
        await languageBtn.first().click()
        const dropdown = page.locator('[role="menu"], .dropdown-menu')
        await expect(dropdown.first()).toBeVisible({ timeout: 2000 })
      }
    })

    test('should maintain sidebar functionality on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Check if sidebar adapts or has mobile menu
      const sidebar = page.locator('.sidebar, nav, [data-testid="sidebar"]')
      const mobileMenu = page.locator('.mobile-menu, [data-testid="mobile-menu"], button:has(.lucide-menu)')
      
      // Either sidebar should be responsive or mobile menu should exist
      const hasSidebar = await sidebar.first().isVisible()
      const hasMobileMenu = await mobileMenu.first().isVisible()
      
      expect(hasSidebar || hasMobileMenu).toBeTruthy()
    })
  })

  test.describe('Performance and Visual Quality', () => {
    test('should have smooth theme transitions', async ({ page }) => {
      // Measure transition time
      const start = Date.now()
      
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      await themeToggle.first().click()
      await page.locator('text=Dark, text=dark').first().click()
      
      // Wait for transition to complete
      await page.waitForTimeout(500)
      
      const end = Date.now()
      const transitionTime = end - start
      
      // Transition should be under 1 second
      expect(transitionTime).toBeLessThan(1000)
    })

    test('should not have layout shifts during theme changes', async ({ page }) => {
      // Get initial layout
      const header = page.locator('header')
      const initialBounds = await header.boundingBox()
      
      // Change theme
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      await themeToggle.first().click()
      await page.locator('text=Dark, text=dark').first().click()
      await page.waitForTimeout(500)
      
      // Check layout after theme change
      const finalBounds = await header.boundingBox()
      
      // Layout should remain stable
      expect(finalBounds?.width).toEqual(initialBounds?.width)
      expect(finalBounds?.height).toEqual(initialBounds?.height)
    })

    test('should preserve user preferences across page loads', async ({ page, context }) => {
      // Set dark theme
      const themeToggle = page.locator('button:has(.lucide-sun), button:has(.lucide-moon)')
      await themeToggle.first().click()
      await page.locator('text=Dark, text=dark').first().click()
      await page.waitForTimeout(500)
      
      // Verify dark theme
      let htmlElement = page.locator('html')
      await expect(htmlElement).toHaveClass(/dark/)
      
      // Reload page
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Verify theme persisted
      htmlElement = page.locator('html')
      await expect(htmlElement).toHaveClass(/dark/)
    })
  })
})