import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { ExcelService, DEFAULT_EXCEL_COMPANY_INFO } from '@/lib/excel'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

const exportRequestSchema = z.object({
  filters: z.object({
    role: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
  }).optional(),
  includeDetails: z.boolean().default(true),
  fileName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and superusers can export user data
    const userRole = user.role
    if (!['SUPERUSER', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = exportRequestSchema.parse(body)

    // Build where clause based on filters
    const where: any = {}
    
    if (validatedData.filters) {
      const { filters } = validatedData
      
      if (filters.role && filters.role.length > 0) {
        where.role = { in: filters.role }
      }
      
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

    // Fetch users data
    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        password: true, // Include but we won't export it
        role: true,
        preferredLanguage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500 // Limit for user data
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'No users found matching the criteria' },
        { status: 404 }
      )
    }

    // Generate Excel file
    const excelBuffer = await ExcelService.exportUsersToExcel(users, {
      fileName: validatedData.fileName || `users-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      includeFormatting: true,
      companyInfo: DEFAULT_EXCEL_COMPANY_INFO
    })

    // Generate filename
    const filename = validatedData.fileName || `users-export-${new Date().toISOString().split('T')[0]}.xlsx`

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
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins and superusers can access user export info
    const userRole = user.role
    if (!['SUPERUSER', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get basic statistics for export preview
    const totalUsers = await db.user.count()
    const activeUsers = await db.user.count({ where: { isActive: true } })
    const recentUsers = await db.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })

    const roleCounts = await db.user.groupBy({
      by: ['role'],
      _count: { role: true }
    })

    return NextResponse.json({
      totalUsers,
      activeUsers,
      recentUsers,
      roleBreakdown: roleCounts.reduce((acc, item) => {
        acc[item.role] = item._count.role
        return acc
      }, {} as Record<string, number>),
      maxRecords: 500,
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