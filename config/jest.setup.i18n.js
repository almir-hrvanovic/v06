import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  usePathname() {
    return '/dashboard'
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  useParams() {
    return {}
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  SessionProvider: ({ children }) => children,
  useSession() {
    return {
      data: {
        user: {
          id: 'test-user',
          name: 'Test User',
          email: 'test@example.com',
          role: 'ADMIN',
        },
        expires: '2024-12-31',
      },
      status: 'authenticated',
    }
  },
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }) => children,
  useTranslations: () => (key) => key,
  useLocale: () => 'en',
  useMessages: () => ({}),
  useTimeZone: () => 'UTC',
  useNow: () => new Date(),
  useFormatter: () => ({
    dateTime: (date) => date.toISOString(),
    number: (num) => num.toString(),
    relativeTime: (date) => 'just now',
  }),
}))

// Mock custom hooks
jest.mock('@/hooks/use-pluralization', () => ({
  usePluralization: () => ({
    getPlural: (key, count) => `${count} items`,
    simplePartial: (key, count) => `${count}`,
  }),
}))

jest.mock('@/hooks/use-locale-format', () => ({
  useLocaleFormat: () => ({
    formatDate: (date, style = 'medium') => {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: style,
      }).format(new Date(date))
    },
    formatNumber: (num, type = 'decimal') => {
      if (type === 'currency') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(num)
      }
      return new Intl.NumberFormat('en-US').format(num)
    },
    formatCurrency: (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount)
    },
  }),
}))

// Mock locale utilities
jest.mock('@/lib/locale', () => ({
  setLocaleCookie: jest.fn().mockResolvedValue(undefined),
  getLocaleCookie: jest.fn().mockReturnValue('en'),
  getLocale: jest.fn().mockReturnValue('en'),
}))

// Global test utilities
global.console = {
  ...console,
  // Suppress console.warn in tests unless explicitly needed
  warn: jest.fn(),
  error: jest.fn(),
}

// Performance measurement mock for performance tests
if (typeof performance === 'undefined') {
  global.performance = {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntries: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    clearResourceTimings: jest.fn(),
    setResourceTimingBufferSize: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
    toJSON: jest.fn(),
  }
}

// Process memory usage mock for performance tests
if (typeof process !== 'undefined' && !process.memoryUsage) {
  process.memoryUsage = jest.fn(() => ({
    rss: 50 * 1024 * 1024, // 50MB
    heapTotal: 30 * 1024 * 1024, // 30MB
    heapUsed: 20 * 1024 * 1024, // 20MB
    external: 5 * 1024 * 1024, // 5MB
    arrayBuffers: 1 * 1024 * 1024, // 1MB
  }))
}

// Increase timeout for i18n tests that may involve file I/O
jest.setTimeout(30000)