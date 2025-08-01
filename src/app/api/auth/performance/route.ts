import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/lib/redis';
import { apiAuth } from '@/utils/api/optimized-auth-wrapper';

// Performance monitoring endpoint for authentication system
export const GET = apiAuth.withRole(['SUPERUSER', 'ADMIN'], async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    
    // Get cache statistics
    const cacheStats = cache.getStats();
    
    // Get middleware performance stats
    const { authMiddleware } = await import('@/middleware/optimized-auth-middleware');
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
      middlewareMetrics: {
        routeCacheSize: middlewareStats.routeCacheSize,
        routeCacheEntries: detailed ? middlewareStats.routeCacheEntries : middlewareStats.routeCacheEntries.length
      },
      performance: {
        recommendations: [] as Array<{
          priority: string;
          issue: string;
          suggestion: string;
          currentValue: string;
          targetValue: string;
        }>
      }
    };
    
    // Add performance recommendations
    if (cacheStats.hitRate < 50) {
      performanceData.performance.recommendations.push({
        priority: 'high',
        issue: 'Low cache hit rate',
        suggestion: 'Consider increasing cache TTL or investigating cache invalidation patterns',
        currentValue: `${cacheStats.hitRate.toFixed(1)}%`,
        targetValue: '>70%'
      });
    }
    
    if (cacheStats.avgTime > 100) {
      performanceData.performance.recommendations.push({
        priority: 'medium',
        issue: 'High average auth time',
        suggestion: 'Check database performance and Redis connection',
        currentValue: `${cacheStats.avgTime.toFixed(1)}ms`,
        targetValue: '<50ms'
      });
    }
    
    if (middlewareStats.routeCacheSize > 1000) {
      performanceData.performance.recommendations.push({
        priority: 'low',
        issue: 'Large route cache size',
        suggestion: 'Consider reducing route cache TTL or implementing LRU eviction',
        currentValue: middlewareStats.routeCacheSize.toString(),
        targetValue: '<500'
      });
    }
    
    return NextResponse.json(performanceData);
    
  } catch (error) {
    console.error('Auth performance monitoring error:', error);
    return NextResponse.json({
      error: 'Performance monitoring failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});

// Clear cache endpoint for debugging/maintenance
export const DELETE = apiAuth.withRole(['SUPERUSER'], async (request: NextRequest, user: any) => {
  try {
    const { searchParams } = new URL(request.url);
    const cacheType = searchParams.get('type') || 'all';
    
    let clearedItems = 0;
    
    switch (cacheType) {
      case 'sessions':
        await cache.clearPattern('session:*');
        clearedItems = 1; // Pattern cleared
        break;
      case 'users':
        await cache.clearPattern('user:*');
        clearedItems = 1; // Pattern cleared
        break;
      case 'routes':
        const { authMiddleware } = await import('@/middleware/optimized-auth-middleware');
        const statsBefore = authMiddleware.getStats();
        authMiddleware.clearCache();
        clearedItems = statsBefore.routeCacheSize;
        break;
      case 'all':
      default:
        await cache.clearPattern('session:*');
        await cache.clearPattern('user:*');
        const { authMiddleware: middleware } = await import('@/middleware/optimized-auth-middleware');
        const stats = middleware.getStats();
        middleware.clearCache();
        clearedItems = stats.routeCacheSize + 2; // Route cache + 2 patterns
        break;
    }
    
    // Log cache clearing action
    console.log(`[Auth Performance] Cache cleared by ${user.email}: type=${cacheType}, items=${clearedItems}`);
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${cacheType} cache`,
      itemsCleared: clearedItems,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cache clearing error:', error);
    return NextResponse.json({
      error: 'Cache clearing failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});

// Force cache statistics logging
export const POST = apiAuth.withRole(['SUPERUSER', 'ADMIN'], async (request: NextRequest, user: any) => {
  try {
    // Force log current cache statistics
    cache.logStats();
    
    const { authMiddleware } = await import('@/middleware/optimized-auth-middleware');
    const middlewareStats = authMiddleware.getStats();
    
    console.log('[Auth Performance] Forced stats logging by:', user.email);
    console.log('[Auth Performance] Middleware stats:', middlewareStats);
    
    return NextResponse.json({
      success: true,
      message: 'Statistics logged to console',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats logging error:', error);
    return NextResponse.json({
      error: 'Stats logging failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
});