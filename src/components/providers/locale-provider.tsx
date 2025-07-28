'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const lastSyncedLocale = useRef<string | null>(null)

  // Sync session locale with cookie only when necessary
  useEffect(() => {
    // Only proceed if session is loaded and user has a language preference
    if (status !== 'authenticated' || !session?.user?.preferredLanguage) {
      return
    }

    const preferredLanguage = session.user.preferredLanguage
    
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
      
      // Reload the page to apply the new locale
      window.location.reload()
    } else {
      // Mark as synced even if no update was needed
      lastSyncedLocale.current = normalizedPreference
    }
  }, [session?.user?.preferredLanguage, status])

  return <>{children}</>
}