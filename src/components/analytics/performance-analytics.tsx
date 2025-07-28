'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  RadialBarChart,
  RadialBar
} from 'recharts'
import { 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  Timer
} from 'lucide-react'

interface PerformanceAnalyticsProps {
  data: any
  loading: boolean
  timeRange: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function PerformanceAnalytics({ data, loading, timeRange }: PerformanceAnalyticsProps) {
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

  const { completionRates, averageTimesByStage, topPerformers, bottlenecks } = data

  // Prepare completion rates data
  const completionData = completionRates?.map((item: any) => ({
    role: item.role,
    completionRate: Math.round((parseInt(item.completed) / parseInt(item.total)) * 100),
    completed: parseInt(item.completed),
    total: parseInt(item.total)
  })) || []

  // Prepare time by stage data
  const timeData = averageTimesByStage?.map((item: any) => ({
    stage: item.stage.replace('_', ' to ').replace(/([A-Z])/g, ' $1').trim(),
    days: Math.round(parseFloat(item.avg_days) * 10) / 10
  })) || []

  // Prepare bottlenecks data
  const bottleneckData = bottlenecks?.map((item: any, index: number) => ({
    status: item.status.replace('_', ' '),
    count: parseInt(item.count),
    avgDaysStuck: Math.round(parseFloat(item.avg_days_stuck) * 10) / 10,
    color: COLORS[index % COLORS.length]
  })) || []

  // Calculate overall performance metrics
  const totalCompleted = completionRates?.reduce((sum: number, item: any) => sum + parseInt(item.completed), 0) || 0
  const totalItems = completionRates?.reduce((sum: number, item: any) => sum + parseInt(item.total), 0) || 0
  const overallCompletionRate = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0

  const averageProcessingTime = timeData.reduce((sum: number, item: any) => sum + item.days, 0) / (timeData.length || 1)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {totalCompleted} of {totalItems} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Timer className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(averageProcessingTime)} days</div>
            <p className="text-xs text-muted-foreground">
              Across all stages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Award className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{topPerformers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              High-performing VPs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bottlenecks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bottleneckData.length}</div>
            <p className="text-xs text-muted-foreground">
              Stages with delays
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Completion Rates by Role */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Rates by Role</CardTitle>
            <CardDescription>Performance by user role</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="role" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    `${value}%`,
                    'Completion Rate'
                  ]}
                />
                <Bar 
                  dataKey="completionRate" 
                  fill="#8884d8"
                  name="Completion Rate (%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Time by Stage */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Time by Stage</CardTitle>
            <CardDescription>Average days spent in each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="stage" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  formatter={(value) => [`${value} days`, 'Average Time']}
                />
                <Bar 
                  dataKey="days" 
                  fill="#82ca9d"
                  name="Days"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5 text-yellow-600" />
            <span>Top Performing VPs</span>
          </CardTitle>
          <CardDescription>VPs with highest completion rates and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers?.slice(0, 10).map((performer: any, index: number) => (
              <div key={performer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {performer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div>
                    <p className="font-medium">{performer.name}</p>
                    <p className="text-sm text-muted-foreground">{performer.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {performer.completed}/{performer.total} completed
                    </p>
                    <Badge 
                      variant={parseFloat(performer.completion_rate) >= 80 ? "default" : "secondary"}
                    >
                      {parseFloat(performer.completion_rate).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-8">
                No performance data available for the selected time period.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottlenecks Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>Process Bottlenecks</span>
          </CardTitle>
          <CardDescription>Stages where items are getting stuck</CardDescription>
        </CardHeader>
        <CardContent>
          {bottleneckData.length > 0 ? (
            <div className="space-y-4">
              {bottleneckData.map((bottleneck: any) => (
                <div key={bottleneck.status} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{bottleneck.status}</h4>
                    <Badge variant="destructive">
                      {bottleneck.count} items
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>Avg: {bottleneck.avgDaysStuck} days stuck</span>
                    </div>
                  </div>
                  {bottleneck.avgDaysStuck > 7 && (
                    <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                      ⚠️ High priority: Items have been stuck for over a week on average
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No significant bottlenecks detected. Process flow is healthy!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Performance Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overallCompletionRate >= 80 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">
                  ✅ <strong>Excellent performance:</strong> Overall completion rate of {overallCompletionRate}% is above target.
                </p>
              </div>
            )}
            
            {overallCompletionRate < 60 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800">
                  🚨 <strong>Action needed:</strong> Completion rate of {overallCompletionRate}% is below acceptable levels.
                </p>
              </div>
            )}

            {averageProcessingTime > 14 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-orange-800">
                  ⏰ <strong>Process optimization needed:</strong> Average processing time of {Math.round(averageProcessingTime)} days exceeds target.
                </p>
              </div>
            )}

            {bottleneckData.some((b: any) => b.avgDaysStuck > 7) && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-yellow-800">
                  ⚠️ <strong>Bottleneck alert:</strong> Some items are stuck for extended periods. Consider workflow optimization.
                </p>
              </div>
            )}

            {overallCompletionRate >= 80 && averageProcessingTime <= 14 && !bottleneckData.some((b: any) => b.avgDaysStuck > 7) && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800">
                  🎯 <strong>Optimal performance:</strong> All key metrics are within target ranges. Keep up the great work!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}