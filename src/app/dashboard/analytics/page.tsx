'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react'
import { OverviewAnalytics } from '@/components/analytics/overview-analytics'
import { WorkloadAnalytics } from '@/components/analytics/workload-analytics'
import { PerformanceAnalytics } from '@/components/analytics/performance-analytics'
import { FinancialAnalytics } from '@/components/analytics/financial-analytics'
import { apiClient } from '@/lib/api-client'

interface AnalyticsData {
  overview?: any
  workload?: any
  performance?: any
  financial?: any
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [activeTab, setActiveTab] = useState('overview')
  const [data, setData] = useState<AnalyticsData>({})
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const userRole = user?.role

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?type=${activeTab}&timeRange=${timeRange}`)
      const result = await response.json()
      
      if (result.success) {
        setData(prev => ({
          ...prev,
          [activeTab]: result.data
        }))
        setLastUpdated(new Date(result.generatedAt))
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, timeRange])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics/export?type=${activeTab}&timeRange=${timeRange}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `analytics-${activeTab}-${timeRange}days-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export analytics:', error)
    }
  }

  // Check permissions
  if (!['ADMIN', 'SUPERUSER', 'MANAGER'].includes(userRole || '')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page
            </p>
          </div>
        </div>
      </div>
    )
  }

  const timeRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 3 months' },
    { value: '365', label: 'Last year' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into system performance and business metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="workload" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Workload</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Financial</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OverviewAnalytics 
            data={data.overview} 
            loading={loading} 
            timeRange={parseInt(timeRange)} 
          />
        </TabsContent>

        <TabsContent value="workload" className="space-y-6">
          <WorkloadAnalytics 
            data={data.workload} 
            loading={loading} 
            timeRange={parseInt(timeRange)} 
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceAnalytics 
            data={data.performance} 
            loading={loading} 
            timeRange={parseInt(timeRange)} 
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialAnalytics 
            data={data.financial} 
            loading={loading} 
            timeRange={parseInt(timeRange)} 
          />
        </TabsContent>
      </Tabs>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  )
}