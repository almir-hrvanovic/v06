'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'theme',
}: {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey) as Theme
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
          return stored
        }
      } catch (error) {
        console.warn('Failed to load theme from localStorage:', error)
      }
    }
    return defaultTheme
  })
  
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(() => {
    // Initialize actualTheme based on stored theme or system preference
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey) as Theme
        if (stored === 'dark') return 'dark'
        if (stored === 'light') return 'light'
        if (stored === 'system' || !stored) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
      } catch (error) {
        console.warn('Failed to determine initial theme:', error)
      }
    }
    return 'light' // fallback only if window is undefined (SSR)
  })

  // Apply the initial theme class immediately to prevent flash
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(actualTheme)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')

    let systemTheme: 'light' | 'dark' = 'light'
    
    if (theme === 'system') {
      systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    
    const resolvedTheme = theme === 'system' ? systemTheme : theme
    setActualTheme(resolvedTheme)
    
    // Apply theme class
    root.classList.add(resolvedTheme)
    
    // Store theme preference
    try {
      localStorage.setItem(storageKey, theme)
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error)
    }
  }, [theme, storageKey])

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      const systemTheme = mediaQuery.matches ? 'dark' : 'light'
      setActualTheme(systemTheme)
      
      // Update root class
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(systemTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const value = {
    theme,
    setTheme,
    actualTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      <div suppressHydrationWarning>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  
  return context
}