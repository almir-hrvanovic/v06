import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { PDFService } from '@/lib/pdf'
import { generateReportHTML } from '@/lib/pdf-templates'
import { z } from 'zod'

const reportRequestSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  type: z.enum(['inquiries', 'users', 'customers', 'analytics']),
  dateRange: z.object({
    from: z.string().transform(str => new Date(str)),
    to: z.string().transform(str => new Date(str))
  }),
  filters: z.record(z.any()).optional(),
  includeDetails: z.boolean().default(true),
  includeSummary: z.boolean().default(true)
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow certain roles to generate reports
    const userRole = session.user.role
    if (!['SUPERUSER', 'ADMIN', 'MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = reportRequestSchema.parse(body)

    let reportData: any = {}
    let summary: any = undefined

    // Generate data based on report type
    switch (validatedData.type) {
      case 'inquiries':
        const inquiryWhere: any = {
          createdAt: {
            gte: validatedData.dateRange.from,
            lte: validatedData.dateRange.to
          }
        }

        // Apply filters
        if (validatedData.filters?.status) {
          inquiryWhere.status = { in: validatedData.filters.status }
        }
        if (validatedData.filters?.priority) {
          inquiryWhere.priority = { in: validatedData.filters.priority }
        }
        if (validatedData.filters?.customerId) {
          inquiryWhere.customerId = validatedData.filters.customerId
        }

        // Fetch inquiries data
        const [inquiries, totalInquiries, totalValue] = await Promise.all([
          validatedData.includeDetails ? prisma.inquiry.findMany({
            where: inquiryWhere,
            include: {
              customer: true,
              createdBy: { select: { id: true, name: true, email: true } },
              items: {
                select: { id: true, name: true, status: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit for PDF performance
          }) : [],
          prisma.inquiry.count({ where: inquiryWhere }),
          prisma.inquiry.aggregate({
            where: inquiryWhere,
            _sum: { totalValue: true },
            _avg: { totalValue: true }
          })
        ])

        if (validatedData.includeSummary) {
          const [pendingCount, completedCount] = await Promise.all([
            prisma.inquiry.count({
              where: { ...inquiryWhere, status: { in: ['DRAFT', 'SUBMITTED', 'ASSIGNED'] } }
            }),
            prisma.inquiry.count({
              where: { ...inquiryWhere, status: { in: ['QUOTED', 'APPROVED'] } }
            })
          ])

          summary = {
            totalInquiries,
            totalValue: totalValue._sum.totalValue?.toNumber() || 0,
            averageValue: totalValue._avg.totalValue?.toNumber() || 0,
            pendingInquiries: pendingCount,
            completedInquiries: completedCount
          }
        }

        reportData = { inquiries, summary }
        break

      case 'users':
        const userWhere: any = {
          createdAt: {
            gte: validatedData.dateRange.from,
            lte: validatedData.dateRange.to
          }
        }

        if (validatedData.filters?.role) {
          userWhere.role = { in: validatedData.filters.role }
        }
        if (validatedData.filters?.isActive !== undefined) {
          userWhere.isActive = validatedData.filters.isActive
        }

        const users = await prisma.user.findMany({
          where: userWhere,
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        })

        reportData = { users }
        break

      case 'customers':
        const customerWhere: any = {
          createdAt: {
            gte: validatedData.dateRange.from,
            lte: validatedData.dateRange.to
          }
        }

        const customers = await prisma.customer.findMany({
          where: customerWhere,
          include: {
            _count: { select: { inquiries: true } }
          },
          orderBy: { createdAt: 'desc' }
        })

        reportData = { customers }
        break

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    // Generate HTML content
    const htmlContent = generateReportHTML(
      validatedData.title,
      validatedData.subtitle,
      reportData,
      validatedData.dateRange,
      validatedData.filters || {}
    )

    // Generate PDF
    const pdfBuffer = await PDFService.generatePDFFromHTML(htmlContent, {
      format: 'A4',
      orientation: 'portrait',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '10mm',
        bottom: '15mm',
        left: '10mm'
      }
    })

    // Create filename
    const dateStr = validatedData.dateRange.from.toISOString().split('T')[0]
    const filename = `${validatedData.type}-report-${dateStr}.pdf`

    // Set response headers for PDF download
    const headers = new Headers()
    headers.set('Content-Type', 'application/pdf')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Content-Length', pdfBuffer.length.toString())

    return new NextResponse(pdfBuffer, { headers })
  } catch (error) {
    console.error('Report PDF generation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate report PDF', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow certain roles to access report capabilities
    const userRole = session.user.role
    if (!['SUPERUSER', 'ADMIN', 'MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Return available report types and their configurations
    const reportTypes = [
      {
        type: 'inquiries',
        name: 'Inquiries Report',
        description: 'Detailed report of inquiries with filtering options',
        filters: ['status', 'priority', 'customerId', 'assignedToId'],
        includeSummary: true
      },
      {
        type: 'users',
        name: 'Users Report', 
        description: 'Report of system users and their activity',
        filters: ['role', 'isActive'],
        includeSummary: false
      },
      {
        type: 'customers',
        name: 'Customers Report',
        description: 'Report of customers and their inquiry history', 
        filters: ['isActive'],
        includeSummary: false
      },
      {
        type: 'analytics',
        name: 'Analytics Report',
        description: 'Comprehensive analytics and metrics report',
        filters: ['dateRange'],
        includeSummary: true
      }
    ]

    return NextResponse.json({ reportTypes })
  } catch (error) {
    console.error('Report types fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report types' },
      { status: 500 }
    )
  }
}