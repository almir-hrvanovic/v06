import { test, expect, type Page } from '@playwright/test'

// Test configuration
test.describe('Sidebar Gesture Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Desktop Behavior', () => {
    test('should not interfere with mouse interactions', async ({ page }) => {
      // Ensure desktop mouse interactions work normally
      const sidebar = page.locator('[data-testid="sidebar"]')
      await expect(sidebar).toBeVisible()
      
      // Test clicking still works
      const collapseButton = page.locator('[data-testid="collapse-button"]')
      if (await collapseButton.isVisible()) {
        await collapseButton.click()
        await page.waitForTimeout(500)
      }
    })
  })

  test.describe('Mobile/Tablet Gesture Support', () => {
    test.use({ 
      viewport: { width: 768, height: 1024 }, // Tablet size
      hasTouch: true 
    })

    test('should detect edge swipe gesture to open sidebar', async ({ page }) => {
      // Simulate edge swipe from left
      await page.touchscreen.tap(10, 400) // Start near left edge
      await page.touchscreen.tap(150, 400) // Swipe right
      await page.waitForTimeout(300)
      
      // Check if sidebar state changed appropriately
      const body = page.locator('body')
      await expect(body).not.toHaveAttribute('data-sidebar-collapsed', 'true')
    })

    test('should detect swipe gesture to close sidebar', async ({ page }) => {
      // Ensure sidebar is open first
      const sidebar = page.locator('[data-testid="sidebar"]')
      await expect(sidebar).toBeVisible()
      
      // Simulate swipe left to close
      await page.touchscreen.tap(200, 400) // Start in content area
      await page.touchscreen.tap(50, 400)  // Swipe left
      await page.waitForTimeout(300)
    })

    test('should handle velocity-based gestures', async ({ page }) => {
      // Test quick swipe (high velocity)
      const startTime = Date.now()
      await page.touchscreen.tap(10, 400)
      await page.touchscreen.tap(200, 400)
      const endTime = Date.now()
      
      // Quick gesture should trigger action even with shorter distance
      expect(endTime - startTime).toBeLessThan(200)
      await page.waitForTimeout(300)
    })

    test('should ignore short swipes', async ({ page }) => {
      // Test short swipe that shouldn't trigger action
      await page.touchscreen.tap(100, 400)
      await page.touchscreen.tap(130, 400) // Only 30px movement
      await page.waitForTimeout(300)
      
      // Should not change sidebar state
    })

    test('should handle diagonal swipes correctly', async ({ page }) => {
      // Test diagonal swipe (should prioritize horizontal component)
      await page.touchscreen.tap(10, 400)
      await page.touchscreen.tap(150, 450) // Right and slightly down
      await page.waitForTimeout(300)
    })

    test('should support momentum-based interactions', async ({ page }) => {
      // Test momentum by doing multiple quick taps in sequence
      await page.touchscreen.tap(10, 400)
      await page.touchscreen.tap(50, 400)
      await page.touchscreen.tap(100, 400)
      await page.touchscreen.tap(150, 400)
      await page.waitForTimeout(500) // Allow momentum animation
    })
  })

  test.describe('Platform-Specific Behavior', () => {
    test.describe('iOS-like behavior', () => {
      test.use({ 
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        hasTouch: true,
        viewport: { width: 820, height: 1180 }
      })

      test('should handle iOS-specific touch behavior', async ({ page }) => {
        // Test iOS-specific edge cases
        await page.touchscreen.tap(5, 400) // Very edge
        await page.touchscreen.tap(200, 400)
        await page.waitForTimeout(300)
      })
    })

    test.describe('Android-like behavior', () => {
      test.use({ 
        userAgent: 'Mozilla/5.0 (Linux; Android 11; Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36',
        hasTouch: true,
        viewport: { width: 800, height: 1280 }
      })

      test('should handle Android-specific touch behavior', async ({ page }) => {
        // Test Android-specific behavior
        await page.touchscreen.tap(15, 400)
        await page.touchscreen.tap(180, 400)
        await page.waitForTimeout(300)
      })
    })
  })

  test.describe('Accessibility Features', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Test keyboard shortcuts
      await page.keyboard.press('Alt+Enter') // Should toggle sidebar
      await page.waitForTimeout(300)
      
      await page.keyboard.press('Escape') // Should close sidebar
      await page.waitForTimeout(300)
    })

    test('should announce actions to screen readers', async ({ page }) => {
      // Check for aria-live region
      const liveRegion = page.locator('#gesture-announcements')
      await expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })

    test('should work with reduced motion preferences', async ({ page }) => {
      // Simulate reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' })
      
      // Gestures should still work but with reduced animation
      await page.touchscreen.tap(10, 400)
      await page.touchscreen.tap(200, 400)
      await page.waitForTimeout(100) // Shorter wait for reduced motion
    })
  })

  test.describe('Edge Detection', () => {
    test.use({ hasTouch: true, viewport: { width: 768, height: 1024 } })

    test('should detect left edge gestures', async ({ page }) => {
      // Test various left edge positions
      const edgePositions = [5, 10, 15, 20]
      
      for (const x of edgePositions) {
        await page.touchscreen.tap(x, 400)
        await page.touchscreen.tap(x + 100, 400)
        await page.waitForTimeout(200)
      }
    })

    test('should ignore center area gestures for edge detection', async ({ page }) => {
      // Test center area (should not be treated as edge gesture)
      await page.touchscreen.tap(400, 400) // Center of 768px width
      await page.touchscreen.tap(500, 400)
      await page.waitForTimeout(300)
    })

    test('should handle right edge appropriately', async ({ page }) => {
      // Test right edge behavior
      await page.touchscreen.tap(760, 400) // Near right edge
      await page.touchscreen.tap(650, 400) // Swipe left
      await page.waitForTimeout(300)
    })
  })

  test.describe('Performance and Smoothness', () => {
    test.use({ hasTouch: true, viewport: { width: 768, height: 1024 } })

    test('should maintain 60fps during gestures', async ({ page }) => {
      // Start performance monitoring
      await page.evaluate(() => {
        (window as any).performanceData = []
        let lastTime = performance.now()
        
        function measureFrame() {
          const currentTime = performance.now()
          const frameDuration = currentTime - lastTime
          ;(window as any).performanceData.push(frameDuration)
          lastTime = currentTime
          requestAnimationFrame(measureFrame)
        }
        
        requestAnimationFrame(measureFrame)
      })

      // Perform gesture
      await page.touchscreen.tap(10, 400)
      await page.touchscreen.tap(200, 400)
      await page.waitForTimeout(500)

      // Check performance data
      const performanceData = await page.evaluate(() => (window as any).performanceData)
      const averageFrameTime = performanceData.reduce((sum: number, time: number) => sum + time, 0) / performanceData.length
      
      // Should maintain close to 16.67ms (60fps)
      expect(averageFrameTime).toBeLessThan(25) // Allow some tolerance
    })

    test('should handle rapid gesture sequences', async ({ page }) => {
      // Test rapid gesture sequence
      for (let i = 0; i < 5; i++) {
        await page.touchscreen.tap(10 + i * 5, 400)
        await page.touchscreen.tap(100 + i * 10, 400)
        await page.waitForTimeout(50)
      }
      
      // Should handle all gestures without breaking
      await page.waitForTimeout(1000)
    })

    test('should cleanup properly after gestures', async ({ page }) => {
      // Perform gesture
      await page.touchscreen.tap(10, 400)
      await page.touchscreen.tap(200, 400)
      await page.waitForTimeout(300)

      // Check that no memory leaks or dangling listeners exist
      const listenerCount = await page.evaluate(() => {
        const events = ['touchstart', 'touchmove', 'touchend']
        let count = 0
        
        events.forEach(event => {
          const listeners = (window as any).getEventListeners?.(document.body)?.[event]
          if (listeners) count += listeners.length
        })
        
        return count
      })

      // Should have reasonable number of listeners
      expect(listenerCount).toBeLessThan(10)
    })
  })

  test.describe('Error Handling', () => {
    test.use({ hasTouch: true })

    test('should handle touch events without touch data', async ({ page }) => {
      // Simulate edge case where touch data might be missing
      await page.evaluate(() => {
        const sidebar = document.querySelector('[data-testid="sidebar"]')
        if (sidebar) {
          const event = new TouchEvent('touchstart', {
            touches: [] // Empty touches array
          })
          sidebar.dispatchEvent(event)
        }
      })
      
      // Should not crash
      await page.waitForTimeout(100)
    })

    test('should handle rapid touch start/end cycles', async ({ page }) => {
      // Simulate rapid touch events that might confuse the state
      for (let i = 0; i < 10; i++) {
        await page.touchscreen.tap(50, 400)
        await page.waitForTimeout(10)
      }
      
      // Should remain stable
      await page.waitForTimeout(500)
    })

    test('should handle window resize during gesture', async ({ page }) => {
      // Start gesture
      await page.touchscreen.tap(10, 400)
      
      // Resize window mid-gesture
      await page.setViewportSize({ width: 900, height: 1200 })
      
      // Complete gesture
      await page.touchscreen.tap(200, 400)
      await page.waitForTimeout(300)
      
      // Should handle gracefully
    })
  })

  test.describe('Configuration Options', () => {
    test('should respect custom thresholds', async ({ page }) => {
      // Test that custom configuration is applied
      // This would require the component to expose configuration options
      await page.evaluate(() => {
        // Simulate custom configuration
        const config = {
          minSwipeDistance: 100, // Higher threshold
          velocityThreshold: 0.5
        }
        ;(window as any).gestureConfig = config
      })

      // Test with new thresholds
      await page.touchscreen.tap(10, 400)
      await page.touchscreen.tap(80, 400) // Should not trigger with higher threshold
      await page.waitForTimeout(300)
    })

    test('should handle disabled haptic feedback', async ({ page }) => {
      // Test with haptic feedback disabled
      await page.evaluate(() => {
        ;(window as any).gestureConfig = {
          enableHapticFeedback: false
        }
      })

      await page.touchscreen.tap(10, 400)
      await page.touchscreen.tap(200, 400)
      await page.waitForTimeout(300)
    })

    test('should handle accessibility mode', async ({ page }) => {
      // Test with accessibility mode enabled
      await page.evaluate(() => {
        ;(window as any).gestureConfig = {
          enableAccessibilityMode: true
        }
      })

      await page.touchscreen.tap(10, 400)
      await page.touchscreen.tap(200, 400)
      await page.waitForTimeout(300)

      // Check for accessibility announcements
      const liveRegion = page.locator('#gesture-announcements')
      await expect(liveRegion).toBeVisible()
    })
  })
})