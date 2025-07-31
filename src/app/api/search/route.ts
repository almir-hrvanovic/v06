import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

const searchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['inquiries', 'items', 'users', 'customers', 'quotes', 'orders']),
  filters: z.object({
    search: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    status: z.array(z.string()).optional(),
    priority: z.array(z.string()).optional(),
    assignedToId: z.string().optional(),
    customerId: z.string().optional(),
    hasAttachments: z.boolean().optional(),
    totalValueMin: z.number().optional(),
    totalValueMax: z.number().optional(),
    itemStatus: z.array(z.string()).optional(),
    inquiryId: z.string().optional(),
    hasCalculations: z.boolean().optional(),
    role: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    lastModifiedDays: z.number().optional(),
  }).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || undefined
    const type = searchParams.get('type') || 'inquiries'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // Parse filters from query params
    const filters: any = {}
    if (query) filters.search = query
    
    const statusParam = searchParams.get('status')
    if (statusParam) filters.status = [statusParam]
    
    const priorityParam = searchParams.get('priority')
    if (priorityParam) filters.priority = [priorityParam]

    const validatedData = searchSchema.parse({
      query,
      type,
      filters,
      page,
      limit,
      sortBy,
      sortOrder
    })

    // Check user permissions
    const userRole = user.role
    if (!canAccessEntityType(userRole, validatedData.type)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const results = await performSearch(validatedData, userRole, user.id)

    return NextResponse.json({
      success: true,
      data: results.data,
      pagination: {
        page: validatedData.page,
        limit: validatedData.limit,
        total: results.total,
        pages: Math.ceil(results.total / validatedData.limit)
      },
      filters: validatedData.filters,
      meta: {
        searchQuery: validatedData.query,
        entityType: validatedData.type,
        executionTime: results.executionTime
      }
    })
  } catch (error) {
    console.error('Search API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function canAccessEntityType(userRole: string, entityType: string): boolean {
  const permissions: Record<string, string[]> = {
    SUPERUSER: ['inquiries', 'items', 'users', 'customers', 'quotes', 'orders'],
    ADMIN: ['inquiries', 'items', 'users', 'customers', 'quotes', 'orders'],
    MANAGER: ['inquiries', 'items', 'users', 'customers', 'quotes', 'orders'],
    SALES: ['inquiries', 'items', 'customers', 'quotes'],
    VPP: ['inquiries', 'items', 'users'],
    VP: ['inquiries', 'items'],
    TECH: ['inquiries', 'items']
  }
  
  return permissions[userRole]?.includes(entityType) || false
}

async function performSearch(params: z.infer<typeof searchSchema>, userRole: string, userId: string) {
  const startTime = Date.now()
  const { type, filters = {}, page, limit, sortBy, sortOrder } = params
  const skip = (page - 1) * limit

  let data: any[] = []
  let total = 0

  switch (type) {
    case 'inquiries':
      const result = await searchInquiries(filters, skip, limit, sortBy, sortOrder, userRole, userId)
      data = result.data
      total = result.total
      break
      
    case 'items':
      const itemResult = await searchItems(filters, skip, limit, sortBy, sortOrder, userRole, userId)
      data = itemResult.data
      total = itemResult.total
      break
      
    case 'users':
      const userResult = await searchUsers(filters, skip, limit, sortBy, sortOrder, userRole)
      data = userResult.data
      total = userResult.total
      break
      
    case 'customers':
      const customerResult = await searchCustomers(filters, skip, limit, sortBy, sortOrder, userRole)
      data = customerResult.data
      total = customerResult.total
      break
      
    default:
      throw new Error(`Unsupported entity type: ${type}`)
  }

  return {
    data,
    total,
    executionTime: Date.now() - startTime
  }
}

async function searchInquiries(filters: any, skip: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc', userRole: string, userId?: string) {
  const where: any = {}

  // Text search
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { customer: { name: { contains: filters.search, mode: 'insensitive' } } }
    ]
  }

  // Status filter
  if (filters.status && filters.status.length > 0) {
    where.status = { in: filters.status }
  }

  // Priority filter
  if (filters.priority && filters.priority.length > 0) {
    where.priority = { in: filters.priority }
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }

  // Assignment filter
  if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId
  }

  // Customer filter
  if (filters.customerId) {
    where.customerId = filters.customerId
  }

  // Value range filter
  if (filters.totalValueMin !== undefined || filters.totalValueMax !== undefined) {
    where.totalValue = {}
    if (filters.totalValueMin !== undefined) where.totalValue.gte = filters.totalValueMin
    if (filters.totalValueMax !== undefined) where.totalValue.lte = filters.totalValueMax
  }

  // Attachments filter
  if (filters.hasAttachments) {
    where.attachments = { some: {} }
  }

  // Role-based filtering
  if (userRole === 'SALES') {
    where.createdById = userId
  } else if (userRole === 'VP') {
    where.items = { some: { assignedToId: userId } }
  }

  // Recent activity filter
  if (filters.lastModifiedDays) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - filters.lastModifiedDays)
    where.updatedAt = { gte: cutoffDate }
  }

  const [data, total] = await Promise.all([
    db.inquiry.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
        items: {
          select: { id: true, status: true },
          include: { costCalculation: { select: { id: true } } }
        },
        attachments: { select: { id: true } },
        _count: { select: { items: true, attachments: true } }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    db.inquiry.count({ where })
  ])

  return { data, total }
}

async function searchItems(filters: any, skip: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc', userRole: string, userId?: string) {
  const where: any = {}

  // Text search
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { inquiry: { title: { contains: filters.search, mode: 'insensitive' } } }
    ]
  }

  // Status filter
  if (filters.itemStatus && filters.itemStatus.length > 0) {
    where.status = { in: filters.itemStatus }
  }

  // Assignment filter
  if (filters.assignedToId) {
    where.assignedToId = filters.assignedToId
  }

  // Inquiry filter
  if (filters.inquiryId) {
    where.inquiryId = filters.inquiryId
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }

  // Calculations filter
  if (filters.hasCalculations) {
    where.costCalculation = { isNot: null }
  }

  // Role-based filtering
  if (userRole === 'VP') {
    where.assignedToId = userId
  }

  const [data, total] = await Promise.all([
    db.inquiryItem.findMany({
      where,
      include: {
        inquiry: {
          include: {
            customer: { select: { id: true, name: true } }
          }
        },
        assignedTo: { select: { id: true, name: true } },
        costCalculation: { select: { id: true, totalCost: true, isApproved: true } },
        attachments: { select: { id: true } },
        _count: { select: { attachments: true } }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    db.inquiryItem.count({ where })
  ])

  return { data, total }
}

async function searchUsers(filters: any, skip: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc', userRole: string) {
  const where: any = {}

  // Text search
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  // Role filter
  if (filters.role && filters.role.length > 0) {
    where.role = { in: filters.role }
  }

  // Active filter
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }

  const [data, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            createdInquiries: true,
            assignedInquiries: true,
            inquiryItems: true,
            costCalculations: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    db.user.count({ where })
  ])

  return { data, total }
}

async function searchCustomers(filters: any, skip: number, limit: number, sortBy: string, sortOrder: 'asc' | 'desc', userRole: string) {
  const where: any = {}

  // Text search
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  // Active filter
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {}
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom)
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo)
  }

  const [data, total] = await Promise.all([
    db.customer.findMany({
      where,
      include: {
        _count: { select: { inquiries: true } }
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    }),
    db.customer.count({ where })
  ])

  return { data, total }
}