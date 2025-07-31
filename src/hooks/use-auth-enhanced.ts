'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User as DBUser } from '@prisma/client'
import { AUTH_URLS } from '@/lib/auth-config'

interface AuthState {
  user: (SupabaseUser & Partial<DBUser>) | null
  loading: boolean
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const router = useRouter()
  const [user, setUser] = useState<(SupabaseUser & Partial<DBUser>) | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      try {
        // Get Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Fetch additional user data from our database
          const response = await fetch('/api/users/me')
          if (response.ok) {
            const dbUser = await response.json()
            // Merge Supabase user with database user data
            setUser({
              ...user,
              ...dbUser,
              email: user.email || dbUser.email
            })
          } else {
            // If we can't get DB data, use Supabase user with defaults
            setUser({
              ...user,
              role: 'authenticated' as any,
              name: user.email?.split('@')[0] || 'User'
            })
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Error loading user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Re-fetch user data on auth change
        try {
          const response = await fetch('/api/users/me')
          if (response.ok) {
            const dbUser = await response.json()
            setUser({
              ...user,
              ...dbUser,
              email: user.email || dbUser.email
            })
          } else {
            setUser({
              ...user,
              role: 'authenticated' as any,
              name: user.email?.split('@')[0] || 'User'
            })
          }
        } catch {
          setUser({
            ...user,
            role: 'authenticated' as any,
            name: user.email?.split('@')[0] || 'User'
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push(AUTH_URLS.signIn)
  }

  return { user, loading, signOut }
}