/**
 * Integration Tests for Language Switching
 * Tests language switching functionality across components
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { SessionProvider } from 'next-auth/react'
import userEvent from '@testing-library/user-event'
import * as fs from 'fs'
import * as path from 'path'

// Mock components for testing
import { LanguageSwitcher } from '@/components/language/language-switcher'
import { Header } from '@/components/layout/header'
import { MobileSidebar } from '@/components/layout/mobile-sidebar'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next-auth
const mockSession = {
  user: {
    id: 'test-user',
    name: 'Test User',
    email: 'test@example.com',
    role: 'ADMIN' as const,
  },
  expires: '2024-12-31',
}

// Load translation messages
const loadMessages = (locale: string) => {
  const filePath = path.join(process.cwd(), 'messages', `${locale}.json`)
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  }
  throw new Error(`Translation file not found: ${filePath}`)
}

// Test wrapper component
const TestWrapper = ({ 
  children, 
  locale = 'en',
  messages = null 
}: { 
  children: React.ReactNode
  locale?: string
  messages?: any
}) => {
  const translationMessages = messages || loadMessages(locale)
  
  return (
    <SessionProvider session={mockSession}>
      <NextIntlClientProvider 
        locale={locale} 
        messages={translationMessages}
        timeZone="Europe/Zagreb"
      >
        {children}
      </NextIntlClientProvider>
    </SessionProvider>
  )
}

describe('Language Switching Integration Tests', () => {
  const user = userEvent.setup()

  describe('LanguageSwitcher Component', () => {
    test('should render language switcher with current locale', () => {
      render(
        <TestWrapper locale="en">
          <LanguageSwitcher variant="dropdown" />
        </TestWrapper>
      )
      
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText(/English/)).toBeInTheDocument()
    })

    test('should show all supported languages in dropdown', async () => {
      render(
        <TestWrapper locale="en">
          <LanguageSwitcher variant="dropdown" />
        </TestWrapper>
      )
      
      const trigger = screen.getByRole('combobox')
      await user.click(trigger)
      
      await waitFor(() => {
        expect(screen.getByText(/Croatian/)).toBeInTheDocument()
        expect(screen.getByText(/Bosnian/)).toBeInTheDocument()
        expect(screen.getByText(/English/)).toBeInTheDocument()
        expect(screen.getByText(/German/)).toBeInTheDocument()
      })
    })

    test('should handle language change', async () => {
      const mockSetLocaleCookie = jest.fn().mockResolvedValue(undefined)
      
      // Mock the locale module
      jest.doMock('@/lib/locale', () => ({
        setLocaleCookie: mockSetLocaleCookie,
      }))

      render(
        <TestWrapper locale="en">
          <LanguageSwitcher variant="dropdown" />
        </TestWrapper>
      )
      
      const trigger = screen.getByRole('combobox')
      await user.click(trigger)
      
      const croatianOption = await screen.findByText(/Croatian/)
      await user.click(croatianOption)
      
      expect(mockSetLocaleCookie).toHaveBeenCalledWith('hr')
    })
  })

  describe('Component Translation Updates', () => {
    test('should update header navigation labels when language changes', () => {
      const { rerender } = render(
        <TestWrapper locale="en">
          <Header />
        </TestWrapper>
      )
      
      // Check English labels
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      
      // Switch to Croatian
      rerender(
        <TestWrapper locale="hr">
          <Header />
        </TestWrapper>
      )
      
      // Check Croatian labels
      expect(screen.getByText('Nadzorna ploča')).toBeInTheDocument()
    })

    test('should update mobile sidebar when language changes', () => {
      const { rerender } = render(
        <TestWrapper locale="en">
          <MobileSidebar />
        </TestWrapper>
      )
      
      // Check English
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
      
      // Switch to German
      rerender(
        <TestWrapper locale="de">
          <MobileSidebar />
        </TestWrapper>
      )
      
      // Check German
      expect(screen.getByText('Dashboard')).toBeInTheDocument() // Same in German
      expect(screen.getByText('Benutzer')).toBeInTheDocument()
    })
  })

  describe('Form Validation Messages', () => {
    test('should display validation messages in selected language', async () => {
      const TestForm = () => {
        const [errors, setErrors] = React.useState<string[]>([])
        const t = useTranslations('forms.validation')
        
        const handleSubmit = () => {
          setErrors([t('required'), t('invalid')])
        }
        
        return (
          <div>
            <button onClick={handleSubmit}>Submit</button>
            {errors.map((error, index) => (
              <div key={index} data-testid="validation-error">
                {error}
              </div>
            ))}
          </div>
        )
      }

      const { rerender } = render(
        <TestWrapper locale="en">
          <TestForm />
        </TestWrapper>
      )
      
      await user.click(screen.getByText('Submit'))
      
      await waitFor(() => {
        const errors = screen.getAllByTestId('validation-error')
        expect(errors[0]).toHaveTextContent('This field is required')
        expect(errors[1]).toHaveTextContent('Invalid format')
      })
      
      // Switch to Croatian
      rerender(
        <TestWrapper locale="hr">
          <TestForm />
        </TestWrapper>
      )
      
      await user.click(screen.getByText('Submit'))
      
      await waitFor(() => {
        const errors = screen.getAllByTestId('validation-error')
        expect(errors[0]).toHaveTextContent('Ovo polje je obavezno')
        expect(errors[1]).toHaveTextContent('Neispravni format')
      })
    })
  })

  describe('Date and Number Formatting', () => {
    test('should format dates according to locale', () => {
      const TestDateComponent = () => {
        const { formatDate } = useLocaleFormat()
        const testDate = new Date('2024-01-15')
        
        return (
          <div>
            <span data-testid="formatted-date">
              {formatDate(testDate, 'medium')}
            </span>
          </div>
        )
      }

      const { rerender } = render(
        <TestWrapper locale="en">
          <TestDateComponent />
        </TestWrapper>
      )
      
      // English date format (MM/DD/YYYY)
      expect(screen.getByTestId('formatted-date')).toHaveTextContent(/01\/15\/2024|Jan 15, 2024/)
      
      // Switch to Croatian (DD.MM.YYYY)
      rerender(
        <TestWrapper locale="hr">
          <TestDateComponent />
        </TestWrapper>
      )
      
      expect(screen.getByTestId('formatted-date')).toHaveTextContent(/15\.01\.2024|15\. sij\. 2024/)
    })

    test('should format numbers according to locale', () => {
      const TestNumberComponent = () => {
        const { formatNumber } = useLocaleFormat()
        const testNumber = 1234.56
        
        return (
          <div>
            <span data-testid="formatted-number">
              {formatNumber(testNumber, 'decimal')}
            </span>
            <span data-testid="formatted-currency">
              {formatNumber(testNumber, 'currency')}
            </span>
          </div>
        )
      }

      const { rerender } = render(
        <TestWrapper locale="en">
          <TestNumberComponent />
        </TestWrapper>
      )
      
      // English formatting (dot decimal separator)
      expect(screen.getByTestId('formatted-number')).toHaveTextContent('1,234.56')
      expect(screen.getByTestId('formatted-currency')).toHaveTextContent(/\$1,234\.56/)
      
      // Switch to German (comma decimal separator)
      rerender(
        <TestWrapper locale="de">
          <TestNumberComponent />
        </TestWrapper>
      )
      
      expect(screen.getByTestId('formatted-number')).toHaveTextContent('1.234,56')
      expect(screen.getByTestId('formatted-currency')).toHaveTextContent(/1\.234,56/)
    })
  })

  describe('Pluralization', () => {
    test('should handle pluralization correctly across languages', () => {
      const TestPluralComponent = ({ count }: { count: number }) => {
        const { getPlural } = usePluralization()
        
        return (
          <span data-testid="plural-text">
            {getPlural('plurals.items', count)}
          </span>
        )
      }

      // Test English pluralization
      const { rerender } = render(
        <TestWrapper locale="en">
          <TestPluralComponent count={0} />
        </TestWrapper>
      )
      
      expect(screen.getByTestId('plural-text')).toHaveTextContent(/no items|0 items/)
      
      rerender(
        <TestWrapper locale="en">
          <TestPluralComponent count={1} />
        </TestWrapper>
      )
      
      expect(screen.getByTestId('plural-text')).toHaveTextContent('1 item')
      
      rerender(
        <TestWrapper locale="en">
          <TestPluralComponent count={5} />
        </TestWrapper>
      )
      
      expect(screen.getByTestId('plural-text')).toHaveTextContent('5 items')
      
      // Test Croatian pluralization (more complex rules)
      rerender(
        <TestWrapper locale="hr">
          <TestPluralComponent count={1} />
        </TestWrapper>
      )
      
      expect(screen.getByTestId('plural-text')).toHaveTextContent(/1 stavka/)
      
      rerender(
        <TestWrapper locale="hr">
          <TestPluralComponent count={2} />
        </TestWrapper>
      )
      
      expect(screen.getByTestId('plural-text')).toHaveTextContent(/2 stavke/)
      
      rerender(
        <TestWrapper locale="hr">
          <TestPluralComponent count={5} />
        </TestWrapper>
      )
      
      expect(screen.getByTestId('plural-text')).toHaveTextContent(/5 stavki/)
    })
  })

  describe('Fallback Behavior', () => {
    test('should fallback to parent locale when key is missing', () => {
      const incompleteMessages = {
        common: {
          actions: {
            save: 'Spremi', // Only has save, missing other keys
          }
        }
      }
      
      const TestFallbackComponent = () => {
        const t = useTranslations('common.actions')
        
        return (
          <div>
            <span data-testid="save-text">{t('save')}</span>
            <span data-testid="cancel-text">{t('cancel')}</span>
          </div>
        )
      }

      render(
        <TestWrapper locale="bs" messages={incompleteMessages}>
          <TestFallbackComponent />
        </TestWrapper>
      )
      
      // Should show Bosnian for save (exists)
      expect(screen.getByTestId('save-text')).toHaveTextContent('Spremi')
      
      // Should fallback to Croatian/English for cancel (missing)
      expect(screen.getByTestId('cancel-text')).toHaveTextContent(/Cancel|Odustani/)
    })
  })

  describe('Cookie Persistence', () => {
    test('should persist language selection in cookie', async () => {
      // Mock document.cookie
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: 'NEXT_LOCALE=en',
      })

      const mockSetLocaleCookie = jest.fn()
      
      jest.doMock('@/lib/locale', () => ({
        setLocaleCookie: mockSetLocaleCookie,
        getLocaleCookie: () => 'hr',
      }))

      render(
        <TestWrapper locale="en">
          <LanguageSwitcher variant="dropdown" />
        </TestWrapper>
      )
      
      const trigger = screen.getByRole('combobox')
      await user.click(trigger)
      
      const croatianOption = await screen.findByText(/Croatian/)
      await user.click(croatianOption)
      
      expect(mockSetLocaleCookie).toHaveBeenCalledWith('hr')
    })
  })
})

// Mock custom hooks
const useTranslations = (namespace?: string) => {
  return (key: string) => {
    // Return mock translations based on current test locale
    const mockTranslations: Record<string, Record<string, string>> = {
      'forms.validation.required': {
        en: 'This field is required',
        hr: 'Ovo polje je obavezno',
        bs: 'Ovo polje je obavezno',
        de: 'Dieses Feld ist erforderlich',
      },
      'forms.validation.invalid': {
        en: 'Invalid format',
        hr: 'Neispravni format',
        bs: 'Neispravni format',
        de: 'Ungültiges Format',
      },
      'common.actions.save': {
        en: 'Save',
        hr: 'Spremi',
        bs: 'Spremi',
        de: 'Speichern',
      },
      'common.actions.cancel': {
        en: 'Cancel',
        hr: 'Odustani',
        bs: 'Odustani',
        de: 'Abbrechen',
      },
    }
    
    const fullKey = namespace ? `${namespace}.${key}` : key
    return mockTranslations[fullKey]?.en || key
  }
}

const useLocaleFormat = () => ({
  formatDate: (date: Date, style: string) => {
    return new Intl.DateTimeFormat('en-US').format(date)
  },
  formatNumber: (num: number, type: string) => {
    if (type === 'currency') {
      return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
      }).format(num)
    }
    return new Intl.NumberFormat('en-US').format(num)
  },
})

const usePluralization = () => ({
  getPlural: (key: string, count: number) => {
    if (count === 0) return 'no items'
    if (count === 1) return '1 item'
    return `${count} items`
  },
})