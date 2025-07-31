import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { hasPermission } from '@/utils/supabase/api-auth'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!hasPermission(user.role, 'workload', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId } = await params

    // Get pending items (assigned but not costed)
    const pendingItems = await db.inquiryItem.count({
      where: {
        assignedToId: userId,
        status: {
          in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS']
        }
      }
    })

    // Get completed items (costed or approved)
    const completedItems = await db.inquiryItem.count({
      where: {
        assignedToId: userId,
        status: {
          in: ['COSTED', 'APPROVED', 'QUOTED']
        }
      }
    })

    // Get total assigned items
    const totalItems = await db.inquiryItem.count({
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