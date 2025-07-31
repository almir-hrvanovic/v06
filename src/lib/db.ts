// Legacy database file - now redirects to new abstraction layer
// This maintains backward compatibility during migration

import { db, withTransaction as dbTransaction } from '@/lib/db/index'

// Re-export the database client as prisma for backward compatibility
export const prisma = db

// Connection helper
export async function connectToDatabase() {
  try {
    await db.connect()
    console.log('✅ Database connected successfully')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// Disconnect helper
export async function disconnectFromDatabase() {
  try {
    await db.disconnect()
    console.log('🔌 Database disconnected')
  } catch (error) {
    console.error('❌ Database disconnection failed:', error)
  }
}

// Health check
export async function checkDatabaseHealth() {
  try {
    // Test with a simple user query
    await db.user.findMany({ take: 1 })
    return { status: 'healthy', timestamp: new Date() }
  } catch (error) {
    return { status: 'unhealthy', error, timestamp: new Date() }
  }
}

// Transaction helper - redirect to new implementation
export const withTransaction = dbTransaction

export default prisma