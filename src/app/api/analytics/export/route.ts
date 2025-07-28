import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// Simple CSV export functionality
export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    if (!['ADMIN', 'SUPERUSER', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'overview'
    const timeRange = searchParams.get('timeRange') || '30'

    const days = parseInt(timeRange)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let csvData = ''
    let filename = `analytics-${type}-${days}days-${new Date().toISOString().split('T')[0]}.csv`

    switch (type) {
      case 'overview':
        csvData = await generateOverviewCSV(startDate)
        break
      case 'workload':
        csvData = await generateWorkloadCSV(startDate)
        break
      case 'performance':
        csvData = await generatePerformanceCSV(startDate)
        break
      case 'financial':
        csvData = await generateFinancialCSV(startDate)
        break
      default:
        csvData = await generateOverviewCSV(startDate)
    }

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Analytics export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateOverviewCSV(startDate: Date): Promise<string> {
  const inquiries = await prisma.inquiry.findMany({
    where: { createdAt: { gte: startDate } },
    include: {
      customer: { select: { name: true } },
      createdBy: { select: { name: true } },
      _count: { select: { items: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  let csv = 'Date,Inquiry ID,Title,Customer,Created By,Status,Items Count\n'
  
  inquiries.forEach(inquiry => {
    csv += `"${inquiry.createdAt.toISOString().split('T')[0]}","${inquiry.id}","${inquiry.title}","${inquiry.customer.name}","${inquiry.createdBy.name}","${inquiry.status}","${inquiry._count.items}"\n`
  })

  return csv
}

async function generateWorkloadCSV(startDate: Date): Promise<string> {
  const vpWorkload = await prisma.user.findMany({
    where: { role: 'VP' },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          inquiryItems: true
        }
      }
    }
  })

  let csv = 'User Name,Email,Role,Active Items\n'
  
  vpWorkload.forEach(vp => {
    csv += `"${vp.name}","${vp.email}","VP","${vp._count.inquiryItems}"\n`
  })

  // Add tech workload
  const techWorkload = await prisma.user.findMany({
    where: { role: 'TECH' },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          inquiryItems: true
        }
      }
    }
  })

  techWorkload.forEach(tech => {
    csv += `"${tech.name}","${tech.email}","TECH","${tech._count.inquiryItems}"\n`
  })

  return csv
}

async function generatePerformanceCSV(startDate: Date): Promise<string> {
  const performance = await prisma.$queryRaw`
    SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      COUNT(CASE WHEN ii.status IN ('APPROVED', 'QUOTED') THEN 1 END) as completed,
      COUNT(*) as total,
      ROUND(
        COUNT(CASE WHEN ii.status IN ('APPROVED', 'QUOTED') THEN 1 END)::numeric / 
        COUNT(*)::numeric * 100, 2
      ) as completion_rate
    FROM "User" u
    JOIN "InquiryItem" ii ON u.id = ii.assigned_to_vp_id
    WHERE u.role IN ('VP', 'MANAGER') AND ii.vp_assigned_at >= ${startDate}
    GROUP BY u.id, u.name, u.email, u.role
    ORDER BY completion_rate DESC
  ` as any[]

  let csv = 'Name,Email,Role,Completed,Total,Completion Rate\n'
  
  performance.forEach(user => {
    csv += `"${user.name}","${user.email}","${user.role}","${user.completed}","${user.total}","${user.completion_rate}%"\n`
  })

  return csv
}

async function generateFinancialCSV(startDate: Date): Promise<string> {
  const quotes = await prisma.quote.findMany({
    where: { createdAt: { gte: startDate } },
    include: {
      inquiry: {
        include: {
          customer: { select: { name: true } }
        }
      },
      createdBy: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  let csv = 'Date,Quote Number,Customer,Total Amount,Status,Created By,Valid Until\n'
  
  quotes.forEach(quote => {
    csv += `"${quote.createdAt.toISOString().split('T')[0]}","${quote.quoteNumber}","${quote.inquiry.customer.name}","${quote.total}","${quote.status}","${quote.createdBy.name}","${quote.validUntil.toISOString().split('T')[0]}"\n`
  })

  return csv
}