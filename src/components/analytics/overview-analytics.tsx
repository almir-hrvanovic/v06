'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  FileText, 
  Activity, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Users,
  Building2
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface OverviewAnalyticsProps {
  data: any
  loading: boolean
  timeRange: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function OverviewAnalytics({ data, loading, timeRange }: OverviewAnalyticsProps) {
  if (loading || !data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const { summary, inquiriesByStatus, inquiriesOverTime, topCustomers, averageProcessingTime } = data

  // Prepare data for charts
  const statusChartData = inquiriesByStatus?.map((item: any) => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    color: COLORS[inquiriesByStatus.indexOf(item) % COLORS.length]
  })) || []

  const timelineData = inquiriesOverTime?.reduce((acc: any[], item: any) => {
    const dateStr = new Date(item.date).toLocaleDateString()
    const existing = acc.find(d => d.date === dateStr)
    if (existing) {
      existing[item.status] = (existing[item.status] || 0) + parseInt(item.count)
      existing.total = (existing.total || 0) + parseInt(item.count)
    } else {
      acc.push({
        date: dateStr,
        [item.status]: parseInt(item.count),
        total: parseInt(item.count)
      })
    }
    return acc
  }, []) || []

  const customerData = topCustomers?.slice(0, 8).map((customer: any) => ({
    name: customer.name.length > 15 ? customer.name.substring(0, 15) + '...' : customer.name,
    inquiries: customer.inquiryCount
  })) || []

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalInquiries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Inquiries</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.activeInquiries || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Quotes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.completedQuotes || 0}</div>
            <p className="text-xs text-muted-foreground">
              Successfully generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.pendingApprovals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting manager review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Inquiries by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Inquiries by Status</CardTitle>
            <CardDescription>Distribution of inquiry statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers</CardTitle>
            <CardDescription>Customers by inquiry volume</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="inquiries" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6">
        {/* Inquiries Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Inquiry Trends</CardTitle>
            <CardDescription>Daily inquiry creation over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                {Object.keys(timelineData[0] || {})
                  .filter(key => key !== 'date' && key !== 'total')
                  .map((status, index) => (
                    <Area
                      key={status}
                      type="monotone"
                      dataKey={status}
                      stackId="2"
                      stroke={COLORS[index % COLORS.length]}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.8}
                    />
                  ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Average Processing Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {averageProcessingTime ? `${Math.round(averageProcessingTime)} days` : 'N/A'}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              From inquiry to quote generation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Active Customers</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {topCustomers?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Customers with inquiries in this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Conversion Rate</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {summary?.totalInquiries > 0 
                ? `${Math.round((summary.completedQuotes / summary.totalInquiries) * 100)}%`
                : '0%'
              }
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Inquiries converted to quotes
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}