'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { UserRole } from '@prisma/client'
import { RuleForm } from '@/components/automation/rule-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NewAutomationRulePage() {
  const { user } = useAuth()
  const router = useRouter()

  // Check permissions
  const canManageRules = user?.role && 
    (user.role === UserRole.ADMIN || user.role === UserRole.SUPERUSER)

  if (!canManageRules) {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/automation/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error('Failed to create rule')
    }
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
        <h1 className="text-3xl font-bold">Create Automation Rule</h1>
        <p className="text-muted-foreground">
          Configure triggers, conditions, and actions for workflow automation
        </p>
      </div>

      <RuleForm onSubmit={handleSubmit} />
    </div>
  )
}