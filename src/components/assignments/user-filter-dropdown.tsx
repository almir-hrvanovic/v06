'use client'

import { useState } from 'react'
import { Check, Users, AlertTriangle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User } from '@/types'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface UserFilterDropdownProps {
  users: User[]
  selectedUserIds: string[]
  onSelectionChange: (userIds: string[]) => void
  userWorkloads?: Map<string, { pending: number; completed: number; total: number }>
}

export function UserFilterDropdown({ 
  users, 
  selectedUserIds, 
  onSelectionChange,
  userWorkloads 
}: UserFilterDropdownProps) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)

  const toggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      onSelectionChange(selectedUserIds.filter(id => id !== userId))
    } else {
      onSelectionChange([...selectedUserIds, userId])
    }
  }

  const selectAll = () => {
    onSelectionChange(users.map(u => u.id))
  }

  const deselectAll = () => {
    onSelectionChange([])
  }

  // Sort users by workload (least loaded first)
  const sortedUsers = [...users].sort((a, b) => {
    const workloadA = userWorkloads?.get(a.id)
    const workloadB = userWorkloads?.get(b.id)
    return (workloadA?.pending || 0) - (workloadB?.pending || 0)
  })

  // Calculate average workload for comparison
  const totalPending = users.reduce((sum, user) => {
    const workload = userWorkloads?.get(user.id)
    return sum + (workload?.pending || 0)
  }, 0)
  const avgPending = users.length > 0 ? totalPending / users.length : 0

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Users className="h-3 w-3" />
          {t('assignments.users', { count: selectedUserIds.length })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[320px]">
        <div className="flex gap-2 p-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={selectAll}
          >
            {t('common.actions.selectAll')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-xs"
            onClick={deselectAll}
          >
            {t('common.actions.deselectAll')}
          </Button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {sortedUsers.map((user) => {
            const workload = userWorkloads?.get(user.id) || { pending: 0, completed: 0, total: 0 }
            const isOverloaded = workload.pending > avgPending * 1.5
            const completionRate = workload.total > 0 
              ? Math.round((workload.completed / workload.total) * 100) 
              : 0

            return (
              <DropdownMenuItem
                key={user.id}
                className="flex items-center justify-between cursor-pointer py-2"
                onSelect={(e) => {
                  e.preventDefault()
                  toggleUser(user.id)
                }}
              >
                <div className="flex-1 space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{user.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                    {isOverloaded && (
                      <AlertTriangle className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">{workload.pending}</span> 
                      {t('assignments.pending')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-medium">{workload.completed}</span> 
                      {t('assignments.completed')}
                    </span>
                  </div>
                  {workload.total > 0 && (
                    <Progress 
                      value={completionRate} 
                      className="h-1.5 mt-1"
                    />
                  )}
                </div>
                <Check 
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                  )}
                />
              </DropdownMenuItem>
            )
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}