import { createClient } from './server';
import { db } from '@/lib/db/index';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/db/types';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  preferredLanguage: string | null;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.error('Supabase auth error:', error);
      return null;
    }

    // Get full user details from database
    const dbUser = await db.user.findUnique({
      where: { email: user.email! },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        preferredLanguage: true
      }
    });

    if (!dbUser || !dbUser.isActive) {
      return null;
    }

    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
      preferredLanguage: dbUser.preferredLanguage
    };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return user;
}

export async function requireRole(
  request: NextRequest, 
  allowedRoles: UserRole[]
): Promise<AuthenticatedUser | NextResponse> {
  const userOrResponse = await requireAuth(request);
  
  if (userOrResponse instanceof NextResponse) {
    return userOrResponse;
  }
  
  const user = userOrResponse;
  
  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }
  
  return user;
}

// Permission checking functions (migrated from NextAuth)
export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  const permissions = rolePermissions[userRole] || [];
  
  return permissions.some(permission => 
    (permission.resource === '*' || permission.resource === resource) &&
    (permission.action === '*' || permission.action === action)
  );
}

export function canAccessResource(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'read');
}

export function canModifyResource(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'write');
}

// Role-based permissions matrix (migrated from NextAuth)
const rolePermissions: Record<UserRole, Array<{resource: string, action: string}>> = {
  SUPERUSER: [
    { resource: '*', action: '*' }
  ],
  ADMIN: [
    { resource: 'users', action: '*' },
    { resource: 'customers', action: '*' },
    { resource: 'inquiries', action: '*' },
    { resource: 'inquiry-items', action: '*' },
    { resource: 'quotes', action: '*' },
    { resource: 'production-orders', action: '*' },
    { resource: 'business_partners', action: '*' },
    { resource: 'reports', action: 'read' },
    { resource: 'settings', action: '*' },
    { resource: 'workload', action: 'read' }
  ],
  MANAGER: [
    { resource: 'inquiries', action: 'read' },
    { resource: 'quotes', action: 'read' },
    { resource: 'production-orders', action: 'read' },
    { resource: 'approvals', action: '*' },
    { resource: 'reports', action: 'read' },
    { resource: 'cost-calculations', action: 'approve' }
  ],
  SALES: [
    { resource: 'customers', action: '*' },
    { resource: 'inquiries', action: '*' },
    { resource: 'quotes', action: '*' },
    { resource: 'reports', action: 'read' }
  ],
  VPP: [
    { resource: 'inquiries', action: 'read' },
    { resource: 'inquiry-items', action: 'read' },
    { resource: 'inquiry-items', action: 'assign' },
    { resource: 'users', action: 'read' },
    { resource: 'customers', action: 'read' },
    { resource: 'workload', action: 'read' }
  ],
  VP: [
    { resource: 'inquiry-items', action: 'read' },
    { resource: 'cost-calculations', action: '*' },
    { resource: 'tech-assignments', action: '*' }
  ],
  TECH: [
    { resource: 'inquiry-items', action: 'read' },
    { resource: 'technical-tasks', action: '*' },
    { resource: 'documentation', action: '*' }
  ]
};

// Helper function to get user permissions
export function getUserPermissions(userRole: UserRole) {
  return rolePermissions[userRole] || [];
}

// Helper function to check if user can assign items
export function canAssignItems(userRole: UserRole): boolean {
  return userRole === 'VPP' || userRole === 'ADMIN' || userRole === 'SUPERUSER';
}

// Helper function to check if user can calculate costs
export function canCalculateCosts(userRole: UserRole): boolean {
  return userRole === 'VP' || userRole === 'ADMIN' || userRole === 'SUPERUSER';
}

// Helper function to check if user can approve
export function canApprove(userRole: UserRole): boolean {
  return userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'SUPERUSER';
}

// Helper function to check if user can create quotes
export function canCreateQuotes(userRole: UserRole): boolean {
  return userRole === 'SALES' || userRole === 'ADMIN' || userRole === 'SUPERUSER';
}