#!/usr/bin/env tsx

/**
 * Add Production Users Script
 * 
 * Adds the specified users with their roles to the database
 */

import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface UserData {
  email: string
  name: string
  role: UserRole
  password: string
}

const users: UserData[] = [
  {
    email: 'almir@al-star.im',
    name: 'Almir',
    role: 'SUPERUSER',
    password: 'password123'
  },
  {
    email: 'admin@al-star.im',
    name: 'Admin',
    role: 'ADMIN', 
    password: 'password123'
  },
  {
    email: 'snjezana@al-star.im',
    name: 'Snježana',
    role: 'MANAGER',
    password: 'password123'
  },
  {
    email: 'pero@al-star.im',
    name: 'Pero',
    role: 'ADMIN',
    password: 'password123'
  },
  {
    email: 'daniel@al-star.im',
    name: 'Daniel',
    role: 'ADMIN',
    password: 'password123'
  },
  {
    email: 'haris@al-star.im',
    name: 'Haris',
    role: 'SALES',
    password: 'password123'
  },
  {
    email: 'vpp@al-star.im',
    name: 'VPP User',
    role: 'VPP',
    password: 'password123'
  },
  {
    email: 'vp@al-star.im',
    name: 'VP User',
    role: 'VP',
    password: 'password123'
  },
  {
    email: 'tech@al-star.im',
    name: 'Tech User',
    role: 'TECH',
    password: 'password123'
  },
  {
    email: 'senad@al-star.im',
    name: 'Senad',
    role: 'MANAGER',
    password: 'password123'
  }
]

async function addUsers() {
  console.log('🚀 Adding production users to database...')
  
  try {
    // First, let's see existing users
    const existingUsers = await prisma.user.findMany({
      select: { email: true, role: true }
    })
    
    console.log(`📊 Found ${existingUsers.length} existing users`)
    
    let addedCount = 0
    let updatedCount = 0
    
    for (const userData of users) {
      console.log(`\n👤 Processing ${userData.email} (${userData.role})...`)
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 12)
      
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      })
      
      if (existingUser) {
        // Update existing user
        await prisma.user.update({
          where: { email: userData.email },
          data: {
            name: userData.name,
            role: userData.role,
            password: hashedPassword,
            isActive: true,
            preferredLanguage: 'en'
          }
        })
        console.log(`   ✅ Updated existing user`)
        updatedCount++
      } else {
        // Create new user
        await prisma.user.create({
          data: {
            email: userData.email,
            name: userData.name,
            role: userData.role,
            password: hashedPassword,
            isActive: true,
            preferredLanguage: 'en'
          }
        })
        console.log(`   ✅ Created new user`)
        addedCount++
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   ✅ ${addedCount} users added`)
    console.log(`   🔄 ${updatedCount} users updated`)
    console.log(`   📈 Total users processed: ${addedCount + updatedCount}`)
    
    // Show final user list by role
    console.log(`\n👥 Final user list by role:`)
    const finalUsers = await prisma.user.findMany({
      select: { email: true, name: true, role: true, isActive: true },
      orderBy: [{ role: 'asc' }, { email: 'asc' }]
    })
    
    const usersByRole = finalUsers.reduce((acc, user) => {
      if (!acc[user.role]) acc[user.role] = []
      acc[user.role].push(user)
      return acc
    }, {} as Record<string, typeof finalUsers>)
    
    Object.entries(usersByRole).forEach(([role, users]) => {
      console.log(`\n   🔸 ${role}:`)
      users.forEach(user => {
        const status = user.isActive ? '✅' : '❌'
        console.log(`     ${status} ${user.email} (${user.name})`)
      })
    })
    
    console.log(`\n🎉 Production users setup completed successfully!`)
    console.log(`\n🔐 All users can now login with password: password123`)
    
  } catch (error) {
    console.error('❌ Error adding users:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  addUsers()
    .then(() => {
      console.log('\n✅ Script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error)
      process.exit(1)
    })
}

export default addUsers