'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Cell
} from 'recharts'
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

interface WorkloadAnalyticsProps {
  data: any
  loading: boolean
  timeRange: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function WorkloadAnalytics({ data, loading, timeRange }: WorkloadAnalyticsProps) {
  if (loading || !data) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
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

  const { vpWorkload, techWorkload, itemsByStatus, assignmentTrends } = data

  // Prepare VP workload data
  const vpChartData = vpWorkload?.map((vp: any) => ({
    name: vp.name.split(' ')[0], // First name only for better chart display
    fullName: vp.name,
    activeItems: vp.activeItems,
    email: vp.email
  })) || []

  // Prepare Tech workload data
  const techChartData = techWorkload?.map((tech: any) => ({
    name: tech.name.split(' ')[0],
    fullName: tech.name,
    activeItems: tech.activeItems,
    email: tech.email
  })) || []

  // Prepare status distribution
  const statusData = itemsByStatus?.map((item: any, index: number) => ({
    name: item.status.replace('_', ' '),
    value: item.count,
    color: COLORS[index % COLORS.length]
  })) || []

  // Prepare assignment trends
  const trendData = assignmentTrends?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    assignments: parseInt(item.vp_assignments)
  })) || []

  // Calculate workload statistics
  const totalVPItems = vpWorkload?.reduce((sum: number, vp: any) => sum + vp.activeItems, 0) || 0
  const totalTechItems = techWorkload?.reduce((sum: number, tech: any) => sum + tech.activeItems, 0) || 0
  const avgVPWorkload = vpWorkload?.length > 0 ? Math.round(totalVPItems / vpWorkload.length) : 0
  const avgTechWorkload = techWorkload?.length > 0 ? Math.round(totalTechItems / techWorkload.length) : 0

  // Find overloaded users (more than 150% of average)
  const overloadedVPs = vpWorkload?.filter((vp: any) => vp.activeItems > avgVPWorkload * 1.5) || []
  const overloadedTechs = techWorkload?.filter((tech: any) => tech.activeItems > avgTechWorkload * 1.5) || []

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active VPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vpWorkload?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {totalVPItems} total items assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Techs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{techWorkload?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {totalTechItems} total items assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg VP Workload</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgVPWorkload}</div>
            <p className="text-xs text-muted-foreground">
              Items per VP
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overloaded Users</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overloadedVPs.length + overloadedTechs.length}</div>
            <p className="text-xs text-muted-foreground">
              Need workload balancing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* VP Workload Chart */}
      <Card>
        <CardHeader>
          <CardTitle>VP Workload Distribution</CardTitle>
          <CardDescription>Current active items per VP</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vpChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} items`,
                  props.payload.fullName
                ]}
              />
              <Bar 
                dataKey="activeItems" 
                fill="#8884d8"
                name="Active Items"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Tech Workload Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tech Workload Distribution</CardTitle>
            <CardDescription>Current active items per technician</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={techChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} items`,
                    props.payload.fullName
                  ]}
                />
                <Bar 
                  dataKey="activeItems" 
                  fill="#82ca9d"
                  name="Active Items"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Item Status Distribution</CardTitle>
            <CardDescription>Current status of all inquiry items</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Trends</CardTitle>
          <CardDescription>Daily VP assignments over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="assignments"
                stroke="#8884d8"
                strokeWidth={2}
                name="VP Assignments"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Workload Alerts */}
      {(overloadedVPs.length > 0 || overloadedTechs.length > 0) && (
        <div className="grid gap-6 md:grid-cols-2">
          {overloadedVPs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Overloaded VPs</span>
                </CardTitle>
                <CardDescription>VPs with high workload need attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overloadedVPs.map((vp: any) => (
                    <div key={vp.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{vp.name}</p>
                        <p className="text-sm text-muted-foreground">{vp.email}</p>
                      </div>
                      <Badge variant="destructive">
                        {vp.activeItems} items
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {overloadedTechs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>Overloaded Technicians</span>
                </CardTitle>
                <CardDescription>Technicians with high workload need attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overloadedTechs.map((tech: any) => (
                    <div key={tech.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{tech.name}</p>
                        <p className="text-sm text-muted-foreground">{tech.email}</p>
                      </div>
                      <Badge variant="destructive">
                        {tech.activeItems} items
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Balanced Workload Message */}
      {overloadedVPs.length === 0 && overloadedTechs.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Workload Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              ✅ All team members have balanced workloads. No immediate action required.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}