import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'
import { db } from '@/lib/db/index'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
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
        analytics = await getOverviewAnalytics(startDate)
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      timeRange: days,
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getOverviewAnalytics(startDate: Date) {
  const [
    totalInquiries,
    activeInquiries,
    completedQuotes,
    pendingApprovals,
    inquiriesByStatus,
    inquiriesOverTime,
    topCustomers,
    averageProcessingTime
  ] = await Promise.all([
    // Total inquiries
    db.inquiry.count({
      where: { createdAt: { gte: startDate } }
    }),
    // Active inquiries
    db.inquiry.count({
      where: {
        createdAt: { gte: startDate },
        status: { in: ['IN_REVIEW', 'ASSIGNED', 'COSTING'] }
      }
    }),
    // Completed quotes
    db.quote.count({
      where: { createdAt: { gte: startDate } }
    }),
    // Pending approvals
    db.approval.count({
      where: {
        createdAt: { gte: startDate },
        status: 'PENDING'
      }
    }),
    // Inquiries by status
    db.inquiry.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startDate } },
      _count: true
    }),
    // Inquiries over time (daily)
    db.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        status
      FROM "Inquiry"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at), status
      ORDER BY date ASC
    `,
    // Top customers by inquiry count
    db.customer.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            inquiries: {
              where: { createdAt: { gte: startDate } }
            }
          }
        }
      },
      orderBy: {
        inquiries: {
          _count: 'desc'
        }
      },
      take: 10
    }),
    // Average processing time (from inquiry to quote)
    db.$queryRaw`
      SELECT 
        AVG(EXTRACT(epoch FROM (q.created_at - i.created_at)) / 86400) as avg_days
      FROM "Quote" q
      JOIN "Inquiry" i ON q.inquiry_id = i.id
      WHERE q.created_at >= ${startDate}
    `
  ])

  return {
    summary: {
      totalInquiries,
      activeInquiries,
      completedQuotes,
      pendingApprovals
    },
    inquiriesByStatus: inquiriesByStatus.map(item => ({
      status: item.status,
      count: item._count
    })),
    inquiriesOverTime,
    topCustomers: topCustomers.map(customer => ({
      id: customer.id,
      name: customer.name,
      inquiryCount: customer._count.inquiries
    })),
    averageProcessingTime: (averageProcessingTime as any)[0]?.avg_days || 0
  }
}

async function getWorkloadAnalytics(startDate: Date) {
  const [
    vpWorkload,
    vppAssignments,
    techWorkload,
    itemsByStatus,
    assignmentTrends
  ] = await Promise.all([
    // VP workload
    db.user.findMany({
      where: { role: 'VP' },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            inquiryItems: true
          }
        }
      }
    }),
    // VPP assignments over time
    db.inquiryItem.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate }
      },
      _count: true
    }),
    // Tech workload
    db.user.findMany({
      where: { role: 'TECH' },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            inquiryItems: true
          }
        }
      }
    }),
    // Items by status
    db.inquiryItem.groupBy({
      by: ['status'],
      where: {
        updatedAt: { gte: startDate }
      },
      _count: true
    }),
    // Assignment trends
    db.$queryRaw`
      SELECT 
        DATE(vp_assigned_at) as date,
        COUNT(*) as vp_assignments
      FROM "InquiryItem"
      WHERE vp_assigned_at >= ${startDate}
      GROUP BY DATE(vp_assigned_at)
      ORDER BY date ASC
    `
  ])

  return {
    vpWorkload: vpWorkload.map(vp => ({
      id: vp.id,
      name: vp.name,
      email: vp.email,
      activeItems: vp._count.inquiryItems
    })),
    techWorkload: techWorkload.map(tech => ({
      id: tech.id,
      name: tech.name,
      email: tech.email,
      activeItems: tech._count.inquiryItems
    })),
    itemsByStatus: itemsByStatus.map(item => ({
      status: item.status,
      count: item._count
    })),
    assignmentTrends
  }
}

async function getPerformanceAnalytics(startDate: Date) {
  const [
    completionRates,
    averageTimesByStage,
    topPerformers,
    bottlenecks
  ] = await Promise.all([
    // Completion rates by user role
    db.$queryRaw`
      SELECT 
        u.role,
        COUNT(CASE WHEN ii.status IN ('APPROVED', 'QUOTED') THEN 1 END) as completed,
        COUNT(*) as total
      FROM "InquiryItem" ii
      JOIN "User" u ON ii.assigned_to_vp_id = u.id
      WHERE ii.vp_assigned_at >= ${startDate}
      GROUP BY u.role
    `,
    // Average time by stage
    db.$queryRaw`
      SELECT 
        'assignment_to_costing' as stage,
        AVG(EXTRACT(epoch FROM (cc.created_at - ii.vp_assigned_at)) / 86400) as avg_days
      FROM "InquiryItem" ii
      JOIN "CostCalculation" cc ON ii.id = cc.inquiry_item_id
      WHERE ii.vp_assigned_at >= ${startDate}
      UNION ALL
      SELECT 
        'costing_to_approval' as stage,
        AVG(EXTRACT(epoch FROM (a.approved_at - cc.created_at)) / 86400) as avg_days
      FROM "CostCalculation" cc
      JOIN "Approval" a ON cc.id = a.cost_calculation_id
      WHERE cc.created_at >= ${startDate} AND a.approved_at IS NOT NULL
    `,
    // Top performers (VPs with highest completion rates)
    db.$queryRaw`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(CASE WHEN ii.status IN ('APPROVED', 'QUOTED') THEN 1 END) as completed,
        COUNT(*) as total,
        ROUND(
          COUNT(CASE WHEN ii.status IN ('APPROVED', 'QUOTED') THEN 1 END)::numeric / 
          COUNT(*)::numeric * 100, 2
        ) as completion_rate
      FROM "User" u
      JOIN "InquiryItem" ii ON u.id = ii.assigned_to_vp_id
      WHERE u.role = 'VP' AND ii.vp_assigned_at >= ${startDate}
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(*) > 0
      ORDER BY completion_rate DESC
      LIMIT 10
    `,
    // Bottlenecks (items stuck in stages)
    db.$queryRaw`
      SELECT 
        ii.status,
        COUNT(*) as count,
        AVG(EXTRACT(epoch FROM (NOW() - ii.updated_at)) / 86400) as avg_days_stuck
      FROM "InquiryItem" ii
      WHERE ii.updated_at >= ${startDate}
        AND ii.status NOT IN ('QUOTED', 'COMPLETED')
      GROUP BY ii.status
      ORDER BY avg_days_stuck DESC
    `
  ])

  return {
    completionRates,
    averageTimesByStage,
    topPerformers,
    bottlenecks
  }
}

async function getFinancialAnalytics(startDate: Date) {
  const [
    totalQuoteValue,
    averageQuoteValue,
    quoteTrends,
    costBreakdown,
    marginAnalysis,
    topValueCustomers
  ] = await Promise.all([
    // Total quote value
    db.quote.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: { total: true },
      _count: true
    }),
    // Average quote value
    db.quote.aggregate({
      where: { createdAt: { gte: startDate } },
      _avg: { total: true }
    }),
    // Quote trends over time
    db.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as quote_count,
        SUM(total) as total_value
      FROM "Quote"
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `,
    // Cost breakdown
    db.costCalculation.aggregate({
      where: { createdAt: { gte: startDate } },
      _avg: {
        materialCost: true,
        laborCost: true,
        overheadCost: true
      },
      _sum: {
        materialCost: true,
        laborCost: true,
        overheadCost: true
      }
    }),
    // Margin analysis
    db.$queryRaw`
      SELECT 
        qi.margin_percentage,
        COUNT(*) as count,
        AVG(qi.selling_price - cc.total_cost) as avg_profit
      FROM "QuoteItem" qi
      JOIN "InquiryItem" ii ON qi.inquiry_item_id = ii.id
      JOIN "CostCalculation" cc ON ii.id = cc.inquiry_item_id
      JOIN "Quote" q ON qi.quote_id = q.id
      WHERE q.created_at >= ${startDate}
      GROUP BY qi.margin_percentage
      ORDER BY qi.margin_percentage
    `,
    // Top customers by quote value
    db.$queryRaw`
      SELECT 
        c.id,
        c.name,
        COUNT(q.id) as quote_count,
        SUM(q.total_amount) as total_value
      FROM "Customer" c
      JOIN "Inquiry" i ON c.id = i.customer_id
      JOIN "Quote" q ON i.id = q.inquiry_id
      WHERE q.created_at >= ${startDate}
      GROUP BY c.id, c.name
      ORDER BY total_value DESC
      LIMIT 10
    `
  ])

  return {
    summary: {
      totalQuoteValue: totalQuoteValue._sum.total || 0,
      averageQuoteValue: averageQuoteValue._avg.total || 0,
      quoteCount: totalQuoteValue._count
    },
    quoteTrends,
    costBreakdown: {
      avgMaterialCost: costBreakdown._avg.materialCost || 0,
      avgLaborCost: costBreakdown._avg.laborCost || 0,
      avgOverheadCost: costBreakdown._avg.overheadCost || 0,
      totalMaterialCost: costBreakdown._sum.materialCost || 0,
      totalLaborCost: costBreakdown._sum.laborCost || 0,
      totalOverheadCost: costBreakdown._sum.overheadCost || 0
    },
    marginAnalysis,
    topValueCustomers
  }
}