import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/index'
import { hasPermission } from '@/utils/supabase/api-auth'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'
import { cache } from '@/lib/redis'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
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
    
    // Generate cache key based on time range
    const cacheKey = `analytics:workload:${timeRange}`
    
    // Try cache first (5-minute TTL for analytics)
    const cachedResult = await cache.get(cacheKey)
    if (cachedResult) {
      const duration = Date.now() - startTime
      console.log(`[API] /analytics/workload cache HIT (${duration}ms) for timeRange ${timeRange}`)
      return NextResponse.json(cachedResult)
    }
    
    console.log(`[API] /analytics/workload cache MISS for timeRange ${timeRange} - querying database`)
    
    // Quick check: Count total inquiry items
    const totalItems = await db.inquiryItem.count()
    console.log('Total inquiry items in database:', totalItems)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - timeRange)

    // Get VP/VPP users
    const vpUsers = await db.user.findMany({
      where: {
        role: { in: ['VP', 'VPP'] },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })
    
    console.log('VP users found:', vpUsers.length)
    
    // Get all items with their assignedToId in one query
    const allAssignedItems = await db.inquiryItem.findMany({
      where: {
        assignedToId: { in: vpUsers.map(u => u.id) },
        status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
      },
      select: {
        assignedToId: true
      }
    })
    
    // Count items per user
    const itemCountByUser = allAssignedItems.reduce((acc, item) => {
      if (item.assignedToId) {
        acc[item.assignedToId] = (acc[item.assignedToId] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    // Build VP workload data
    const vpWorkload = vpUsers.map(vp => ({
      ...vp,
      _count: {
        inquiryItems: itemCountByUser[vp.id] || 0
      }
    }))
    
    console.log('VP workload data:', vpWorkload)

    // Transform VP workload data
    const vpData = vpWorkload.map(vp => ({
      id: vp.id,
      name: vp.name,
      email: vp.email,
      role: vp.role,
      activeItems: vp._count.inquiryItems
    }))

    // Get items by status - using manual grouping since groupBy is not supported
    const allItems = await db.inquiryItem.findMany({
      select: {
        status: true
      }
    })
    
    // Group by status manually
    const statusCounts = allItems.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const itemsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      _count: { status: count }
    })).sort((a, b) => a.status.localeCompare(b.status))
    
    console.log('Items by status:', itemsByStatus)

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

    // Get completed items count per user - optimized
    const completedItems = await db.inquiryItem.findMany({
      where: {
        assignedToId: { in: vpUsers.map(u => u.id) },
        status: { in: ['COSTED', 'APPROVED', 'QUOTED'] },
        updatedAt: { gte: startDate }
      },
      select: {
        assignedToId: true
      }
    })
    
    // Count completed items per user
    const completedCountByUser = completedItems.reduce((acc, item) => {
      if (item.assignedToId) {
        acc[item.assignedToId] = (acc[item.assignedToId] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    const completedByUser = vpUsers.map(vp => ({
      id: vp.id,
      _count: {
        inquiryItems: completedCountByUser[vp.id] || 0
      }
    }))

    // Create a map of completed items
    const completedMap = new Map(
      completedByUser.map(u => [u.id, u._count.inquiryItems])
    )

    // Add completed count to VP data
    const vpDataWithCompleted = vpData.map(vp => ({
      ...vp,
      completedItems: completedMap.get(vp.id) || 0
    }))

    const response = {
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
    }
    
    console.log('Full response:', JSON.stringify(response, null, 2))
    
    // Cache the analytics result for 5 minutes (300 seconds)
    await cache.set(cacheKey, response, 300)
    
    const duration = Date.now() - startTime
    console.log(`[API] /analytics/workload database query completed (${duration}ms) for timeRange ${timeRange}`)
    
    return NextResponse.json(response)
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`[API] /analytics/workload error (${duration}ms):`, error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}