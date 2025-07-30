'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Currency } from '@prisma/client'
import { getSystemSettings } from '@/lib/currency'
import { useAuth } from '@/hooks/use-auth'

interface CurrencySettings {
  mainCurrency: Currency
  additionalCurrency1: Currency | null
  additionalCurrency2: Currency | null
  exchangeRate1: number | null
  exchangeRate2: number | null
}

interface CurrencyContextType {
  settings: CurrencySettings | null
  loading: boolean
  error: string | null
  refreshSettings: () => Promise<void>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [settings, setSettings] = useState<CurrencySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSystemSettings()
      setSettings({
        mainCurrency: data.mainCurrency,
        additionalCurrency1: data.additionalCurrency1,
        additionalCurrency2: data.additionalCurrency2,
        exchangeRate1: data.exchangeRate1,
        exchangeRate2: data.exchangeRate2
      })
    } catch (err) {
      console.error('Failed to load currency settings:', err)
      setError('Failed to load currency settings')
      // Set default settings on error
      setSettings({
        mainCurrency: Currency.EUR,
        additionalCurrency1: null,
        additionalCurrency2: null,
        exchangeRate1: null,
        exchangeRate2: null
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only load settings if authenticated
    if (!authLoading && user) {
      loadSettings()
    } else if (!authLoading && !user) {
      // Set default settings for unauthenticated users
      setSettings({
        mainCurrency: Currency.EUR,
        additionalCurrency1: null,
        additionalCurrency2: null,
        exchangeRate1: null,
        exchangeRate2: null
      })
      setLoading(false)
    }
  }, [authLoading, user])

  const refreshSettings = async () => {
    await loadSettings()
  }

  return (
    <CurrencyContext.Provider value={{ settings, loading, error, refreshSettings }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}

// Hook to get main currency
export function useMainCurrency(): Currency {
  const { settings } = useCurrency()
  return settings?.mainCurrency || Currency.EUR
}

// Hook to get available currencies
export function useAvailableCurrencies(): Currency[] {
  const { settings } = useCurrency()
  if (!settings) return [Currency.EUR]
  
  const currencies = [settings.mainCurrency]
  if (settings.additionalCurrency1) {
    currencies.push(settings.additionalCurrency1)
  }
  if (settings.additionalCurrency2) {
    currencies.push(settings.additionalCurrency2)
  }
  
  return currencies
}

// Hook to convert currency
export function useCurrencyConverter() {
  const { settings } = useCurrency()
  
  const convert = (amount: number, from: Currency, to: Currency): number => {
    if (!settings || from === to) return amount
    
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
    
    // If conversion not possible, return original amount
    console.warn(`Cannot convert from ${from} to ${to}`)
    return amount
  }
  
  const convertToMain = (amount: number, from: Currency): number => {
    if (!settings) return amount
    return convert(amount, from, settings.mainCurrency)
  }
  
  return { convert, convertToMain }
}