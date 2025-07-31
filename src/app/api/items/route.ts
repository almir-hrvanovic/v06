import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { itemFiltersSchema } from '@/lib/validations'
import { hasPermission } from '@/utils/supabase/api-auth'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'inquiry-items', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams)
    
    // Convert numeric params from strings and handle status
    const params: any = {
      ...rawParams,
      page: rawParams.page ? parseInt(rawParams.page, 10) : undefined,
      limit: rawParams.limit ? parseInt(rawParams.limit, 10) : undefined,
    }
    
    // Handle status - it can be a comma-separated string or single value
    if (rawParams.status) {
      params.status = rawParams.status.includes(',') 
        ? rawParams.status.split(',').map((s: string) => s.trim())
        : [rawParams.status]
    }
    
    const filters = itemFiltersSchema.parse(params)

    const where: any = {}

    // Apply role-based filtering
    if (user.role === 'VP') {
      where.assignedToId = user.id
    } else if (user.role === 'TECH') {
      where.assignedTo = {
        role: 'VP',
        inquiryItems: {
          some: {
            assignedToId: user.id
          }
        }
      }
    }

    // Apply filters
    if (filters.status && filters.status.length > 0) {
      where.status = { in: filters.status }
    }

    if (filters.assignedToId) {
      where.assignedToId = filters.assignedToId
    }

    if (filters.inquiryId) {
      where.inquiryId = filters.inquiryId
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { inquiry: { title: { contains: filters.search, mode: 'insensitive' } } }
      ]
    }

    const [items, total] = await Promise.all([
      db.inquiryItem.findMany({
        where,
        include: {
          inquiry: {
            include: {
              customer: { select: { id: true, name: true } },
              createdBy: { select: { id: true, name: true, email: true } }
            }
          },
          assignedTo: { select: { id: true, name: true, email: true, role: true } },
          costCalculation: {
            include: {
              calculatedBy: { select: { id: true, name: true, email: true } },
              approvals: {
                include: {
                  approver: { select: { id: true, name: true, email: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      db.inquiryItem.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: items,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        pages: Math.ceil(total / filters.limit),
      },
    })
  } catch (error) {
    console.error('Get items error:', error)
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}