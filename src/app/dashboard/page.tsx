'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NotificationDemo } from '@/components/notifications/notification-demo'
import { useTranslations } from 'next-intl'
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('dashboard.welcome')}, {session?.user?.name}
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.overview')}
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.totalInquiries')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInquiries}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.stats.fromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.activeInquiries')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeInquiries}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.stats.currentlyInProgress')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.pendingApprovals')}</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.stats.requireYourAttention')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.stats.monthlyRevenue')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dashboard.stats.fromLastMonth')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity.title')}</CardTitle>
            <CardDescription>
              {t('dashboard.recentActivity.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    {activity.type === 'inquiry' && <FileText className="h-4 w-4" />}
                    {activity.type === 'approval' && <CheckSquare className="h-4 w-4" />}
                    {activity.type === 'quote' && <FileCheck className="h-4 w-4" />}
                    {activity.type === 'production' && <Package className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge
                    variant={
                      activity.status === 'new' ? 'default' :
                      activity.status === 'approved' ? 'success' :
                      activity.status === 'ready' ? 'warning' : 'info'
                    }
                    className="text-xs"
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.pendingTasks.title')}</CardTitle>
            <CardDescription>
              {t('dashboard.pendingTasks.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between space-x-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          task.priority === 'high' ? 'destructive' :
                          task.priority === 'medium' ? 'warning' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {t('dashboard.pendingTasks.due')}: {task.dueDate}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    {t('common.actions.view')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Demo */}
        <div className="flex justify-center">
          <NotificationDemo />
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickActions.title')}</CardTitle>
          <CardDescription>
            {t('dashboard.quickActions.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {userRole === 'SALES' && (
              <>
                <Button className="justify-start" variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  {t('dashboard.quickActions.newInquiry')}
                </Button>
                <Button className="justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  {t('dashboard.quickActions.addCustomer')}
                </Button>
                <Button className="justify-start" variant="outline">
                  <FileCheck className="mr-2 h-4 w-4" />
                  {t('dashboard.quickActions.generateQuote')}
                </Button>
              </>
            )}
            {userRole === 'VPP' && (
              <>
                <Button className="justify-start" variant="outline">
                  <Calculator className="mr-2 h-4 w-4" />
                  {t('dashboard.quickActions.assignItems')}
                </Button>
                <Button className="justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  {t('dashboard.quickActions.viewWorkload')}
                </Button>
              </>
            )}
            {userRole === 'VP' && (
              <>
                <Button className="justify-start" variant="outline">
                  <Calculator className="mr-2 h-4 w-4" />
                  {t('dashboard.quickActions.calculateCosts')}
                </Button>
                <Button className="justify-start" variant="outline">
                  <CheckSquare className="mr-2 h-4 w-4" />
                  {t('dashboard.quickActions.reviewItems')}
                </Button>
              </>
            )}
            {userRole === 'MANAGER' && (
              <Button className="justify-start" variant="outline">
                <CheckSquare className="mr-2 h-4 w-4" />
                {t('dashboard.quickActions.pendingApprovals')}
              </Button>
            )}
            <Button className="justify-start" variant="outline">
              <Package className="mr-2 h-4 w-4" />
              {t('dashboard.quickActions.viewReports')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}