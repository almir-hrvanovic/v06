import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { ExcelService, DEFAULT_EXCEL_COMPANY_INFO } from '@/lib/excel'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

const exportRequestSchema = z.object({
  filters: z.object({
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
    customerId: z.string().optional(),
    assignedToId: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
  }).optional(),
  includeDetails: z.boolean().default(true),
  includeSummary: z.boolean().default(true),
  fileName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user permissions
    const userRole = user.role
    if (!['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = exportRequestSchema.parse(body)

    // Build where clause based on filters
    const where: any = {}
    
    if (validatedData.filters) {
      const { filters } = validatedData
      
      if (filters.status && filters.status.length > 0) {
        where.status = { in: filters.status }
      }
      
      if (filters.priority && filters.priority.length > 0) {
        where.priority = { in: filters.priority }
      }
      
      if (filters.customerId) {
        where.customerId = filters.customerId
      }
      
      if (filters.assignedToId) {
        where.assignedToId = filters.assignedToId
      }
      
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
      }
      
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { customer: { name: { contains: filters.search, mode: 'insensitive' } } }
        ]
      }
    }

    // Apply role-based filtering
    if (userRole === 'SALES') {
      where.createdById = user.id
    } else if (userRole === 'VP') {
      where.items = { some: { assignedToId: user.id } }
    }

    // Fetch inquiries data
    const inquiries = await db.inquiry.findMany({
      where,
      include: {
        customer: true,
        createdBy: true,
        items: {
          include: {
            costCalculation: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit to prevent memory issues
    })

    if (inquiries.length === 0) {
      return NextResponse.json(
        { error: 'No inquiries found matching the criteria' },
        { status: 404 }
      )
    }

    // Generate Excel file
    const excelBuffer = await ExcelService.exportInquiriesToExcel(inquiries, {
      fileName: validatedData.fileName || `inquiries-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      includeSummary: validatedData.includeSummary,
      includeFormatting: true,
      companyInfo: DEFAULT_EXCEL_COMPANY_INFO
    })

    // Generate filename
    const filename = validatedData.fileName || `inquiries-export-${new Date().toISOString().split('T')[0]}.xlsx`

    // Set response headers for Excel download
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Content-Length', excelBuffer.length.toString())

    return new NextResponse(excelBuffer, { headers })
  } catch (error) {
    console.error('Excel export error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate Excel export', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user permissions
    const userRole = user.role
    if (!['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get basic statistics for export preview
    const totalInquiries = await db.inquiry.count()
    const recentInquiries = await db.inquiry.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })

    const statusCounts = await db.inquiry.groupBy({
      by: ['status'],
      _count: { status: true }
    })

    const priorityCounts = await db.inquiry.groupBy({
      by: ['priority'],
      _count: { priority: true }
    })

    return NextResponse.json({
      totalInquiries,
      recentInquiries,
      statusBreakdown: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.status
        return acc
      }, {} as Record<string, number>),
      priorityBreakdown: priorityCounts.reduce((acc, item) => {
        acc[item.priority] = item._count.priority
        return acc
      }, {} as Record<string, number>),
      maxRecords: 1000,
      supportedFormats: ['xlsx'],
      features: {
        includeSummary: true,
        includeFormatting: true,
        includeCharts: false,
        customColumns: true
      }
    })
  } catch (error) {
    console.error('Excel export info error:', error)
    return NextResponse.json(
      { error: 'Failed to get export information' },
      { status: 500 }
    )
  }
}