'use client'

import { useDevAutoLogin } from '@/hooks/use-dev-auto-login'

interface DevAutoLoginProviderProps {
  children: React.ReactNode
}

/**
 * Development Auto-Login Provider
 * 
 * Wraps the application and maintains dev session.
 * Only active in development mode when configured.
 */
export function DevAutoLoginProvider({ children }: DevAutoLoginProviderProps) {
  const { isChecking, isEnabled } = useDevAutoLogin()

  // Always render children immediately
  // The hook works in the background
  return <>{children}</>
}