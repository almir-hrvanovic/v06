import { NextRequest, NextResponse } from 'next/server';
import { optimizedAuth } from '@/utils/supabase/optimized-auth';
import { cache } from '@/lib/redis';
import { apiAuth } from '@/utils/api/optimized-auth-wrapper';
import { UserRole } from '@/lib/db/types';

// Health check endpoint for authentication system
export const GET = apiAuth.withRole(['SUPERUSER', 'ADMIN'], async (request: NextRequest, user: any) => {
  try {
    // Get auth system health
    const authHealth = await optimizedAuth.healthCheck();
    
    // Get cache statistics
    const cacheStats = cache.getStats();
    
    // Get middleware performance stats (if available)
    const { authMiddleware } = await import('@/middleware/optimized-auth-middleware');
    const middlewareStats = authMiddleware.getStats();
    
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
          middlewareStats.routeCacheEntries.filter(e => e.hasUser).length / middlewareStats.routeCacheEntries.length * 100 : 0
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
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
});