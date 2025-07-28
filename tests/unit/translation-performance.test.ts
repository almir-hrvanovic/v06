/**
 * Performance Tests for Translation Loading
 * Tests the performance of translation loading and rendering
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { performance } from 'perf_hooks'
import * as fs from 'fs'
import * as path from 'path'

// Performance benchmarking configuration
const PERFORMANCE_CONFIG = {
  maxTranslationLoadTime: 50, // milliseconds
  maxRenderTime: 100, // milliseconds
  maxMemoryIncrease: 10, // MB
  iterations: 100, // for stress testing
  languages: ['en', 'hr', 'bs', 'de'],
}

// Load translation messages
const loadMessages = (locale: string) => {
  const filePath = path.join(process.cwd(), 'messages', `${locale}.json`)
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }
  throw new Error(`Translation file not found: ${filePath}`)
}

// Get bundle size for locale
const getBundleSize = (locale: string): number => {
  const filePath = path.join(process.cwd(), 'messages', `${locale}.json`)
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath)
    return stats.size
  }
  return 0
}

// Count translation keys
const countKeys = (obj: any, prefix = ''): number => {
  let count = 0
  
  for (const [key, value] of Object.entries(obj || {})) {
    if (key.startsWith('_')) continue // Skip metadata
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      count += countKeys(value, prefix ? `${prefix}.${key}` : key)
    } else {
      count++
    }
  }
  
  return count
}

describe('Translation Performance Tests', () => {
  let initialMemory: number

  beforeAll(() => {
    // Record initial memory usage
    if (process.memoryUsage) {
      initialMemory = process.memoryUsage().heapUsed / 1024 / 1024 // MB
    }
  })

  describe('Translation Loading Performance', () => {
    test.each(PERFORMANCE_CONFIG.languages)(
      'should load %s translations within performance budget',
      (locale) => {
        const startTime = performance.now()
        
        // Load translation messages
        const messages = loadMessages(locale)
        
        const loadTime = performance.now() - startTime
        const keyCount = countKeys(messages)
        const bundleSize = getBundleSize(locale)
        
        console.log(`${locale} load metrics:`, {
          loadTime: `${loadTime.toFixed(2)}ms`,
          keyCount,
          bundleSize: `${(bundleSize / 1024).toFixed(2)}KB`,
        })
        
        // Performance assertions
        expect(loadTime).toBeLessThan(PERFORMANCE_CONFIG.maxTranslationLoadTime)
        expect(keyCount).toBeGreaterThan(100) // Should have substantial translations
        expect(bundleSize).toBeLessThan(500 * 1024) // Should be under 500KB
      }
    )

    test('should handle concurrent translation loading', async () => {
      const startTime = performance.now()
      
      // Load all languages concurrently
      const loadPromises = PERFORMANCE_CONFIG.languages.map(async (locale) => {
        return new Promise((resolve) => {
          const messages = loadMessages(locale)
          resolve({ locale, keyCount: countKeys(messages) })
        })
      })
      
      const results = await Promise.all(loadPromises)
      const totalTime = performance.now() - startTime
      
      console.log('Concurrent loading results:', results)
      console.log(`Total concurrent load time: ${totalTime.toFixed(2)}ms`)
      
      // Should load all languages faster than loading them sequentially
      expect(totalTime).toBeLessThan(PERFORMANCE_CONFIG.maxTranslationLoadTime * 2)
      expect(results).toHaveLength(PERFORMANCE_CONFIG.languages.length)
    })
  })

  describe('Translation Memory Usage', () => {
    test('should efficiently handle large translation objects', () => {
      const startTime = performance.now()
      const memoryBefore = process.memoryUsage?.().heapUsed || 0
      
      // Load all languages simultaneously
      const allMessages = PERFORMANCE_CONFIG.languages.map(locale => ({
        locale,
        messages: loadMessages(locale),
      }))
      
      const loadTime = performance.now() - startTime
      const memoryAfter = process.memoryUsage?.().heapUsed || 0
      const memoryIncrease = (memoryAfter - memoryBefore) / 1024 / 1024
      
      console.log('Large object handling:', {
        loadTime: `${loadTime.toFixed(2)}ms`,
        memoryIncrease: `${memoryIncrease.toFixed(2)}MB`,
        totalKeys: allMessages.reduce((sum, { messages }) => sum + countKeys(messages), 0),
      })
      
      // Should handle large objects efficiently
      expect(loadTime).toBeLessThan(PERFORMANCE_CONFIG.maxTranslationLoadTime * 2)
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_CONFIG.maxMemoryIncrease * 4)
      expect(allMessages).toHaveLength(PERFORMANCE_CONFIG.languages.length)
    })
  })

  afterAll(() => {
    if (process.memoryUsage && initialMemory) {
      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024
      const totalIncrease = finalMemory - initialMemory
      
      console.log('Final memory summary:', {
        initialMemory: `${initialMemory.toFixed(2)}MB`,
        finalMemory: `${finalMemory.toFixed(2)}MB`,
        totalIncrease: `${totalIncrease.toFixed(2)}MB`,
      })
    }
  })
})