'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp } from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import { User } from '@/types'
import { useTranslations } from 'next-intl'

interface WorkloadChartProps {
  users: User[]
  userWorkloads: Map<string, { pending: number; completed: number; total: number }>
  loading?: boolean
}

const COLORS = {
  normal: '#8884d8',
  warning: '#ffc658',
  danger: '#ff6b6b'
}

export function WorkloadChart({ users, userWorkloads, loading = false }: WorkloadChartProps) {
  const t = useTranslations()

  const chartData = useMemo(() => {
    return users.map(user => {
      const workload = userWorkloads.get(user.id) || { pending: 0, completed: 0, total: 0 }
      return {
        name: user.name.split(' ')[0], // First name only for chart
        fullName: user.name,
        pending: workload.pending,
        completed: workload.completed,
        total: workload.total,
        id: user.id
      }
    }).sort((a, b) => b.pending - a.pending) // Sort by pending workload
  }, [users, userWorkloads])

  // Calculate statistics
  const totalPending = chartData.reduce((sum, user) => sum + user.pending, 0)
  const avgPending = users.length > 0 ? Math.round(totalPending / users.length) : 0
  const maxPending = Math.max(...chartData.map(u => u.pending))
  const overloadedUsers = chartData.filter(user => user.pending > avgPending * 1.5)

  // Get color for bar based on workload
  const getBarColor = (pending: number) => {
    if (pending > avgPending * 1.5) return COLORS.danger
    if (pending > avgPending * 1.2) return COLORS.warning
    return COLORS.normal
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="h-[250px] bg-muted animate-pulse rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('assignments.workloadDistribution')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('assignments.averageLoad')}: {avgPending} {t('assignments.itemsPerUser')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {overloadedUsers.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overloadedUsers.length} {t('assignments.overloaded')}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {t('assignments.maxLoad')}: {maxPending}
          </Badge>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: t('assignments.pendingItems'), angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-background border rounded p-2 shadow-lg">
                      <p className="font-medium">{data.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('assignments.pending')}: {data.pending}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('assignments.completed')}: {data.completed}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="pending" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.pending)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.normal }} />
          <span>{t('assignments.normalLoad')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.warning }} />
          <span>{t('assignments.highLoad')}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS.danger }} />
          <span>{t('assignments.overloaded')}</span>
        </div>
      </div>
    </div>
  )
}