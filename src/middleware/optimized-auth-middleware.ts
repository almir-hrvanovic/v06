import { NextRequest, NextResponse } from 'next/server';
import { optimizedAuth } from '@/utils/supabase/optimized-auth';
import { cache, cacheKeys } from '@/lib/upstash-redis';

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

const logger = new OptimizationLogger('auth-optimization', 'middleware');

// Route-level auth cache to prevent duplicate middleware auth checks
const routeAuthCache = new Map<string, { 
  result: any; 
  timestamp: number; 
  sessionToken: string 
}>();

// Extract session token from request (multiple sources)
function getSessionToken(request: NextRequest): string | null {
  // 1. Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 2. Cookie-based session
  const accessToken = request.cookies.get('sb-access-token')?.value;
  if (accessToken) {
    return accessToken;
  }

  // 3. Supabase session cookies (sb-xxx-xxx format)
  const cookieNames = request.cookies.getAll()
    .filter(cookie => cookie.name.startsWith('sb-') && cookie.name.includes('auth-token'))
    .map(cookie => cookie.name);
  
  for (const cookieName of cookieNames) {
    const tokenValue = request.cookies.get(cookieName)?.value;
    if (tokenValue) {
      return tokenValue;
    }
  }

  return null;
}

// Generate cache key for route-level auth caching
function getRouteCacheKey(request: NextRequest): string {
  const { pathname } = request.nextUrl;
  const sessionToken = getSessionToken(request);
  return `route-auth:${pathname}:${sessionToken?.substring(0, 16) || 'no-token'}`;
}

// Optimized middleware auth check with aggressive caching
export async function optimizedAuthMiddleware(
  request: NextRequest,
  requireAuth: boolean = true
): Promise<{ user: any | null; response: NextResponse | null; duration: number }> {
  const startTime = Date.now();
  const { pathname } = request.nextUrl;
  const sessionToken = getSessionToken(request);
  
  // No session token and auth required
  if (!sessionToken && requireAuth) {
    logger.performance('Auth Middleware - No Token', Date.now() - startTime);
    return {
      user: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      duration: Date.now() - startTime
    };
  }
  
  if (!sessionToken) {
    logger.performance('Auth Middleware - No Auth Required', Date.now() - startTime);
    return {
      user: null,
      response: null,
      duration: Date.now() - startTime
    };
  }

  // Check route-level cache (30 second TTL)
  const routeCacheKey = getRouteCacheKey(request);
  const routeCache = routeAuthCache.get(routeCacheKey);
  
  if (routeCache && (Date.now() - routeCache.timestamp) < 30000 && routeCache.sessionToken === sessionToken) {
    logger.performance('Auth Middleware - Route Cache HIT', Date.now() - startTime, true);
    return {
      user: routeCache.result,
      response: null,
      duration: Date.now() - startTime
    };
  }

  try {
    // Use optimized auth flow
    const user = await optimizedAuth.getUser(request);
    const duration = Date.now() - startTime;
    
    if (!user && requireAuth) {
      logger.performance('Auth Middleware - Unauthorized', duration);
      return {
        user: null,
        response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        duration
      };
    }

    // Cache the result for this route/session combination
    routeAuthCache.set(routeCacheKey, {
      result: user,
      timestamp: Date.now(),
      sessionToken: sessionToken
    });

    // Clean up old cache entries (keep only last 100)
    if (routeAuthCache.size > 100) {
      const entries = Array.from(routeAuthCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, entries.length - 100);
      toDelete.forEach(([key]) => routeAuthCache.delete(key));
    }

    logger.performance('Auth Middleware - Success', duration, false);
    return {
      user,
      response: null,
      duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Auth Middleware Error:', error);
    logger.performance('Auth Middleware - Error', duration);
    
    if (requireAuth) {
      return {
        user: null,
        response: NextResponse.json({ error: 'Internal Server Error' }, { status: 500 }),
        duration
      };
    }
    
    return {
      user: null,
      response: null,
      duration
    };
  }
}

// Role-based middleware with caching
export async function requireRoleMiddleware(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ user: any | null; response: NextResponse | null; duration: number }> {
  const startTime = Date.now();
  
  // First get authenticated user
  const authResult = await optimizedAuthMiddleware(request, true);
  
  if (authResult.response || !authResult.user) {
    return authResult;
  }

  // Check role (fast in-memory check)
  if (!allowedRoles.includes(authResult.user.role)) {
    const duration = Date.now() - startTime;
    logger.performance('Role Middleware - Forbidden', duration);
    return {
      user: authResult.user,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      duration
    };
  }

  const duration = Date.now() - startTime;
  logger.performance('Role Middleware - Success', duration, authResult.duration < 50);
  
  return {
    user: authResult.user,
    response: null,
    duration
  };
}

// Permission-based middleware with caching
export async function requirePermissionMiddleware(
  request: NextRequest,
  resource: string,
  action: string
): Promise<{ user: any | null; response: NextResponse | null; duration: number }> {
  const startTime = Date.now();
  
  // First get authenticated user
  const authResult = await optimizedAuthMiddleware(request, true);
  
  if (authResult.response || !authResult.user) {
    return authResult;
  }

  // Check permission (fast in-memory check)
  const hasPermission = optimizedAuth.hasPermission(authResult.user.role, resource, action);
  
  if (!hasPermission) {
    const duration = Date.now() - startTime;
    logger.performance('Permission Middleware - Forbidden', duration);
    return {
      user: authResult.user,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
      duration
    };
  }

  const duration = Date.now() - startTime;
  logger.performance('Permission Middleware - Success', duration, authResult.duration < 50);
  
  return {
    user: authResult.user,
    response: null,
    duration
  };
}

// Batch permission checks for complex routes
export async function batchPermissionMiddleware(
  request: NextRequest,
  permissions: Array<{ resource: string; action: string; required?: boolean }>
): Promise<{ 
  user: any | null; 
  response: NextResponse | null; 
  permissions: Record<string, boolean>;
  duration: number 
}> {
  const startTime = Date.now();
  
  // First get authenticated user
  const authResult = await optimizedAuthMiddleware(request, true);
  
  if (authResult.response || !authResult.user) {
    return {
      user: authResult.user,
      response: authResult.response,
      permissions: {},
      duration: Date.now() - startTime
    };
  }

  // Check all permissions in parallel
  const permissionResults = await optimizedAuth.checkMultiplePermissions(
    authResult.user,
    permissions.map(p => ({ resource: p.resource, action: p.action }))
  );

  // Check if any required permissions are missing
  const missingRequired = permissions
    .filter(p => p.required !== false) // default to required
    .some(p => !permissionResults[`${p.resource}:${p.action}`]);

  if (missingRequired) {
    const duration = Date.now() - startTime;
    logger.performance('Batch Permission Middleware - Forbidden', duration);
    return {
      user: authResult.user,
      response: NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 }),
      permissions: permissionResults,
      duration
    };
  }

  const duration = Date.now() - startTime;
  logger.performance('Batch Permission Middleware - Success', duration, authResult.duration < 50);
  
  return {
    user: authResult.user,
    response: null,
    permissions: permissionResults,
    duration
  };
}

// Helper function to clear route auth cache
export function clearRouteAuthCache(pattern?: string) {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const [key] of routeAuthCache.entries()) {
      if (regex.test(key)) {
        routeAuthCache.delete(key);
      }
    }
  } else {
    routeAuthCache.clear();
  }
  logger.info(`Route auth cache cleared${pattern ? ` (pattern: ${pattern})` : ''}`);
}

// Middleware performance stats
export function getMiddlewareStats() {
  return {
    routeCacheSize: routeAuthCache.size,
    cacheStats: cache.getStats(),
    routeCacheEntries: Array.from(routeAuthCache.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      hasUser: !!value.result
    }))
  };
}

// Export main middleware functions
export const authMiddleware = {
  optimized: optimizedAuthMiddleware,
  requireRole: requireRoleMiddleware,
  requirePermission: requirePermissionMiddleware,
  batchPermissions: batchPermissionMiddleware,
  clearCache: clearRouteAuthCache,
  getStats: getMiddlewareStats
};