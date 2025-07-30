'use client'

import { use, useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { UserRole } from '@prisma/client'
import { RuleForm } from '@/components/automation/rule-form'
import { ArrowLeft, Activity } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{
    ruleId: string
  }>
}

export default function EditAutomationRulePage({ params }: PageProps) {
  const { ruleId } = use(params)
  const { user } = useAuth()
  const router = useRouter()
  const [rule, setRule] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Check permissions
  const canManageRules = user?.role && 
    (user.role === UserRole.ADMIN || user.role === UserRole.SUPERUSER)

  useEffect(() => {
    if (!canManageRules) {
      router.push('/dashboard')
      return
    }
    fetchRule()
  }, [canManageRules, router])

  const fetchRule = async () => {
    try {
      const response = await fetch(`/api/automation/rules/${ruleId}`)
      if (!response.ok) throw new Error('Failed to fetch rule')
      const data = await response.json()
      setRule(data)
    } catch (error) {
      toast.error('Failed to load automation rule')
      router.push('/dashboard/automation')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/automation/rules/${ruleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Failed to update rule')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/dashboard/automation" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Automation Rules
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Automation Rule</h1>
        <p className="text-muted-foreground">
          Modify triggers, conditions, and actions for this rule
        </p>
      </div>

      {rule.logs && rule.logs.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Executions
            </CardTitle>
            <CardDescription>
              Last 10 executions of this rule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rule.logs.map((log: any) => (
                <div key={log.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant={log.status === 'SUCCESS' ? 'success' : 'destructive'}>
                      {log.status}
                    </Badge>
                    <span className="text-sm">{log.message}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <RuleForm rule={rule} onSubmit={handleSubmit} />
    </div>
  )
}