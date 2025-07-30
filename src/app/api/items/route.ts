import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { itemFiltersSchema } from '@/lib/validations'
import { hasPermission } from '@/utils/supabase/api-auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'inquiry-items', 'read')) {
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
    
    // Only add status if it exists (don't pass undefined)
    if (rawParams.status) {
      params.status = [rawParams.status]
    }
    
    const filters = itemFiltersSchema.parse(params)

    const where: any = {}

    // Apply role-based filtering
    if (session.user.role === 'VP') {
      where.assignedToId = session.user.id
    } else if (session.user.role === 'TECH') {
      where.assignedTo = {
        role: 'VP',
        inquiryItems: {
          some: {
            assignedToId: session.user.id
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
      prisma.inquiryItem.findMany({
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
      prisma.inquiryItem.count({ where }),
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}