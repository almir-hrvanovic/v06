'use client'

import React, { useState, useMemo } from 'react'
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
import { UserCheck, Clock, CheckSquare2, ChevronDown, ChevronRight, Package, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { getPriorityBadge } from '@/lib/priority-utils'

interface TableViewProps {
  items: InquiryItemWithRelations[]
  users: User[]
  canAssign: boolean
  onAssign: (itemIds: string[], userId: string | null) => Promise<boolean>
  userWorkloads: Map<string, { pending: number; completed: number; total: number }>
  selectedUserIds?: string[]
  onSelectedItemsChange?: (itemIds: string[]) => void
  selectedItems?: string[]
}

interface GroupedInquiry {
  inquiryId: string
  title: string
  customerName: string
  priority: string
  items: InquiryItemWithRelations[]
}

export function TableView({
  items,
  users,
  canAssign,
  onAssign,
  userWorkloads,
  selectedUserIds,
  onSelectedItemsChange,
  selectedItems: controlledSelectedItems
}: TableViewProps) {
  const t = useTranslations()
  const [internalSelectedItems, setInternalSelectedItems] = useState<string[]>([])
  const [assigningItems, setAssigningItems] = useState<string[]>([])
  const [expandedInquiries, setExpandedInquiries] = useState<Set<string>>(new Set())
  
  // Use controlled selectedItems if provided, otherwise use internal state
  const selectedItems = controlledSelectedItems ?? internalSelectedItems
  const setSelectedItems = (items: string[]) => {
    if (onSelectedItemsChange) {
      onSelectedItemsChange(items)
    } else {
      setInternalSelectedItems(items)
    }
  }

  // Filter out assigned, costed, and quoted items by default
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.status === 'PENDING' || 
      item.status === 'IN_PROGRESS'
    )
  }, [items])

  // Group items by inquiry
  const groupedInquiries = useMemo(() => {
    const groups = new Map<string, GroupedInquiry>()
    
    filteredItems.forEach(item => {
      const inquiryId = item.inquiryId
      if (!groups.has(inquiryId)) {
        groups.set(inquiryId, {
          inquiryId,
          title: item.inquiry.title,
          customerName: item.inquiry.customer.name,
          priority: item.inquiry.priority,
          items: []
        })
      }
      groups.get(inquiryId)!.items.push(item)
    })
    
    return Array.from(groups.values())
  }, [filteredItems])
  
  // Filter users based on selectedUserIds
  const filteredUsers = selectedUserIds && selectedUserIds.length > 0
    ? users.filter(user => selectedUserIds.includes(user.id))
    : users

  const toggleInquiryExpanded = (inquiryId: string) => {
    setExpandedInquiries(prev => {
      const next = new Set(prev)
      if (next.has(inquiryId)) {
        next.delete(inquiryId)
      } else {
        next.add(inquiryId)
      }
      return next
    })
  }

  const handleSelectAllInquiryItems = (inquiry: GroupedInquiry, checked: boolean) => {
    const inquiryItemIds = inquiry.items.map(item => item.id)
    
    if (checked) {
      // Add all inquiry items to selection
      const newSelection = new Set(selectedItems)
      inquiryItemIds.forEach(id => newSelection.add(id))
      setSelectedItems(Array.from(newSelection))
    } else {
      // Remove all inquiry items from selection
      setSelectedItems(selectedItems.filter(id => !inquiryItemIds.includes(id)))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(item => item.id))
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

  const isInquiryFullySelected = (inquiry: GroupedInquiry) => {
    return inquiry.items.every(item => selectedItems.includes(item.id))
  }

  const isInquiryPartiallySelected = (inquiry: GroupedInquiry) => {
    const selectedCount = inquiry.items.filter(item => selectedItems.includes(item.id)).length
    return selectedCount > 0 && selectedCount < inquiry.items.length
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
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    indeterminate={selectedItems.length > 0 && selectedItems.length < filteredItems.length ? true : undefined}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>{t('assignments.inquiry')}</TableHead>
              <TableHead>{t('assignments.customer')}</TableHead>
              <TableHead>{t('assignments.priority')}</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>{t('assignments.headers.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedInquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canAssign ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  {t('assignments.noItems')}
                </TableCell>
              </TableRow>
            ) : (
              groupedInquiries.map((inquiry) => {
                const isExpanded = expandedInquiries.has(inquiry.inquiryId)
                const isFullySelected = isInquiryFullySelected(inquiry)
                const isPartiallySelected = isInquiryPartiallySelected(inquiry)
                
                return (
                  <React.Fragment key={inquiry.inquiryId}>
                    {/* Inquiry Row */}
                    <TableRow className="bg-muted/30 hover:bg-muted/50">
                      {canAssign && (
                        <TableCell>
                          <Checkbox
                            checked={isFullySelected}
                            indeterminate={isPartiallySelected ? true : undefined}
                            onCheckedChange={(checked) => handleSelectAllInquiryItems(inquiry, !!checked)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleInquiryExpanded(inquiry.inquiryId)}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{inquiry.title}</TableCell>
                      <TableCell>{inquiry.customerName}</TableCell>
                      <TableCell>{getPriorityBadge(inquiry.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{inquiry.items.length}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {canAssign && (
                          <Select
                            onValueChange={(value) => {
                              const itemIds = inquiry.items.map(item => item.id)
                              setAssigningItems(itemIds)
                              onAssign(itemIds, value === 'unassigned' ? null : value).then((success) => {
                                if (success) {
                                  setSelectedItems(selectedItems.filter(id => !itemIds.includes(id)))
                                }
                                setAssigningItems([])
                              })
                            }}
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Assign all..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">
                                <span className="flex items-center">
                                  <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                                  Unassign
                                </span>
                              </SelectItem>
                              {filteredUsers.map((user) => {
                                const workload = userWorkloads.get(user.id)
                                const avgPending = filteredUsers.reduce((sum, u) => {
                                  const w = userWorkloads.get(u.id)
                                  return sum + (w?.pending || 0)
                                }, 0) / filteredUsers.length
                                const isOverloaded = (workload?.pending || 0) > avgPending * 1.5
                                
                                return (
                                  <SelectItem key={user.id} value={user.id}>
                                    <span className="flex items-center justify-between w-full">
                                      <span className="flex items-center gap-2">
                                        {user.name}
                                        {user.role === 'VPP' && (
                                          <Badge variant="outline" className="text-xs h-4 px-1">VPP</Badge>
                                        )}
                                      </span>
                                      <span className={cn(
                                        "text-xs",
                                        isOverloaded ? "text-destructive font-semibold" : "text-muted-foreground"
                                      )}>
                                        {workload?.pending || 0} {isOverloaded && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                                      </span>
                                    </span>
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                    
                    {/* Item Rows (when expanded) */}
                    {isExpanded && inquiry.items.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/20">
                        {canAssign && (
                          <TableCell className="pl-8">
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={(checked) => handleSelectItem(item.id, !!checked)}
                              disabled={assigningItems.includes(item.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell></TableCell>
                        <TableCell className="pl-12">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-muted-foreground">{item.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.quantity} {item.unit || ''}
                          </div>
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
                          {canAssign && (
                            <Select
                              value={item.assignedToId || 'unassigned'}
                              onValueChange={(value) => handleAssign(item.id, value)}
                              disabled={assigningItems.includes(item.id)}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">
                                  <span className="flex items-center">
                                    <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                                    Unassigned
                                  </span>
                                </SelectItem>
                                {filteredUsers.map((user) => {
                                  const workload = userWorkloads.get(user.id)
                                  const avgPending = filteredUsers.reduce((sum, u) => {
                                    const w = userWorkloads.get(u.id)
                                    return sum + (w?.pending || 0)
                                  }, 0) / filteredUsers.length
                                  const isOverloaded = (workload?.pending || 0) > avgPending * 1.5
                                  
                                  return (
                                    <SelectItem key={user.id} value={user.id}>
                                      <span className="flex items-center justify-between w-full">
                                        <span className="flex items-center gap-2">
                                          {user.name}
                                          {user.role === 'VPP' && (
                                            <Badge variant="outline" className="text-xs h-4 px-1">VPP</Badge>
                                          )}
                                        </span>
                                        <span className={cn(
                                          "text-xs",
                                          isOverloaded ? "text-destructive font-semibold" : "text-muted-foreground"
                                        )}>
                                          {workload?.pending || 0} {isOverloaded && <AlertTriangle className="inline h-3 w-3 ml-1" />}
                                        </span>
                                      </span>
                                    </SelectItem>
                                  )
                                })}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}