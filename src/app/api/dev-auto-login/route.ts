import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * Dev Auto-Login API Route
 * 
 * This endpoint handles automatic login for development.
 * It reads the password from server-side environment variables.
 * 
 * SECURITY: Only works in development mode!
 */
export async function POST(request: NextRequest) {
  // Security check - only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Dev auto-login is only available in development mode' },
      { status: 403 }
    )
  }

  // Check if dev auto-login is enabled
  const isEnabled = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === 'true'
  const devEmail = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL
  const devPassword = process.env.DEV_AUTO_LOGIN_PASSWORD

  if (!isEnabled) {
    return NextResponse.json(
      { error: 'Dev auto-login is not enabled' },
      { status: 403 }
    )
  }

  if (!devEmail || !devPassword) {
    return NextResponse.json(
      { error: 'Dev auto-login credentials not configured' },
      { status: 400 }
    )
  }

  try {
    const supabase = await createClient()
    
    // Check if already logged in
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email === devEmail) {
      return NextResponse.json({
        success: true,
        message: 'Already logged in',
        user: session.user
      })
    }

    // Attempt to sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPassword
    })

    if (error) {
      console.error('Dev auto-login failed:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (data?.user) {
      console.log(`✅ Dev auto-login successful: ${devEmail}`)
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        user: data.user
      })
    }

    return NextResponse.json(
      { error: 'Login failed' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Dev auto-login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}