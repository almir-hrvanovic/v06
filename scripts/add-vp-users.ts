import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Adding new VP/VPP users...')

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create 4 new VP users
  const vpUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'vp2@al-star.im',
        name: 'VP User 2',
        password: hashedPassword,
        role: UserRole.VP,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'vp3@al-star.im',
        name: 'VP User 3',
        password: hashedPassword,
        role: UserRole.VP,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'vp4@al-star.im',
        name: 'VP User 4',
        password: hashedPassword,
        role: UserRole.VP,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'vp5@al-star.im',
        name: 'VP User 5',
        password: hashedPassword,
        role: UserRole.VP,
        isActive: true,
      },
    }),
  ])

  console.log('✅ Created 4 new VP users:', vpUsers.map(u => u.email).join(', '))

  // Create 1 new VPP user
  const vppUser = await prisma.user.create({
    data: {
      email: 'vpp2@al-star.im',
      name: 'VPP User 2',
      password: hashedPassword,
      role: UserRole.VPP,
      isActive: true,
    },
  })

  console.log('✅ Created 1 new VPP user:', vppUser.email)

  // Display all VP/VPP users
  const allVpUsers = await prisma.user.findMany({
    where: {
      role: {
        in: [UserRole.VP, UserRole.VPP]
      }
    },
    select: {
      email: true,
      name: true,
      role: true,
    }
  })

  console.log('\n📋 All VP/VPP users:')
  allVpUsers.forEach(user => {
    console.log(`   - ${user.name} (${user.email}) - ${user.role}`)
  })

  console.log('\n✨ Done!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })