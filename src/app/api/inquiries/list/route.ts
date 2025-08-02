import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { inquiryFiltersSchema } from '@/lib/validations'
import { cache } from '@/lib/upstash-redis'
import { optimizedAuth } from '@/utils/supabase/optimized-auth'

/**
 * Lightweight inquiries listing endpoint
 * Returns minimal data for better performance
 */
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
    
    // Convert numeric params from strings
    const params = {
      ...rawParams,
      page: rawParams.page ? parseInt(rawParams.page, 10) : undefined,
      limit: rawParams.limit ? parseInt(rawParams.limit, 10) : undefined,
      status: rawParams.status ? [rawParams.status] : undefined,
      priority: rawParams.priority ? [rawParams.priority] : undefined,
    }
    
    const filters = inquiryFiltersSchema.parse(params)
    
    // Generate cache key
    const cacheKey = `inquiries:list:${user.role}:${user.id}:${JSON.stringify(filters)}`
    
    // Try cache first (5-minute TTL)
    const cachedResult = await cache.get(cacheKey)
    if (cachedResult) {
      const duration = Date.now() - startTime
      console.log(`[API] /inquiries/list cache HIT (${duration}ms)`)
      return NextResponse.json(cachedResult)
    }

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
        { title: { contains: filters.search, mode: 'insensitive' } },
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

    // Get inquiries with minimal data
    const inquiries = await db.inquiry.findMany({
      where,
      skip: ((filters.page || 1) - 1) * (filters.limit || 10),
      take: filters.limit || 10,
      orderBy: filters.orderBy || { createdAt: 'desc' },
      select: {
        id: true,
        sequentialNumber: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true
          }
        },
        // Summary counts instead of full data
        _count: {
          select: {
            items: true
          }
        }
      }
    })

    // Add summary data for each inquiry
    const inquiriesWithSummary = await Promise.all(
      inquiries.map(async (inquiry) => {
        // Get assigned/unassigned item counts
        const assignedCount = await db.inquiryItem.count({
          where: {
            inquiryId: inquiry.id,
            assignedToId: { not: null }
          }
        })

        return {
          ...inquiry,
          itemsCount: inquiry._count.items,
          assignedItemsCount: assignedCount,
          unassignedItemsCount: inquiry._count.items - assignedCount
        }
      })
    )

    const result = {
      inquiries: inquiriesWithSummary,
      total,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: Math.ceil(total / (filters.limit || 10))
    }
    
    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300)
    
    const duration = Date.now() - startTime
    console.log(`[API] /inquiries/list completed in ${duration}ms`)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch inquiries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    )
  }
}