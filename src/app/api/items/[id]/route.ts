import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/utils/supabase/api-auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'items', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const item = await prisma.inquiryItem.findUnique({
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
    if (session.user.role === 'VP' && item.assignedToId !== session.user.id) {
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
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.user.role, 'items', 'write')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, quantity, unit, status, notes, requestedDelivery, assignedToId } = body

    // Get existing item to check permissions
    const existingItem = await prisma.inquiryItem.findUnique({
      where: { id: params.id },
      select: { assignedToId: true }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // VP can only update items assigned to them
    if (session.user.role === 'VP' && existingItem.assignedToId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const item = await prisma.inquiryItem.update({
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