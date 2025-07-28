import { PrismaClient, UserRole, InquiryStatus, Priority, ItemStatus } from '@prisma/client'

const prisma = new PrismaClient()

interface InquiryTemplate {
  title: string
  description: string
  priority: Priority
  deadline: Date
  customerId: string
  items: Array<{
    name: string
    description: string
    quantity: number
    unit: string
  }>
}

async function createInquiriesAsAdmin() {
  console.log('🎭 Creating 10 Inquiries as Admin User...')
  console.log('==========================================')

  try {
    // Get admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@al-star.im' }
    })

    if (!adminUser) {
      console.log('❌ Admin user not found!')
      return
    }

    console.log(`✅ Found admin: ${adminUser.name} (${adminUser.email}) - Role: ${adminUser.role}`)

    // Get customers for inquiries
    const customers = await prisma.customer.findMany()
    console.log(`📋 Found ${customers.length} customers`)

    // Create 10 inquiry templates with different dates and multiple items
    const inquiryTemplates: InquiryTemplate[] = [
      {
        title: 'Industrial Automation System Upgrade',
        description: 'Complete automation system upgrade for manufacturing facility including sensors, controllers, and safety systems',
        priority: Priority.HIGH,
        deadline: new Date('2025-02-15'),
        customerId: customers[0]?.id || '',
        items: [
          { name: 'PLC Controllers', description: 'Programmable logic controllers for main control system', quantity: 8, unit: 'pieces' },
          { name: 'Proximity Sensors', description: 'Industrial proximity sensors for position detection', quantity: 24, unit: 'pieces' },
          { name: 'Safety Relays', description: 'Safety relay modules for emergency stop systems', quantity: 12, unit: 'pieces' },
          { name: 'HMI Panels', description: 'Human-machine interface touchscreen panels', quantity: 4, unit: 'pieces' }
        ]
      },
      {
        title: 'Precision Machining Components',
        description: 'Custom precision-machined components for aerospace application with tight tolerances',
        priority: Priority.HIGH,
        deadline: new Date('2025-02-28'),
        customerId: customers[1]?.id || customers[0]?.id || '',
        items: [
          { name: 'Titanium Brackets', description: 'Aerospace-grade titanium mounting brackets', quantity: 16, unit: 'pieces' },
          { name: 'Aluminum Housings', description: 'CNC machined aluminum equipment housings', quantity: 8, unit: 'pieces' },
          { name: 'Steel Shafts', description: 'Precision ground stainless steel drive shafts', quantity: 32, unit: 'pieces' }
        ]
      },
      {
        title: 'Marine Equipment Manufacturing',
        description: 'Corrosion-resistant marine equipment for offshore drilling platform',
        priority: Priority.MEDIUM,
        deadline: new Date('2025-03-15'),
        customerId: customers[2]?.id || customers[0]?.id || '',
        items: [
          { name: 'Marine Valves', description: 'Stainless steel ball valves for seawater applications', quantity: 40, unit: 'pieces' },
          { name: 'Pipe Fittings', description: 'Custom flanged pipe connections', quantity: 60, unit: 'pieces' },
          { name: 'Support Structures', description: 'Heavy-duty pipe support brackets', quantity: 25, unit: 'pieces' },
          { name: 'Access Hatches', description: 'Waterproof maintenance access panels', quantity: 12, unit: 'pieces' },
          { name: 'Gasket Systems', description: 'Complete sealing gasket assemblies', quantity: 50, unit: 'sets' }
        ]
      },
      {
        title: 'Solar Panel Mounting System',
        description: 'Complete mounting system for commercial solar panel installation',
        priority: Priority.MEDIUM,
        deadline: new Date('2025-03-30'),
        customerId: customers[3]?.id || customers[0]?.id || '',
        items: [
          { name: 'Aluminum Rails', description: 'Extruded aluminum mounting rails', quantity: 200, unit: 'pieces' },
          { name: 'Clamp Systems', description: 'Panel securing and adjustment clamps', quantity: 400, unit: 'pieces' },
          { name: 'Grounding Kit', description: 'Electrical grounding and bonding equipment', quantity: 100, unit: 'pieces' }
        ]
      },
      {
        title: 'Food Processing Equipment',
        description: 'Sanitary equipment components for dairy processing facility',
        priority: Priority.LOW,
        deadline: new Date('2025-04-15'),
        customerId: customers[4]?.id || customers[0]?.id || '',
        items: [
          { name: 'Sanitary Pumps', description: 'Food-grade centrifugal pumps', quantity: 12, unit: 'pieces' },
          { name: 'Filter Vessels', description: 'Stainless steel filtration housings', quantity: 20, unit: 'pieces' },
          { name: 'Valve Manifolds', description: 'Multi-port valve control assemblies', quantity: 8, unit: 'pieces' },
          { name: 'CIP Systems', description: 'Clean-in-place connection fittings', quantity: 60, unit: 'pieces' }
        ]
      },
      {
        title: 'Automotive Testing Equipment',
        description: 'Custom test fixtures and equipment for vehicle component validation',
        priority: Priority.HIGH,
        deadline: new Date('2025-02-20'),
        customerId: customers[0]?.id || '',
        items: [
          { name: 'Test Fixtures', description: 'Precision test and alignment fixtures', quantity: 24, unit: 'pieces' },
          { name: 'Load Sensors', description: 'Force and torque measurement sensors', quantity: 16, unit: 'pieces' },
          { name: 'Actuator Mounts', description: 'Pneumatic and hydraulic actuator brackets', quantity: 32, unit: 'pieces' },
          { name: 'Control Software', description: 'Custom testing control software license', quantity: 2, unit: 'licenses' },
          { name: 'Calibration Tools', description: 'Precision measurement calibration standards', quantity: 10, unit: 'sets' }
        ]
      },
      {
        title: 'Medical Device Components',
        description: 'Precision components for surgical instrument manufacturing',
        priority: Priority.HIGH,
        deadline: new Date('2025-03-05'),
        customerId: customers[1]?.id || customers[0]?.id || '',
        items: [
          { name: 'Surgical Handles', description: 'Ergonomic surgical instrument handles', quantity: 100, unit: 'pieces' },
          { name: 'Blade Assemblies', description: 'Replaceable surgical blade components', quantity: 200, unit: 'pieces' },
          { name: 'Spring Mechanisms', description: 'Precision actuator spring assemblies', quantity: 400, unit: 'pieces' }
        ]
      },
      {
        title: 'Mining Equipment Overhaul',
        description: 'Heavy-duty replacement parts for mining excavation equipment',
        priority: Priority.MEDIUM,
        deadline: new Date('2025-04-30'),
        customerId: customers[2]?.id || customers[0]?.id || '',
        items: [
          { name: 'Excavator Teeth', description: 'Hardened steel excavator bucket teeth', quantity: 80, unit: 'pieces' },
          { name: 'Hydraulic Cylinders', description: 'High-pressure hydraulic lift cylinders', quantity: 16, unit: 'pieces' },
          { name: 'Drive Components', description: 'Chain drive sprockets and components', quantity: 24, unit: 'pieces' },
          { name: 'Wear Plates', description: 'Abrasion-resistant liner plates', quantity: 50, unit: 'pieces' }
        ]
      },
      {
        title: 'Packaging Line Modernization',
        description: 'Equipment upgrade components for automated packaging line',
        priority: Priority.LOW,
        deadline: new Date('2025-05-15'),
        customerId: customers[3]?.id || customers[0]?.id || '',
        items: [
          { name: 'Conveyor Systems', description: 'Stainless steel modular conveyor chains', quantity: 60, unit: 'meters' },
          { name: 'Guide Rails', description: 'Product guidance and alignment systems', quantity: 40, unit: 'pieces' },
          { name: 'Sensor Mounts', description: 'Detection equipment mounting brackets', quantity: 30, unit: 'pieces' },
          { name: 'Drive Motors', description: 'Variable speed servo drive motors', quantity: 12, unit: 'pieces' },
          { name: 'Control Panels', description: 'Operator interface control panels', quantity: 6, unit: 'pieces' }
        ]
      },
      {
        title: 'HVAC System Components',
        description: 'Custom air handling equipment for commercial building climate control',
        priority: Priority.MEDIUM,
        deadline: new Date('2025-05-30'),
        customerId: customers[4]?.id || customers[0]?.id || '',
        items: [
          { name: 'Heat Exchangers', description: 'Plate-type heat recovery units', quantity: 8, unit: 'pieces' },
          { name: 'Damper Assemblies', description: 'Motorized airflow control dampers', quantity: 24, unit: 'pieces' },
          { name: 'Filter Housings', description: 'Heavy-duty air filter frames', quantity: 16, unit: 'pieces' }
        ]
      }
    ]

    // Create inquiries
    const createdInquiries = []
    
    for (let i = 0; i < inquiryTemplates.length; i++) {
      const template = inquiryTemplates[i]
      
      console.log(`\n📝 Creating Inquiry ${i + 1}/10: ${template.title}`)
      console.log(`   🎯 Priority: ${template.priority}`)
      console.log(`   📅 Deadline: ${template.deadline.toISOString().split('T')[0]}`)
      console.log(`   📦 Items: ${template.items.length}`)

      try {
        const inquiry = await prisma.inquiry.create({
          data: {
            title: template.title,
            description: template.description,
            status: InquiryStatus.SUBMITTED,
            priority: template.priority,
            deadline: template.deadline,
            customerId: template.customerId,
            createdById: adminUser.id,
            items: {
              create: template.items.map(item => ({
                name: item.name,
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                status: ItemStatus.PENDING
              }))
            }
          },
          include: {
            items: true,
            customer: true
          }
        })

        createdInquiries.push(inquiry)
        
        console.log(`   ✅ Created successfully - ID: ${inquiry.id}`)
        console.log(`   👤 Customer: ${inquiry.customer.name}`)
        
        // Log items
        inquiry.items.forEach((item, index) => {
          console.log(`      ${index + 1}. ${item.name} (${item.quantity} ${item.unit})`)
        })

      } catch (error) {
        console.log(`   ❌ Failed to create inquiry: ${error}`)
      }
    }

    // Final summary
    console.log('\n🎉 INQUIRY CREATION SUMMARY:')
    console.log('=====================================')
    console.log(`✅ Total Inquiries Created: ${createdInquiries.length}/10`)
    console.log(`👤 Created by: ${adminUser.name} (${adminUser.email})`)
    console.log(`📋 Total Items: ${createdInquiries.reduce((sum, inq) => sum + inq.items.length, 0)}`)
    
    // Priority breakdown
    const priorityBreakdown = createdInquiries.reduce((acc, inq) => {
      acc[inq.priority] = (acc[inq.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    console.log('📊 Priority Breakdown:')
    Object.entries(priorityBreakdown).forEach(([priority, count]) => {
      console.log(`   ${priority}: ${count} inquiries`)
    })

    // Date range
    const dates = createdInquiries.map(inq => inq.deadline).filter(d => d !== null)
    const minDate = new Date(Math.min(...dates.map(d => d!.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d!.getTime())))
    
    console.log(`📅 Date Range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`)
    
    console.log('\n✅ Admin inquiry creation completed successfully!')

  } catch (error) {
    console.log(`❌ Error creating inquiries: ${error}`)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
createInquiriesAsAdmin().catch(console.error)