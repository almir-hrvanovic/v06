import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = {
  api: 60,          // 60 requests per minute for API routes
  auth: 5,          // 5 requests per minute for auth routes  
  upload: 10,       // 10 requests per minute for uploads
  default: 100      // 100 requests per minute for other routes
}

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

// Redis-based rate limiting for API routes
export async function redisRateLimit(request: NextRequest, routeType: string = 'default') {
  const ip = getClientIp(request)
  const key = getRateLimitKey(ip, routeType)
  const limit = RATE_LIMIT_MAX_REQUESTS[routeType as keyof typeof RATE_LIMIT_MAX_REQUESTS] || RATE_LIMIT_MAX_REQUESTS.default
  
  try {
    // Check if Redis is available
    const redisClient = await redis()
    if (!redisClient) {
      // Fallback to in-memory rate limiting if Redis unavailable
      return null
    }
    
    const current = await redisClient.incr(key)
    
    if (current === 1) {
      // First request, set expiration
      await redisClient.expire(key, Math.floor(RATE_LIMIT_WINDOW / 1000))
    }
    
    if (current > limit) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString(),
          'Retry-After': Math.floor(RATE_LIMIT_WINDOW / 1000).toString()
        }
      })
    }
    
    // Add rate limit headers
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Remaining', (limit - current).toString())
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + RATE_LIMIT_WINDOW).toISOString())
    
    return response
  } catch (error) {
    // If Redis is down, allow the request but log the error
    console.error('Redis rate limiting error:', error)
    return NextResponse.next()
  }
}