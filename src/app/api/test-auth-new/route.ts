import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  console.log('[TEST-AUTH] Starting test...')
  
  try {
    // Log cookies
    const cookieHeader = request.headers.get('cookie')
    console.log('[TEST-AUTH] Cookie header:', cookieHeader?.substring(0, 100) + '...')
    
    // Test 1: Create Supabase client
    const supabase = await createClient()
    console.log('[TEST-AUTH] Supabase client created')
    
    // Test 2: Get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('[TEST-AUTH] Session check:', { 
      hasSession: !!session,
      sessionError: sessionError?.message 
    })
    
    // Test 3: Get user
    const { data: { user }, error } = await supabase.auth.getUser()
    console.log('[TEST-AUTH] Auth check result:', { 
      hasUser: !!user, 
      error: error?.message,
      email: user?.email 
    })
    
    if (error || !user) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        details: error?.message || 'No user found',
        test: 'FAILED'
      }, { status: 401 })
    }
    
    return NextResponse.json({
      test: 'SUCCESS',
      user: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error) {
    console.error('[TEST-AUTH] Error:', error)
    return NextResponse.json({ 
      error: 'Internal error',
      details: error instanceof Error ? error.message : 'Unknown error',
      test: 'ERROR'
    }, { status: 500 })
  }
}