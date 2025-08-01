import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { createInquirySchema, inquiryFiltersSchema } from '@/lib/validations'
import { onInquiryCreated } from '@/lib/automation/hooks'
import { cache, cacheKeys } from '@/lib/upstash-redis'
import { optimizedAuth } from '@/utils/supabase/optimized-auth'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Check authentication
    const user = await optimizedAuth.getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!optimizedAuth.hasPermission(user.role, 'inquiries', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams)
    
    // Convert numeric params from strings and handle status/priority as arrays
    const params = {
      ...rawParams,
      page: rawParams.page ? parseInt(rawParams.page, 10) : undefined,
      limit: rawParams.limit ? parseInt(rawParams.limit, 10) : undefined,
      status: rawParams.status ? [rawParams.status] : undefined,
      priority: rawParams.priority ? [rawParams.priority] : undefined,
    }
    
    const filters = inquiryFiltersSchema.parse(params)
    
    // Generate cache key based on user role and filters
    const cacheKey = `inquiries:${user.role}:${user.id}:${JSON.stringify(filters)}`
    
    // Try cache first (2-minute TTL for frequently changing data)
    const cachedResult = await cache.get(cacheKey)
    if (cachedResult) {
      const duration = Date.now() - startTime
      console.log(`[API] /inquiries cache HIT (${duration}ms) for user ${user.email}`)
      return NextResponse.json(cachedResult)
    }
    
    console.log(`[API] /inquiries cache MISS for user ${user.email} - querying database`)

    const where: any = {}

    // Apply role-based filtering
    if (user.role === 'SALES') {
      where.createdById = user.id
    } else if (user.role === 'VPP') {
      where.OR = [
        { assignedToId: user.id },
        { status: 'SUBMITTED' }
      ]
    } else if (user.role === 'VP') {
      where.OR = [
        { assignedToId: user.id }
      ]
    }

    // Apply search filter
    if (filters.search) {
      where.OR = [
        ...(where.OR || []),
        { description: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } }
      ]
    }

    // Apply status filter
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    // Apply priority filter
    if (filters.priority && filters.priority.length > 0) {
      where.priority = { in: filters.priority }
    }

    // Apply assignedTo filter
    if (filters.assignedTo) {
      where.assignedToId = filters.assignedTo
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo)
      }
    }

    // Get total count for pagination
    const total = await db.inquiry.count({ where })

    // Get inquiries with pagination
    const inquiries = await db.inquiry.findMany({
      where,
      skip: ((filters.page || 1) - 1) * (filters.limit || 10),
      take: filters.limit || 10,
      orderBy: filters.orderBy || { createdAt: 'desc' },
      include: {
        customer: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true
              }
            },
            costs: true
          }
        }
      }
    })

    const result = {
      inquiries,
      total,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: Math.ceil(total / (filters.limit || 10))
    }
    
    // Cache the result for 2 minutes
    await cache.set(cacheKey, result, 120)
    
    const duration = Date.now() - startTime
    console.log(`[API] /inquiries completed in ${duration}ms for user ${user.email}`)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] Error fetching inquiries:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch inquiries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await optimizedAuth.getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!optimizedAuth.hasPermission(user.role, 'inquiries', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = createInquirySchema.parse(body)

    // Get next sequential number
    const latestInquiry = await db.inquiry.findFirst({
      orderBy: { sequentialNumber: 'desc' },
      select: { sequentialNumber: true }
    })
    
    const nextNumber = (latestInquiry?.sequentialNumber || 0) + 1

    // Create inquiry with sequential number
    const inquiry = await db.inquiry.create({
      data: {
        ...validatedData,
        sequentialNumber: nextNumber,
        createdById: user.id,
        status: 'DRAFT'
      },
      include: {
        customer: true,
        createdBy: true,
        items: true
      }
    })

    // Trigger automation hooks
    await onInquiryCreated(inquiry)
    
    // Invalidate cache for this user
    await cache.clearPattern(`inquiries:${user.role}:${user.id}:*`)
    
    return NextResponse.json(inquiry, { status: 201 })
  } catch (error) {
    console.error('[API] Error creating inquiry:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create inquiry' },
      { status: 500 }
    )
  }
}