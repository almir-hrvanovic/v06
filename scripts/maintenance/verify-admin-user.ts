import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyAdminUser() {
  console.log('🔍 VERIFYING admin@al-star.im USER...')
  console.log('=====================================')

  try {
    // Check if admin@al-star.im exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@al-star.im' }
    })

    if (adminUser) {
      console.log('✅ FOUND: admin@al-star.im')
      console.log(`   Name: ${adminUser.name}`)
      console.log(`   Role: ${adminUser.role}`)
      console.log(`   Active: ${adminUser.isActive}`)
      console.log(`   Has Password: ${adminUser.password ? 'YES' : 'NO'}`)
      console.log(`   Created: ${adminUser.createdAt}`)
    } else {
      console.log('❌ NOT FOUND: admin@al-star.im')
    }

    // List all al-star.im users
    console.log('\n📋 ALL al-star.im USERS:')
    const allUsers = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@al-star.im'
        }
      },
      select: {
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    })

    allUsers.forEach(user => {
      console.log(`   ${user.email} - ${user.name} (${user.role}) - Active: ${user.isActive}`)
    })

    console.log(`\n📊 Total al-star.im users: ${allUsers.length}`)

  } catch (error) {
    console.log(`❌ Error: ${error}`)
  } finally {
    await prisma.$disconnect()
  }
}

verifyAdminUser().catch(console.error)