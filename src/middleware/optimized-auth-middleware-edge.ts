import { NextRequest, NextResponse } from 'next/server';
import { optimizedAuth } from '@/utils/supabase/optimized-auth-edge';

// Edge Runtime compatible auth middleware (no Redis)
// Redis caching is handled in API routes, not middleware

// Performance monitoring
class OptimizationLogger {
  private context: string;
  private category: string;

  constructor(context: string, category: string) {
    this.context = context;
    this.category = category;
  }

  info(message: string, data?: any) {
    console.log(`[${this.context}:${this.category}] ${message}`, data || '');
  }

  error(message: string, error?: any) {
    console.error(`[${this.context}:${this.category}] ${message}`, error || '');
  }

  performance(operation: string, duration: number, cached: boolean = false) {
    const cacheInfo = cached ? ' (CACHED)' : ' (COMPUTED)';
    console.log(`[${this.context}:${this.category}] ${operation}: ${duration}ms${cacheInfo}`);
  }
}

const logger = new OptimizationLogger('auth-optimization', 'middleware-edge');

// Simple in-memory cache for Edge Runtime
const edgeCache = new Map<string, { data: any; expires: number }>();
const EDGE_CACHE_TTL = 60 * 1000; // 1 minute

class AuthMiddleware {
  async optimized(request: NextRequest, returnUser: boolean = false): Promise<{ user?: any; response?: NextResponse }> {
    const startTime = Date.now();

    try {
      // For Edge Runtime, we use session cookies instead of Redis cache
      const sessionCookie = request.cookies.get('sb-access-token');
      
      if (!sessionCookie) {
        logger.info('No session cookie found');
        return { response: new NextResponse('Unauthorized', { status: 401 }) };
      }

      // Create a cache key based on the session token
      const cacheKey = `auth:${sessionCookie.value.substring(0, 20)}`;
      
      // Check in-memory cache
      const cached = edgeCache.get(cacheKey);
      if (cached && cached.expires > Date.now()) {
        const duration = Date.now() - startTime;
        logger.performance('Edge cache hit', duration, true);
        return { user: cached.data };
      }

      // Get user from optimized auth (without Redis)
      const user = await optimizedAuth.getUser(request);
      const duration = Date.now() - startTime;
      
      if (!user) {
        logger.info(`Auth check failed (${duration}ms)`);
        return { response: new NextResponse('Unauthorized', { status: 401 }) };
      }

      // Cache in Edge Runtime memory
      edgeCache.set(cacheKey, {
        data: user,
        expires: Date.now() + EDGE_CACHE_TTL
      });

      // Clean up expired entries
      if (edgeCache.size > 1000) {
        const now = Date.now();
        for (const [key, value] of edgeCache.entries()) {
          if (value.expires < now) {
            edgeCache.delete(key);
          }
        }
      }

      logger.performance('Auth check completed', duration, false);
      
      if (returnUser) {
        return { user };
      }

      return {};
    } catch (error) {
      logger.error('Auth middleware error', error);
      return { response: new NextResponse('Internal Server Error', { status: 500 }) };
    }
  }
}

export const authMiddleware = new AuthMiddleware();