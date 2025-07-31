// Main database abstraction layer
// This file provides a unified interface for database operations

import { DB_PROVIDER, DATABASE_PROVIDERS } from '@/lib/db-config'
import { prismaAdapter } from './adapters/prisma-adapter'
import { supabaseAdapter } from './adapters/supabase-adapter'
import type { DatabaseClient, DatabaseOperations } from './types'
import type { ExtendedDatabaseOperations } from './extended-types'

// Re-export types
export * from './types'
export * from './extended-types'

// Combined database interface
export interface CombinedDatabaseClient extends DatabaseClient, ExtendedDatabaseOperations {}

// Get the appropriate database adapter based on configuration
function getDatabaseAdapter(): CombinedDatabaseClient {
  switch (DB_PROVIDER) {
    case DATABASE_PROVIDERS.PRISMA:
      return prismaAdapter as CombinedDatabaseClient
    case DATABASE_PROVIDERS.SUPABASE:
      return supabaseAdapter as CombinedDatabaseClient
    default:
      // Default to Prisma
      return prismaAdapter as CombinedDatabaseClient
  }
}

// Export the database client
export const db = getDatabaseAdapter()

// Legacy export for backward compatibility
// This allows gradual migration from direct prisma imports
export { db as prisma }

// Helper functions for common database operations
export const database = {
  // Get current user by email
  async getUserByEmail(email: string) {
    return db.user.findUnique({ where: { email } })
  },
  
  // Get current user by ID
  async getUserById(id: string) {
    return db.user.findUnique({ where: { id } })
  },
  
  // Get system settings
  async getSystemSettings() {
    let settings = await db.systemSettings.findFirst()
    
    // Create default settings if none exist
    if (!settings) {
      settings = await db.systemSettings.create({
        data: {
          mainCurrency: 'EUR' as any,
        }
      })
    }
    
    return settings
  },
  
  // Create audit log entry
  async createAuditLog(data: {
    action: string
    entity: string
    entityId: string
    userId: string
    inquiryId?: string | null
    oldData?: any
    newData?: any
    metadata?: any
  }) {
    return db.auditLog.create({ 
      data: {
        ...data,
        inquiryId: data.inquiryId || null,
        oldData: data.oldData || {},
        newData: data.newData || {},
        metadata: data.metadata || {}
      }
    })
  },
  
  // Get notifications for user
  async getUserNotifications(userId: string, limit = 10) {
    return db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  },
  
  // Mark notifications as read
  async markNotificationsAsRead(userId: string, notificationIds: string[]) {
    return db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: DatabaseOperations) => Promise<T>
): Promise<T> {
  return db.$transaction(callback)
}