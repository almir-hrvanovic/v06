import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = {
  api: 60,          // 60 requests per minute for API routes
  auth: 5,          // 5 requests per minute for auth routes  
  upload: 10,       // 10 requests per minute for uploads
  default: 100      // 100 requests per minute for other routes
}

// In-memory rate limiting for Edge Runtime
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Get rate limit key for IP
function getRateLimitKey(ip: string, route: string): string {
  return `ratelimit:${route}:${ip}`
}

// Get client IP address
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIp) return cfConnectingIp
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  if (realIp) return realIp
  
  return '127.0.0.1'
}

// Rate limiting middleware (Edge Runtime compatible)
export async function rateLimit(request: NextRequest, routeType: string = 'default') {
  const ip = getClientIp(request)
  const key = getRateLimitKey(ip, routeType)
  const limit = RATE_LIMIT_MAX_REQUESTS[routeType as keyof typeof RATE_LIMIT_MAX_REQUESTS] || RATE_LIMIT_MAX_REQUESTS.default
  const now = Date.now()
  
  // Clean up expired entries
  for (const [k, v] of rateLimitStore.entries()) {
    if (v.resetTime < now) {
      rateLimitStore.delete(k)
    }
  }
  
  // Get or create rate limit entry
  const entry = rateLimitStore.get(key)
  
  if (!entry || entry.resetTime < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', (limit - 1).toString())
    response.headers.set('X-RateLimit-Reset', new Date(now + RATE_LIMIT_WINDOW).toISOString())
    
    return response
  }
  
  // Increment count
  entry.count++
  
  if (entry.count > limit) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
        'Retry-After': Math.floor((entry.resetTime - now) / 1000).toString()
      }
    })
  }
  
  // Add rate limit headers
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', (limit - entry.count).toString())
  response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())
  
  return response
}

// Security headers middleware
export function securityHeaders(response: NextResponse): NextResponse {
  // Basic security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss: ws:",
    "frame-src 'self' https://vercel.live",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // Strict Transport Security (only for production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  
  return response
}

// CORS configuration
export function corsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin') || ''
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'https://localhost:3000'
  ]
  
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_APP_URL) {
    allowedOrigins.push(process.env.NEXT_PUBLIC_APP_URL)
  }
  
  if (allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

// Request sanitization
export function sanitizeRequest(request: NextRequest): boolean {
  const url = request.url
  const path = new URL(url).pathname
  
  // Check for common attack patterns
  const dangerousPatterns = [
    /\.\.\//,           // Directory traversal
    /<script/i,         // XSS attempts
    /javascript:/i,     // JavaScript protocol
    /on\w+\s*=/i,      // Event handlers
    /union.*select/i,   // SQL injection
    /exec\s*\(/i,      // Command injection
    /eval\s*\(/i,      // Eval injection
  ]
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(url) || pattern.test(path)) {
      return false
    }
  }
  
  // Check query parameters
  const searchParams = new URL(url).searchParams
  for (const [key, value] of searchParams) {
    for (const pattern of dangerousPatterns) {
      if (pattern.test(key) || pattern.test(value)) {
        return false
      }
    }
  }
  
  return true
}

// Combined security middleware
export async function applySecurity(request: NextRequest, routeType: string = 'default'): Promise<NextResponse | null> {
  // Sanitize request
  if (!sanitizeRequest(request)) {
    return new NextResponse('Bad Request', { status: 400 })
  }
  
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(request, routeType)
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse
  }
  
  return null
}