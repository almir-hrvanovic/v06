import { PrismaClient, UserRole, InquiryStatus, Priority, ItemStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.productionItem.deleteMany()
  await prisma.productionOrder.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.approval.deleteMany()
  await prisma.costCalculation.deleteMany()
  await prisma.inquiryItem.deleteMany()
  await prisma.inquiry.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create Users - ONLY al-star.im domain users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'almir@al-star.im',
        name: 'Almir Al-Star',
        password: hashedPassword,
        role: UserRole.SUPERUSER,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'admin@al-star.im',
        name: 'Administrator',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'snjezana@al-star.im',
        name: 'Snjezana Manager',
        password: hashedPassword,
        role: UserRole.MANAGER,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'pero@al-star.im',
        name: 'Pero Admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'daniel@al-star.im',
        name: 'Daniel Admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'haris@al-star.im',
        name: 'Haris Sales',
        password: hashedPassword,
        role: UserRole.SALES,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'vpp@al-star.im',
        name: 'VPP User',
        password: hashedPassword,
        role: UserRole.VPP,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'vp@al-star.im',
        name: 'VP User',
        password: hashedPassword,
        role: UserRole.VP,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'tech@al-star.im',
        name: 'Tech User',
        password: hashedPassword,
        role: UserRole.TECH,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'senad@al-star.im',
        name: 'Senad Manager',
        password: hashedPassword,
        role: UserRole.MANAGER,
        isActive: true,
      },
    }),
  ])

  console.log(`👥 Created ${users.length} users`)

  // Create Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Acme Corporation',
        email: 'orders@acmecorp.com',
        phone: '+1-555-0101',
        address: '123 Business Ave, Enterprise City, EC 12345',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'TechStart Industries',
        email: 'procurement@techstart.com',
        phone: '+1-555-0202',
        address: '456 Innovation Blvd, Tech Valley, TV 67890',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Global Manufacturing Ltd',
        email: 'contact@globalmanuf.com',
        phone: '+1-555-0303',
        address: '789 Industrial Park, Manufacturing District, MD 11111',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Precision Engineering Co',
        email: 'sales@precisioneng.com',
        phone: '+1-555-0404',
        address: '321 Quality Street, Engineering Town, ET 22222',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Future Systems Inc',
        email: 'orders@futuresys.com',
        phone: '+1-555-0505',
        address: '654 Tomorrow Way, Innovation City, IC 33333',
      },
    }),
  ])

  console.log(`🏢 Created ${customers.length} customers`)

  // Get user references
  const superUser = users.find(u => u.role === UserRole.SUPERUSER)!
  const adminUser = users.find(u => u.role === UserRole.ADMIN)!
  const salesUser = users.find(u => u.role === UserRole.SALES)!
  const vppUser = users.find(u => u.role === UserRole.VPP)!
  const vpUser = users.find(u => u.email === 'vp@al-star.im')!
  const managerUser = users.find(u => u.role === UserRole.MANAGER)!

  // Create Inquiries with Items
  const inquiry1 = await prisma.inquiry.create({
    data: {
      title: 'Custom Machinery Components',
      description: 'Need custom precision-machined components for new production line',
      status: InquiryStatus.ASSIGNED,
      priority: Priority.HIGH,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      customerId: customers[0].id,
      createdById: salesUser.id,
      assignedToId: vppUser.id,
      items: {
        create: [
          {
            name: 'Steel Brackets',
            description: 'Precision steel brackets for mounting assemblies',
            quantity: 50,
            unit: 'pieces',
            status: ItemStatus.ASSIGNED,
            assignedToId: vpUser.id,
          },
          {
            name: 'Aluminum Housings',
            description: 'CNC machined aluminum housings with tight tolerances',
            quantity: 25,
            unit: 'pieces',
            status: ItemStatus.IN_PROGRESS,
            assignedToId: vpUser.id,
          },
          {
            name: 'Custom Gears',
            description: 'Precision gears for transmission assembly',
            quantity: 100,
            unit: 'pieces',
            status: ItemStatus.PENDING,
          },
        ],
      },
    },
  })

  const inquiry2 = await prisma.inquiry.create({
    data: {
      title: 'Prototype Development Parts',
      description: 'Components needed for R&D prototype testing',
      status: InquiryStatus.COSTING,
      priority: Priority.MEDIUM,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      customerId: customers[1].id,
      createdById: salesUser.id,
      assignedToId: vppUser.id,
      items: {
        create: [
          {
            name: 'Titanium Plates',
            description: 'High-grade titanium plates for aerospace application',
            quantity: 10,
            unit: 'pieces',
            status: ItemStatus.ASSIGNED,
            assignedToId: vpUser.id,
          },
          {
            name: 'Carbon Fiber Tubes',
            description: 'Lightweight carbon fiber tubes',
            quantity: 30,
            unit: 'meters',
            status: ItemStatus.COSTED,
            assignedToId: vpUser.id,
          },
        ],
      },
    },
  })

  const inquiry3 = await prisma.inquiry.create({
    data: {
      title: 'Production Line Upgrade Components',
      description: 'Various components for production line modernization',
      status: InquiryStatus.SUBMITTED,
      priority: Priority.LOW,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      customerId: customers[2].id,
      createdById: salesUser.id,
      items: {
        create: [
          {
            name: 'Conveyor Rollers',
            description: 'Heavy-duty rollers for conveyor system',
            quantity: 200,
            unit: 'pieces',
            status: ItemStatus.PENDING,
          },
          {
            name: 'Motor Mounts',
            description: 'Vibration-dampening motor mounts',
            quantity: 15,
            unit: 'pieces',
            status: ItemStatus.PENDING,
          },
        ],
      },
    },
  })

  console.log(`📋 Created 3 inquiries with items`)

  // Create Cost Calculations for assigned items
  const inquiry1Items = await prisma.inquiryItem.findMany({
    where: { inquiryId: inquiry1.id, status: { not: ItemStatus.PENDING } },
  })

  const inquiry2Items = await prisma.inquiryItem.findMany({
    where: { inquiryId: inquiry2.id, status: { not: ItemStatus.PENDING } },
  })

  const costCalculations = []

  // Cost calculation for Steel Brackets
  if (inquiry1Items[0]) {
    const costCalc1 = await prisma.costCalculation.create({
      data: {
        materialCost: 1500.00,
        laborCost: 2500.00,
        overheadCost: 800.00,
        totalCost: 4800.00,
        notes: 'Includes material, machining, and finishing operations',
        inquiryItemId: inquiry1Items[0].id,
        calculatedById: vpUser.id,
        isApproved: true,
        approvedAt: new Date(),
      },
    })
    costCalculations.push(costCalc1)
  }

  // Cost calculation for Aluminum Housings
  if (inquiry1Items[1]) {
    const costCalc2 = await prisma.costCalculation.create({
      data: {
        materialCost: 3200.00,
        laborCost: 4500.00,
        overheadCost: 1200.00,
        totalCost: 8900.00,
        notes: 'CNC machining with precision tolerances +/- 0.001"',
        inquiryItemId: inquiry1Items[1].id,
        calculatedById: vpUser.id,
        isApproved: false,
      },
    })
    costCalculations.push(costCalc2)
  }

  // Cost calculation for Carbon Fiber Tubes
  if (inquiry2Items[1]) {
    const costCalc3 = await prisma.costCalculation.create({
      data: {
        materialCost: 2800.00,
        laborCost: 1200.00,
        overheadCost: 600.00,
        totalCost: 4600.00,
        notes: 'High-strength carbon fiber with custom length cutting',
        inquiryItemId: inquiry2Items[1].id,
        calculatedById: vpUser.id,
        isApproved: true,
        approvedAt: new Date(),
      },
    })
    costCalculations.push(costCalc3)
  }

  console.log(`💰 Created ${costCalculations.length} cost calculations`)

  // Create Approvals for cost calculations
  const approvals = []

  for (const costCalc of costCalculations) {
    const approval = await prisma.approval.create({
      data: {
        type: 'COST_CALCULATION',
        status: costCalc.isApproved ? 'APPROVED' : 'PENDING',
        comments: costCalc.isApproved ? 'Cost calculation approved - reasonable pricing' : null,
        approverId: managerUser.id,
        costCalculationId: costCalc.id,
        approvedAt: costCalc.isApproved ? new Date() : null,
      },
    })
    approvals.push(approval)
  }

  console.log(`✅ Created ${approvals.length} approvals`)

  // Create a Quote for approved items
  const approvedCostCalcs = costCalculations.filter(cc => cc.isApproved)
  if (approvedCostCalcs.length > 0) {
    const totalCost = approvedCostCalcs.reduce((sum, cc) => sum + Number(cc.totalCost), 0)
    const margin = 0.25 // 25% margin
    const quoteTotal = totalCost * (1 + margin)

    const quote = await prisma.quote.create({
      data: {
        quoteNumber: 'QUO-2024-001',
        title: 'Custom Machinery Components Quote',
        description: 'Quote for precision-machined components as per inquiry requirements',
        subtotal: totalCost,
        margin: margin,
        total: quoteTotal,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days validity
        status: 'SENT',
        terms: 'Net 30 days payment terms. 50% deposit required before production.',
        notes: 'All components manufactured to customer specifications with quality certification.',
        inquiryId: inquiry1.id,
        createdById: salesUser.id,
      },
    })

    console.log(`📄 Created quote: ${quote.quoteNumber}`)
  }

  // Create some notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        type: 'INQUIRY_ASSIGNED',
        title: 'New inquiry assigned',
        message: 'Inquiry INQ-2024-001 has been assigned to you for item assignment',
        userId: vppUser.id,
        data: { inquiryId: inquiry1.id },
      },
    }),
    prisma.notification.create({
      data: {
        type: 'COST_CALCULATION_REQUESTED',
        title: 'Cost calculation needed',
        message: 'Please calculate costs for Steel Brackets in inquiry INQ-2024-001',
        userId: vpUser.id,
        data: { inquiryId: inquiry1.id, itemName: 'Steel Brackets' },
      },
    }),
    prisma.notification.create({
      data: {
        type: 'APPROVAL_REQUIRED',
        title: 'Cost calculation approval required',
        message: 'Cost calculation for Aluminum Housings needs your approval',
        userId: managerUser.id,
        data: { costCalculationId: costCalculations[1]?.id },
      },
    }),
  ])

  console.log(`🔔 Created ${notifications.length} notifications`)

  // Create audit log entries
  const auditLogs = await Promise.all([
    prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Inquiry',
        entityId: inquiry1.id,
        newData: { title: inquiry1.title, status: inquiry1.status },
        userId: salesUser.id,
        inquiryId: inquiry1.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Inquiry',
        entityId: inquiry1.id,
        oldData: { status: 'SUBMITTED' },
        newData: { status: 'ASSIGNED' },
        userId: vppUser.id,
        inquiryId: inquiry1.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'CostCalculation',
        entityId: costCalculations[0]?.id || '',
        newData: { totalCost: costCalculations[0]?.totalCost },
        userId: vpUser.id,
      },
    }),
  ])

  console.log(`📝 Created ${auditLogs.length} audit log entries`)

  console.log('✅ Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   Users: ${users.length}`)
  console.log(`   Customers: ${customers.length}`)
  console.log(`   Inquiries: 3`)
  console.log(`   Items: 7`)
  console.log(`   Cost Calculations: ${costCalculations.length}`)
  console.log(`   Approvals: ${approvals.length}`)
  console.log(`   Quotes: 1`)
  console.log(`   Notifications: ${notifications.length}`)
  console.log(`   Audit Logs: ${auditLogs.length}`)
  console.log('\n🔐 Demo Login Credentials:')
  console.log('   Superuser: almir@al-star.im / password123')
  console.log('   Admin: admin@al-star.im / password123')
  console.log('   Manager: snjezana@al-star.im / password123')
  console.log('   Admin: pero@al-star.im / password123')
  console.log('   Admin: daniel@al-star.im / password123')
  console.log('   Sales: haris@al-star.im / password123')
  console.log('   VPP: vpp@al-star.im / password123')
  console.log('   VP: vp@al-star.im / password123')
  console.log('   Tech: tech@al-star.im / password123')
  console.log('   Manager: senad@al-star.im / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })