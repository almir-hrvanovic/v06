import { NextRequest, NextResponse } from 'next/server';

// Simplified health check endpoint - we'll implement auth checking inside
export async function GET(request: NextRequest) {
  try {
    // Dynamic imports to avoid build-time issues
    const [
      { optimizedAuth },
      { cache },
      { getMiddlewareStats }
    ] = await Promise.all([
      import('@/utils/supabase/optimized-auth'),
      import('@/lib/upstash-redis'),
      import('@/middleware/optimized-auth-middleware').then(m => ({ getMiddlewareStats: m.getMiddlewareStats }))
    ]);

    // Check if user has permission
    const user = await optimizedAuth.getUser(request);
    if (!user || !['SUPERUSER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get auth system health
    const authHealth = await optimizedAuth.healthCheck();
    
    // Get cache statistics
    const cacheStats = cache.getStats();
    
    // Get middleware performance stats
    const middlewareStats = getMiddlewareStats();
    
    const healthData = {
      timestamp: new Date().toISOString(),
      authSystem: {
        status: authHealth.status,
        cacheHitRate: authHealth.cacheHitRate,
        avgResponseTime: authHealth.avgResponseTime,
        errors: authHealth.errors
      },
      cacheMetrics: {
        totalOperations: cacheStats.operations,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hitRate,
        averageTime: cacheStats.avgTime
      },
      middlewareStats: {
        routeCacheSize: middlewareStats.routeCacheSize,
        routeCacheEfficiency: middlewareStats.routeCacheEntries.length > 0 ? 
          middlewareStats.routeCacheEntries.filter((e: any) => e.hasUser).length / middlewareStats.routeCacheEntries.length * 100 : 0
      },
      systemInfo: {
        nodeVersion: process.version,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        platform: process.platform
      }
    };
    
    // Determine overall health status
    let overallStatus = 'healthy';
    if (authHealth.status === 'unhealthy' || cacheStats.hitRate < 30) {
      overallStatus = 'unhealthy';
    } else if (authHealth.status === 'degraded' || cacheStats.hitRate < 60) {
      overallStatus = 'degraded';
    }
    
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json({
      status: overallStatus,
      ...healthData
    }, { status: statusCode });
    
  } catch (error) {
    console.error('Auth health check error:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}