import { NextRequest, NextResponse } from 'next/server';

// Performance monitoring endpoint for authentication system
export async function GET(request: NextRequest) {
  try {
    // Dynamic imports
    const [
      { optimizedAuth },
      { cache },
      { authMiddleware }
    ] = await Promise.all([
      import('@/utils/supabase/optimized-auth'),
      import('@/lib/upstash-redis'),
      import('@/middleware/optimized-auth-middleware')
    ]);

    // Check if user has permission
    const user = await optimizedAuth.getUser(request);
    if (!user || !['SUPERUSER', 'ADMIN'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    
    // Get cache statistics
    const cacheStats = cache.getStats();
    
    // Get middleware performance stats
    const middlewareStats = authMiddleware.getStats();
    
    const performanceData = {
      timestamp: new Date().toISOString(),
      overview: {
        cacheHitRate: cacheStats.hitRate,
        averageAuthTime: cacheStats.avgTime,
        totalAuthOperations: cacheStats.operations,
        routeCacheSize: middlewareStats.routeCacheSize
      },
      cacheMetrics: {
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.hitRate,
        totalOperations: cacheStats.operations,
        averageTime: cacheStats.avgTime
      },
      routeCache: {
        size: middlewareStats.routeCacheSize,
        entries: detailed ? middlewareStats.routeCacheEntries : undefined
      },
      recommendations: generateRecommendations(cacheStats, middlewareStats)
    };
    
    return NextResponse.json({
      success: true,
      performance: performanceData
    });
    
  } catch (error) {
    console.error('Auth performance check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Performance check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Dynamic imports
    const { optimizedAuth } = await import('@/utils/supabase/optimized-auth');

    // Check if user has permission
    const user = await optimizedAuth.getUser(request);
    if (!user || !['SUPERUSER'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { action } = await request.json();
    
    if (action === 'clear-cache') {
      const { cache } = await import('@/lib/upstash-redis');
      await cache.clearAuth();
      
      return NextResponse.json({
        success: true,
        message: 'Auth cache cleared'
      });
    }
    
    if (action === 'reset-stats') {
      const { cache } = await import('@/lib/upstash-redis');
      cache.resetStats();
      
      return NextResponse.json({
        success: true,
        message: 'Auth statistics reset'
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
    
  } catch (error) {
    console.error('Auth performance action error:', error);
    return NextResponse.json({
      success: false,
      error: 'Action failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function generateRecommendations(cacheStats: any, middlewareStats: any): string[] {
  const recommendations: string[] = [];
  
  if (cacheStats.hitRate < 60) {
    recommendations.push('Cache hit rate is low. Consider increasing cache TTL or warming cache for frequently accessed users.');
  }
  
  if (cacheStats.avgTime > 100) {
    recommendations.push('Average auth time is high. Check database connection and query performance.');
  }
  
  if (middlewareStats.routeCacheSize > 1000) {
    recommendations.push('Route cache is large. Consider implementing LRU eviction or reducing cache TTL.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Authentication system is performing optimally.');
  }
  
  return recommendations;
}