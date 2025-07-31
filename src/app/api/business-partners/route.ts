import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { hasPermission } from '@/utils/supabase/api-auth'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

const createBusinessPartnerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  isActive: z.boolean().optional().default(true)
})

const businessPartnerFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false', 'all']).optional().default('all'),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('50')
})

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'business_partners', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const filters = businessPartnerFiltersSchema.parse(Object.fromEntries(searchParams))

    const page = parseInt(filters.page)
    const limit = parseInt(filters.limit)
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive'
      }
    }

    if (filters.isActive !== 'all') {
      where.isActive = filters.isActive === 'true'
    }

    // Get data with pagination
    const [businessPartners, total] = await Promise.all([
      db.businessPartner.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      db.businessPartner.count({ where })
    ])

    return NextResponse.json({
      data: businessPartners,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching business partners:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'business_partners', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const data = createBusinessPartnerSchema.parse(body)

    // Check for duplicate name
    const existingPartner = await db.businessPartner.findUnique({
      where: { name: data.name }
    })

    if (existingPartner) {
      return NextResponse.json(
        { error: 'Business partner with this name already exists' },
        { status: 409 }
      )
    }

    const businessPartner = await db.businessPartner.create({
      data
    })

    return NextResponse.json(businessPartner, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating business partner:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}