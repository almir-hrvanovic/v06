// Database type definitions for abstraction layer
// These types ensure consistency across different database providers

import type { 
  User, 
  UserRole,
  SystemSettings, 
  Currency,
  StorageProvider,
  AuditLog,
  Notification,
  NotificationType,
  DeadlineStatus,
  DeadlineEntity,
  AutomationLogStatus,
  AutomationTrigger,
  Prisma
} from '@prisma/client'

// Re-export common types (only non-enum types)
export type {
  User,
  SystemSettings,
  AuditLog,
  Notification
}

// Re-export enums as both types and values
export { 
  UserRole, 
  Currency, 
  StorageProvider, 
  NotificationType,
  DeadlineStatus,
  DeadlineEntity,
  AutomationLogStatus,
  AutomationTrigger
} from '@prisma/client'

// Re-export enum types explicitly for type usage
export type {
  UserRole as UserRoleType,
  Currency as CurrencyType,
  StorageProvider as StorageProviderType,
  NotificationType as NotificationTypeType,
  DeadlineStatus as DeadlineStatusType,
  DeadlineEntity as DeadlineEntityType,
  AutomationLogStatus as AutomationLogStatusType,
  AutomationTrigger as AutomationTriggerType
} from '@prisma/client'

// Import extended operations  
import type { ExtendedDatabaseOperations } from './extended-types'

// Database operations interface
export interface DatabaseOperations extends ExtendedDatabaseOperations {
  // User operations
  user: {
    findUnique: (args: { where: { id?: string; email?: string }; select?: any; include?: any }) => Promise<any>
    findMany: (args?: { where?: any; take?: number; skip?: number; select?: any; include?: any; orderBy?: any }) => Promise<any[]>
    create: (args: { data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> }) => Promise<User>
    update: (args: { where: { id: string }; data: Partial<User> }) => Promise<User>
    delete: (args: { where: { id: string } }) => Promise<User>
  }
  
  // System settings operations
  systemSettings: {
    findFirst: () => Promise<SystemSettings | null>
    create: (args: { data: Partial<SystemSettings> }) => Promise<SystemSettings>
    update: (args: { where: { id: string }; data: Partial<SystemSettings> }) => Promise<SystemSettings>
  }
  
  // Audit log operations
  auditLog: {
    create: (args: { data: Omit<AuditLog, 'id' | 'timestamp'> & { metadata?: any } }) => Promise<AuditLog>
    findMany: (args?: { where?: any; take?: number; skip?: number; orderBy?: any }) => Promise<AuditLog[]>
  }
  
  // Notification operations
  notification: {
    findMany: (args?: { where?: any; take?: number; skip?: number; orderBy?: any }) => Promise<Notification[]>
    create: (args: { data: Omit<Notification, 'id' | 'createdAt'> }) => Promise<Notification>
    update: (args: { where: { id: string }; data: Partial<Notification> }) => Promise<Notification>
    updateMany: (args: { where: any; data: Partial<Notification> }) => Promise<{ count: number }>
  }
  
  // Transaction support
  $transaction: <T>(fn: (tx: DatabaseOperations) => Promise<T>) => Promise<T>
}

// Database client interface
export interface DatabaseClient extends DatabaseOperations {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

// Query filter types
export interface QueryFilters {
  where?: Record<string, any>
  orderBy?: Record<string, 'asc' | 'desc'>
  take?: number
  skip?: number
  include?: Record<string, boolean>
}

// Pagination types
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}