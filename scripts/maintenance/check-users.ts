import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        password: true,
        isActive: true
      }
    })
    
    console.log('Users in database:')
    console.log('==================')
    users.forEach(user => {
      console.log(`Email: ${user.email}`)
      console.log(`Name: ${user.name}`)
      console.log(`Role: ${user.role}`)
      console.log(`Password: ${user.password}`)
      console.log(`Active: ${user.isActive}`)
      console.log('---')
    })
    
    console.log(`\nTotal users: ${users.length}`)
    
    // Test specific user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@gs-cms.com' }
    })
    
    if (adminUser) {
      console.log('\nAdmin user found!')
      console.log('Password in DB:', adminUser.password)
      console.log('Expected password: password123')
      console.log('Passwords match:', adminUser.password === 'password123')
    } else {
      console.log('\nAdmin user NOT found!')
    }
    
  } catch (error) {
    console.error('Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()