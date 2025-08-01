import { NextRequest, NextResponse } from 'next/server';
import { optimizedAuth } from '@/utils/supabase/optimized-auth';
import { UserRole } from '@/lib/db/types';

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

const logger = new OptimizationLogger('auth-optimization', 'api-wrapper');

// Type definitions for API handlers
export type AuthenticatedApiHandler = (
  request: NextRequest,
  user: any,
  context?: { params?: any }
) => Promise<NextResponse> | NextResponse;

export type ApiHandlerWithAuth = (
  request: NextRequest,
  context?: { params?: any }
) => Promise<NextResponse> | NextResponse;

// Optimized wrapper for API routes that require authentication
export function withOptimizedAuth(handler: AuthenticatedApiHandler): ApiHandlerWithAuth {
  return async (request: NextRequest, context?: { params?: any }) => {
    const startTime = Date.now();
    
    try {
      // Use optimized auth flow
      const user = await optimizedAuth.getUser(request);
      const authDuration = Date.now() - startTime;
      
      if (!user) {
        logger.performance('API Auth - Unauthorized', authDuration);
        return NextResponse.json(
          { error: 'Unauthorized' },
          { 
            status: 401,
            headers: {
              'x-auth-duration': `${authDuration}ms`,
              'x-auth-cached': 'false'
            }
          }
        );
      }

      logger.performance('API Auth - Success', authDuration, authDuration < 50);
      
      // Call the actual handler with authenticated user
      const response = await handler(request, user, context);
      
      // Add auth performance headers
      response.headers.set('x-auth-duration', `${authDuration}ms`);
      response.headers.set('x-auth-cached', authDuration < 50 ? 'true' : 'false');
      response.headers.set('x-user-role', user.role);
      
      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Auth Error:', error);
      logger.performance('API Auth - Error', duration);
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { 
          status: 500,
          headers: {
            'x-auth-duration': `${duration}ms`,
            'x-auth-error': 'true'
          }
        }
      );
    }
  };
}

// Wrapper for API routes that require specific roles
export function withOptimizedRole(
  allowedRoles: UserRole[],
  handler: AuthenticatedApiHandler
): ApiHandlerWithAuth {
  return async (request: NextRequest, context?: { params?: any }) => {
    const startTime = Date.now();
    
    try {
      // Use optimized auth flow
      const user = await optimizedAuth.getUser(request);
      const authDuration = Date.now() - startTime;
      
      if (!user) {
        logger.performance('API Role Auth - Unauthorized', authDuration);
        return NextResponse.json(
          { error: 'Unauthorized' },
          { 
            status: 401,
            headers: {
              'x-auth-duration': `${authDuration}ms`,
              'x-auth-cached': 'false'
            }
          }
        );
      }

      // Check role (fast in-memory check)
      if (!allowedRoles.includes(user.role)) {
        logger.performance('API Role Auth - Forbidden', authDuration, authDuration < 50);
        return NextResponse.json(
          { error: 'Forbidden' },
          { 
            status: 403,
            headers: {
              'x-auth-duration': `${authDuration}ms`,
              'x-auth-cached': authDuration < 50 ? 'true' : 'false',
              'x-user-role': user.role,
              'x-required-roles': allowedRoles.join(',')
            }
          }
        );
      }

      logger.performance('API Role Auth - Success', authDuration, authDuration < 50);
      
      // Call the actual handler with authenticated user
      const response = await handler(request, user, context);
      
      // Add auth performance headers
      response.headers.set('x-auth-duration', `${authDuration}ms`);
      response.headers.set('x-auth-cached', authDuration < 50 ? 'true' : 'false');
      response.headers.set('x-user-role', user.role);
      response.headers.set('x-allowed-roles', allowedRoles.join(','));
      
      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Role Auth Error:', error);
      logger.performance('API Role Auth - Error', duration);
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { 
          status: 500,
          headers: {
            'x-auth-duration': `${duration}ms`,
            'x-auth-error': 'true'
          }
        }
      );
    }
  };
}

// Wrapper for API routes that require specific permissions
export function withOptimizedPermission(
  resource: string,
  action: string,
  handler: AuthenticatedApiHandler
): ApiHandlerWithAuth {
  return async (request: NextRequest, context?: { params?: any }) => {
    const startTime = Date.now();
    
    try {
      // Use optimized auth flow
      const user = await optimizedAuth.getUser(request);
      const authDuration = Date.now() - startTime;
      
      if (!user) {
        logger.performance('API Permission Auth - Unauthorized', authDuration);
        return NextResponse.json(
          { error: 'Unauthorized' },
          { 
            status: 401,
            headers: {
              'x-auth-duration': `${authDuration}ms`,
              'x-auth-cached': 'false'
            }
          }
        );
      }

      // Check permission (fast in-memory check)
      const hasPermission = optimizedAuth.hasPermission(user.role, resource, action);
      
      if (!hasPermission) {
        logger.performance('API Permission Auth - Forbidden', authDuration, authDuration < 50);
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { 
            status: 403,
            headers: {
              'x-auth-duration': `${authDuration}ms`,
              'x-auth-cached': authDuration < 50 ? 'true' : 'false',
              'x-user-role': user.role,
              'x-required-permission': `${resource}:${action}`
            }
          }
        );
      }

      logger.performance('API Permission Auth - Success', authDuration, authDuration < 50);
      
      // Call the actual handler with authenticated user
      const response = await handler(request, user, context);
      
      // Add auth performance headers
      response.headers.set('x-auth-duration', `${authDuration}ms`);
      response.headers.set('x-auth-cached', authDuration < 50 ? 'true' : 'false');
      response.headers.set('x-user-role', user.role);
      response.headers.set('x-permission-checked', `${resource}:${action}`);
      
      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Permission Auth Error:', error);
      logger.performance('API Permission Auth - Error', duration);
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { 
          status: 500,
          headers: {
            'x-auth-duration': `${duration}ms`,
            'x-auth-error': 'true'
          }
        }
      );
    }
  };
}

// Wrapper for API routes with batch permission checking
export function withOptimizedBatchPermissions(
  permissions: Array<{ resource: string; action: string; required?: boolean }>,
  handler: (
    request: NextRequest,
    user: any,
    permissions: Record<string, boolean>,
    context?: { params?: any }
  ) => Promise<NextResponse> | NextResponse
): ApiHandlerWithAuth {
  return async (request: NextRequest, context?: { params?: any }) => {
    const startTime = Date.now();
    
    try {
      // Use optimized auth flow
      const user = await optimizedAuth.getUser(request);
      const authDuration = Date.now() - startTime;
      
      if (!user) {
        logger.performance('API Batch Permission Auth - Unauthorized', authDuration);
        return NextResponse.json(
          { error: 'Unauthorized' },
          { 
            status: 401,
            headers: {
              'x-auth-duration': `${authDuration}ms`,
              'x-auth-cached': 'false'
            }
          }
        );
      }

      // Check all permissions in parallel
      const permissionResults = await optimizedAuth.checkMultiplePermissions(
        user,
        permissions.map(p => ({ resource: p.resource, action: p.action }))
      );

      // Check if any required permissions are missing
      const missingRequired = permissions
        .filter(p => p.required !== false) // default to required
        .some(p => !permissionResults[`${p.resource}:${p.action}`]);

      if (missingRequired) {
        logger.performance('API Batch Permission Auth - Forbidden', authDuration, authDuration < 50);
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { 
            status: 403,
            headers: {
              'x-auth-duration': `${authDuration}ms`,
              'x-auth-cached': authDuration < 50 ? 'true' : 'false',
              'x-user-role': user.role,
              'x-permission-results': JSON.stringify(permissionResults)
            }
          }
        );
      }

      logger.performance('API Batch Permission Auth - Success', authDuration, authDuration < 50);
      
      // Call the actual handler with authenticated user and permissions
      const response = await handler(request, user, permissionResults, context);
      
      // Add auth performance headers
      response.headers.set('x-auth-duration', `${authDuration}ms`);
      response.headers.set('x-auth-cached', authDuration < 50 ? 'true' : 'false');
      response.headers.set('x-user-role', user.role);
      response.headers.set('x-permissions-checked', permissions.length.toString());
      
      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Batch Permission Auth Error:', error);
      logger.performance('API Batch Permission Auth - Error', duration);
      
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { 
          status: 500,
          headers: {
            'x-auth-duration': `${duration}ms`,
            'x-auth-error': 'true'
          }
        }
      );
    }
  };
}

// Optional wrapper that allows both authenticated and anonymous access
export function withOptionalAuth(
  handler: (
    request: NextRequest,
    user: any | null,
    context?: { params?: any }
  ) => Promise<NextResponse> | NextResponse
): ApiHandlerWithAuth {
  return async (request: NextRequest, context?: { params?: any }) => {
    const startTime = Date.now();
    
    try {
      // Try to get user, but don't fail if not authenticated
      const user = await optimizedAuth.getUser(request);
      const authDuration = Date.now() - startTime;
      
      logger.performance('API Optional Auth', authDuration, authDuration < 50);
      
      // Call handler with user (may be null)
      const response = await handler(request, user, context);
      
      // Add auth performance headers
      response.headers.set('x-auth-duration', `${authDuration}ms`);
      response.headers.set('x-auth-cached', authDuration < 50 ? 'true' : 'false');
      response.headers.set('x-auth-optional', 'true');
      if (user) {
        response.headers.set('x-user-role', user.role);
      }
      
      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('API Optional Auth Error:', error);
      logger.performance('API Optional Auth - Error', duration);
      
      // For optional auth, continue without user on error
      const response = await handler(request, null, context);
      response.headers.set('x-auth-duration', `${duration}ms`);
      response.headers.set('x-auth-error', 'true');
      response.headers.set('x-auth-optional', 'true');
      
      return response;
    }
  };
}

// Export all wrappers
export const apiAuth = {
  withAuth: withOptimizedAuth,
  withRole: withOptimizedRole,
  withPermission: withOptimizedPermission,
  withBatchPermissions: withOptimizedBatchPermissions,
  withOptionalAuth
};