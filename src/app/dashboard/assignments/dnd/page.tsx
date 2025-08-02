'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  DragOverEvent,
  Over,
  pointerWithin,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Package, Users, Eye, EyeOff, Loader2, Sparkles, ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { useTranslations } from 'next-intl'
import { InquiryItemWithRelations, User, Customer, Inquiry, Priority } from '@/types'
import { DraggableItem } from '@/components/assignments/draggable-item'
import { UserDropZone } from '@/components/assignments/user-drop-zone'
import { UnassignedDropZone } from '@/components/assignments/unassigned-drop-zone'
import { SortableUserZone } from '@/components/assignments/sortable-user-zone'
import { AssignmentFilters } from '@/components/assignments/assignment-filters'
import { UserFilterDropdown } from '@/components/assignments/user-filter-dropdown'
import { CollapsibleInquiryGroup } from '@/components/assignments/collapsible-inquiry-group'
import { useRouter } from 'next/navigation'

interface ItemAssignment {
  itemId: string
  userId: string | null
}

const SELECTED_USER_IDS_KEY = 'assignments-vp-vpp-filter'

export default function DragDropAssignmentPage() {
  const t = useTranslations()
  const { user: authUser } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [items, setItems] = useState<InquiryItemWithRelations[]>([])
  const [filteredItems, setFilteredItems] = useState<InquiryItemWithRelations[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [assignments, setAssignments] = useState<ItemAssignment[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showAssigned, setShowAssigned] = useState(false)
  const [showCostedItems, setShowCostedItems] = useState(false)
  const [over, setOver] = useState<Over | null>(null)
  const [orderedUserIds, setOrderedUserIds] = useState<string[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [plannedAssignments, setPlannedAssignments] = useState<ItemAssignment[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [filters, setFilters] = useState({
    customerId: undefined as string | undefined,
    inquiryId: undefined as string | undefined,
    priority: undefined as Priority | undefined,
    search: undefined as string | undefined,
  })

  const handleFilterChange = (newFilters: {
    customerId?: string | undefined
    inquiryId?: string | undefined
    priority?: Priority | undefined
    search?: string | undefined
  }) => {
    console.log('Filter change received:', newFilters)
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }

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

  // Load selected user IDs from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && users.length > 0 && !isInitialized) {
      const saved = localStorage.getItem(SELECTED_USER_IDS_KEY)
      if (saved) {
        try {
          const savedIds = JSON.parse(saved)
          // Validate that saved IDs still exist in current users
          const validIds = savedIds.filter((id: string) => 
            users.some(u => u.id === id)
          )
          setSelectedUserIds(validIds.length > 0 ? validIds : users.map(u => u.id))
        } catch {
          setSelectedUserIds(users.map(u => u.id))
        }
      } else {
        // First time - select all
        setSelectedUserIds(users.map(u => u.id))
      }
      setIsInitialized(true)
    }
  }, [users, isInitialized])

  // Save selected user IDs to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized && selectedUserIds.length >= 0) {
      localStorage.setItem(SELECTED_USER_IDS_KEY, JSON.stringify(selectedUserIds))
    }
  }, [selectedUserIds, isInitialized])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all required data in parallel
      const [usersData, itemsData, customersData, inquiriesData] = await Promise.all([
        // Fetch both VP and VPP users
        apiClient.getUsers({ roles: 'VP,VPP', active: 'true' }).then(response => {
          // Handle both direct array and wrapped response
          const userData = Array.isArray(response) ? response : (response as any)?.data || []
          // Sort VPPs first, then VPs by name
          return userData.sort((a: any, b: any) => {
            if (a.role === 'VPP' && b.role !== 'VPP') return -1
            if (a.role !== 'VPP' && b.role === 'VPP') return 1
            return a.name.localeCompare(b.name)
          })
        }).catch(err => {
          console.log('Failed to fetch users:', err.message)
          return []
        }),
        // Fetch items - fetch all relevant statuses in fewer requests
        Promise.all([
          // Get all items (like the regular assignments page)
          apiClient.getInquiryItems({ 
            limit: 200
          }).then(res => (res as any)?.data || [])
        ]).then(([allItems]) => {
          // Just return all items
          console.log('Fetched items:', allItems.length)
          return allItems
        }).catch(err => {
          console.log('Failed to fetch items:', err.message)
          return []
        }),
        // Fetch customers
        apiClient.getCustomers({ limit: 100 }).then(res => (res as any)?.data || (res as any) || []).catch(err => {
          console.log('Failed to fetch customers:', err.message)
          return []
        }),
        // Fetch inquiries
        apiClient.getInquiries({ limit: 100 }).then(res => (res as any)?.data || []).catch(err => {
          console.log('Failed to fetch inquiries:', err.message)
          return []
        })
      ])

      console.log('Fetched users:', usersData)
      console.log('Fetched items:', itemsData)
      
      // Debug: Check item statuses
      const statusCounts = itemsData.reduce((acc: any, item: any) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {})
      console.log('Item status distribution:', statusCounts)
      
      // Debug: Check inquiry statuses
      const inquiryStatusCounts = itemsData.reduce((acc: any, item: any) => {
        const status = item.inquiry?.status || 'NO_INQUIRY'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {})
      console.log('Inquiry status distribution:', inquiryStatusCounts)
      
      // Debug: Check assignment status
      const assignmentCounts = {
        assigned: itemsData.filter((item: any) => item.assignedToId).length,
        unassigned: itemsData.filter((item: any) => !item.assignedToId).length
      }
      console.log('Assignment distribution:', assignmentCounts)
      
      // Debug: Check for items without inquiry
      const itemsWithoutInquiry = itemsData.filter((item: any) => !item.inquiry)
      console.log('Items without inquiry relation:', itemsWithoutInquiry.length)
      
      // Debug: Check for unassigned PENDING items
      const unassignedPending = itemsData.filter((item: any) => 
        !item.assignedToId && 
        item.status === 'PENDING'
      )
      console.log('Unassigned PENDING items:', unassignedPending.length, unassignedPending.slice(0, 3))
      
      // Also check items that might be filtered out by inquiry status
      const allUnassignedPending = itemsData.filter((item: any) => 
        !item.assignedToId && 
        item.status === 'PENDING'
      )
      console.log('All unassigned PENDING (no inquiry filter):', allUnassignedPending.length)
      
      // Debug: Sample item structure
      if (itemsData.length > 0) {
        console.log('Sample item structure:', itemsData[0])
      }

      // Calculate workload for each user from the items data
      const usersWithWorkload = usersData.map((user: any) => {
        // Count items assigned to this user
        const userItems = itemsData.filter((item: any) => item.assignedToId === user.id)
        const pendingCount = userItems.filter((item: any) => 
          ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status)
        ).length
        const completedCount = userItems.filter((item: any) => 
          ['COSTED', 'APPROVED', 'QUOTED'].includes(item.status)
        ).length
        
        return {
          ...user,
          pendingCount,
          completedCount,
        }
      })

      console.log('Users with workload:', usersWithWorkload)

      setUsers(usersWithWorkload)
      setItems(itemsData)
      // Initialize user order only (not selection)
      setOrderedUserIds(usersWithWorkload.map((u: User) => u.id))
      // selectedUserIds is now managed by localStorage
      setCustomers(customersData)
      setInquiries(inquiriesData)

      // Initialize assignments from fetched items
      const initialAssignments = itemsData.map((item: InquiryItemWithRelations) => ({
        itemId: item.id,
        userId: item.assignedToId || null,
      }))
      setAssignments(initialAssignments)
      // Reset planned assignments and changes flag
      setPlannedAssignments([])
      setHasChanges(false)

    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error(t('errors.failedToLoadData'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const applyFilters = useCallback(() => {
    let filtered = [...items]
    
    console.log('applyFilters start:', { 
      itemsCount: filtered.length,
      showAssigned,
      showCostedItems
    })

    // Only show items from inquiries that can be assigned
    // Removed strict inquiry status filter - let's show all items with inquiries
    filtered = filtered.filter(item => item.inquiry)
    
    // NEVER show QUOTED items
    filtered = filtered.filter(item => item.status !== 'QUOTED')
    
    console.log('After inquiry status and QUOTED filter:', filtered.length)

    if (showAssigned) {
      // When showing assigned items
      filtered = filtered.filter(item => 
        item.assignedToId && 
        ['ASSIGNED', 'IN_PROGRESS', 'COSTED', 'APPROVED'].includes(item.status)
      )
    } else {
      // Default: Only show unassigned items (PENDING status only)
      const unassignedBeforeFilter = filtered.filter(item => !item.assignedToId).length
      filtered = filtered.filter(item => 
        !item.assignedToId &&
        item.status === 'PENDING'
      )
      console.log('Default filter - unassigned:', {
        beforeFilter: unassignedBeforeFilter,
        afterStatusFilter: filtered.length
      })
    }

    // Handle COSTED items filter
    if (!showCostedItems) {
      // Filter out COSTED items that don't have quotes
      filtered = filtered.filter(item => {
        if (item.status === 'COSTED') {
          // Check if this item has a quote
          // For now, assume items without quotes are those in COSTED status
          return false
        }
        return true
      })
    }

    if (filters.customerId) {
      console.log('Applying customer filter:', filters.customerId)
      filtered = filtered.filter(item => item.inquiry.customerId === filters.customerId)
    }

    if (filters.inquiryId) {
      console.log('Applying inquiry filter:', filters.inquiryId)
      filtered = filtered.filter(item => item.inquiryId === filters.inquiryId)
    }

    if (filters.priority) {
      console.log('Applying priority filter:', filters.priority)
      filtered = filtered.filter(item => item.inquiry.priority === filters.priority)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.inquiry.title.toLowerCase().includes(searchLower) ||
        item.inquiry.customer.name.toLowerCase().includes(searchLower)
      )
    }

    // Sort by deadline (requestedDelivery date)
    filtered.sort((a, b) => {
      const dateA = a.requestedDelivery ? new Date(a.requestedDelivery).getTime() : Infinity
      const dateB = b.requestedDelivery ? new Date(b.requestedDelivery).getTime() : Infinity
      return dateA - dateB // Earliest deadline first
    })

    console.log('Final filtered items:', filtered.length)
    setFilteredItems(filtered)
  }, [items, filters, showAssigned, showCostedItems])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOver(event.over)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Check if trying to reassign COSTED, APPROVED, or IN_PROGRESS items
    const checkReassignment = (itemId: string) => {
      const item = items.find(i => i.id === itemId)
      if (item && item.assignedToId && ['COSTED', 'APPROVED', 'IN_PROGRESS'].includes(item.status)) {
        toast.error(t('assignments.reassignmentNotAllowed') || 'Reassignment of items in progress requires special approval. This functionality will be implemented soon.')
        return false
      }
      return true
    }

    // For group dragging
    if (activeId.startsWith('group-')) {
      const groupData = active.data.current as { type: string, inquiryId: string, itemIds: string[] }
      const itemIds = groupData.itemIds
      
      // Check all items in the group
      const hasRestrictedItems = itemIds.some(itemId => {
        const item = items.find(i => i.id === itemId)
        return item && item.assignedToId && ['COSTED', 'APPROVED', 'IN_PROGRESS'].includes(item.status)
      })
      
      if (hasRestrictedItems) {
        toast.error(t('assignments.reassignmentNotAllowed') || 'Reassignment of items in progress requires special approval. This functionality will be implemented soon.')
        setActiveId(null)
        return
      }
    } else if (!activeId.startsWith('user-')) {
      // For individual item dragging
      if (!checkReassignment(activeId)) {
        setActiveId(null)
        return
      }
    }

    // Check if we're dragging a group
    if (activeId.startsWith('group-')) {
      // Handle group dragging
      const groupData = active.data.current as { type: string, inquiryId: string, itemIds: string[] }
      const itemIds = groupData.itemIds
      
      // Determine target
      let targetUserId: string | null = null
      
      if (overId === 'unassigned') {
        targetUserId = null
      } else if (overId.startsWith('user-')) {
        targetUserId = overId.replace('user-', '')
      } else {
        // Check if it's a direct user ID
        const targetUser = users.find(u => u.id === overId)
        if (targetUser) {
          targetUserId = targetUser.id
        }
      }
      
      // Update local assignments only
      setAssignments(prev => {
        const newAssignments = [...prev]
        itemIds.forEach(itemId => {
          const index = newAssignments.findIndex(a => a.itemId === itemId)
          if (index !== -1) {
            newAssignments[index] = { ...newAssignments[index], userId: targetUserId }
          }
        })
        return newAssignments
      })
      
      // Track planned changes
      setPlannedAssignments(prev => {
        const newPlanned = [...prev.filter(p => !itemIds.includes(p.itemId))]
        itemIds.forEach(itemId => {
          newPlanned.push({ itemId, userId: targetUserId })
        })
        return newPlanned
      })
      
      setHasChanges(true)
      setActiveId(null)
      return
    }

    // Check if we're dragging a user
    if (activeId.startsWith('user-') && overId.startsWith('user-')) {
      const activeUserId = activeId.replace('user-', '')
      const overUserId = overId.replace('user-', '')
      
      const oldIndex = orderedUserIds.indexOf(activeUserId)
      const newIndex = orderedUserIds.indexOf(overUserId)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setOrderedUserIds(arrayMove(orderedUserIds, oldIndex, newIndex))
      }
      
      setActiveId(null)
      return
    }

    // Otherwise, it's an item being dragged
    const itemId = activeId
    const dropTargetId = overId

    // Determine target user
    let targetUserId: string | null = null
    
    if (dropTargetId === 'unassigned') {
      targetUserId = null
    } else if (dropTargetId.startsWith('user-')) {
      targetUserId = dropTargetId.replace('user-', '')
    } else {
      // Check if it's a direct user ID (for backward compatibility)
      const targetUser = users.find(u => u.id === dropTargetId)
      if (targetUser) {
        targetUserId = targetUser.id
      }
    }
    
    // Update local assignments only
    setAssignments(prev => 
      prev.map(a => a.itemId === itemId ? { ...a, userId: targetUserId } : a)
    )
    
    // Track planned changes
    setPlannedAssignments(prev => {
      const newPlanned = [...prev.filter(p => p.itemId !== itemId)]
      newPlanned.push({ itemId, userId: targetUserId })
      return newPlanned
    })
    
    setHasChanges(true)
    setActiveId(null)
  }

  const getItemsForUser = (userId: string | null) => {
    const userItems = assignments
      .filter(a => a.userId === userId)
      .map(a => filteredItems.find(item => item.id === a.itemId))
      .filter(Boolean) as InquiryItemWithRelations[]
    
    return userItems
  }

  const activeItem = activeId && !activeId.startsWith('user-') && !activeId.startsWith('group-') ? filteredItems.find(item => item.id === activeId) : null
  const activeUser = activeId && activeId.startsWith('user-') ? users.find(u => u.id === activeId.replace('user-', '')) : null
  
  // Get active group data
  let activeGroup = null
  if (activeId && activeId.startsWith('group-')) {
    const inquiryId = activeId.replace('group-', '')
    const groupItems = filteredItems.filter(item => item.inquiryId === inquiryId)
    if (groupItems.length > 0) {
      activeGroup = {
        inquiryId,
        items: groupItems,
        inquiry: groupItems[0].inquiry
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Check permissions
  const userRole = authUser?.role
  console.log('Current user role:', userRole)
  if (userRole !== 'VPP' && userRole !== 'ADMIN' && userRole !== 'SUPERUSER') {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">{t('assignments.title')}</h1>
        <p className="text-muted-foreground">{t('errors.noPermission')}</p>
      </div>
    )
  }

  const unassignedItems = getItemsForUser(null)
  
  console.log('Debug DND page:', {
    totalItems: items.length,
    filteredItems: filteredItems.length,
    assignments: assignments.length,
    unassignedItems: unassignedItems.length,
    showAssigned,
    hasChanges
  })

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard/assignments')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">
                  {t('assignments.dragDropTitle')}
                </h1>
                <Sparkles className="h-5 w-5 text-yellow-500" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('assignments.dragDropDescription')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-assigned"
                checked={showAssigned}
                onCheckedChange={setShowAssigned}
              />
              <Label htmlFor="show-assigned" className="text-sm">
                {t('assignments.showAssignedItems')}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-costed"
                checked={showCostedItems}
                onCheckedChange={setShowCostedItems}
              />
              <Label htmlFor="show-costed" className="text-sm">
                {t('assignments.showCostedItems')}
              </Label>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Package className="h-3 w-3" />
              {t('assignments.assignableItems', { count: filteredItems.length })}
            </Badge>
            <UserFilterDropdown
              users={users}
              selectedUserIds={selectedUserIds}
              onSelectionChange={setSelectedUserIds}
            />
          </div>
        </div>

        {/* Filters */}
        <AssignmentFilters
          customers={customers}
          inquiries={inquiries}
          onFilterChange={handleFilterChange}
          defaultExpanded={true}
        />
        
        {/* Assignment Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {hasChanges && (
              <span className="text-orange-500 font-medium">
                {t('assignments.unsavedChanges')}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Reset all assignments back to unassigned
                setAssignments(items.map(item => ({ itemId: item.id, userId: null })))
                setPlannedAssignments([])
                setHasChanges(false)
                toast.info(t('assignments.changesReset'))
              }}
              disabled={!hasChanges}
            >
              {t('common.actions.reset')}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                // Apply all planned assignments
                try {
                  // Group assignments by user
                  const assignmentsByUser = plannedAssignments.reduce((acc, assignment) => {
                    if (assignment.userId) {
                      if (!acc[assignment.userId]) {
                        acc[assignment.userId] = []
                      }
                      acc[assignment.userId].push(assignment.itemId)
                    }
                    return acc
                  }, {} as Record<string, string[]>)
                  
                  // Apply assignments for each user
                  for (const [userId, itemIds] of Object.entries(assignmentsByUser)) {
                    await apiClient.assignItems({ itemIds, assigneeId: userId })
                  }
                  
                  // Apply unassignments
                  const unassignedItems = plannedAssignments
                    .filter(a => !a.userId)
                    .map(a => a.itemId)
                  
                  if (unassignedItems.length > 0) {
                    await apiClient.unassignItems({ itemIds: unassignedItems })
                  }
                  
                  toast.success(t('assignments.changesApplied'))
                  setHasChanges(false)
                  setPlannedAssignments([])
                  fetchData()
                } catch (error) {
                  console.error('Failed to apply assignments:', error)
                  toast.error(t('errors.failedToApplyAssignments'))
                }
              }}
              disabled={!hasChanges}
            >
              {t('common.actions.apply')}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="h-full grid grid-cols-[300px_1fr] overflow-hidden">
            {/* Left Panel - Unassigned Items */}
            <UnassignedDropZone
              items={unassignedItems}
              isOver={activeId ? over?.id === 'unassigned' : false}
            />

            {/* Right Panel - User Drop Zones */}
            <div className="p-4 overflow-y-auto overflow-x-hidden">
              <SortableContext
                items={orderedUserIds.map(id => `user-${id}`)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-max">
                {orderedUserIds
                  .filter(userId => selectedUserIds.includes(userId))
                  .map(userId => users.find(u => u.id === userId))
                  .filter(Boolean)
                  .map((user) => user && (
                    <SortableUserZone
                      key={user.id}
                      user={user}
                      items={getItemsForUser(user.id)}
                      isOver={activeId && !activeId.startsWith('user-') ? over?.id === `user-${user.id}` : false}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeItem ? (
              <DraggableItem item={activeItem} isDragging />
            ) : activeUser ? (
              <div className="opacity-80">
                <UserDropZone 
                  user={activeUser} 
                  items={getItemsForUser(activeUser.id)}
                />
              </div>
            ) : activeGroup ? (
              <div className="opacity-80 bg-card rounded-md p-2 border">
                <CollapsibleInquiryGroup
                  inquiryId={activeGroup.inquiryId}
                  inquiryTitle={activeGroup.inquiry.title}
                  customerName={activeGroup.inquiry.customer.name}
                  items={activeGroup.items}
                  priority={activeGroup.inquiry.priority}
                  isDragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}