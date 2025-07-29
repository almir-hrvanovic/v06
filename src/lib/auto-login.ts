import { signIn } from 'next-auth/react'

export const DEFAULT_LOGIN_CREDENTIALS = {
  email: 'almir@al-star.im',
  password: 'password123'
}

export async function autoLoginDevelopment() {
  // Only run in development
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // Check if auto-login is enabled
  if (process.env.NEXT_PUBLIC_AUTO_LOGIN !== 'true') {
    return
  }

  try {
    console.log('🔐 Auto-login: Attempting to sign in with default credentials...')
    
    const result = await signIn('credentials', {
      email: DEFAULT_LOGIN_CREDENTIALS.email,
      password: DEFAULT_LOGIN_CREDENTIALS.password,
      redirect: false,
    })

    if (result?.ok) {
      console.log('✅ Auto-login: Successfully signed in as', DEFAULT_LOGIN_CREDENTIALS.email)
      return true
    } else {
      console.error('❌ Auto-login: Failed to sign in:', result?.error)
      return false
    }
  } catch (error) {
    console.error('❌ Auto-login: Error during auto-login:', error)
    return false
  }
}