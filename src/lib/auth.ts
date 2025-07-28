import type { NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export const authOptions: NextAuthConfig = {
  secret: process.env.NEXTAUTH_SECRET,
  basePath: '/api/auth',
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              password: true,
              isActive: true,
              preferredLanguage: true
            }
          })

          if (!user || !user.isActive) {
            return null
          }

          // Check password using bcrypt
          const isPasswordValid = user.password 
            ? await bcrypt.compare(credentials.password as string, user.password)
            : false

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            preferredLanguage: user.preferredLanguage,
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.NODE_ENV === 'production' ? '.al-star.im' : undefined
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role
        token.preferredLanguage = user.preferredLanguage
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.preferredLanguage = token.preferredLanguage
      }
      return session
    },
    async redirect({ url, baseUrl }: any) {
      console.log('NextAuth redirect callback:', { url, baseUrl })
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`
        console.log('Relative redirect to:', redirectUrl)
        return redirectUrl
      }
      
      // Allows callback URLs on the same origin
      if (url && new URL(url).origin === baseUrl) {
        console.log('Same origin redirect to:', url)
        return url
      }
      
      // Default redirect to dashboard
      const defaultUrl = `${baseUrl}/dashboard`
      console.log('Default redirect to:', defaultUrl)
      return defaultUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  trustHost: true
}

// Permission checking functions
export function hasPermission(userRole: UserRole, resource: string, action: string): boolean {
  const permissions = rolePermissions[userRole] || []
  
  return permissions.some(permission => 
    (permission.resource === '*' || permission.resource === resource) &&
    (permission.action === '*' || permission.action === action)
  )
}

export function canAccessResource(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'read')
}

export function canModifyResource(userRole: UserRole, resource: string): boolean {
  return hasPermission(userRole, resource, 'write')
}

// Role-based permissions matrix
const rolePermissions: Record<UserRole, Array<{resource: string, action: string}>> = {
  [UserRole.SUPERUSER]: [
    { resource: '*', action: '*' }
  ],
  [UserRole.ADMIN]: [
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
  [UserRole.MANAGER]: [
    { resource: 'inquiries', action: 'read' },
    { resource: 'quotes', action: 'read' },
    { resource: 'production-orders', action: 'read' },
    { resource: 'approvals', action: '*' },
    { resource: 'reports', action: 'read' },
    { resource: 'cost-calculations', action: 'approve' }
  ],
  [UserRole.SALES]: [
    { resource: 'customers', action: '*' },
    { resource: 'inquiries', action: '*' },
    { resource: 'quotes', action: '*' },
    { resource: 'reports', action: 'read' }
  ],
  [UserRole.VPP]: [
    { resource: 'inquiries', action: 'read' },
    { resource: 'inquiry-items', action: 'read' },
    { resource: 'inquiry-items', action: 'assign' },
    { resource: 'users', action: 'read' },
    { resource: 'workload', action: 'read' }
  ],
  [UserRole.VP]: [
    { resource: 'inquiry-items', action: 'read' },
    { resource: 'cost-calculations', action: '*' },
    { resource: 'tech-assignments', action: '*' }
  ],
  [UserRole.TECH]: [
    { resource: 'inquiry-items', action: 'read' },
    { resource: 'technical-tasks', action: '*' },
    { resource: 'documentation', action: '*' }
  ]
}

// Helper function to get user permissions
export function getUserPermissions(userRole: UserRole) {
  return rolePermissions[userRole] || []
}

// Helper function to check if user can assign items
export function canAssignItems(userRole: UserRole): boolean {
  return userRole === UserRole.VPP || userRole === UserRole.ADMIN || userRole === UserRole.SUPERUSER
}

// Helper function to check if user can calculate costs
export function canCalculateCosts(userRole: UserRole): boolean {
  return userRole === UserRole.VP || userRole === UserRole.ADMIN || userRole === UserRole.SUPERUSER
}

// Helper function to check if user can approve
export function canApprove(userRole: UserRole): boolean {
  return userRole === UserRole.MANAGER || userRole === UserRole.ADMIN || userRole === UserRole.SUPERUSER
}

// Helper function to check if user can create quotes
export function canCreateQuotes(userRole: UserRole): boolean {
  return userRole === UserRole.SALES || userRole === UserRole.ADMIN || userRole === UserRole.SUPERUSER
}