import { NextRequest, NextResponse } from 'next/server'
import { optimizedAuth } from '@/utils/supabase/optimized-auth'
import { db } from '@/lib/db/index'
import { cache, cacheKeys } from '@/lib/upstash-redis'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const authUser = await optimizedAuth.getUser(request)
    
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Cache key based on user email
    const cacheKey = cacheKeys.userByEmail(authUser.email!)
    
    // Try cache first (5-minute TTL)
    const cachedUser = await cache.get(cacheKey)
    if (cachedUser) {
      const duration = Date.now() - startTime
      console.log(`[API] /users/me cache HIT (${duration}ms) for ${authUser.email}`)
      return NextResponse.json(cachedUser)
    }

    // Cache miss - fetch from database
    console.log(`[API] /users/me cache MISS for ${authUser.email} - querying database`)
    const dbUser = await db.user.findUnique({
      where: { email: authUser.email! }
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Cache the result for 5 minutes (300 seconds)
    await cache.set(cacheKey, dbUser, 300)
    
    // Also cache by user ID for consistency
    await cache.set(cacheKeys.user(dbUser.id), dbUser, 300)
    
    const duration = Date.now() - startTime
    console.log(`[API] /users/me database query completed (${duration}ms) for ${authUser.email}`)

    return NextResponse.json(dbUser)
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`[API] /users/me error (${duration}ms):`, error)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}