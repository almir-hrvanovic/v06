// Prisma database adapter
// Implements the DatabaseClient interface using Prisma

import { PrismaClient } from '@prisma/client'
import type { DatabaseClient, DatabaseOperations } from '../types'
import { createExtendedPrismaOperations, createExtendedTransactionOperations } from './prisma-extended'

// Declare global type to prevent TypeScript errors
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Get or create Prisma client singleton with proper connection pooling
function getPrismaClient(): PrismaClient {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    })
  }
  return global.prisma
}

// Prevent multiple instances during development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = getPrismaClient()
}

// Create Prisma adapter that implements DatabaseClient interface
export function createPrismaAdapter(): DatabaseClient {
  const prisma = getPrismaClient()
  
  const operations: DatabaseOperations = {
    user: {
      findUnique: async (args) => {
        const result = await prisma.user.findUnique({
          where: args.where
        })
        return result
      },
      findMany: async (args) => {
        const result = await prisma.user.findMany(args)
        return result
      },
      create: async (args) => {
        const result = await prisma.user.create(args as any)
        return result
      },
      update: async (args) => {
        const result = await prisma.user.update(args)
        return result
      },
      delete: async (args) => {
        const result = await prisma.user.delete(args)
        return result
      }
    },
    
    systemSettings: {
      findFirst: async () => {
        const result = await prisma.systemSettings.findFirst()
        return result
      },
      create: async (args) => {
        const result = await prisma.systemSettings.create(args as any)
        return result
      },
      update: async (args) => {
        const result = await prisma.systemSettings.update(args)
        return result
      }
    },
    
    auditLog: {
      create: async (args) => {
        const result = await prisma.auditLog.create({
          data: {
            ...args.data,
            metadata: args.data.metadata || {}
          }
        })
        return result
      },
      findMany: async (args) => {
        const result = await prisma.auditLog.findMany(args)
        return result
      }
    },
    
    notification: {
      findMany: async (args) => {
        const result = await prisma.notification.findMany(args)
        return result
      },
      create: async (args) => {
        const result = await prisma.notification.create(args as any)
        return result
      },
      update: async (args) => {
        const result = await prisma.notification.update(args)
        return result
      },
      updateMany: async (args) => {
        const result = await prisma.notification.updateMany(args)
        return result
      }
    },
    
    $transaction: async (fn) => {
      return await prisma.$transaction(async (tx) => {
        // Create a new operations object that uses the transaction
        const extendedTxOps = createExtendedTransactionOperations(tx)
        const txOperations = {
          user: {
            findUnique: (args) => tx.user.findUnique(args),
            findMany: (args) => tx.user.findMany(args as any),
            create: (args) => tx.user.create(args as any),
            update: (args) => tx.user.update(args),
            delete: (args) => tx.user.delete(args)
          },
          systemSettings: {
            findFirst: () => tx.systemSettings.findFirst(),
            create: (args) => tx.systemSettings.create(args as any),
            update: (args) => tx.systemSettings.update(args)
          },
          auditLog: {
            create: (args) => tx.auditLog.create({
              data: {
                ...args.data,
                metadata: args.data.metadata || {}
              }
            }),
            findMany: (args) => tx.auditLog.findMany(args as any)
          },
          notification: {
            findMany: (args) => tx.notification.findMany(args as any),
            create: (args) => tx.notification.create(args as any),
            update: (args) => tx.notification.update(args),
            updateMany: (args) => tx.notification.updateMany(args)
          },
          $transaction: async (nestedFn) => {
            // Nested transactions use the same transaction context
            return nestedFn({ ...txOperations, ...extendedTxOps })
          },
          ...extendedTxOps
        }
        return fn(txOperations)
      })
    }
  }
  
  // Get extended operations
  const extendedOps = createExtendedPrismaOperations(prisma)
  
  return {
    ...operations,
    ...extendedOps,
    connect: async () => {
      await prisma.$connect()
    },
    disconnect: async () => {
      await prisma.$disconnect()
    }
  }
}

// Export a singleton instance
export const prismaAdapter = createPrismaAdapter()