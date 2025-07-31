/**
 * Development Auto-Login Service
 * 
 * SECURITY WARNING: This is for development only!
 * Never use this in production environments.
 */

import { createClient } from '@/utils/supabase/client'

// Check if dev auto-login is enabled
export function isDevAutoLoginEnabled(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    process.env.NODE_ENV === 'development' &&
    process.env.DEV_AUTO_LOGIN === 'true' &&
    !!process.env.DEV_AUTO_LOGIN_EMAIL
  )
}

// Get the configured dev email
export function getDevAutoLoginEmail(): string | null {
  if (!isDevAutoLoginEnabled()) return null
  return process.env.DEV_AUTO_LOGIN_EMAIL || null
}

// Get dev password (server-side only)
export function getDevPassword(): string | null {
  if (!isDevAutoLoginEnabled()) return null
  // This is server-side only, not exposed to client
  return process.env.DEV_AUTO_LOGIN_PASSWORD || null
}

// Perform auto-login
export async function performDevAutoLogin() {
  if (!isDevAutoLoginEnabled()) {
    return { success: false, error: 'Dev auto-login is not enabled' }
  }

  const email = getDevAutoLoginEmail()
  if (!email) {
    return { success: false, error: 'No dev email configured' }
  }

  try {
    console.warn('🔐 DEV AUTO-LOGIN: Attempting to auto-login as:', email)
    console.warn('⚠️  This is for development only and should NEVER be used in production!')
    
    const supabase = createClient()
    
    // First check if already logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email === email) {
      console.log('✅ DEV AUTO-LOGIN: Already logged in as', email)
      return { success: true, alreadyLoggedIn: true }
    }
    
    // Check if we have a password configured (note: this won't work client-side)
    const password = getDevPassword()
    if (password) {
      console.log('🔑 DEV AUTO-LOGIN: Attempting password-based login...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('❌ DEV AUTO-LOGIN: Password login failed:', error.message)
        return { 
          success: false, 
          error: error.message,
          requiresManualLogin: true 
        }
      }
      
      if (data?.user) {
        console.log('✅ DEV AUTO-LOGIN: Successfully logged in with password')
        return { success: true, user: data.user }
      }
    }
    
    // Fallback message if no password configured
    console.warn('📧 DEV AUTO-LOGIN: No password configured')
    console.warn('   Add DEV_AUTO_LOGIN_PASSWORD to .env.local for automatic login')
    console.warn('   Or login manually at /auth/signin')
    
    return { 
      success: false, 
      error: 'No password configured for auto-login',
      requiresManualLogin: true 
    }
    
  } catch (error) {
    console.error('❌ DEV AUTO-LOGIN: Error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Check and maintain session
export async function checkDevSession() {
  if (!isDevAutoLoginEnabled()) return null
  
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  const devEmail = getDevAutoLoginEmail()
  if (session?.user?.email === devEmail) {
    return session
  }
  
  return null
}