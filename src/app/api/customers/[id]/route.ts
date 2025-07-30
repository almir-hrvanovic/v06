import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { z } from 'zod'

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
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only certain roles can update customers
    if (session.user.role !== UserRole.SUPERUSER && 
        session.user.role !== UserRole.ADMIN && 
        session.user.role !== UserRole.SALES) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateCustomerSchema.parse(body)

    // Check if customer exists
    const existing = await prisma.customer.findUnique({
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
      const emailExists = await prisma.customer.findFirst({
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
    const customer = await prisma.customer.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: { inquiries: true }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'CUSTOMER',
        entityId: customer.id,
        userId: session.user.id!,
        oldData: existing as any,
        newData: customer as any,
        metadata: {
          customerName: customer.name
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
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only certain roles can deactivate customers
    if (session.user.role !== UserRole.SUPERUSER && session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inquiries: true }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Don't delete if customer has inquiries
    if (customer._count.inquiries > 0) {
      // Soft delete (deactivate) instead
      await prisma.customer.update({
        where: { id },
        data: { isActive: false }
      })

      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'CUSTOMER',
          entityId: customer.id,
          userId: session.user.id!,
          oldData: { isActive: true },
          newData: { isActive: false },
          metadata: {
            action: 'deactivated',
            customerName: customer.name,
            reason: 'Has existing inquiries'
          }
        }
      })

      return NextResponse.json({ message: 'Customer deactivated' })
    }

    // Hard delete if no inquiries
    await prisma.customer.delete({
      where: { id }
    })

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'CUSTOMER',
        entityId: customer.id,
        userId: session.user.id!,
        oldData: customer as any,
        metadata: {
          customerName: customer.name,
          customerEmail: customer.email
        }
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