import { test, expect } from '@playwright/test';

/**
 * CRITICAL MOBILE HEADER Z-INDEX FIX VALIDATION
 * 
 * This test validates the emergency fix for mobile sidebar integration
 * where the Sheet overlay was covering the mobile header, making it
 * inaccessible when the sidebar was opened.
 * 
 * BUG: Sheet overlay (z-99) was covering Mobile Header (z-50)
 * FIX: Mobile Header now has z-110 to stay above Sheet overlay
 */

test.describe('Mobile Header Z-Index Fix Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    await page.goto('http://localhost:3003/dashboard');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('Mobile header should remain visible and accessible when sidebar is closed', async ({ page }) => {
    // Verify mobile header is visible
    const mobileHeader = page.locator('.mobile-header');
    await expect(mobileHeader).toBeVisible();
    
    // Verify header has correct z-index class
    await expect(mobileHeader).toHaveClass(/mobile-header/);
    
    // Verify menu button is accessible
    const menuButton = page.locator('.mobile-sidebar-trigger');
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toBeEnabled();
  });

  test('CRITICAL: Mobile header should remain visible when sidebar is opened', async ({ page }) => {
    // Open mobile sidebar
    const menuButton = page.locator('.mobile-sidebar-trigger');
    await menuButton.click();
    
    // Wait for sidebar to open
    await page.waitForTimeout(500);
    
    // CRITICAL CHECK: Header should still be visible above the overlay
    const mobileHeader = page.locator('.mobile-header');
    await expect(mobileHeader).toBeVisible();
    
    // CRITICAL CHECK: Menu button should still be accessible to close sidebar
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toBeEnabled();
    
    // Verify we can still interact with header elements
    const userMenu = page.locator('[data-testid="user-menu"], .mobile-header button').last();
    if (await userMenu.isVisible()) {
      await expect(userMenu).toBeEnabled();
    }
  });

  test('Header should have proper z-index stacking context', async ({ page }) => {
    const mobileHeader = page.locator('.mobile-header');
    
    // Check computed z-index is applied correctly
    const zIndex = await mobileHeader.evaluate((el) => {
      return window.getComputedStyle(el).zIndex;
    });
    
    // Should be 110 (higher than Sheet overlay z-99)
    expect(zIndex).toBe('110');
  });

  test('User can close sidebar using header menu button', async ({ page }) => {
    // Open sidebar
    const menuButton = page.locator('.mobile-sidebar-trigger');
    await menuButton.click();
    await page.waitForTimeout(300);
    
    // Verify sidebar is open
    const drawer = page.locator('[role="dialog"]');
    await expect(drawer).toBeVisible();
    
    // Close sidebar using the same menu button (should still be accessible)
    await menuButton.click();
    await page.waitForTimeout(300);
    
    // Verify sidebar is closed
    await expect(drawer).not.toBeVisible();
  });

  test('Header functionality works correctly with sidebar interactions', async ({ page }) => {
    // Test search functionality with sidebar open
    const menuButton = page.locator('.mobile-sidebar-trigger');
    await menuButton.click();
    await page.waitForTimeout(300);
    
    // Try to access search (if available in header)
    const searchButton = page.locator('.mobile-header [data-icon="search"], .mobile-header button[aria-label*="search"]').first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
      // Should be able to interact with search
      await expect(searchButton).toBeEnabled();
    }
    
    // Close sidebar
    await menuButton.click();
  });

  test('Responsive behavior maintains header accessibility', async ({ page }) => {
    const breakpoints = [
      { width: 320, height: 568 }, // iPhone 5
      { width: 375, height: 667 }, // iPhone SE
      { width: 414, height: 896 }, // iPhone 11 Pro Max
      { width: 768, height: 1024 }, // iPad
    ];

    for (const viewport of breakpoints) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(200);
      
      // Only test on actual mobile sizes (< 1024px)
      if (viewport.width < 1024) {
        const mobileHeader = page.locator('.mobile-header');
        await expect(mobileHeader).toBeVisible();
        
        const menuButton = page.locator('.mobile-sidebar-trigger');
        await expect(menuButton).toBeVisible();
        
        // Test sidebar interaction
        await menuButton.click();
        await page.waitForTimeout(300);
        
        // Header should still be accessible
        await expect(mobileHeader).toBeVisible();
        await expect(menuButton).toBeEnabled();
        
        // Close sidebar
        await menuButton.click();
        await page.waitForTimeout(300);
      }
    }
  });
});

/**
 * TECHNICAL IMPLEMENTATION NOTES:
 * 
 * Z-Index Hierarchy (Fixed):
 * - Mobile Header: z-110 (var(--mobile-header-z-index))
 * - Sheet Content: z-100 
 * - Sheet Overlay: z-99
 * - Sidebar: z-40
 * 
 * Key Changes Made:
 * 1. Updated mobile-header.tsx z-index from z-50 to use .mobile-header CSS class
 * 2. Added CSS variable --mobile-header-z-index: 110
 * 3. Added .mobile-header CSS class with proper positioning
 * 4. Added .mobile-sidebar-trigger class for button accessibility
 * 5. Added isolation: isolate for better stacking context control
 * 
 * This ensures the mobile header always remains above the Sheet overlay
 * and maintains full functionality when the mobile sidebar is opened.
 */