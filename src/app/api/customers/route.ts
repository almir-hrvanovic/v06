import { NextRequest, NextResponse } from 'next/server'
import { hasPermission } from '@/utils/supabase/api-auth'
import { db } from '@/lib/db/index'
import { UserRole } from '@/lib/db/types'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'
import { optimizeApiRoute } from '@/lib/api-optimization'

// Schema for creating/updating customers
const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable()
})

const getHandler = async (request: NextRequest) => {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only certain roles can view customers
    if (!hasPermission(user.role, 'customers', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('active')

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const customers = await db.customer.findMany({
      where,
      include: {
        _count: {
          select: { inquiries: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { 
      success: true,
      data: customers, 
      total: customers.length,
      pagination: {
        page: 1,
        limit: customers.length,
        total: customers.length
      }
    }
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

const postHandler = async (request: NextRequest) => {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only certain roles can create customers
    if (!hasPermission(user.role, 'customers', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = customerSchema.parse(body)

    // Check if customer with same email already exists
    const existing = await db.customer!.findFirst({
      where: { email: validatedData.email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 400 }
      )
    }

    // Create customer
    const customer = await db.customer.create({
      data: validatedData,
      include: {
        _count: {
          select: { inquiries: true }
        }
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'CUSTOMER',
        entityId: customer.id,
        userId: user.id!,
        oldData: {},
        newData: customer as any,
        metadata: {
          customerName: customer.name,
          customerEmail: customer.email
        },
        inquiryId: null
      }
    })

    return { 
      success: true,
      data: customer,
      message: 'Customer created successfully'
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to create customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}

// Export optimized route handlers
export const GET = optimizeApiRoute(getHandler, {
  enableCaching: true,
  cacheMaxAge: 300, // 5 minutes cache for customers
  enableCompression: true,
  enableETag: true,
  optimizePayload: true,
  excludeFields: ['email'] // Remove email from customer listings for privacy
})

export const POST = optimizeApiRoute(postHandler, {
  enableCaching: false, // Don't cache POST requests
  enableCompression: true,
  enableResponseTiming: true,
  optimizePayload: true
})