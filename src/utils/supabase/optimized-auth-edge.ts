import { createEdgeClient } from './edge-client';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/db/types';

// Edge Runtime compatible version - no direct Redis/DB imports

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  preferredLanguage: string | null;
}

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

const logger = new OptimizationLogger('auth-optimization-edge', 'middleware');

// Permission matrix - hardcoded for Edge Runtime
const PERMISSION_MATRIX: Record<UserRole, string[]> = {
  SUPERUSER: ['all'],
  ADMIN: ['users', 'inquiries', 'analytics', 'system', 'reports'],
  MANAGER: ['inquiries', 'analytics', 'reports', 'approvals'],
  SALES: ['inquiries', 'customers', 'quotes'],
  VPP: ['inquiries', 'items', 'workload'],
  VP: ['items', 'costs'],
  TECH: ['technical-tasks', 'documentation'],
  VIEWER: ['view']
};

class OptimizedAuthEdge {
  async getUser(request: NextRequest): Promise<AuthenticatedUser | null> {
    const startTime = Date.now();
    
    try {
      // Get auth token from request
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value
      
      if (!token) {
        logger.info('No auth token found in request');
        return null;
      }
      
      const supabase = createEdgeClient(authHeader || `Bearer ${token}`);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        logger.info('No authenticated Supabase user');
        return null;
      }

      // In Edge Runtime, we'll use a simplified user object
      // Full user details are fetched in API routes with DB access
      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        role: (user.user_metadata?.role as UserRole) || 'VIEWER',
        preferredLanguage: user.user_metadata?.preferredLanguage || 'en-US'
      };

      const duration = Date.now() - startTime;
      logger.performance('Edge auth check', duration);
      
      return authenticatedUser;
    } catch (error) {
      logger.error('Edge auth error', error);
      return null;
    }
  }

  hasPermission(role: UserRole, resource: string, action: string): boolean {
    const permissions = PERMISSION_MATRIX[role] || [];
    return permissions.includes('all') || permissions.includes(resource);
  }

  async requireRole(
    request: NextRequest,
    allowedRoles: UserRole[]
  ): Promise<{ user?: AuthenticatedUser; response?: NextResponse }> {
    const user = await this.getUser(request);
    
    if (!user) {
      return {
        response: new NextResponse('Unauthorized', { status: 401 })
      };
    }

    if (!allowedRoles.includes(user.role)) {
      return {
        response: new NextResponse('Forbidden', { status: 403 })
      };
    }

    return { user };
  }
}

export const optimizedAuth = new OptimizedAuthEdge();