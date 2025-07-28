import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetUsers() {
  try {
    console.log('🗑️  Deleting all existing users...')
    
    // Delete in order to respect foreign key constraints
    await prisma.automationLog.deleteMany()
    await prisma.automationRule.deleteMany()
    await prisma.deadline.deleteMany()
    await prisma.auditLog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.productionItem.deleteMany()
    await prisma.productionOrder.deleteMany()
    await prisma.quote.deleteMany()
    await prisma.approval.deleteMany()
    await prisma.costCalculation.deleteMany()
    await prisma.itemAttachment.deleteMany()
    await prisma.inquiryAttachment.deleteMany()
    await prisma.fileAttachment.deleteMany()
    await prisma.inquiryItem.deleteMany()
    await prisma.inquiry.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.user.deleteMany()
    
    console.log('✅ All users and related data deleted')
    
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    // Create new users
    const users = [
      {
        email: 'admin@gs-cms.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN' as const,
        isActive: true
      },
      {
        email: 'sales@gs-cms.com',
        name: 'Sales User',
        password: hashedPassword,
        role: 'SALES' as const,
        isActive: true
      },
      {
        email: 'vpp@gs-cms.com',
        name: 'VPP User',
        password: hashedPassword,
        role: 'VPP' as const,
        isActive: true
      },
      {
        email: 'vp@gs-cms.com',
        name: 'VP User',
        password: hashedPassword,
        role: 'VP' as const,
        isActive: true
      },
      {
        email: 'manager@gs-cms.com',
        name: 'Manager User',
        password: hashedPassword,
        role: 'MANAGER' as const,
        isActive: true
      }
    ]
    
    console.log('👥 Creating new users...')
    
    for (const user of users) {
      await prisma.user.create({
        data: user
      })
      console.log(`✅ Created ${user.role}: ${user.email}`)
    }
    
    console.log('\n✨ User reset completed successfully!')
    console.log('\n🔐 Login credentials:')
    users.forEach(user => {
      console.log(`   ${user.role}: ${user.email} / password123`)
    })
    
  } catch (error) {
    console.error('❌ Error resetting users:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetUsers()