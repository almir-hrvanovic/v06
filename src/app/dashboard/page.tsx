'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NotificationDemo } from '@/components/notifications/notification-demo'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  FileText,
  Users,
  Calculator,
  CheckSquare,
  FileCheck,
  Package,
  TrendingUp,
  Clock,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const t = useTranslations()

  // Mock data - in real app, this would come from API calls
  const stats = {
    totalInquiries: 127,
    activeInquiries: 45,
    pendingApprovals: 8,
    activeQuotes: 23,
    productionOrders: 12,
    revenue: 245000,
  }

  const recentActivities = [
    {
      id: 1,
      type: 'inquiry',
      title: 'New inquiry from Acme Corp',
      description: 'INQ-2024-015: Custom machinery components',
      time: '2 minutes ago',
      status: 'new',
    },
    {
      id: 2,
      type: 'approval',
      title: 'Cost calculation approved',
      description: 'Item #3 in INQ-2024-012 approved by Manager',
      time: '15 minutes ago',
      status: 'approved',
    },
    {
      id: 3,
      type: 'quote',
      title: 'Quote generated',
      description: 'QUO-2024-045 ready for customer review',
      time: '1 hour ago',
      status: 'ready',
    },
    {
      id: 4,
      type: 'production',
      title: 'Production order started',
      description: 'PO-2024-018 moved to production',
      time: '3 hours ago',
      status: 'in-progress',
    },
  ]

  const pendingTasks = [
    {
      id: 1,
      title: 'Cost calculation required',
      description: 'INQ-2024-014, Item: Steel brackets (Qty: 50)',
      priority: 'high',
      dueDate: 'Today',
    },
    {
      id: 2,
      title: 'Approval pending',
      description: 'Cost calculation for INQ-2024-013',
      priority: 'medium',
      dueDate: 'Tomorrow',
    },
    {
      id: 3,
      title: 'Quote review',
      description: 'QUO-2024-043 needs final review',
      priority: 'low',
      dueDate: 'This week',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t('dashboard.welcome')}, {session?.user?.name}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.overview')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge 
            variant="secondary" 
            className="bg-[hsl(var(--supabase-green))]/10 text-[hsl(var(--supabase-green))] border-[hsl(var(--supabase-green))]/20 px-3 py-1"
          >
            {userRole ? (
              (() => {
                try {
                  return t(`roles.${userRole}`)
                } catch (error) {
                  console.warn(`Translation missing for roles.${userRole}`, error)
                  return userRole // Fallback to role name
                }
              })()
            ) : ''}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.stats.totalInquiries')}
            </CardTitle>
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.totalInquiries}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('dashboard.stats.fromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.stats.activeInquiries')}
            </CardTitle>
            <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.activeInquiries}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('dashboard.stats.currentlyInProgress')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.stats.pendingApprovals')}
            </CardTitle>
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded-lg">
              <CheckSquare className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              {stats.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('dashboard.stats.requireYourAttention')}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.stats.monthlyRevenue')}
            </CardTitle>
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded-lg">
              <TrendingUp className="h-4 w-4 text-[hsl(var(--supabase-green))]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground mb-1">
              ${stats.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('dashboard.stats.fromLastMonth')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{t('dashboard.recentActivity.title')}</CardTitle>
            <CardDescription>
              {t('dashboard.recentActivity.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg shadow-sm",
                    activity.type === 'inquiry' && "bg-blue-50 dark:bg-blue-950",
                    activity.type === 'approval' && "bg-green-50 dark:bg-green-950",
                    activity.type === 'quote' && "bg-purple-50 dark:bg-purple-950",
                    activity.type === 'production' && "bg-orange-50 dark:bg-orange-950"
                  )}>
                    {activity.type === 'inquiry' && <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                    {activity.type === 'approval' && <CheckSquare className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    {activity.type === 'quote' && <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                    {activity.type === 'production' && <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">{activity.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs border-0",
                      activity.status === 'new' && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
                      activity.status === 'approved' && "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
                      activity.status === 'ready' && "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
                      activity.status === 'in-progress' && "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300"
                    )}
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{t('dashboard.pendingTasks.title')}</CardTitle>
            <CardDescription>
              {t('dashboard.pendingTasks.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.id} className="p-3 rounded-lg border border-border hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between space-x-3">
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {task.description}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs border-0",
                            task.priority === 'high' && "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
                            task.priority === 'medium' && "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
                            task.priority === 'low' && "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          )}
                        >
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {t('dashboard.pendingTasks.due')}: {task.dueDate}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="shrink-0">
                      {t('common.actions.view')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Demo */}
        <Card className="lg:col-span-1 flex items-center justify-center">
          <CardContent className="p-8">
            <NotificationDemo />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t('dashboard.quickActions.title')}</CardTitle>
          <CardDescription>
            {t('dashboard.quickActions.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {userRole === 'SALES' && (
              <>
                <Button className="justify-start h-auto p-4 flex-col items-start space-y-2" variant="outline">
                  <div className="flex items-center space-x-2 w-full">
                    <FileText className="h-4 w-4 text-[hsl(var(--supabase-green))]" />
                    <span className="font-medium">{t('dashboard.quickActions.newInquiry')}</span>
                  </div>
                </Button>
                <Button className="justify-start h-auto p-4 flex-col items-start space-y-2" variant="outline">
                  <div className="flex items-center space-x-2 w-full">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{t('dashboard.quickActions.addCustomer')}</span>
                  </div>
                </Button>
                <Button className="justify-start h-auto p-4 flex-col items-start space-y-2" variant="outline">
                  <div className="flex items-center space-x-2 w-full">
                    <FileCheck className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">{t('dashboard.quickActions.generateQuote')}</span>
                  </div>
                </Button>
              </>
            )}
            {userRole === 'VPP' && (
              <>
                <Button className="justify-start h-auto p-4 flex-col items-start space-y-2" variant="outline">
                  <div className="flex items-center space-x-2 w-full">
                    <Calculator className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">{t('dashboard.quickActions.assignItems')}</span>
                  </div>
                </Button>
                <Button className="justify-start h-auto p-4 flex-col items-start space-y-2" variant="outline">
                  <div className="flex items-center space-x-2 w-full">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{t('dashboard.quickActions.viewWorkload')}</span>
                  </div>
                </Button>
              </>
            )}
            {userRole === 'VP' && (
              <>
                <Button className="justify-start h-auto p-4 flex-col items-start space-y-2" variant="outline">
                  <div className="flex items-center space-x-2 w-full">
                    <Calculator className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">{t('dashboard.quickActions.calculateCosts')}</span>
                  </div>
                </Button>
                <Button className="justify-start h-auto p-4 flex-col items-start space-y-2" variant="outline">
                  <div className="flex items-center space-x-2 w-full">
                    <CheckSquare className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{t('dashboard.quickActions.reviewItems')}</span>
                  </div>
                </Button>
              </>
            )}
            {userRole === 'MANAGER' && (
              <Button className="justify-start h-auto p-4 flex-col items-start space-y-2" variant="outline">
                <div className="flex items-center space-x-2 w-full">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{t('dashboard.quickActions.pendingApprovals')}</span>
                </div>
              </Button>
            )}
            <Button className="justify-start h-auto p-4 flex-col items-start space-y-2" variant="outline">
              <div className="flex items-center space-x-2 w-full">
                <Package className="h-4 w-4 text-indigo-600" />
                <span className="font-medium">{t('dashboard.quickActions.viewReports')}</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}