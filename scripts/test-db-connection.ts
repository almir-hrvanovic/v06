import { prisma } from '../src/lib/db'

async function testConnection() {
  try {
    console.log('Testing database connection...')
    
    // Test basic query
    const userCount = await prisma.user.count()
    console.log('User count:', userCount)
    
    // Test system settings
    const settings = await prisma.systemSettings.findFirst()
    console.log('System settings:', settings)
    
    console.log('Database connection successful!')
  } catch (error) {
    console.error('Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()