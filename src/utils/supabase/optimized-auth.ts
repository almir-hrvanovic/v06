import { createClient } from './server';
import { db } from '@/lib/db/index';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/db/types';
import { cache, cacheKeys } from '@/lib/upstash-redis';
import { OptimizationLogger } from '@/lib/optimization-logger';

// Create logger for auth system debugging
const logger = new OptimizationLogger('CRIT-005', 'auth-system');
logger.log('INFO', 'Optimized auth module loaded');

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  preferredLanguage: string | null;
}

export interface CachedSession {
  user: AuthenticatedUser;
  supabaseUserId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  permissions: string[];
}

// Supabase client singleton to avoid recreation
class SupabaseClientSingleton {
  private static instance: SupabaseClientSingleton;
  private clientPromise: Promise<any> | null = null;

  private constructor() {}

  static getInstance(): SupabaseClientSingleton {
    if (!SupabaseClientSingleton.instance) {
      SupabaseClientSingleton.instance = new SupabaseClientSingleton();
    }
    return SupabaseClientSingleton.instance;
  }

  async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = createClient();
    }
    return this.clientPromise;
  }

  // Reset client (useful for testing or config changes)
  reset() {
    this.clientPromise = null;
  }
}

const supabaseClientSingleton = SupabaseClientSingleton.getInstance();

// Request-level cache to prevent duplicate auth checks within same request
const requestCache = new Map<string, Promise<AuthenticatedUser | null>>();

// Extract session token from request
function getSessionToken(request: NextRequest): string | null {
  logger.startOperation('getSessionToken');
  
  // Check authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    logger.endOperation('getSessionToken', true, { source: 'auth-header' });
    return token;
  }
  
  // Log all available cookies for debugging
  const allCookies = request.cookies.getAll();
  logger.log('DEBUG', 'Available cookies', { 
    cookieNames: allCookies.map(c => c.name),
    cookieCount: allCookies.length 
  });
  
  // Try to find Supabase auth cookie
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    logger.log('DEBUG', 'Supabase project reference', { projectRef });
    
    if (projectRef) {
      // Try the standard Supabase cookie name pattern
      const cookieName = `sb-${projectRef}-auth-token`;
      const authToken = request.cookies.get(cookieName)?.value;
      
      if (authToken) {
        logger.log('INFO', 'Found Supabase auth cookie', { cookieName });
        try {
          const parsed = JSON.parse(authToken);
          const token = parsed.access_token || authToken;
          logger.endOperation('getSessionToken', true, { 
            source: 'supabase-cookie',
            hasAccessToken: !!parsed.access_token 
          });
          return token;
        } catch (e) {
          logger.log('WARNING', 'Failed to parse auth cookie', { error: e });
          logger.endOperation('getSessionToken', true, { source: 'supabase-cookie-raw' });
          return authToken;
        }
      }
    }
  }
  
  // Fallback to any sb-*-auth-token cookie
  logger.log('DEBUG', 'Trying fallback cookie search');
  for (const cookie of allCookies) {
    if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
      logger.log('INFO', 'Found auth cookie via fallback', { cookieName: cookie.name });
      try {
        const parsed = JSON.parse(cookie.value);
        const token = parsed.access_token || cookie.value;
        logger.endOperation('getSessionToken', true, { 
          source: 'fallback-cookie',
          cookieName: cookie.name 
        });
        return token;
      } catch {
        logger.endOperation('getSessionToken', true, { 
          source: 'fallback-cookie-raw',
          cookieName: cookie.name 
        });
        return cookie.value;
      }
    }
  }

  logger.log('WARNING', 'No session token found');
  logger.endOperation('getSessionToken', false, { reason: 'no-token-found' });
  return null;
}

// Get user permissions based on role (cached)
export function getUserPermissions(userRole: UserRole): string[] {
  const rolePermissions: Record<UserRole, string[]> = {
    SUPERUSER: ['*'],
    ADMIN: ['users:*', 'customers:*', 'inquiries:*', 'quotes:*', 'reports:read', 'settings:*'],
    MANAGER: ['inquiries:read', 'quotes:read', 'approvals:*', 'reports:read'],
    SALES: ['customers:*', 'inquiries:*', 'quotes:*', 'reports:read'],
    VPP: ['inquiries:read', 'users:read', 'workload:read'],
    VP: ['cost-calculations:*', 'tech-assignments:*'],
    TECH: ['technical-tasks:*', 'documentation:*']
  };
  
  return rolePermissions[userRole] || [];
}

// Fast permission check (in-memory)
export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  const permissions = getUserPermissions(userRole);
  
  // Check for wildcard permissions
  if (permissions.includes('*')) return true;
  
  // Check for exact match
  if (permissions.includes(`${resource}:${action}`)) return true;
  
  // Check for resource wildcard
  if (permissions.includes(`${resource}:*`)) return true;
  
  return false;
}

// Optimized user authentication with multi-level caching
export async function getAuthenticatedUserOptimized(request: NextRequest): Promise<AuthenticatedUser | null> {
  logger.startOperation('getAuthenticatedUserOptimized');
  const startTime = Date.now();
  
  const sessionToken = getSessionToken(request);
  
  if (!sessionToken) {
    logger.log('WARNING', 'No session token found in request', {
      path: request.nextUrl.pathname,
      method: request.method
    });
    logger.endOperation('getAuthenticatedUserOptimized', false, { 
      reason: 'no-token',
      duration: Date.now() - startTime 
    });
    return null;
  }
  
  logger.log('DEBUG', 'Session token found, proceeding with auth check');

  // Request-level cache check (prevents duplicate checks in same request)
  const requestKey = `req:${sessionToken}`;
  if (requestCache.has(requestKey)) {
    const result = await requestCache.get(requestKey)!;
    logger.performance('Auth Check - Request Cache', Date.now() - startTime, true);
    return result;
  }

  // Create request-level cache promise
  const authPromise = authenticateUser(sessionToken);
  requestCache.set(requestKey, authPromise);
  
  // Clean up request cache after 30 seconds
  setTimeout(() => requestCache.delete(requestKey), 30000);
  
  const result = await authPromise;
  logger.performance('Auth Check - Total', Date.now() - startTime, false);
  return result;
}

async function authenticateUser(sessionToken: string): Promise<AuthenticatedUser | null> {
  logger.startOperation('authenticateUser');
  
  try {
    const cacheKey = cacheKeys.session(sessionToken);
    logger.log('DEBUG', 'Checking Redis cache', { cacheKey });
    
    // 1. Try Redis cache first (fastest)
    try {
      const cached = await cache.get<CachedSession>(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        logger.log('INFO', 'Redis cache HIT', { 
          email: cached.user.email,
          expiresIn: cached.expiresAt - Date.now() 
        });
        logger.endOperation('authenticateUser', true, { source: 'redis-cache' });
        return cached.user;
      }
      logger.log('DEBUG', 'Redis cache MISS');
    } catch (redisError) {
      logger.log('WARNING', 'Redis error, falling back to database', { error: redisError });
    }
    
    // 2. Get Supabase client (singleton)
    logger.log('DEBUG', 'Getting Supabase client');
    const supabase = await supabaseClientSingleton.getClient();
    
    // 3. Verify current session with Supabase
    logger.log('DEBUG', 'Verifying session with Supabase');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      logger.log('ERROR', 'Supabase auth verification failed', { 
        error: error?.message,
        hasUser: !!user 
      });
      logger.endOperation('authenticateUser', false, { reason: 'supabase-auth-failed' });
      return null;
    }
    
    logger.log('INFO', 'Supabase auth successful', { userId: user.id, email: user.email });

    // 4. Get user from database (with caching)
    const dbUserKey = cacheKeys.userByEmail(user.email!);
    let dbUser = await cache.get<any>(dbUserKey);
    
    if (!dbUser) {
      logger.info(`DB user cache MISS: ${user.email}`);
      dbUser = await db.user.findUnique({
        where: { email: user.email! }
      });
      
      if (dbUser) {
        // Cache user for 5 minutes
        await cache.set(dbUserKey, dbUser, 300);
      }
    } else {
      logger.info(`DB user cache HIT: ${user.email}`);
    }

    if (!dbUser || !dbUser.isActive) {
      return null;
    }

    const authenticatedUser: AuthenticatedUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      preferredLanguage: dbUser.preferredLanguage
    };

    // 5. Cache the complete session (15 minutes)
    const cachedSession: CachedSession = {
      user: authenticatedUser,
      supabaseUserId: user.id,
      accessToken: sessionToken,
      refreshToken: '', // We don't store refresh tokens in cache for security
      expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
      permissions: getUserPermissions(dbUser.role)
    };

    await cache.set(cacheKey, cachedSession, 900); // 15 minutes
    logger.info(`Session cached: ${user.email} (15min TTL)`);

    return authenticatedUser;

  } catch (error) {
    logger.error('Error in optimized auth flow:', error);
    return null;
  }
}

// Optimized auth requirement with caching
export async function requireAuthOptimized(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUserOptimized(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return user;
}

// Optimized role requirement with parallel permission checks
export async function requireRoleOptimized(
  request: NextRequest, 
  allowedRoles: UserRole[]
): Promise<AuthenticatedUser | NextResponse> {
  const userOrResponse = await requireAuthOptimized(request);
  
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse;
  }
  
  const user = userOrResponse;
  
  // Fast in-memory role check
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  return user;
}

// Batch permission checks (for complex authorization)
export async function checkMultiplePermissions(
  user: AuthenticatedUser,
  checks: Array<{ resource: string; action: string }>
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  // All checks run in parallel (synchronous for role-based permissions)
  checks.forEach(({ resource, action }) => {
    const key = `${resource}:${action}`;
    results[key] = hasPermission(user.role, resource, action);
  });
  
  return results;
}

// Session invalidation helpers
export async function invalidateUserSession(userId: string) {
  // Clear all session caches for this user
  await cache.clearPattern(`session:*`);
  await cache.del(cacheKeys.user(userId));
  logger.info(`Invalidated all sessions for user: ${userId}`);
}

export async function invalidateSessionToken(sessionToken: string) {
  await cache.del(cacheKeys.session(sessionToken));
  logger.info(`Invalidated session token`);
}

// Health check for auth system
export async function authHealthCheck(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  cacheHitRate: number;
  avgResponseTime: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  try {
    // Test Supabase connection
    const supabase = await supabaseClientSingleton.getClient();
    await supabase.auth.getSession();
  } catch (error) {
    errors.push('Supabase connection failed');
    status = 'unhealthy';
  }
  
  try {
    // Test database connection - using findMany with take limit for compatibility
    await db.user.findMany({ take: 1 });
  } catch (error) {
    errors.push('Database connection failed');
    status = 'unhealthy';
  }
  
  // Get cache statistics
  const cacheStats = cache.getStats();
  
  if (cacheStats.hitRate < 50) {
    status = status === 'unhealthy' ? 'unhealthy' : 'degraded';
    errors.push('Low cache hit rate');
  }
  
  return {
    status,
    cacheHitRate: cacheStats.hitRate,
    avgResponseTime: cacheStats.avgTime,
    errors
  };
}

// Export optimized functions as default
export const optimizedAuth = {
  getUser: getAuthenticatedUserOptimized,
  requireAuth: requireAuthOptimized,
  requireRole: requireRoleOptimized,
  hasPermission,
  checkMultiplePermissions,
  invalidateUserSession,
  invalidateSessionToken,
  healthCheck: authHealthCheck
};