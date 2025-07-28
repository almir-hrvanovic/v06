import { NextRequest, NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerAuth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!hasPermission(session.user.role, 'workload', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params

    // Get pending items (assigned but not costed)
    const pendingItems = await prisma.inquiryItem.count({
      where: {
        assignedToId: userId,
        status: {
          in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS']
        }
      }
    })

    // Get completed items (costed or approved)
    const completedItems = await prisma.inquiryItem.count({
      where: {
        assignedToId: userId,
        status: {
          in: ['COSTED', 'APPROVED', 'QUOTED']
        }
      }
    })

    // Get total assigned items
    const totalItems = await prisma.inquiryItem.count({
      where: {
        assignedToId: userId
      }
    })

    return NextResponse.json({
      userId,
      pendingItems,
      completedItems,
      totalItems,
      workloadPercentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
    })

  } catch (error) {
    console.error('Get workload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}