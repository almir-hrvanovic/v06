'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { autoLoginDevelopment } from '@/lib/auto-login'

export function AutoLoginProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isAutoLogging, setIsAutoLogging] = useState(false)
  const [hasAttemptedAutoLogin, setHasAttemptedAutoLogin] = useState(false)

  useEffect(() => {
    // Only run once on mount and if not already logged in
    if (
      status === 'unauthenticated' && 
      !hasAttemptedAutoLogin && 
      !isAutoLogging &&
      process.env.NODE_ENV === 'development' &&
      process.env.NEXT_PUBLIC_AUTO_LOGIN === 'true'
    ) {
      setIsAutoLogging(true)
      setHasAttemptedAutoLogin(true)

      autoLoginDevelopment().then((success) => {
        if (success) {
          // Redirect to dashboard or intended page
          if (pathname === '/' || pathname === '/auth/signin') {
            router.push('/dashboard')
          } else {
            // Refresh the current page to load with auth
            router.refresh()
          }
        }
        setIsAutoLogging(false)
      })
    }
  }, [status, hasAttemptedAutoLogin, isAutoLogging, pathname, router])

  // Show loading state during auto-login
  if (isAutoLogging) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-muted-foreground">Auto-logging in for development...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}