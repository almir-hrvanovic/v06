/**
 * Unit Tests for Translation Key Existence
 * Tests that all required translation keys exist across all supported languages
 */

import { describe, test, expect, beforeAll } from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'

// Define supported languages
const LANGUAGES = ['en', 'hr', 'bs', 'de'] as const
type Language = typeof LANGUAGES[number]

// Define required translation key categories
const REQUIRED_KEY_CATEGORIES = [
  'common.actions',
  'common.labels', 
  'common.status',
  'common.priority',
  'forms.placeholders',
  'forms.headers',
  'forms.validation',
  'emptyStates',
  'search',
  'dashboard',
  'auth',
  'navigation',
  'titles',
  'notifications'
] as const

// Translation objects for each language
let translations: Record<Language, any> = {} as Record<Language, any>

describe('Translation Key Existence Tests', () => {
  beforeAll(() => {
    // Load all translation files
    LANGUAGES.forEach(lang => {
      const filePath = path.join(process.cwd(), 'messages', `${lang}.json`)
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8')
        translations[lang] = JSON.parse(content)
      } else {
        throw new Error(`Translation file not found: ${filePath}`)
      }
    })
  })

  describe('Translation File Validity', () => {
    test.each(LANGUAGES)('should load valid JSON for %s', (lang) => {
      expect(translations[lang]).toBeDefined()
      expect(typeof translations[lang]).toBe('object')
      expect(translations[lang]).not.toBeNull()
    })

    test.each(LANGUAGES)('should have metadata section for %s', (lang) => {
      expect(translations[lang]._metadata).toBeDefined()
      expect(translations[lang]._metadata.language).toBeDefined()
      expect(translations[lang]._metadata.locale).toBeDefined()
      expect(translations[lang]._metadata.version).toBeDefined()
    })
  })

  describe('Required Category Existence', () => {
    test.each(LANGUAGES)('should have all required categories for %s', (lang) => {
      REQUIRED_KEY_CATEGORIES.forEach(category => {
        const keys = category.split('.')
        let current = translations[lang]
        
        for (const key of keys) {
          expect(current[key]).toBeDefined()
          current = current[key]
        }
      })
    })
  })

  describe('Common Actions Keys', () => {
    const REQUIRED_ACTIONS = [
      'save', 'cancel', 'delete', 'edit', 'view', 'create', 'update',
      'loading', 'creating', 'processing', 'saving', 'search', 'filter'
    ]

    test.each(LANGUAGES)('should have all action keys for %s', (lang) => {
      REQUIRED_ACTIONS.forEach(action => {
        expect(translations[lang].common.actions[action]).toBeDefined()
        expect(typeof translations[lang].common.actions[action]).toBe('string')
        expect(translations[lang].common.actions[action].length).toBeGreaterThan(0)
      })
    })
  })

  describe('Status Keys', () => {
    const REQUIRED_STATUSES = [
      'pending', 'assigned', 'inProgress', 'costed', 'approved', 
      'completed', 'active', 'inactive'
    ]

    test.each(LANGUAGES)('should have all status keys for %s', (lang) => {
      REQUIRED_STATUSES.forEach(status => {
        expect(translations[lang].common.status[status]).toBeDefined()
        expect(typeof translations[lang].common.status[status]).toBe('string')
        expect(translations[lang].common.status[status].length).toBeGreaterThan(0)
      })
    })
  })

  describe('Form Placeholder Keys', () => {
    const REQUIRED_PLACEHOLDERS = [
      'zeroAmount', 'costNotes', 'searchItems', 'searchOrders', 
      'searchQuotes', 'unitExample', 'calculationNotes'
    ]

    test.each(LANGUAGES)('should have all placeholder keys for %s', (lang) => {
      REQUIRED_PLACEHOLDERS.forEach(placeholder => {
        expect(translations[lang].forms.placeholders[placeholder]).toBeDefined()
        expect(typeof translations[lang].forms.placeholders[placeholder]).toBe('string')
        expect(translations[lang].forms.placeholders[placeholder].length).toBeGreaterThan(0)
      })
    })
  })

  describe('Header Keys', () => {
    const REQUIRED_HEADERS = [
      'totalCalculations', 'approved', 'pendingApproval', 'totalValue',
      'customer', 'items', 'created', 'status', 'assignedTo'
    ]

    test.each(LANGUAGES)('should have all header keys for %s', (lang) => {
      REQUIRED_HEADERS.forEach(header => {
        expect(translations[lang].forms.headers[header]).toBeDefined()
        expect(typeof translations[lang].forms.headers[header]).toBe('string')
        expect(translations[lang].forms.headers[header].length).toBeGreaterThan(0)
      })
    })
  })

  describe('Empty State Keys', () => {
    const REQUIRED_EMPTY_STATES = [
      'noApprovalsFound', 'noCostCalculationsFound', 'noProductionOrdersFound',
      'noQuotesFound', 'noInquiriesFound', 'noResultsFound'
    ]

    test.each(LANGUAGES)('should have all empty state keys for %s', (lang) => {
      REQUIRED_EMPTY_STATES.forEach(emptyState => {
        expect(translations[lang].emptyStates[emptyState]).toBeDefined()
        expect(typeof translations[lang].emptyStates[emptyState]).toBe('string')
        expect(translations[lang].emptyStates[emptyState].length).toBeGreaterThan(0)
      })
    })
  })

  describe('Key Consistency Across Languages', () => {
    test('should have same key structure across all languages', () => {
      const baseKeys = getDeepKeys(translations.en)
      
      LANGUAGES.slice(1).forEach(lang => {
        const langKeys = getDeepKeys(translations[lang])
        
        // Check for missing keys
        const missingKeys = baseKeys.filter(key => !langKeys.includes(key))
        expect(missingKeys).toEqual([])
        
        // Check for extra keys
        const extraKeys = langKeys.filter(key => !baseKeys.includes(key))
        expect(extraKeys).toEqual([])
      })
    })

    test('should have no empty translation values', () => {
      LANGUAGES.forEach(lang => {
        const emptyKeys = findEmptyKeys(translations[lang])
        expect(emptyKeys).toEqual([])
      })
    })
  })

  describe('Translation Quality', () => {
    test.each(LANGUAGES)('should not have placeholder text patterns for %s', (lang) => {
      const placeholderPatterns = [
        /TODO:/i,
        /FIXME:/i,
        /\[placeholder\]/i,
        /\[translation needed\]/i,
        /xxx/i,
        /yyy/i
      ]
      
      const allValues = getAllTranslationValues(translations[lang])
      
      allValues.forEach(value => {
        placeholderPatterns.forEach(pattern => {
          expect(value).not.toMatch(pattern)
        })
      })
    })

    test('should have appropriate language-specific formatting', () => {
      // Croatian/Bosnian should use comma as decimal separator in examples
      const hrValues = getAllTranslationValues(translations.hr)
      const bsValues = getAllTranslationValues(translations.bs)
      
      hrValues.concat(bsValues).forEach(value => {
        if (value.includes('0.00')) {
          expect(value).toContain('0,00')
        }
      })
      
      // German should use German-specific terms
      const deValues = getAllTranslationValues(translations.de)
      const germanSpecificTerms = ['erstellt', 'aktualisiert', 'bearbeitet']
      
      // Should contain at least some German-specific terms
      const hasGermanTerms = deValues.some(value => 
        germanSpecificTerms.some(term => 
          value.toLowerCase().includes(term)
        )
      )
      expect(hasGermanTerms).toBe(true)
    })
  })
})

// Helper functions
function getDeepKeys(obj: any, prefix = ''): string[] {
  const keys: string[] = []
  
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('_')) continue // Skip metadata
    
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getDeepKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  
  return keys.sort()
}

function findEmptyKeys(obj: any, prefix = ''): string[] {
  const emptyKeys: string[] = []
  
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('_')) continue // Skip metadata
    
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      emptyKeys.push(...findEmptyKeys(value, fullKey))
    } else if (typeof value === 'string' && value.trim() === '') {
      emptyKeys.push(fullKey)
    }
  }
  
  return emptyKeys
}

function getAllTranslationValues(obj: any): string[] {
  const values: string[] = []
  
  for (const [key, value] of Object.entries(obj)) {
    if (key.startsWith('_')) continue // Skip metadata
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      values.push(...getAllTranslationValues(value))
    } else if (typeof value === 'string') {
      values.push(value)
    }
  }
  
  return values
}