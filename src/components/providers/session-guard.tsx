'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SessionGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

export function SessionGuard({ children, redirectTo = '/' }: SessionGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isInitialRender, setIsInitialRender] = useState(true)

  useEffect(() => {
    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      setIsInitialRender(false)
    }, 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  // During initial render or loading, show children with smooth transition
  if (loading || isInitialRender) {
    return (
      <div className={`transition-opacity duration-300 ${isInitialRender ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  // Authenticated - show normally
  return <>{children}</>
}