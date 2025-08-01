import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { ExcelService, DEFAULT_EXCEL_COMPANY_INFO } from '@/lib/excel'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

const exportRequestSchema = z.object({
  filters: z.object({
    isActive: z.boolean().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
    minInquiries: z.number().optional(),
    maxInquiries: z.number().optional(),
  }).optional(),
  includeDetails: z.boolean().default(true),
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
    if (!['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = exportRequestSchema.parse(body)

    // Build where clause based on filters
    const where: any = {}
    
    if (validatedData.filters) {
      const { filters } = validatedData
      
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive
      }
      
      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {}
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
      }
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      }
    }

    // Fetch customers data
    const customers = await (db.customer as any).findMany({
      where,
      include: {
        _count: {
          select: { inquiries: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit to prevent memory issues
    })

    // Apply inquiry count filters if specified
    let filteredCustomers = customers
    if (validatedData.filters?.minInquiries !== undefined || validatedData.filters?.maxInquiries !== undefined) {
      filteredCustomers = customers.filter((customer: any) => {
        const inquiryCount = (customer as any)._count.inquiries
        if (validatedData.filters?.minInquiries !== undefined && inquiryCount < validatedData.filters.minInquiries) {
          return false
        }
        if (validatedData.filters?.maxInquiries !== undefined && inquiryCount > validatedData.filters.maxInquiries) {
          return false
        }
        return true
      })
    }

    if (filteredCustomers.length === 0) {
      return NextResponse.json(
        { error: 'No customers found matching the criteria' },
        { status: 404 }
      )
    }

    // Generate Excel file
    const excelBuffer = await ExcelService.exportCustomersToExcel(filteredCustomers as any, {
      fileName: validatedData.fileName || `customers-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      includeFormatting: true,
      companyInfo: DEFAULT_EXCEL_COMPANY_INFO
    })

    // Generate filename
    const filename = validatedData.fileName || `customers-export-${new Date().toISOString().split('T')[0]}.xlsx`

    // Set response headers for Excel download
    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    headers.set('Content-Length', excelBuffer.length.toString())

    return new NextResponse(excelBuffer as any, { headers })
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
    if (!['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get basic statistics for export preview
    const totalCustomers = await (db.customer as any).count()
    const activeCustomers = await (db.customer as any).count({ where: { isActive: true } })
    const recentCustomers = await (db.customer as any).count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })

    // Get customers with inquiry counts
    const customersWithInquiries = await (db.customer as any).findMany({
      select: {
        _count: {
          select: { inquiries: true }
        }
      }
    })

    const inquiryCountStats = customersWithInquiries.reduce(
      (acc: any, customer: any) => {
        const count = customer._count.inquiries
        acc.total += count
        if (count === 0) acc.withoutInquiries++
        if (count >= 1) acc.withInquiries++
        if (count >= 5) acc.activeCustomers++
        return acc
      },
      { total: 0, withoutInquiries: 0, withInquiries: 0, activeCustomers: 0 }
    )

    return NextResponse.json({
      totalCustomers,
      activeCustomers,
      recentCustomers,
      inquiryStats: inquiryCountStats,
      maxRecords: 1000,
      supportedFormats: ['xlsx'],
      features: {
        includeSummary: false,
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