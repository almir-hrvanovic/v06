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

  // Use optimized auth middleware for protected routes
  const authStartTime = Date.now()
  const authResult = await authMiddleware.optimized(request, true)
  const authDuration = Date.now() - authStartTime
  
  console.log('Optimized middleware check:', { 
    pathname, 
    hasUser: !!authResult.user,
    userEmail: authResult.user?.email,
    authDuration: `${authDuration}ms`,
    cached: authDuration < 50 // Likely cached if under 50ms
  })

  // Handle auth failures
  if (authResult.response) {
    // For dashboard routes, redirect to signin
    if (pathname.startsWith(PROTECTED_ROUTES.dashboard) && authResult.response.status === 401) {
      console.log('Redirecting to signin - optimized auth failed')
      return NextResponse.redirect(new URL(AUTH_URLS.signIn, request.url))
    }
    
    // For API routes, return the auth response (401/403)
    if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
      return authResult.response
    }
    
    // For other protected routes, redirect to signin
    return NextResponse.redirect(new URL(AUTH_URLS.signIn, request.url))
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