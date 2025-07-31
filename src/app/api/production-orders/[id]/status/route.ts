import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { UserRole } from '@/lib/db/types'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only certain roles can update production order status
    if (user.role !== UserRole.SUPERUSER && 
        user.role !== UserRole.ADMIN && 
        user.role !== UserRole.MANAGER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = ['PENDING', 'IN_PRODUCTION', 'COMPLETED', 'SHIPPED', 'DELIVERED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get current order
    const order = await db.productionOrder.findUnique({
      where: { id },
      include: {
        quote: {
          include: {
            inquiry: {
              include: {
                customer: true,
                createdBy: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Production order not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = { status }

    // Set dates based on status
    if (status === 'IN_PRODUCTION' && !order.startDate) {
      updateData.startDate = new Date()
    } else if (status === 'COMPLETED' && !order.completedDate) {
      updateData.completedDate = new Date()
    }
    // Note: ProductionOrder model doesn't have shippedDate or deliveredDate fields

    // Update order
    const updatedOrder = await db.productionOrder.update({
      where: { id },
      data: updateData,
      include: {
        quote: {
          include: {
            inquiry: {
              include: {
                customer: true
              }
            }
          }
        },
        _count: {
          select: { items: true }
        }
      }
    })

    // Create notifications
    const notifications = []

    // Notify sales rep (createdBy is the sales person who created the inquiry)
    notifications.push({
      userId: order.quote.inquiry.createdById,
      type: 'STATUS_UPDATE' as const,
      title: 'Production Order Status Updated',
      message: `Order ${order.orderNumber} is now ${status.toLowerCase().replace('_', ' ')}`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status,
        relatedId: order.id,
        relatedType: 'PRODUCTION_ORDER'
      }
    })

    // Notify managers
    if (status === 'COMPLETED' || status === 'DELIVERED') {
      const managers = await db.user.findMany({
        where: { role: { in: [UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERUSER] } }
      })

      for (const manager of managers) {
        notifications.push({
          userId: manager.id,
          type: 'STATUS_UPDATE' as const,
          title: `Production Order ${status === 'COMPLETED' ? 'Completed' : 'Delivered'}`,
          message: `Order ${order.orderNumber} for ${order.quote.inquiry.customer.name} has been ${status.toLowerCase()}`,
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status,
            customerName: order.quote.inquiry.customer.name,
            relatedId: order.id,
            relatedType: 'PRODUCTION_ORDER'
          }
        })
      }
    }

    await db.notification.createMany({
      data: notifications
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'PRODUCTION_ORDER',
        entityId: order.id,
        userId: user.id!,
        oldData: { status: order.status },
        newData: { status: status },
        metadata: {
          action: 'status_update',
          orderNumber: order.orderNumber,
          customer: order.quote.inquiry.customer.name
        }
      }
    })

    return NextResponse.json({
      message: 'Status updated successfully',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Failed to update production order status:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}