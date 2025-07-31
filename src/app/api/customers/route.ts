import { NextRequest, NextResponse } from 'next/server'
import { hasPermission } from '@/utils/supabase/api-auth'
import { db } from '@/lib/db/index'
import { UserRole } from '@/lib/db/types'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

// Schema for creating/updating customers
const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable()
})

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
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

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Failed to fetch customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
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
    const existing = await db.customer.findFirst({
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
        newData: customer as any,
        metadata: {
          customerName: customer.name,
          customerEmail: customer.email
        }
      }
    })

    return NextResponse.json(customer)
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