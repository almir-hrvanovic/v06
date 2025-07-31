'use client'

import { useState } from 'react'
import { Check, Users } from 'lucide-react'
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

interface UserFilterDropdownProps {
  users: User[]
  selectedUserIds: string[]
  onSelectionChange: (userIds: string[]) => void
}

export function UserFilterDropdown({ 
  users, 
  selectedUserIds, 
  onSelectionChange 
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Users className="h-3 w-3" />
          {t('assignments.users', { count: selectedUserIds.length })}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
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
        <div className="max-h-[300px] overflow-y-auto">
          {users.map((user) => (
            <DropdownMenuItem
              key={user.id}
              className="flex items-center justify-between cursor-pointer"
              onSelect={(e) => {
                e.preventDefault()
                toggleUser(user.id)
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{user.name}</span>
                <Badge variant="outline" className="text-xs">
                  {user.role}
                </Badge>
              </div>
              <Check 
                className={cn(
                  "h-4 w-4",
                  selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"
                )}
              />
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}