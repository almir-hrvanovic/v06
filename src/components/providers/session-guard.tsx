'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface SessionGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function SessionGuard({ children, redirectTo = '/auth/signin' }: SessionGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push(redirectTo)
    }
  }, [session, status, router, redirectTo])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return null
  }

  // Authenticated
  return <>{children}</>
}