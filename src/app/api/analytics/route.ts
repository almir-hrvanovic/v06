import { NextRequest, NextResponse } from 'next/server'
import { optimizedAuth } from '@/utils/supabase/optimized-auth'
import { db } from '@/lib/db/index'
import { optimizeApiRoute } from '@/lib/api-optimization'

const getHandler = async (request: NextRequest) => {
  try {
    const user = await optimizedAuth.getUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30' // days
    const type = searchParams.get('type') || 'overview'

    const days = parseInt(timeRange)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let analytics = {}

    switch (type) {
      case 'overview':
        analytics = await getOverviewAnalytics(startDate)
        break
      case 'workload':
        analytics = await getWorkloadAnalytics(startDate)
        break
      case 'performance':
        analytics = await getPerformanceAnalytics(startDate)
        break
      case 'financial':
        analytics = await getFinancialAnalytics(startDate)
        break
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 })
    }

    // Return optimized data structure
    return {
      success: true,
      type,
      timeRange: days,
      startDate: startDate.toISOString(),
      data: analytics,
      cached: false // This will be handled by optimization layer
    }
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export optimized route handler with caching enabled for analytics data
export const GET = optimizeApiRoute(getHandler, {
  enableCaching: true,
  cacheMaxAge: 600, // 10 minutes cache for analytics
  enableCompression: true,
  enableETag: true,
  optimizePayload: true,
  excludeFields: ['password', '__v', 'createdAt', 'updatedAt', 'email'] // Remove sensitive/unnecessary fields
})

async function getOverviewAnalytics(startDate: Date) {
  // Simplified version that works with the database abstraction
  const inquiries = await db.inquiry.findMany({
    where: { createdAt: { gte: startDate } }
  }) as any[]

  const quotes = await db.quote.findMany({
    where: { createdAt: { gte: startDate } }
  }) as any[]

  const approvals = await db.approval.findMany({
    where: { 
      createdAt: { gte: startDate },
      status: 'PENDING'
    }
  }) as any[]

  // Calculate status distribution
  const statusCounts = inquiries.reduce((acc, inquiry) => {
    acc[inquiry.status] = (acc[inquiry.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    summary: {
      totalInquiries: inquiries.length,
      activeInquiries: inquiries.filter(i => 
        ['IN_REVIEW', 'ASSIGNED', 'COSTING'].includes(i.status)
      ).length,
      completedQuotes: quotes.length,
      pendingApprovals: approvals.length
    },
    inquiriesByStatus: Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    })),
    // Simplified metrics
    inquiriesOverTime: [],
    topCustomers: [],
    averageProcessingTime: 0
  }
}

async function getWorkloadAnalytics(startDate: Date) {
  const vpUsers = await db.user.findMany({
    where: { role: 'VP' }
  }) as any[]

  const items = await db.inquiryItem.findMany({
    where: { createdAt: { gte: startDate } }
  }) as any[]

  // Calculate workload per user
  const workloadMap = new Map<string, number>()
  items.forEach(item => {
    if (item.assignedToId) {
      workloadMap.set(item.assignedToId, (workloadMap.get(item.assignedToId) || 0) + 1)
    }
  })

  const vpWorkload = vpUsers.map(vp => ({
    id: vp.id,
    name: vp.name,
    email: vp.email,
    activeItems: workloadMap.get(vp.id) || 0,
    completedItems: 0
  }))

  return {
    vpWorkload,
    workloadDistribution: {
      totalItems: items.length,
      assignedItems: items.filter(i => i.assignedToId).length,
      unassignedItems: items.filter(i => !i.assignedToId).length
    },
    assignmentTrends: []
  }
}

async function getPerformanceAnalytics(startDate: Date) {
  // Simplified performance metrics
  const items = await db.inquiryItem.findMany({
    where: { 
      createdAt: { gte: startDate },
      assignedToId: { not: null }
    }
  }) as any[]

  const performanceByUser = new Map<string, { completed: number, total: number }>()
  
  items.forEach(item => {
    if (item.assignedToId) {
      const current = performanceByUser.get(item.assignedToId) || { completed: 0, total: 0 }
      current.total++
      if (['APPROVED', 'QUOTED'].includes(item.status)) {
        current.completed++
      }
      performanceByUser.set(item.assignedToId, current)
    }
  })

  return {
    userPerformance: Array.from(performanceByUser.entries()).map(([userId, stats]) => ({
      userId,
      completionRate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
      totalItems: stats.total,
      completedItems: stats.completed
    })),
    overallCompletionRate: 0,
    averageHandlingTime: 0
  }
}

async function getFinancialAnalytics(startDate: Date) {
  const quotes = await db.quote.findMany({
    where: { createdAt: { gte: startDate } }
  }) as any[]

  const totalValue = quotes.reduce((sum, quote) => sum + (parseFloat(quote.total) || 0), 0)
  const averageQuoteValue = quotes.length > 0 ? totalValue / quotes.length : 0

  return {
    summary: {
      totalQuotes: quotes.length,
      totalValue,
      averageQuoteValue,
      approvedQuotes: quotes.filter(q => q.status === 'APPROVED').length
    },
    quotesByStatus: [],
    revenueOverTime: []
  }
}