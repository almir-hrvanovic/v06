// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  console.log('Testing database connection...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set ✓' : 'Not set ✗')
  console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set ✓' : 'Not set ✗')
  
  try {
    const prisma = new PrismaClient({
      log: ['query', 'error'],
    })
    
    // Test query
    const inquiryCount = await prisma.inquiry.count()
    const itemCount = await prisma.inquiryItem.count()
    const userCount = await prisma.user.count()
    
    console.log('\n✅ Database connection successful!')
    console.log(`📊 Database stats:`)
    console.log(`  - Inquiries: ${inquiryCount}`)
    console.log(`  - Items: ${itemCount}`)
    console.log(`  - Users: ${userCount}`)
    
    // Get unassigned items
    const unassignedItems = await prisma.inquiryItem.findMany({
      where: {
        assignedToId: null,
        status: 'PENDING'
      },
      include: {
        inquiry: {
          include: {
            customer: true
          }
        }
      },
      take: 5
    })
    
    console.log(`\n📦 Unassigned items: ${unassignedItems.length}`)
    unassignedItems.forEach(item => {
      console.log(`  - ${item.name} (${item.inquiry.customer.name})`)
    })
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

testConnection()