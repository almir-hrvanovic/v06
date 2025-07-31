import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { updateInquirySchema, idSchema } from '@/lib/validations'
import { hasPermission } from '@/utils/supabase/api-auth'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'inquiries', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = idSchema.parse({ id: params.id })

    const inquiry = await db.inquiry.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true, role: true } },
        items: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true, role: true } },
            costCalculation: {
              include: {
                calculatedBy: { select: { id: true, name: true, email: true } }
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        quotes: {
          include: {
            createdBy: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        attachments: {
          include: {
            attachment: {
              include: {
                uploadedBy: { select: { id: true, name: true, email: true } }
              }
            }
          }
        }
      }
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Check role-based access
    if (user.role === 'SALES' && inquiry.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (user.role === 'VP') {
      const hasAssignedItems = inquiry.items.some(item => 
        item.assignedToId === user.id
      )
      if (!hasAssignedItems) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({
      success: true,
      data: inquiry,
    })
  } catch (error) {
    console.error('Get inquiry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'inquiries', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = idSchema.parse({ id: params.id })
    const body = await request.json()
    const validatedData = updateInquirySchema.parse(body)

    // Get the existing inquiry for audit trail
    const existingInquiry = await db.inquiry.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        deadline: true,
        assignedToId: true,
        createdById: true,
      }
    })

    if (!existingInquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Check role-based access for modifications
    if (user.role === 'SALES' && existingInquiry.createdById !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const inquiry = await db.inquiry.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.priority && { priority: validatedData.priority }),
        ...(validatedData.deadline !== undefined && { deadline: validatedData.deadline }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.assignedToId !== undefined && { assignedToId: validatedData.assignedToId }),
      },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } },
            costCalculation: true,
          }
        }
      }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Inquiry',
        entityId: inquiry.id,
        oldData: {
          title: existingInquiry.title,
          status: existingInquiry.status,
          priority: existingInquiry.priority,
          assignedToId: existingInquiry.assignedToId,
        },
        newData: {
          title: inquiry.title,
          status: inquiry.status,
          priority: inquiry.priority,
          assignedToId: inquiry.assignedToId,
        },
        userId: user.id,
        inquiryId: inquiry.id,
      }
    })

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: 'Inquiry updated successfully',
    })
  } catch (error) {
    console.error('Update inquiry error:', error)
    
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Validation error', details: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'inquiries', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = idSchema.parse({ id: params.id })

    const existingInquiry = await db.inquiry.findUnique({
      where: { id },
      select: { id: true, title: true, createdById: true }
    })

    if (!existingInquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Only allow deletion by creator or admin/superuser
    if (
      user.role !== 'ADMIN' && 
      user.role !== 'SUPERUSER' && 
      existingInquiry.createdById !== user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.inquiry.delete({
      where: { id }
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Inquiry',
        entityId: id,
        oldData: {
          title: existingInquiry.title,
        },
        userId: user.id,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Inquiry deleted successfully',
    })
  } catch (error) {
    console.error('Delete inquiry error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}