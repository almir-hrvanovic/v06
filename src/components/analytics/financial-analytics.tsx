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
  Cell,
  AreaChart,
  Area
} from 'recharts'
import { 
  DollarSign, 
  TrendingUp, 
  Percent,
  Building2,
  Calculator,
  Target
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface FinancialAnalyticsProps {
  data: any
  loading: boolean
  timeRange: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function FinancialAnalytics({ data, loading, timeRange }: FinancialAnalyticsProps) {
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

  const { summary, quoteTrends, costBreakdown, marginAnalysis, topValueCustomers } = data

  // Prepare quote trends data
  const trendsData = quoteTrends?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString(),
    quoteCount: parseInt(item.quote_count),
    totalValue: parseFloat(item.total_value) || 0
  })) || []

  // Prepare cost breakdown data
  const costData = [
    {
      name: 'Material',
      value: parseFloat(costBreakdown?.totalMaterialCost || 0),
      average: parseFloat(costBreakdown?.avgMaterialCost || 0),
      color: COLORS[0]
    },
    {
      name: 'Labor',
      value: parseFloat(costBreakdown?.totalLaborCost || 0),
      average: parseFloat(costBreakdown?.avgLaborCost || 0),
      color: COLORS[1]
    },
    {
      name: 'Overhead',
      value: parseFloat(costBreakdown?.totalOverheadCost || 0),
      average: parseFloat(costBreakdown?.avgOverheadCost || 0),
      color: COLORS[2]
    }
  ]

  // Prepare margin analysis data
  const marginData = marginAnalysis?.map((item: any, index: number) => ({
    margin: `${parseFloat(item.margin_percentage || 0).toFixed(1)}%`,
    count: parseInt(item.count),
    avgProfit: parseFloat(item.avg_profit || 0),
    color: COLORS[index % COLORS.length]
  })) || []

  // Prepare top customers data
  const customerData = topValueCustomers?.slice(0, 8).map((customer: any) => ({
    name: customer.name.length > 15 ? customer.name.substring(0, 15) + '...' : customer.name,
    fullName: customer.name,
    totalValue: parseFloat(customer.total_value),
    quoteCount: parseInt(customer.quote_count)
  })) || []

  // Calculate financial metrics
  const totalQuoteValue = parseFloat(summary?.totalQuoteValue || 0)
  const averageQuoteValue = parseFloat(summary?.averageQuoteValue || 0)
  const quoteCount = parseInt(summary?.quoteCount || 0)
  
  const totalCosts = costData.reduce((sum: number, item: any) => sum + item.value, 0)
  const averageMargin = marginData.reduce((sum: number, item: any) => sum + (parseFloat(item.margin.replace('%', '')) * item.count), 0) / 
                       (marginData.reduce((sum: number, item: any) => sum + item.count, 0) || 1)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quote Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalQuoteValue)}</div>
            <p className="text-xs text-muted-foreground">
              {quoteCount} quotes generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Quote Value</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageQuoteValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per quote
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Production Costs</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCosts)}</div>
            <p className="text-xs text-muted-foreground">
              Material, labor & overhead
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Margin</CardTitle>
            <Percent className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Weighted average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quote Value Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Quote Value Trends</CardTitle>
            <CardDescription>Daily quote generation and value</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'totalValue' ? formatCurrency(value as number) : value,
                    name === 'totalValue' ? 'Total Value' : 'Quote Count'
                  ]}
                />
                <Legend />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalValue"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                  name="Total Value"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="quoteCount"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Quote Count"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Production cost distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Margin Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Margin Distribution</CardTitle>
            <CardDescription>Quote margins and profitability</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marginData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="margin" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'avgProfit' ? formatCurrency(value as number) : value,
                    name === 'avgProfit' ? 'Avg Profit' : 'Quote Count'
                  ]}
                />
                <Bar dataKey="count" fill="#8884d8" name="Quote Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Value Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Value</CardTitle>
            <CardDescription>Highest value customers</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip 
                  formatter={(value, name, props) => [
                    formatCurrency(value as number),
                    props.payload.fullName
                  ]}
                />
                <Bar 
                  dataKey="totalValue" 
                  fill="#82ca9d"
                  name="Total Value"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Cost Analysis</CardTitle>
          <CardDescription>Breakdown of production costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {costData.map((cost, index) => (
              <div key={cost.name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{cost.name} Costs</h4>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: cost.color }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-medium">{formatCurrency(cost.value)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average:</span>
                    <span className="font-medium">{formatCurrency(cost.average)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>% of Total:</span>
                    <span>{((cost.value / totalCosts) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Value Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Customer Value Rankings</span>
          </CardTitle>
          <CardDescription>Detailed customer performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topValueCustomers?.slice(0, 10).map((customer: any, index: number) => (
              <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.quote_count} quotes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(parseFloat(customer.total_value))}</p>
                  <Badge variant="outline">
                    {formatCurrency(parseFloat(customer.total_value) / parseInt(customer.quote_count))} avg
                  </Badge>
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-8">
                No customer data available for the selected time period.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Financial Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Financial Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {averageQuoteValue > 50000 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-green-800">
                  💰 <strong>High-value quotes:</strong> Average quote value of {formatCurrency(averageQuoteValue)} indicates strong market positioning.
                </p>
              </div>
            )}
            
            {averageMargin > 25 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800">
                  📈 <strong>Healthy margins:</strong> Average margin of {averageMargin.toFixed(1)}% is above industry standards.
                </p>
              </div>
            )}

            {averageMargin < 15 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                <p className="text-orange-800">
                  ⚠️ <strong>Margin optimization needed:</strong> Consider reviewing pricing strategy to improve profitability.
                </p>
              </div>
            )}

            {totalCosts > totalQuoteValue * 0.8 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800">
                  🚨 <strong>Cost control alert:</strong> Production costs are high relative to quote values. Review cost structure.
                </p>
              </div>
            )}

            {quoteCount > 0 && trendsData.length > 7 && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                <p className="text-purple-800">
                  📊 <strong>Growth trend:</strong> {quoteCount} quotes generated show {trendsData.length > 0 ? 'positive' : 'stable'} business activity.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}