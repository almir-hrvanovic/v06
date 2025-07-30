import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applySecurity, securityHeaders, corsHeaders } from '@/middleware/security'
import { serverMonitor } from '@/lib/server-monitoring'
import { createClient } from '@/utils/supabase/middleware'
import { AUTH_URLS, PUBLIC_ROUTES, PROTECTED_ROUTES } from '@/lib/auth-config'

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname } = request.nextUrl
  const requestId = Math.random().toString(36).substring(2)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const isPlaywright = userAgent.includes('Playwright') || request.headers.get('x-playwright') === 'true'
  
  // Log incoming request
  serverMonitor.log({
    level: 'info',
    source: 'middleware',
    message: `${request.method} ${pathname}${request.nextUrl.search}`,
    requestId,
    endpoint: pathname,
    method: request.method,
    data: {
      userAgent: isPlaywright ? 'Playwright Test' : userAgent.substring(0, 100),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      referer: request.headers.get('referer'),
      isPlaywright
    }
  })
  
  // Skip rate limiting for auth routes temporarily
  if (!pathname.startsWith('/api/auth')) {
    // Determine route type for rate limiting
    let routeType = 'default'
    if (pathname.startsWith('/api/uploadthing')) routeType = 'upload'
    else if (pathname.startsWith('/api')) routeType = 'api'
    
    // Apply security checks
    const securityResponse = await applySecurity(request, routeType)
    if (securityResponse) {
      return securityResponse
    }
  }
  
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    return corsHeaders(request, response)
  }
  
  // Create Supabase client with middleware
  const { supabase, response } = createClient(request)
  
  // Get session from Supabase
  const { data: { session } } = await supabase.auth.getSession()
  
  console.log('Middleware check:', { 
    pathname, 
    hasSession: !!session,
    userEmail: session?.user?.email
  })

  // Allow access to public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return securityHeaders(corsHeaders(request, response))
  }

  // Protect dashboard routes - redirect to signin if no session
  if (pathname.startsWith(PROTECTED_ROUTES.dashboard) && !session) {
    console.log('Redirecting to signin - no Supabase session')
    return NextResponse.redirect(new URL(AUTH_URLS.signIn, request.url))
  }

  // Protect API routes (except auth) - return 401 if no session
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth') && !session) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  
  // Add monitoring headers
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-server-monitoring', 'active')
  if (isPlaywright) {
    response.headers.set('x-playwright-monitored', 'true')
  }
  
  // Log response
  const duration = Date.now() - startTime
  serverMonitor.log({
    level: response.status >= 400 ? 'warn' : 'info',
    source: 'middleware',
    message: `${request.method} ${pathname} - ${response.status} (${duration}ms)`,
    requestId,
    endpoint: pathname,
    method: request.method,
    statusCode: response.status,
    duration,
    data: {
      isPlaywright,
      finalStatus: response.status
    }
  })
  
  return securityHeaders(corsHeaders(request, response))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.json|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
  ],
}