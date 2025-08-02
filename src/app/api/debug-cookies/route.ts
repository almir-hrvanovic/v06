import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  
  // Filter for Supabase cookies
  const supabaseCookies = allCookies.filter(cookie => 
    cookie.name.includes('sb-') || cookie.name.includes('supabase')
  )
  
  return NextResponse.json({
    totalCookies: allCookies.length,
    supabaseCookies: supabaseCookies.map(c => ({
      name: c.name,
      valueLength: c.value?.length || 0,
      hasValue: !!c.value
    })),
    allCookieNames: allCookies.map(c => c.name)
  })
}