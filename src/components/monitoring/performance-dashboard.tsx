'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, CheckCircle2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseAvg: number;
  dbQueryAvg: number;
  cacheHitRate: number;
  activeUsers: number;
  errorRate: number;
  bottlenecks: Record<string, number>;
  breakdown: {
    html: number;
    javascript: number;
    apiCalls: number;
    database: number;
    assets: number;
  };
}

interface PerformanceAlert {
  level: 'WARNING' | 'CRITICAL';
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  status: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
}

function MetricCard({ title, value, status, icon, trend }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    critical: 'text-red-600 bg-red-50'
  };

  const statusIcons = {
    good: <CheckCircle2 className="h-5 w-5" />,
    warning: <AlertTriangle className="h-5 w-5" />,
    critical: <AlertCircle className="h-5 w-5" />
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          <div className={cn('p-2 rounded-full', statusColors[status])}>
            {icon || statusIcons[status]}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BottleneckChart({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((sum, value) => sum + value, 0);
  const sortedEntries = Object.entries(data).sort(([, a], [, b]) => b - a);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Performance Bottlenecks</CardTitle>
        <CardDescription>Time spent in each component</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedEntries.map(([name, time]) => {
          const percentage = (time / total) * 100;
          return (
            <div key={name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                <span>{(time / 1000).toFixed(1)}s ({percentage.toFixed(0)}%)</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/monitoring/metrics');
        const data = await response.json();
        
        if (data.success) {
          setMetrics(data.metrics);
          setAlerts(data.alerts || []);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch metrics');
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setError('Failed to fetch performance metrics');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Update every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatus = (value: number, warningThreshold: number, criticalThreshold: number): 'good' | 'warning' | 'critical' => {
    if (value > criticalThreshold) return 'critical';
    if (value > warningThreshold) return 'warning';
    return 'good';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return <div>No metrics available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Performance Dashboard</h2>
        <p className="text-muted-foreground">Real-time performance monitoring for v06 optimization</p>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <Alert key={index} variant={alert.level === 'CRITICAL' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{alert.level}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Page Load Time"
          value={`${(metrics.pageLoadTime / 1000).toFixed(1)}s`}
          status={getStatus(metrics.pageLoadTime, 5000, 10000)}
        />
        <MetricCard
          title="API Response"
          value={`${(metrics.apiResponseAvg / 1000).toFixed(1)}s`}
          status={getStatus(metrics.apiResponseAvg, 500, 2000)}
        />
        <MetricCard
          title="Cache Hit Rate"
          value={`${metrics.cacheHitRate.toFixed(1)}%`}
          status={metrics.cacheHitRate > 80 ? 'good' : metrics.cacheHitRate > 50 ? 'warning' : 'critical'}
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics.errorRate.toFixed(1)}%`}
          status={metrics.errorRate < 1 ? 'good' : metrics.errorRate < 5 ? 'warning' : 'critical'}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Database Queries"
          value={`${(metrics.dbQueryAvg / 1000).toFixed(1)}s`}
          status={getStatus(metrics.dbQueryAvg, 100, 500)}
        />
        <MetricCard
          title="Active Users"
          value={metrics.activeUsers}
          status="good"
        />
      </div>

      {/* Bottleneck Analysis */}
      <div className="grid gap-4 md:grid-cols-2">
        <BottleneckChart data={metrics.bottlenecks} />
        
        {/* Performance Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Load Time Breakdown</CardTitle>
            <CardDescription>Time spent in each phase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">HTML</span>
                <span className="text-sm">{metrics.breakdown.html}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">JavaScript</span>
                <span className="text-sm">{metrics.breakdown.javascript}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">API Calls</span>
                <span className="text-sm text-red-600 font-semibold">{metrics.breakdown.apiCalls}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Database</span>
                <span className="text-sm text-red-600 font-semibold">{metrics.breakdown.database}ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Assets</span>
                <span className="text-sm">{metrics.breakdown.assets}ms</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-sm font-semibold">
                    {((metrics.breakdown.html + metrics.breakdown.javascript + 
                      metrics.breakdown.apiCalls + metrics.breakdown.database + 
                      metrics.breakdown.assets) / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Progress</CardTitle>
          <CardDescription>Progress towards performance targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Page Load Target (&lt; 2s)</span>
                <span className={metrics.pageLoadTime < 2000 ? 'text-green-600' : 'text-red-600'}>
                  {metrics.pageLoadTime < 2000 ? 'Achieved ✓' : `${((2000 / metrics.pageLoadTime) * 100).toFixed(0)}%`}
                </span>
              </div>
              <Progress value={Math.min(100, (2000 / metrics.pageLoadTime) * 100)} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>API Response Target (&lt; 200ms)</span>
                <span className={metrics.apiResponseAvg < 200 ? 'text-green-600' : 'text-yellow-600'}>
                  {metrics.apiResponseAvg < 200 ? 'Achieved ✓' : `${((200 / metrics.apiResponseAvg) * 100).toFixed(0)}%`}
                </span>
              </div>
              <Progress value={Math.min(100, (200 / metrics.apiResponseAvg) * 100)} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Cache Hit Target (&gt; 95%)</span>
                <span className={metrics.cacheHitRate > 95 ? 'text-green-600' : 'text-yellow-600'}>
                  {metrics.cacheHitRate > 95 ? 'Achieved ✓' : `${((metrics.cacheHitRate / 95) * 100).toFixed(0)}%`}
                </span>
              </div>
              <Progress value={Math.min(100, (metrics.cacheHitRate / 95) * 100)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}