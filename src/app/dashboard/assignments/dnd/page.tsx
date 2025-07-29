'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
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
import { useRouter } from 'next/navigation'

interface ItemAssignment {
  itemId: string
  userId: string | null
}

export default function DragDropAssignmentPage() {
  const t = useTranslations()
  const { data: session } = useSession()
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
  const [over, setOver] = useState<Over | null>(null)
  const [orderedUserIds, setOrderedUserIds] = useState<string[]>([])
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

  useEffect(() => {
    fetchData()
  }, [showAssigned])

  useEffect(() => {
    applyFilters()
  }, [items, filters])

  const fetchData = async () => {
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
        }),
        // Fetch all items without status filter
        apiClient.getInquiryItems({ 
          limit: 100
        }).then(res => (res as any)?.data || []),
        // Fetch customers
        apiClient.getCustomers({ limit: 100 }).then(res => (res as any) || []),
        // Fetch inquiries
        apiClient.getInquiries({ limit: 100 }).then(res => (res as any)?.data || [])
      ])

      console.log('Fetched users:', usersData)
      console.log('Fetched items:', itemsData)

      // Calculate workload for each user
      const usersWithWorkload = await Promise.all(
        usersData.map(async (user: any) => {
          try {
            const workloadData = await apiClient.getWorkload(user.id)
            return {
              ...user,
              pendingCount: (workloadData as any)?.pendingItems || 0,
              completedCount: (workloadData as any)?.completedItems || 0,
            }
          } catch (error) {
            console.error(`Failed to fetch workload for user ${user.id}:`, error)
            return {
              ...user,
              pendingCount: 0,
              completedCount: 0,
            }
          }
        })
      )

      console.log('Users with workload:', usersWithWorkload)

      setUsers(usersWithWorkload)
      setItems(itemsData)
      // Initialize user order
      setOrderedUserIds(usersWithWorkload.map((u: User) => u.id))
      setCustomers(customersData)
      setInquiries(inquiriesData)

      // Initialize assignments from fetched items
      const initialAssignments = itemsData.map((item: InquiryItemWithRelations) => ({
        itemId: item.id,
        userId: item.assignedToId || null,
      }))
      setAssignments(initialAssignments)

    } catch (error) {
      console.error('Failed to fetch data:', error)
      toast.error(t('errors.failedToLoadData'))
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...items]

    // Only show items from inquiries that can be assigned (SUBMITTED or ASSIGNED status)
    filtered = filtered.filter(item => 
      ['SUBMITTED', 'ASSIGNED'].includes(item.inquiry.status)
    )

    // Only show items that are in assignable states (not already calculated/approved/quoted)
    filtered = filtered.filter(item => 
      ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status)
    )

    if (filters.customerId) {
      filtered = filtered.filter(item => item.inquiry.customerId === filters.customerId)
    }

    if (filters.inquiryId) {
      filtered = filtered.filter(item => item.inquiryId === filters.inquiryId)
    }

    if (filters.priority) {
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

    setFilteredItems(filtered)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOver(event.over)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

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

    // Handle dropping on unassigned area
    if (dropTargetId === 'unassigned') {
      // Remove assignment (set to null)
      setAssignments(prev => 
        prev.map(a => a.itemId === itemId ? { ...a, userId: null } : a)
      )

      // Update items state
      setItems(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, assignedToId: null, assignedTo: null as any }
            : item
        )
      )

      try {
        // API call to remove assignment
        await apiClient.unassignItems({ itemIds: [itemId] })
        toast.success(t('assignments.itemUnassigned'))
        fetchData()
      } catch (error) {
        console.error('Failed to unassign item:', error)
        toast.error(t('errors.failedToUnassignItem'))
        fetchData()
      }

      setActiveId(null)
      return
    }

    // Check if dropping on a user zone
    let targetUserId: string | null = null
    
    if (dropTargetId.startsWith('user-')) {
      targetUserId = dropTargetId.replace('user-', '')
    } else if (dropTargetId !== 'unassigned') {
      // Check if it's a direct user ID (for backward compatibility)
      const targetUser = users.find(u => u.id === dropTargetId)
      if (targetUser) {
        targetUserId = targetUser.id
      }
    }
    
    if (!targetUserId && dropTargetId !== 'unassigned') {
      setActiveId(null)
      return
    }
    
    const targetUser = targetUserId ? users.find(u => u.id === targetUserId) : null

    // Update local state optimistically
    setAssignments(prev => 
      prev.map(a => a.itemId === itemId ? { ...a, userId: targetUserId } : a)
    )

    // Update items state to reflect the new assignment
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, assignedToId: targetUserId, assignedTo: targetUser || null }
          : item
      )
    )

    try {
      // Make API call to persist the assignment
      await apiClient.assignItems({
        itemIds: [itemId],
        assigneeId: targetUserId!
      })

      toast.success(t('assignments.itemAssignedTo', { name: targetUser?.name || '' }))
      
      // Refresh workload data
      fetchData()
    } catch (error) {
      console.error('Failed to assign item:', error)
      toast.error(t('errors.failedToAssignItem'))
      
      // Revert on error
      fetchData()
    }

    setActiveId(null)
  }

  const getItemsForUser = (userId: string | null) => {
    const userItems = assignments
      .filter(a => a.userId === userId)
      .map(a => filteredItems.find(item => item.id === a.itemId))
      .filter(Boolean) as InquiryItemWithRelations[]
    
    return userItems
  }

  const activeItem = activeId && !activeId.startsWith('user-') ? filteredItems.find(item => item.id === activeId) : null
  const activeUser = activeId && activeId.startsWith('user-') ? users.find(u => u.id === activeId.replace('user-', '')) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Check permissions
  const userRole = session?.user?.role
  if (userRole !== 'VPP' && userRole !== 'ADMIN' && userRole !== 'SUPERUSER') {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">{t('assignments.title')}</h1>
        <p className="text-muted-foreground">{t('errors.noPermission')}</p>
      </div>
    )
  }

  const unassignedItems = getItemsForUser(null)

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
            <Badge variant="secondary" className="gap-1">
              <Package className="h-3 w-3" />
              {t('assignments.assignableItems', { count: filteredItems.length })}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {t('assignments.users', { count: users.length })}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <AssignmentFilters
          customers={customers}
          inquiries={inquiries}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Left Panel - Unassigned Items */}
          <UnassignedDropZone
            items={unassignedItems}
            isOver={activeId ? over?.id === 'unassigned' : false}
          />

          {/* Right Panel - User Drop Zones */}
          <div className="flex-1 p-4 overflow-y-auto">
            <SortableContext
              items={orderedUserIds.map(id => `user-${id}`)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
                {orderedUserIds
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
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}