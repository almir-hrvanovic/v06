import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { UserRole } from '@/lib/db/types'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

// Schema for updating customers
const updateCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only certain roles can update customers
    if (user.role !== UserRole.SUPERUSER && 
        user.role !== UserRole.ADMIN && 
        user.role !== UserRole.SALES) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateCustomerSchema.parse(body)

    // Check if customer exists
    const existing = await db.customer.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed to one that already exists
    if (validatedData.email !== existing.email) {
      const emailExists = await db.customer.findFirst({
        where: { 
          email: validatedData.email,
          id: { not: id }
        }
      })

      if (emailExists) {
        return NextResponse.json(
          { error: 'Customer with this email already exists' },
          { status: 400 }
        )
      }
    }

    // Update customer
    const customer = await db.customer.update({
      where: { id },
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
        action: 'UPDATE',
        entity: 'CUSTOMER',
        entityId: customer.id,
        userId: user.id!,
        oldData: existing as any,
        newData: customer as any,
        metadata: {
          customerName: customer.name
        },
        inquiryId: null
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

    console.error('Failed to update customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only certain roles can deactivate customers
    if (user.role !== UserRole.SUPERUSER && user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if customer exists
    const customer = await db.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inquiries: true }
        }
      }
    }) as any

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Don't delete if customer has inquiries
    if (customer._count.inquiries > 0) {
      // Soft delete (deactivate) instead
      await db.customer.update({
        where: { id },
        data: { isActive: false }
      })

      await db.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'CUSTOMER',
          entityId: customer.id,
          userId: user.id!,
          oldData: { isActive: true },
          newData: { isActive: false },
          metadata: {
            action: 'deactivated',
            customerName: customer.name,
            reason: 'Has existing inquiries'
          },
          inquiryId: null
        }
      })

      return NextResponse.json({ message: 'Customer deactivated' })
    }

    // Hard delete if no inquiries
    await db.customer.delete({
      where: { id }
    })

    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'CUSTOMER',
        entityId: customer.id,
        userId: user.id!,
        oldData: customer as any,
        newData: {},
        metadata: {
          customerName: customer.name,
          customerEmail: customer.email
        },
        inquiryId: null
      }
    })

    return NextResponse.json({ message: 'Customer deleted' })
  } catch (error) {
    console.error('Failed to delete customer:', error)
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    )
  }
}