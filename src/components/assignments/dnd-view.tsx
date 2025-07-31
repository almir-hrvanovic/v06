'use client'

import { useState, useEffect } from 'react'
import { InquiryItemWithRelations, User } from '@/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DraggableItem } from '@/components/assignments/draggable-item'
import { UserDropZone } from '@/components/assignments/user-drop-zone'
import { UnassignedDropZone } from '@/components/assignments/unassigned-drop-zone'
import { SortableUserZone } from '@/components/assignments/sortable-user-zone'
import { UserFilterDropdown } from '@/components/assignments/user-filter-dropdown'
import { Save, RotateCcw, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface DndViewProps {
  items: InquiryItemWithRelations[]
  users: User[]
  canAssign: boolean
  onAssign: (itemIds: string[], userId: string | null) => Promise<boolean>
  userWorkloads: Map<string, { pending: number; completed: number; total: number }>
}

interface PlannedAssignment {
  itemId: string
  userId: string | null
}

export function DndView({
  items,
  users,
  canAssign,
  onAssign,
  userWorkloads
}: DndViewProps) {
  const t = useTranslations()
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [orderedUserIds, setOrderedUserIds] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [plannedAssignments, setPlannedAssignments] = useState<PlannedAssignment[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Initialize user selection and order
  useEffect(() => {
    if (users.length > 0 && orderedUserIds.length === 0) {
      const userIds = users.map(u => u.id)
      setOrderedUserIds(userIds)
      
      // Load saved selection or select all
      const saved = localStorage.getItem('dnd-selected-users')
      if (saved) {
        try {
          const savedIds = JSON.parse(saved)
          const validIds = savedIds.filter((id: string) => userIds.includes(id))
          setSelectedUserIds(validIds.length > 0 ? validIds : userIds)
        } catch {
          setSelectedUserIds(userIds)
        }
      } else {
        setSelectedUserIds(userIds)
      }
    }
  }, [users, orderedUserIds.length])

  // Save selected users preference
  useEffect(() => {
    if (selectedUserIds.length > 0) {
      localStorage.setItem('dnd-selected-users', JSON.stringify(selectedUserIds))
    }
  }, [selectedUserIds])

  // Initialize planned assignments from current state
  useEffect(() => {
    const assignments = items.map(item => ({
      itemId: item.id,
      userId: item.assignedToId
    }))
    setPlannedAssignments(assignments)
  }, [items])

  // Get items with planned assignments applied
  const itemsWithPlanned = items.map(item => {
    const planned = plannedAssignments.find(p => p.itemId === item.id)
    return {
      ...item,
      assignedToId: planned?.userId || item.assignedToId
    }
  })

  // Check if item can be reassigned
  const canReassignItem = (item: InquiryItemWithRelations) => {
    if (!item.assignedToId) return true
    return !['COSTED', 'APPROVED', 'IN_PROGRESS'].includes(item.status)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Handle user reordering
    if (activeId.startsWith('sortable-user-') && overId.startsWith('sortable-user-')) {
      const activeUserId = activeId.replace('sortable-user-', '')
      const overUserId = overId.replace('sortable-user-', '')
      
      const oldIndex = orderedUserIds.indexOf(activeUserId)
      const newIndex = orderedUserIds.indexOf(overUserId)
      
      if (oldIndex !== newIndex) {
        setOrderedUserIds(arrayMove(orderedUserIds, oldIndex, newIndex))
      }
      return
    }

    // Handle item assignment
    if (active.data.current?.type === 'item' || active.data.current?.type === 'group') {
      const targetUserId = overId === 'unassigned' ? null : overId.replace('user-', '')
      
      let itemIds: string[] = []
      if (active.data.current?.type === 'group') {
        itemIds = active.data.current.itemIds
      } else {
        itemIds = [activeId]
      }

      // Check if items can be reassigned
      const itemsToCheck = items.filter(item => itemIds.includes(item.id))
      const cannotReassign = itemsToCheck.filter(item => !canReassignItem(item))
      
      if (cannotReassign.length > 0) {
        toast.error(t('assignments.reassignmentNotAllowed'))
        return
      }

      // Update planned assignments
      const newAssignments = plannedAssignments.map(assignment => {
        if (itemIds.includes(assignment.itemId)) {
          return { ...assignment, userId: targetUserId }
        }
        return assignment
      })
      
      setPlannedAssignments(newAssignments)
      setHasChanges(true)
    }
  }

  const handleApplyChanges = async () => {
    // Group changes by assignment action
    const toAssign = new Map<string, string[]>() // userId -> itemIds
    const toUnassign: string[] = []

    plannedAssignments.forEach(planned => {
      const item = items.find(i => i.id === planned.itemId)
      if (!item) return

      if (item.assignedToId !== planned.userId) {
        if (planned.userId === null) {
          toUnassign.push(planned.itemId)
        } else {
          const existing = toAssign.get(planned.userId) || []
          existing.push(planned.itemId)
          toAssign.set(planned.userId, existing)
        }
      }
    })

    // Apply changes
    try {
      // Unassign items
      if (toUnassign.length > 0) {
        await onAssign(toUnassign, null)
      }

      // Assign items to users
      for (const [userId, itemIds] of toAssign) {
        await onAssign(itemIds, userId)
      }

      setHasChanges(false)
      toast.success(t('assignments.changesApplied'))
    } catch (error) {
      toast.error(t('assignments.failedToApplyAssignments'))
    }
  }

  const handleReset = () => {
    const assignments = items.map(item => ({
      itemId: item.id,
      userId: item.assignedToId
    }))
    setPlannedAssignments(assignments)
    setHasChanges(false)
    toast.info(t('assignments.changesReset'))
  }

  // Active dragging item
  const activeItem = activeId 
    ? items.find(item => item.id === activeId)
    : null

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1">
            <Users className="h-4 w-4 mr-2" />
            {selectedUserIds.length} / {users.length} users
          </Badge>
          <UserFilterDropdown
            users={users}
            selectedUserIds={selectedUserIds}
            onSelectionChange={setSelectedUserIds}
          />
        </div>
        
        {canAssign && hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('assignments.reset')}
            </Button>
            <Button
              size="sm"
              onClick={handleApplyChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              {t('assignments.apply')}
            </Button>
          </div>
        )}
      </div>

      {/* DND Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Unassigned Items */}
          <div className="lg:col-span-1">
            <UnassignedDropZone
              items={itemsWithPlanned.filter(item => !item.assignedToId)}
              isOver={false}
            />
          </div>

          {/* Users */}
          <div className="lg:col-span-3">
            <SortableContext
              items={orderedUserIds.map(id => `sortable-user-${id}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                {orderedUserIds
                  .filter(userId => selectedUserIds.includes(userId))
                  .map(userId => {
                    const user = users.find(u => u.id === userId)
                    if (!user) return null
                    
                    const userItems = itemsWithPlanned.filter(
                      item => item.assignedToId === user.id
                    )
                    const workload = userWorkloads.get(user.id)
                    
                    return (
                      <SortableUserZone 
                        key={user.id} 
                        user={{
                          ...user,
                          pendingCount: workload?.pending || 0,
                          completedCount: workload?.completed || 0
                        }}
                        items={userItems}
                        isOver={false}
                      >
                        <UserDropZone
                          user={{
                            ...user,
                            pendingCount: workload?.pending || 0,
                            completedCount: workload?.completed || 0
                          }}
                          items={userItems}
                          isOver={false}
                        />
                      </SortableUserZone>
                    )
                  })}
              </div>
            </SortableContext>
          </div>
        </div>

        <DragOverlay>
          {activeItem && (
            <Card className="opacity-80">
              <DraggableItem item={activeItem} isDragging />
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}