import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'
import { cache, isRedisAvailable } from '@/lib/upstash-redis'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow admin/superuser to view cache stats
    if (!['ADMIN', 'SUPERUSER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get cache statistics
    const stats = cache.getStats()
    
    // Check Redis connection status
    const redisStatus = isRedisAvailable() ? 'connected' : 'disconnected'
    
    // Force log current metrics for visibility
    cache.logStats()

    const response = {
      redis: {
        status: redisStatus,
        connected: isRedisAvailable()
      },
      cache: {
        ...stats,
        hitRateFormatted: `${stats.hitRate.toFixed(2)}%`,
        avgTimeFormatted: `${stats.avgTime.toFixed(2)}ms`
      },
      timestamp: new Date().toISOString(),
      performance: {
        status: stats.hitRate > 50 ? 'good' : stats.hitRate > 20 ? 'fair' : 'poor',
        recommendation: stats.hitRate < 20 
          ? 'Cache hit rate is low. Consider increasing TTL values or checking cache invalidation logic.'
          : stats.hitRate < 50
          ? 'Cache hit rate is moderate. Monitor for improvements.'
          : 'Cache performance is good!'
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Cache stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Clear all caches (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow superuser to clear all caches
    if (user.role !== 'SUPERUSER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Clear all cache patterns
    await cache.clearPattern('*')
    
    console.log(`[Cache] All caches cleared by ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'All caches cleared successfully',
      clearedBy: user.email,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Cache clear error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}