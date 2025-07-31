// Load environment variables
require('dotenv').config({ path: '.env.local' })

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Enum values from Prisma schema
const Currency = { EUR: 'EUR', BAM: 'BAM' }
const Priority = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH', URGENT: 'URGENT' }
const InquiryStatus = { SUBMITTED: 'SUBMITTED' }
const ItemStatus = { PENDING: 'PENDING' }
const UserRole = { SALES: 'SALES', VP: 'VP', VPP: 'VPP' }

async function seedMetalInquiries() {
  try {
    console.log('🏭 Starting metal industry data seed...')

    // First, ensure we have a SALES user to create inquiries
    let salesUser = await prisma.user.findFirst({
      where: { role: UserRole.SALES }
    })

    if (!salesUser) {
      console.log('Creating SALES user...')
      salesUser = await prisma.user.create({
        data: {
          email: 'sales@metalworks.com',
          name: 'John Sales',
          password: 'password123', // In production, this should be hashed
          role: UserRole.SALES,
          isActive: true
        }
      })
    }

    // Get or create a metal industry customer
    let customer = await prisma.customer.findFirst({
      where: { name: 'SteelTech Industries' }
    })

    if (!customer) {
      console.log('Creating metal industry customer...')
      customer = await prisma.customer.create({
        data: {
          name: 'SteelTech Industries',
          email: 'procurement@steeltech.com',
          phone: '+1234567890',
          address: '123 Industrial Park, Metal City',
          website: 'www.steeltech.com',
          contactPerson: 'Mike Johnson',
          notes: 'Major steel fabrication company',
          isActive: true,
          createdById: salesUser.id
        }
      })
    }

    // Metal industry inquiries data
    const metalInquiries = [
      {
        title: 'Steel Beam Fabrication Project Q1-2025',
        description: 'Large scale structural steel beams for construction project',
        priority: Priority.HIGH,
        items: [
          { name: 'H-Beam 300x300x10x15', description: 'Heavy duty H-beam, Grade S355', quantity: 50, unit: 'pieces' },
          { name: 'I-Beam 200x100x5.5x8', description: 'Standard I-beam for floor support', quantity: 100, unit: 'pieces' },
          { name: 'Steel Plate 20mm', description: 'Base plates for beam connections', quantity: 200, unit: 'm²' },
          { name: 'Welding Wire ER70S-6', description: '1.2mm diameter welding wire', quantity: 500, unit: 'kg' },
          { name: 'Galvanizing Service', description: 'Hot-dip galvanizing for all beams', quantity: 150, unit: 'pieces' }
        ]
      },
      {
        title: 'Stainless Steel Kitchen Equipment',
        description: 'Commercial kitchen equipment manufacturing',
        priority: Priority.MEDIUM,
        items: [
          { name: 'SS Sheet 316L 2mm', description: 'Food grade stainless steel sheets', quantity: 300, unit: 'm²' },
          { name: 'SS Pipe 50mm Ø', description: 'Seamless stainless steel pipe', quantity: 200, unit: 'meters' },
          { name: 'SS Angle 50x50x5', description: 'Stainless steel angle for frames', quantity: 150, unit: 'meters' },
          { name: 'SS Welding Rod 316L', description: '3.2mm diameter welding rods', quantity: 100, unit: 'kg' },
          { name: 'Polishing Service', description: 'Mirror finish polishing #8', quantity: 300, unit: 'm²' }
        ]
      },
      {
        title: 'Aluminum Extrusion Profiles Order',
        description: 'Custom aluminum profiles for window manufacturing',
        priority: Priority.URGENT,
        items: [
          { name: 'Aluminum Profile T-6063', description: 'Custom window frame profile', quantity: 2000, unit: 'meters' },
          { name: 'Aluminum Corner Joint', description: '90-degree corner connectors', quantity: 500, unit: 'pieces' },
          { name: 'Rubber Seal Strip', description: 'EPDM weather seal for profiles', quantity: 2000, unit: 'meters' },
          { name: 'Anodizing Service', description: 'Bronze anodizing finish', quantity: 2000, unit: 'meters' },
          { name: 'Cutting Service', description: 'Precision cutting to length', quantity: 1000, unit: 'cuts' }
        ]
      },
      {
        title: 'Copper Components Manufacturing',
        description: 'Electrical components and heat exchangers',
        priority: Priority.HIGH,
        items: [
          { name: 'Copper Sheet 3mm', description: 'C11000 grade copper sheets', quantity: 100, unit: 'm²' },
          { name: 'Copper Tube 15mm', description: 'Type L copper tubes', quantity: 500, unit: 'meters' },
          { name: 'Copper Bus Bar', description: '50x10mm electrical bus bars', quantity: 200, unit: 'meters' },
          { name: 'Brass Fittings', description: 'Various compression fittings', quantity: 1000, unit: 'pieces' },
          { name: 'Silver Brazing Service', description: 'High-temp brazing for tubes', quantity: 500, unit: 'joints' }
        ]
      },
      {
        title: 'Tool Steel and Machinery Parts',
        description: 'Precision machined components for industrial machinery',
        priority: Priority.MEDIUM,
        items: [
          { name: 'Tool Steel D2 Block', description: '200x200x50mm pre-hardened blocks', quantity: 20, unit: 'pieces' },
          { name: 'HSS Round Bar 50mm', description: 'High speed steel for cutting tools', quantity: 100, unit: 'meters' },
          { name: 'CNC Machining Service', description: 'Precision milling and turning', quantity: 50, unit: 'hours' },
          { name: 'Heat Treatment', description: 'Vacuum hardening to 58-60 HRC', quantity: 20, unit: 'pieces' },
          { name: 'Surface Grinding', description: 'Precision grinding ±0.005mm', quantity: 40, unit: 'hours' }
        ]
      }
    ]

    // Create inquiries with items
    for (const inquiryData of metalInquiries) {
      console.log(`Creating inquiry: ${inquiryData.title}`)
      
      const inquiry = await prisma.inquiry.create({
        data: {
          title: inquiryData.title,
          description: inquiryData.description,
          priority: inquiryData.priority,
          status: InquiryStatus.SUBMITTED, // Makes items assignable
          customerId: customer.id,
          createdById: salesUser.id,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          items: {
            create: inquiryData.items.map(item => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              status: ItemStatus.PENDING, // Unassigned status
              requestedDelivery: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
              // assignedToId is null by default - unassigned
            }))
          }
        },
        include: {
          items: true,
          customer: true
        }
      })

      console.log(`✅ Created inquiry with ${inquiry.items.length} items`)
    }

    // Create a few VP users if they don't exist
    const vpUsers = [
      { email: 'vp1@metalworks.com', name: 'Alice VP', role: UserRole.VP },
      { email: 'vp2@metalworks.com', name: 'Bob VP', role: UserRole.VP },
      { email: 'vpp@metalworks.com', name: 'Carol VPP', role: UserRole.VPP }
    ]

    for (const vpData of vpUsers) {
      const existingUser = await prisma.user.findUnique({
        where: { email: vpData.email }
      })

      if (!existingUser) {
        await prisma.user.create({
          data: {
            ...vpData,
            password: 'password123', // In production, this should be hashed
            isActive: true
          }
        })
        console.log(`✅ Created ${vpData.role} user: ${vpData.name}`)
      }
    }

    // Get summary
    const totalInquiries = await prisma.inquiry.count()
    const totalItems = await prisma.inquiryItem.count()
    const unassignedItems = await prisma.inquiryItem.count({
      where: { assignedToId: null, status: ItemStatus.PENDING }
    })

    console.log('\n📊 Database Summary:')
    console.log(`- Total inquiries: ${totalInquiries}`)
    console.log(`- Total items: ${totalItems}`)
    console.log(`- Unassigned items: ${unassignedItems}`)
    console.log('\n✅ Metal industry test data seeded successfully!')

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seed function
seedMetalInquiries()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })