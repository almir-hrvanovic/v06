'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

/**
 * Development Auto-Login Hook
 * 
 * This hook maintains a persistent session for development.
 * It checks if you're logged in as the configured dev user,
 * and helps maintain that session.
 * 
 * SECURITY WARNING: Only works in development mode!
 */
export function useDevAutoLogin() {
  const [isChecking, setIsChecking] = useState(true)
  const [isEnabled, setIsEnabled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') {
      setIsChecking(false)
      return
    }

    // Check if dev auto-login is enabled
    const enabled = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === 'true'
    const devEmail = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL
    
    if (!enabled || !devEmail) {
      setIsChecking(false)
      return
    }

    setIsEnabled(true)
    
    // Show warning in console
    console.warn('🔐 DEV AUTO-LOGIN ENABLED')
    console.warn(`📧 Dev Email: ${devEmail}`)
    console.warn('⚠️  This is for DEVELOPMENT ONLY!')
    console.warn('⚠️  Make sure DEV_AUTO_LOGIN is set to false in production!')

    async function checkAndMaintainSession() {
      const supabase = createClient()
      
      try {
        // Check current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user?.email === devEmail) {
          console.log('✅ Dev session active:', devEmail)
          setIsChecking(false)
          return
        }
        
        if (!session) {
          console.log('❌ No session found')
          console.log('🔑 Attempting automatic login...')
          
          // Try automatic login via API
          try {
            const response = await fetch('/api/dev-auto-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include'
            })
            
            const data = await response.json()
            
            if (response.ok && data.success) {
              console.log('✅ Automatic login successful!')
              console.log('🔄 Refreshing page to load authenticated session...')
              
              // Wait a moment for the session to be established
              setTimeout(() => {
                router.refresh()
                window.location.reload()
              }, 500)
            } else {
              console.error('❌ Automatic login failed:', data.error)
              console.log('📝 Please configure DEV_AUTO_LOGIN_PASSWORD in .env.local')
              console.log('   Or login manually at /auth/signin')
              console.log(`   Email: ${devEmail}`)
            }
          } catch (error) {
            console.error('❌ Error during automatic login:', error)
            console.log('📝 Fallback: Please login manually at /auth/signin')
          }
        } else {
          console.log('⚠️  Logged in as different user:', session.user.email)
          console.log('   Sign out to use dev auto-login')
        }
      } catch (error) {
        console.error('Error checking dev session:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkAndMaintainSession()

    // Set up auth state listener
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        console.warn('🔓 Dev user signed out - session ended')
      } else if (event === 'SIGNED_IN' && session?.user?.email === devEmail) {
        console.log('✅ Dev user signed in successfully')
        // Refresh the page to ensure all components get the new session
        router.refresh()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return { isChecking, isEnabled }
}