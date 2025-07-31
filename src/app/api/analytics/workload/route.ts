import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { hasPermission } from '@/utils/supabase/api-auth'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - VPP and above can view workload analytics
    if (!['VPP', 'ADMIN', 'SUPERUSER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = parseInt(searchParams.get('timeRange') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)

    // Get VP/VPP workload
    const vpWorkload = await db.user.findMany({
      where: {
        role: { in: ['VP', 'VPP'] },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        inquiryItems: {
          where: {
            status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
          },
          select: { id: true }
        },
        _count: {
          select: {
            inquiryItems: {
              where: {
                status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
              }
            }
          }
        }
      }
    })

    // Transform VP workload data
    const vpData = vpWorkload.map(vp => ({
      id: vp.id,
      name: vp.name,
      email: vp.email,
      role: vp.role,
      activeItems: vp._count.inquiryItems
    }))

    // Get items by status
    const itemsByStatus = await db.inquiryItem.groupBy({
      by: ['status'],
      _count: { status: true },
      orderBy: { status: 'asc' }
    })

    // Get assignment trends (last 30 days)
    const trendItems = await db.inquiryItem.findMany({
      where: {
        assignedToId: { not: null },
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Group by date
    const trendMap = new Map<string, number>()
    trendItems.forEach(item => {
      const dateKey = item.createdAt.toISOString().split('T')[0]
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1)
    })

    // Convert to array format
    const trends = Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      assignments: count
    }))

    // Get completed items count per user
    const completedByUser = await db.user.findMany({
      where: {
        role: { in: ['VP', 'VPP'] },
        isActive: true
      },
      select: {
        id: true,
        _count: {
          select: {
            inquiryItems: {
              where: {
                status: { in: ['COSTED', 'APPROVED', 'QUOTED'] },
                updatedAt: { gte: startDate }
              }
            }
          }
        }
      }
    })

    // Create a map of completed items
    const completedMap = new Map(
      completedByUser.map(u => [u.id, u._count.inquiryItems])
    )

    // Add completed count to VP data
    const vpDataWithCompleted = vpData.map(vp => ({
      ...vp,
      completedItems: completedMap.get(vp.id) || 0
    }))

    return NextResponse.json({
      vpWorkload: vpDataWithCompleted,
      techWorkload: [], // Not used in assignments
      itemsByStatus: itemsByStatus.map(item => ({
        status: item.status,
        count: item._count.status
      })),
      assignmentTrends: trends.map(t => ({
        date: t.date,
        vp_assignments: t.assignments?.toString() || '0'
      }))
    })
  } catch (error) {
    console.error('Get workload analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}