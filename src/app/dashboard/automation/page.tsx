'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { UserRole } from '@prisma/client'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export const dynamic = 'force-dynamic'

interface AutomationRule {
  id: string
  name: string
  description?: string
  trigger: string
  isActive: boolean
  priority: number
  createdAt: string
  createdBy: {
    name: string
    email: string
  }
  _count: {
    logs: number
  }
}

export default function AutomationRulesPage() {
  const t = useTranslations()
  const { data: session } = useSession()
  const router = useRouter()
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)

  // Check permissions
  const canManageRules = session?.user?.role && 
    (session.user.role === UserRole.ADMIN || session.user.role === UserRole.SUPERUSER)

  const canDeleteRules = session?.user?.role === UserRole.SUPERUSER

  useEffect(() => {
    if (!canManageRules) {
      router.push('/dashboard')
      return
    }
    fetchRules()
  }, [canManageRules, router])

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/automation/rules')
      if (!response.ok) throw new Error('Failed to fetch rules')
      const data = await response.json()
      setRules(data)
    } catch (error) {
      toast.error(t('automation.rules.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      })
      
      if (!response.ok) throw new Error('Failed to update rule')
      
      toast.success(!isActive ? t('automation.rules.activated') : t('automation.rules.deactivated'))
      fetchRules()
    } catch (error) {
      toast.error(t('automation.rules.updateFailed'))
    }
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm(t('automation.rules.confirmDelete'))) return

    try {
      const response = await fetch(`/api/automation/rules/${ruleId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete rule')
      
      toast.success(t('automation.rules.deleted'))
      fetchRules()
    } catch (error) {
      toast.error(t('automation.rules.deleteFailed'))
    }
  }

  const formatTrigger = (trigger: string): string => {
    return trigger.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 100) return <Badge variant="destructive">{t('automation.priority.critical')}</Badge>
    if (priority >= 50) return <Badge variant="default">{t('automation.priority.high')}</Badge>
    if (priority >= 10) return <Badge>{t('automation.priority.normal')}</Badge>
    return <Badge variant="secondary">{t('automation.priority.low')}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('pages.automation.title')}</h1>
          <p className="text-muted-foreground">
            {t('pages.automation.subtitle')}
          </p>
        </div>
        <Link href="/dashboard/automation/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('automation.rules.createRule')}
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {rules.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {t('automation.rules.noRules')}
              </p>
              <Link href="/dashboard/automation/new">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('automation.rules.createFirst')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {rule.name}
                      {rule.isActive ? (
                        <Badge variant="success">{t('automation.rules.statusActive')}</Badge>
                      ) : (
                        <Badge variant="secondary">{t('automation.rules.statusInactive')}</Badge>
                      )}
                    </CardTitle>
                    {rule.description && (
                      <CardDescription>{rule.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRule(rule.id, rule.isActive)}
                      title={rule.isActive ? t('automation.rules.deactivate') : t('automation.rules.activate')}
                    >
                      {rule.isActive ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </Button>
                    <Link href={`/dashboard/automation/${rule.id}`}>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    {canDeleteRules && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('automation.rules.trigger')}</p>
                    <p className="font-medium">{formatTrigger(rule.trigger)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('automation.rules.priority')}</p>
                    <div className="mt-1">{getPriorityBadge(rule.priority)}</div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('automation.rules.executions')}</p>
                    <p className="font-medium flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {rule._count.logs}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('automation.rules.createdBy')}</p>
                    <p className="font-medium">{rule.createdBy.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}