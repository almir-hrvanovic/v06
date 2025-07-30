'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const lastSyncedLocale = useRef<string | null>(null)

  // Sync session locale with cookie only when necessary
  useEffect(() => {
    // Only proceed if user is loaded and has a language preference
    if (loading || !user?.preferredLanguage) {
      return
    }

    const preferredLanguage = user.preferredLanguage
    
    // Normalize language codes to ensure consistency
    const normalizeLocale = (locale: string) => {
      // Map short codes to full codes if needed
      const localeMap: { [key: string]: string } = {
        'hr': 'hr-HR',
        'bs': 'bs-BA',
        'en': 'en-US',
        'de': 'de-DE'
      }
      return localeMap[locale] || locale
    }

    const normalizedPreference = normalizeLocale(preferredLanguage)
    
    // Skip if we've already synced this locale
    if (lastSyncedLocale.current === normalizedPreference) {
      return
    }

    // Get current cookie value
    const currentCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1]
    
    const normalizedCookie = currentCookie ? normalizeLocale(currentCookie) : null
    
    // Only update cookie if it's different from normalized session preference
    if (normalizedCookie !== normalizedPreference) {
      console.log('LocaleProvider: Updating cookie from', normalizedCookie, 'to', normalizedPreference)
      document.cookie = `locale=${normalizedPreference}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`
      lastSyncedLocale.current = normalizedPreference
      
      // Don't reload automatically - let the user trigger it if needed
      // This prevents the "operation aborted" errors
      console.log('Language preference updated. Page reload may be required for full effect.')
    } else {
      // Mark as synced even if no update was needed
      lastSyncedLocale.current = normalizedPreference
    }
  }, [user?.preferredLanguage, loading])

  return <>{children}</>
}