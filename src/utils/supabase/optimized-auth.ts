import { createClient } from './server';
import { db } from '@/lib/db/index';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/db/types';
import { cache, cacheKeys } from '@/lib/redis';

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
    const cacheInfo = cached ? ' (CACHED)' : ' (DB)';
    console.log(`[${this.context}:${this.category}] ${operation}: ${duration}ms${cacheInfo}`);
  }
}

const logger = new OptimizationLogger('auth-optimization', 'quick-wins');

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
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try cookies
  const accessToken = request.cookies.get('sb-access-token')?.value;
  if (accessToken) {
    return accessToken;
  }

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
  const startTime = Date.now();
  const sessionToken = getSessionToken(request);
  
  if (!sessionToken) {
    logger.performance('Auth Check - No Token', Date.now() - startTime);
    return null;
  }

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
  try {
    const cacheKey = cacheKeys.session(sessionToken);
    
    // 1. Try Redis cache first (fastest)
    const cached = await cache.get<CachedSession>(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.info(`Session cache HIT: ${cached.user.email}`);
      return cached.user;
    }

    logger.info('Session cache MISS - fetching from Supabase');
    
    // 2. Get Supabase client (singleton)
    const supabase = await supabaseClientSingleton.getClient();
    
    // 3. Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken);
    
    if (error || !user) {
      logger.error('Supabase auth error:', error);
      return null;
    }

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