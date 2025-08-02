'use client'

import { createContext, useContext, ReactNode, useEffect, useState, useRef } from 'react'
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

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<(SupabaseUser & Partial<DBUser>) | null>(null)
  const [loading, setLoading] = useState(true)
  const isInitialLoadRef = useRef(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadUser() {
      try {
        console.log('[useAuth] Starting auth check, isInitialLoad:', isInitialLoadRef.current);
        
        // Get Supabase session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('[useAuth] Session error:', sessionError);
          setUser(null);
          setLoading(false);
          isInitialLoadRef.current = false;
          return;
        }
        
        if (session?.user) {
          console.log('[useAuth] Session found, user:', session.user.email);
          
          // Skip API call on initial load to prevent circular dependency
          if (isInitialLoadRef.current) {
            console.log('[useAuth] Initial load - using session data only');
            // Set basic user data from session
            setUser({
              ...session.user,
              role: 'SUPERUSER' as any, // Default role, will be updated on auth state change
              name: session.user.email?.split('@')[0] || 'User'
            });
            setLoading(false);
            isInitialLoadRef.current = false;
            return;
          }
          
          // Fetch additional user data from our database (only after initial load)
          try {
            const response = await fetch('/api/users/me', {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              }
            })
            if (response.ok) {
              const dbUser = await response.json()
              console.log('Fetched DB user:', dbUser)
              // Merge Supabase user with database user data
              setUser({
                ...session.user,
                id: dbUser.id,
                role: dbUser.role,
                name: dbUser.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || dbUser.email,
                isActive: dbUser.isActive,
                preferredLanguage: dbUser.preferredLanguage
              })
            } else {
              console.warn('Failed to fetch DB user, using defaults')
              // If we can't get DB data, use Supabase user with defaults
              setUser({
                ...session.user,
                role: 'SUPERUSER' as any, // Default role for now
                name: session.user.email?.split('@')[0] || 'User'
              })
            }
          } catch (error) {
            console.error('Error fetching DB user:', error)
            // Check if it's a network error (common during initial load)
            if (error instanceof TypeError && error.message.includes('NetworkError')) {
              console.log('[useAuth] Network error - likely CORS or initial load issue, using session data')
            }
            // Fallback if API fails - use session data with defaults
            setUser({
              ...session.user,
              role: 'SUPERUSER' as any,
              name: session.user.email?.split('@')[0] || 'User'
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
        isInitialLoadRef.current = false
      }
    }

    loadUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[useAuth] Auth state changed, event:', _event);
      
      if (session?.user) {
        // For auth state changes after initial load, fetch user data
        if (!isInitialLoadRef.current) {
          setLoading(true)
          try {
            const response = await fetch('/api/users/me', {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              }
            })
            if (response.ok) {
              const dbUser = await response.json()
              setUser({
                ...session.user,
                id: dbUser.id,
                role: dbUser.role,
                name: dbUser.name || session.user.email?.split('@')[0] || 'User',
                email: session.user.email || dbUser.email,
                isActive: dbUser.isActive,
                preferredLanguage: dbUser.preferredLanguage
              })
            } else {
              setUser({
                ...session.user,
                role: 'SUPERUSER' as any,
                name: session.user.email?.split('@')[0] || 'User'
              })
            }
          } catch (error) {
            console.warn('[useAuth] Error in auth state change:', error)
            // Use session data with defaults on error
            setUser({
              ...session.user,
              role: 'SUPERUSER' as any,
              name: session.user.email?.split('@')[0] || 'User'
            })
          }
          setLoading(false)
        }
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // Remove dependencies to prevent re-runs

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push(AUTH_URLS.signIn)
  }

  const authValue: AuthState = { user, loading, signOut }

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider')
  }
  return context
}