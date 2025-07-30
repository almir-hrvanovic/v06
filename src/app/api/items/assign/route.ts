import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { bulkAssignItemsSchema } from '@/lib/validations'
import { canAssignItems } from '@/utils/supabase/api-auth'
import { sendNotificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canAssignItems(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = bulkAssignItemsSchema.parse(body)

    // Verify assignee exists and has VP role
    const assignee = await prisma.user.findUnique({
      where: { id: validatedData.assigneeId },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    })

    if (!assignee) {
      return NextResponse.json({ error: 'Assignee not found' }, { status: 404 })
    }

    if (!assignee.isActive) {
      return NextResponse.json({ error: 'Assignee is not active' }, { status: 400 })
    }

    if (assignee.role !== 'VP' && assignee.role !== 'VPP') {
      return NextResponse.json({ error: 'Can only assign items to VP or VPP users' }, { status: 400 })
    }

    // Verify all items exist and are assignable
    const items = await prisma.inquiryItem.findMany({
      where: {
        id: { in: validatedData.itemIds },
        status: { in: ['PENDING', 'ASSIGNED'] }
      },
      include: {
        inquiry: {
          include: {
            customer: { select: { id: true, name: true } }
          }
        }
      }
    })

    if (items.length !== validatedData.itemIds.length) {
      return NextResponse.json({ 
        error: 'Some items not found or not assignable' 
      }, { status: 400 })
    }

    // Check if inquiries are in correct status for assignment
    const invalidInquiries = items.filter(item => 
      !['SUBMITTED', 'ASSIGNED'].includes(item.inquiry.status)
    )

    if (invalidInquiries.length > 0) {
      return NextResponse.json({ 
        error: 'Some items belong to inquiries that cannot be assigned' 
      }, { status: 400 })
    }

    // Perform bulk assignment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update items
      const updatedItems = await tx.inquiryItem.updateMany({
        where: { id: { in: validatedData.itemIds } },
        data: {
          assignedToId: validatedData.assigneeId,
          status: 'ASSIGNED'
        }
      })

      // Update inquiry status to ASSIGNED if not already
      const inquiryIds = [...new Set(items.map(item => item.inquiry.id))]
      await tx.inquiry.updateMany({
        where: { 
          id: { in: inquiryIds },
          status: 'SUBMITTED'
        },
        data: { status: 'ASSIGNED' }
      })

      // Create audit logs
      for (const item of items) {
        await tx.auditLog.create({
          data: {
            action: 'ASSIGN',
            entity: 'InquiryItem',
            entityId: item.id,
            newData: {
              assignedToId: validatedData.assigneeId,
              assigneeName: assignee.name,
              status: 'ASSIGNED'
            },
            userId: session.user.id,
            inquiryId: item.inquiry.id,
          }
        })
      }

      // Create notifications for the assignee
      const uniqueInquiries = items.reduce((acc, item) => {
        if (!acc.find(inq => inq.id === item.inquiry.id)) {
          acc.push(item.inquiry)
        }
        return acc
      }, [] as typeof items[0]['inquiry'][])

      for (const inquiry of uniqueInquiries) {
        const assignedItems = items.filter(item => item.inquiry.id === inquiry.id)
        await tx.notification.create({
          data: {
            type: 'COST_CALCULATION_REQUESTED',
            title: 'Items assigned for cost calculation',
            message: `${assignedItems.length} items from "${inquiry.title}" have been assigned to you for cost calculation`,
            userId: validatedData.assigneeId,
            data: {
              inquiryId: inquiry.id,
              itemIds: assignedItems.map(item => item.id),
              itemCount: assignedItems.length
            }
          }
        })
      }

      return updatedItems
    })

    // Send email notifications to the assignee
    try {
      // Group items by inquiry for cleaner emails
      const inquiryGroups = items.reduce((acc, item) => {
        const inquiry = acc.find(group => group.inquiry.id === item.inquiry.id)
        if (inquiry) {
          inquiry.items.push(item)
        } else {
          acc.push({
            inquiry: item.inquiry,
            items: [item]
          })
        }
        return acc
      }, [] as Array<{ inquiry: typeof items[0]['inquiry']; items: typeof items }>)

      for (const group of inquiryGroups) {
        await sendNotificationEmail(
          'assignment',
          [assignee.email],
          {
            userName: assignee.name,
            itemName: group.items.length === 1 
              ? group.items[0].name 
              : `${group.items.length} items`,
            inquiryTitle: group.inquiry.title,
            customerName: group.inquiry.customer.name,
            dueDate: group.items[0].requestedDelivery
          }
        )
      }
    } catch (emailError) {
      console.error('Failed to send assignment notification email:', emailError)
      // Don't fail the main operation if email fails
    }

    // Fetch updated items for response
    const updatedItems = await prisma.inquiryItem.findMany({
      where: { id: { in: validatedData.itemIds } },
      include: {
        inquiry: {
          include: {
            customer: { select: { id: true, name: true } }
          }
        },
        assignedTo: { select: { id: true, name: true, email: true, role: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedItems,
      message: `Successfully assigned ${validatedData.itemIds.length} items to ${assignee.name}`,
    })
  } catch (error) {
    console.error('Assign items error:', error)
    
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