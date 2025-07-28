'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  // Simple effect to sync session locale with cookie
  useEffect(() => {
    if (session?.user?.preferredLanguage) {
      const currentCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('locale='))
        ?.split('=')[1]
      
      // Only update cookie if it's different from session preference
      if (currentCookie !== session.user.preferredLanguage) {
        document.cookie = `locale=${session.user.preferredLanguage}; path=/; max-age=${365 * 24 * 60 * 60}; samesite=lax`
      }
    }
  }, [session?.user?.preferredLanguage])

  return <>{children}</>
}