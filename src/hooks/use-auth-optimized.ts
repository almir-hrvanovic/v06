'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { User as DBUser } from '@/lib/db/types'
import { AUTH_URLS } from '@/lib/auth-config'

interface AuthState {
  user: (SupabaseUser & Partial<DBUser>) | null
  loading: boolean
  signOut: () => Promise<void>
}

// Cache for user data
let userCache: { data: any; timestamp: number } | null = null
const CACHE_DURATION = 60000 // 1 minute

// Promise to prevent concurrent fetches
let fetchPromise: Promise<any> | null = null

export function useAuth(): AuthState {
  const router = useRouter()
  const [user, setUser] = useState<(SupabaseUser & Partial<DBUser>) | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    
    async function loadUser() {
      try {
        // Get Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Check cache first
          const now = Date.now()
          if (userCache && userCache.timestamp > now - CACHE_DURATION) {
            if (isMounted.current) {
              setUser(userCache.data)
              setLoading(false)
            }
            return
          }

          // If there's already a fetch in progress, wait for it
          if (fetchPromise) {
            try {
              const cachedData = await fetchPromise
              if (isMounted.current) {
                setUser(cachedData)
              }
            } catch {
              // Use Supabase user as fallback
              if (isMounted.current) {
                setUser({
                  ...session.user,
                  role: 'SUPERUSER' as any,
                  name: session.user.email?.split('@')[0] || 'User'
                })
              }
            }
            return
          }

          // Create a new fetch promise
          fetchPromise = fetch('/api/users/me').then(async (response) => {
            if (response.ok) {
              const dbUser = await response.json()
              const mergedUser = {
                ...session.user,
                ...dbUser,
                email: session.user.email || dbUser.email
              }
              // Update cache
              userCache = { data: mergedUser, timestamp: Date.now() }
              return mergedUser
            } else {
              throw new Error('Failed to fetch user data')
            }
          }).finally(() => {
            fetchPromise = null
          })

          try {
            const userData = await fetchPromise
            if (isMounted.current) {
              setUser(userData)
            }
          } catch {
            // Fallback if API fails
            if (isMounted.current) {
              setUser({
                ...session.user,
                role: 'SUPERUSER' as any,
                name: session.user.email?.split('@')[0] || 'User'
              })
            }
          }
        } else {
          if (isMounted.current) {
            setUser(null)
            // Clear cache on logout
            userCache = null
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
        if (isMounted.current) {
          setUser(null)
        }
      } finally {
        if (isMounted.current) {
          setLoading(false)
        }
      }
    }

    loadUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Clear cache on auth change
      userCache = null
      
      if (session?.user) {
        // Re-use the loadUser logic
        if (isMounted.current) {
          setLoading(true)
          loadUser()
        }
      } else {
        if (isMounted.current) {
          setUser(null)
          setLoading(false)
        }
      }
    })

    return () => {
      isMounted.current = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    // Clear cache on signout
    userCache = null
    await supabase.auth.signOut()
    router.push(AUTH_URLS.signIn)
  }

  return { user, loading, signOut }
}