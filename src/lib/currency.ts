import { Currency } from '@prisma/client'

/**
 * Currency formatting utilities for the application
 * Supports multiple currencies with proper locale formatting
 */

// Currency symbols mapping
export const currencySymbols: Record<Currency, string> = {
  EUR: '€',
  BAM: 'KM',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  HRK: 'kn',
  RSD: 'дин'
}

// Currency names
export const currencyNames: Record<Currency, string> = {
  EUR: 'Euro',
  BAM: 'Convertible Mark',
  USD: 'US Dollar',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
  HRK: 'Croatian Kuna',
  RSD: 'Serbian Dinar'
}

// Currency decimal places
export const currencyDecimals: Record<Currency, number> = {
  EUR: 2,
  BAM: 2,
  USD: 2,
  GBP: 2,
  CHF: 2,
  HRK: 2,
  RSD: 2
}

// ISO currency codes for Intl.NumberFormat
export const currencyISO: Record<Currency, string> = {
  EUR: 'EUR',
  BAM: 'BAM',
  USD: 'USD',
  GBP: 'GBP',
  CHF: 'CHF',
  HRK: 'HRK',
  RSD: 'RSD'
}

// System settings cache
let systemSettingsCache: {
  mainCurrency: Currency
  additionalCurrency1: Currency | null
  additionalCurrency2: Currency | null
  exchangeRate1: number | null
  exchangeRate2: number | null
  timestamp: number
} | null = null

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

/**
 * Fetch system settings from API
 */
async function fetchSystemSettings() {
  try {
    const response = await fetch('/api/system-settings', {
      credentials: 'include' // Include cookies for authentication
    })
    if (!response.ok) {
      // If unauthorized, return default settings instead of throwing
      if (response.status === 401) {
        console.warn('User not authenticated, using default currency settings')
        return {
          mainCurrency: Currency.EUR,
          additionalCurrency1: null,
          additionalCurrency2: null,
          exchangeRate1: null,
          exchangeRate2: null,
          timestamp: Date.now()
        }
      }
      throw new Error('Failed to fetch system settings')
    }
    const data = await response.json()
    
    // Update cache
    systemSettingsCache = {
      mainCurrency: data.mainCurrency,
      additionalCurrency1: data.additionalCurrency1,
      additionalCurrency2: data.additionalCurrency2,
      exchangeRate1: data.exchangeRate1,
      exchangeRate2: data.exchangeRate2,
      timestamp: Date.now()
    }
    
    return systemSettingsCache
  } catch (error) {
    console.error('Failed to fetch system settings:', error)
    // Return default settings if fetch fails
    return {
      mainCurrency: Currency.EUR,
      additionalCurrency1: null,
      additionalCurrency2: null,
      exchangeRate1: null,
      exchangeRate2: null,
      timestamp: Date.now()
    }
  }
}

/**
 * Get system settings (with caching)
 */
export async function getSystemSettings() {
  // Check cache
  if (systemSettingsCache && Date.now() - systemSettingsCache.timestamp < CACHE_DURATION) {
    return systemSettingsCache
  }
  
  // Fetch fresh settings
  return fetchSystemSettings()
}

/**
 * Get system settings synchronously (from cache or default)
 */
export function getSystemSettingsSync() {
  if (systemSettingsCache) {
    return systemSettingsCache
  }
  
  // Return default settings
  return {
    mainCurrency: Currency.EUR,
    additionalCurrency1: null,
    additionalCurrency2: null,
    exchangeRate1: null,
    exchangeRate2: null,
    timestamp: 0
  }
}

/**
 * Convert amount from one currency to another using system settings
 */
export async function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency
): Promise<number> {
  if (from === to) return amount
  
  const settings = await getSystemSettings()
  
  // Check if conversion involves main currency
  if (from === settings.mainCurrency) {
    // Converting from main to additional
    if (to === settings.additionalCurrency1 && settings.exchangeRate1) {
      return amount / settings.exchangeRate1
    }
    if (to === settings.additionalCurrency2 && settings.exchangeRate2) {
      return amount / settings.exchangeRate2
    }
  } else if (to === settings.mainCurrency) {
    // Converting from additional to main
    if (from === settings.additionalCurrency1 && settings.exchangeRate1) {
      return amount * settings.exchangeRate1
    }
    if (from === settings.additionalCurrency2 && settings.exchangeRate2) {
      return amount * settings.exchangeRate2
    }
  } else {
    // Converting between two additional currencies (through main)
    if (from === settings.additionalCurrency1 && to === settings.additionalCurrency2 && 
        settings.exchangeRate1 && settings.exchangeRate2) {
      // First convert to main currency, then to target
      const inMain = amount * settings.exchangeRate1
      return inMain / settings.exchangeRate2
    }
    if (from === settings.additionalCurrency2 && to === settings.additionalCurrency1 && 
        settings.exchangeRate1 && settings.exchangeRate2) {
      // First convert to main currency, then to target
      const inMain = amount * settings.exchangeRate2
      return inMain / settings.exchangeRate1
    }
  }
  
  throw new Error(`Unsupported currency conversion: ${from} to ${to}`)
}

/**
 * Convert amount to main currency
 */
export async function convertToMainCurrency(amount: number, from: Currency): Promise<number> {
  const settings = await getSystemSettings()
  return convertCurrency(amount, from, settings.mainCurrency)
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: Currency,
  locale = 'hr-HR'
): string {
  if (amount === null || amount === undefined || amount === '') {
    return ''
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numAmount)) {
    return ''
  }
  
  const decimals = currencyDecimals[currency]
  const symbol = currencySymbols[currency]
  
  // Format number without currency symbol first
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numAmount)
  
  // Add currency symbol based on currency type
  switch (currency) {
    case Currency.BAM:
    case Currency.RSD:
    case Currency.HRK:
      // These currencies typically come after the number
      return `${formatted} ${symbol}`
    case Currency.EUR:
    case Currency.USD:
    case Currency.GBP:
    case Currency.CHF:
      // These currencies typically come before the number
      return `${symbol} ${formatted}`
    default:
      // Default format
      return `${symbol} ${formatted}`
  }
}

/**
 * Format currency with main system currency
 */
export async function formatMainCurrency(
  amount: number | string | null | undefined,
  locale = 'hr-HR'
): Promise<string> {
  const settings = await getSystemSettings()
  return formatCurrency(amount, settings.mainCurrency, locale)
}

/**
 * Parse currency amount from string
 */
export function parseCurrencyAmount(value: string): number | null {
  if (!value) return null
  
  // Remove all currency symbols and spaces
  let cleanValue = value
  Object.values(currencySymbols).forEach(symbol => {
    cleanValue = cleanValue.replace(new RegExp(symbol, 'g'), '')
  })
  
  // Remove spaces and thousand separators
  cleanValue = cleanValue
    .replace(/\s/g, '')
    .replace(/\./g, '') // Remove thousand separators (dots)
    .replace(',', '.') // Convert decimal comma to dot
    .trim()
  
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? null : parsed
}

/**
 * Format currency input (for controlled input fields)
 */
export function formatCurrencyInput(value: string, currency: Currency = Currency.EUR): string {
  // Remove all non-numeric characters except comma and dot
  const cleaned = value.replace(/[^\d,.-]/g, '')
  
  if (!cleaned) return ''
  
  // Handle decimal separator
  const parts = cleaned.split(',')
  if (parts.length > 2) {
    // Too many commas, keep only first occurrence
    return parts[0] + ',' + parts.slice(1).join('')
  }
  
  if (parts.length === 2) {
    // Format integer part with thousand separators
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const decimalPart = parts[1].slice(0, currencyDecimals[currency])
    return integerPart + ',' + decimalPart
  }
  
  // No decimal separator, just format with thousand separators
  return cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return currencySymbols[currency]
}

/**
 * Get list of available currencies
 */
export async function getAvailableCurrencies(): Promise<Currency[]> {
  const settings = await getSystemSettings()
  const currencies = [settings.mainCurrency]
  
  if (settings.additionalCurrency1) {
    currencies.push(settings.additionalCurrency1)
  }
  
  if (settings.additionalCurrency2) {
    currencies.push(settings.additionalCurrency2)
  }
  
  return currencies
}

/**
 * Check if currency is available in system
 */
export async function isCurrencyAvailable(currency: Currency): Promise<boolean> {
  const available = await getAvailableCurrencies()
  return available.includes(currency)
}

// Legacy exports for backward compatibility
export const CURRENCY_SYMBOLS = currencySymbols
export const CURRENCY_NAMES = currencyNames
export const CURRENCY_DECIMALS = currencyDecimals