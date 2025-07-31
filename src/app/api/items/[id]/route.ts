import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { hasPermission } from '@/utils/supabase/api-auth'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'items', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const item = await db.inquiryItem.findUnique({
      where: { id: params.id },
      include: {
        inquiry: {
          select: {
            id: true,
            title: true,
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        costCalculation: {
          include: {
            calculatedBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Check role-based access
    if (user.role === 'VP' && item.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Get item error:', error)
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
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(user.role, 'items', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, quantity, unit, status, notes, requestedDelivery, assignedToId } = body

    // Get existing item to check permissions
    const existingItem = await db.inquiryItem.findUnique({
      where: { id: params.id },
      select: { assignedToId: true }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // VP can only update items assigned to them
    if (user.role === 'VP' && existingItem.assignedToId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const item = await db.inquiryItem.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(quantity !== undefined && { quantity }),
        ...(unit !== undefined && { unit }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(requestedDelivery !== undefined && { requestedDelivery }),
        ...(assignedToId !== undefined && { assignedToId })
      },
      include: {
        inquiry: {
          select: {
            id: true,
            title: true,
            customer: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        costCalculation: {
          include: {
            calculatedBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Update item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}