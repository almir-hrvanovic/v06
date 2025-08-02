import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db/index'
import { UserRole } from '@/lib/db/types'

export async function getAuthenticatedUserFromRequest(request: NextRequest) {
  try {
    // Create Supabase client with proper cookie handling
    const supabase = await createClient()
    
    // Get the current user from Supabase
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.log('[API Auth] No authenticated user found:', error?.message)
      return null
    }
    
    // Get full user details from database
    const dbUser = await db.user.findUnique({
      where: { email: user.email! },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferredLanguage: true
      }
    })
    
    if (!dbUser) {
      console.log('[API Auth] User not found in database:', user.email)
      return null
    }
    
    return dbUser
  } catch (error) {
    console.error('[API Auth] Error getting authenticated user:', error)
    return null
  }
}

// Permission checking functions
export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  const permissions = rolePermissions[userRole] || [];
  
  return permissions.some(permission => 
    (permission.resource === '*' || permission.resource === resource) &&
    (permission.action === '*' || permission.action === action)
  );
}

// Role-based permissions matrix
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

// Helper function to check if user can assign items
export function canAssignItems(userRole: UserRole): boolean {
  return userRole === 'VPP' || userRole === 'ADMIN' || userRole === 'SUPERUSER';
}

// Helper function to check if user can calculate costs
export function canCalculateCosts(userRole: UserRole): boolean {
  return userRole === 'VP' || userRole === 'ADMIN' || userRole === 'SUPERUSER';
}