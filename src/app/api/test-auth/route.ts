import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { db } from '@/lib/db/index'

export async function GET(request: NextRequest) {
  try {
    console.log('Test auth endpoint called')
    
    // Test Supabase connection
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('Supabase auth result:', { user: user?.email, error: authError })
    
    // Test database connection
    const users = await db.user.findMany({ take: 1 })
    const items = await db.inquiryItem.findMany({ take: 1 })
    const userCount = users.length > 0 ? 'connected' : 'no data'
    const itemCount = items.length > 0 ? 'connected' : 'no data'
    
    return NextResponse.json({
      success: true,
      auth: {
        isAuthenticated: !!user,
        userEmail: user?.email || null,
        authError: authError?.message || null
      },
      database: {
        connected: true,
        userCount,
        itemCount
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    })
  } catch (error) {
    console.error('Test auth error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}