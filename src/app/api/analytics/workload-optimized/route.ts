import { NextRequest, NextResponse } from 'next/server'
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

    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Execute optimized query using Supabase
    const { data: analyticsData, error } = await supabase.rpc('get_workload_analytics', {
      start_date: startDate.toISOString(),
      time_range: timeRange
    })

    if (error) {
      console.error('Analytics query error:', error)
      // Fallback to basic query if RPC doesn't exist
      
      // Get VP workload with a single query
      const { data: vpWorkload } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          inquiry_items!assignedToId(
            id,
            status
          )
        `)
        .in('role', ['VP', 'VPP'])
        .eq('isActive', true)

      // Get items by status
      const { data: itemsByStatus } = await supabase
        .from('inquiry_items')
        .select('status')

      // Group items by status
      const statusCounts = (itemsByStatus || []).reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {})

      const formattedItemsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: count as number
      }))

      // Format VP workload data
      const formattedVpWorkload = (vpWorkload || []).map((vp: any) => {
        const activeItems = (vp.inquiry_items || []).filter((item: any) => 
          ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status)
        ).length
        
        const completedItems = (vp.inquiry_items || []).filter((item: any) => 
          ['COSTED', 'APPROVED', 'QUOTED'].includes(item.status)
        ).length

        return {
          id: vp.id,
          name: vp.name,
          email: vp.email,
          role: vp.role,
          activeItems,
          completedItems
        }
      })

      return NextResponse.json({
        vpWorkload: formattedVpWorkload,
        techWorkload: [],
        itemsByStatus: formattedItemsByStatus,
        assignmentTrends: []
      })
    }

    return NextResponse.json(analyticsData)
  } catch (error: any) {
    console.error('Get workload analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}