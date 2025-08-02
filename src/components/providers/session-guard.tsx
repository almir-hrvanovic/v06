'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface SessionGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function SessionGuard({ children, redirectTo = '/' }: SessionGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // Loading state - keep it minimal to prevent flashing
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  // Authenticated
  return <>{children}</>
}