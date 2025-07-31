'use client'

import { useState } from 'react'
import { InquiryItemWithRelations, User } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserCheck, Clock, CheckSquare2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface TableViewProps {
  items: InquiryItemWithRelations[]
  users: User[]
  canAssign: boolean
  onAssign: (itemIds: string[], userId: string | null) => Promise<boolean>
  userWorkloads: Map<string, { pending: number; completed: number; total: number }>
  selectedUserIds?: string[]
}

export function TableView({
  items,
  users,
  canAssign,
  onAssign,
  userWorkloads,
  selectedUserIds
}: TableViewProps) {
  const t = useTranslations()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [assigningItems, setAssigningItems] = useState<string[]>([])
  
  // Filter users based on selectedUserIds
  const filteredUsers = selectedUserIds && selectedUserIds.length > 0
    ? users.filter(user => selectedUserIds.includes(user.id))
    : users

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, itemId])
    } else {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    }
  }

  const handleAssign = async (itemId: string, userId: string) => {
    setAssigningItems([itemId])
    const success = await onAssign([itemId], userId === 'unassigned' ? null : userId)
    if (success) {
      setSelectedItems(selectedItems.filter(id => id !== itemId))
    }
    setAssigningItems([])
  }

  const handleBulkAssign = async (userId: string) => {
    if (selectedItems.length === 0) return
    
    setAssigningItems(selectedItems)
    const success = await onAssign(selectedItems, userId === 'unassigned' ? null : userId)
    if (success) {
      setSelectedItems([])
    }
    setAssigningItems([])
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Pending', className: 'bg-yellow-500' },
      ASSIGNED: { label: 'Assigned', className: 'bg-blue-500' },
      IN_PROGRESS: { label: 'In Progress', className: 'bg-purple-500' },
      COSTED: { label: 'Costed', className: 'bg-green-500' },
      APPROVED: { label: 'Approved', className: 'bg-emerald-500' },
      QUOTED: { label: 'Quoted', className: 'bg-teal-500' },
    }
    const config = statusConfig[status] || { label: status, className: 'bg-gray-500' }
    return (
      <Badge className={cn(config.className, 'text-white')}>
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig: Record<string, { label: string; className: string }> = {
      LOW: { label: 'Low', className: 'bg-gray-500' },
      MEDIUM: { label: 'Medium', className: 'bg-yellow-500' },
      HIGH: { label: 'High', className: 'bg-orange-500' },
      URGENT: { label: 'Urgent', className: 'bg-red-500' },
    }
    const config = priorityConfig[priority] || { label: priority, className: 'bg-gray-500' }
    return (
      <Badge variant="outline" className={cn('border-2', `border-${config.className}`)}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {canAssign && selectedItems.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedItems.length} item(s) selected
          </span>
          <Select onValueChange={handleBulkAssign}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Assign to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassign</SelectItem>
              {filteredUsers.map((user) => {
                const workload = userWorkloads.get(user.id)
                return (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({workload?.pending || 0} pending)
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {canAssign && (
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedItems.length === items.length && items.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead>{t('assignments.item')}</TableHead>
              <TableHead>{t('assignments.customer')}</TableHead>
              <TableHead>{t('assignments.inquiry')}</TableHead>
              <TableHead>{t('assignments.priority')}</TableHead>
              <TableHead>{t('assignments.status')}</TableHead>
              <TableHead>{t('assignments.assignedTo')}</TableHead>
              <TableHead>{t('assignments.quantity')}</TableHead>
              {canAssign && <TableHead>{t('assignments.actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canAssign ? 9 : 7} className="text-center py-8 text-muted-foreground">
                  {t('assignments.noItems')}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  {canAssign && (
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                        disabled={assigningItems.includes(item.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">{item.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.inquiry?.customer?.name || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {item.inquiry?.title || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.inquiry?.priority && getPriorityBadge(item.inquiry.priority)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell>
                    {item.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        {item.assignedTo.name}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.quantity} {item.unit || ''}
                  </TableCell>
                  {canAssign && (
                    <TableCell>
                      <Select
                        value={item.assignedToId || 'unassigned'}
                        onValueChange={(value) => handleAssign(item.id, value)}
                        disabled={assigningItems.includes(item.id)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {filteredUsers.map((user) => {
                            const workload = userWorkloads.get(user.id)
                            return (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({workload?.pending || 0})
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}