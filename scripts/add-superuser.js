// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addSuperuser() {
  try {
    console.log('🔧 Adding almir.hrvanovic@icloud.com as SUPERUSER...')
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'almir.hrvanovic@icloud.com' }
    })
    
    if (existingUser) {
      // Update existing user to SUPERUSER
      const updatedUser = await prisma.user.update({
        where: { email: 'almir.hrvanovic@icloud.com' },
        data: { 
          role: 'SUPERUSER',
          isActive: true
        }
      })
      console.log('✅ Updated existing user to SUPERUSER:', updatedUser.email)
    } else {
      // Create new SUPERUSER
      const newUser = await prisma.user.create({
        data: {
          email: 'almir.hrvanovic@icloud.com',
          name: 'Almir Hrvanovic',
          password: 'temp-password', // You should change this via Supabase auth
          role: 'SUPERUSER',
          isActive: true,
          preferredLanguage: 'hr-HR'
        }
      })
      console.log('✅ Created new SUPERUSER:', newUser.email)
    }
    
    // Verify the change
    const verifyUser = await prisma.user.findUnique({
      where: { email: 'almir.hrvanovic@icloud.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })
    
    console.log('\n📊 User details:')
    console.log(verifyUser)
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addSuperuser()