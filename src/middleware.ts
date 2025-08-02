import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applySecurity, securityHeaders, corsHeaders } from '@/middleware/security'
import { serverMonitor } from '@/lib/server-monitoring'
import { authMiddleware } from '@/middleware/optimized-auth-middleware-edge'
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
  
  // Create default response
  let response = NextResponse.next()
  
  // Allow access to public routes (no auth needed)
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return securityHeaders(corsHeaders(request, response))
  }

  // TEMPORARILY DISABLED - Auth check moved to API routes
  // The optimized auth middleware is looking for wrong cookie names
  // Each API route will handle its own auth for now
  
  // Skip auth check in middleware for API routes
  if (pathname.startsWith('/api')) {
    // Let API routes handle their own auth
    response.headers.set('x-auth-duration', '0ms')
    response.headers.set('x-auth-cached', 'skipped')
  } else if (pathname.startsWith(PROTECTED_ROUTES.dashboard)) {
    // For dashboard routes, we still need to check auth
    // But use a simple check for now
    const supabaseToken = request.cookies.getAll().find(cookie => 
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    )
    
    if (!supabaseToken) {
      console.log('No Supabase auth token found, redirecting to signin')
      return NextResponse.redirect(new URL(AUTH_URLS.signIn, request.url))
    }
  }
  
  // Add monitoring headers
  response.headers.set('x-request-id', requestId)
  response.headers.set('x-server-monitoring', 'active')
  response.headers.set('x-auth-duration', `${authDuration}ms`)
  response.headers.set('x-auth-cached', authDuration < 50 ? 'true' : 'false')
  
  // Add API optimization headers for API routes
  if (pathname.startsWith('/api')) {
    response.headers.set('x-api-optimization', 'enabled')
    // Enable compression support signaling
    response.headers.set('vary', 'Accept-Encoding')
  }
  
  if (isPlaywright) {
    response.headers.set('x-playwright-monitored', 'true')
  }
  
  // Log response
  const duration = Date.now() - startTime
  serverMonitor.log({
    level: response.status >= 400 ? 'warn' : 'info',
    source: 'middleware',
    message: `${request.method} ${pathname} - ${response.status} (${duration}ms, auth: ${authDuration}ms)`,
    requestId,
    endpoint: pathname,
    method: request.method,
    statusCode: response.status,
    duration,
    data: {
      isPlaywright,
      finalStatus: response.status,
      authDuration,
      authCached: authDuration < 50,
      hasUser: !!authResult.user
    }
  })
  
  return securityHeaders(corsHeaders(request, response))
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.json|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
  ],
}