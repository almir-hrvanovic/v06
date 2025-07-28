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
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Package, Users, Eye, EyeOff, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { InquiryItemWithRelations, User, Customer, Inquiry, Priority } from '@/types'
import { DraggableItem } from '@/components/assignments/draggable-item'
import { UserDropZone } from '@/components/assignments/user-drop-zone'
import { AssignmentFilters } from '@/components/assignments/assignment-filters'

interface ItemAssignment {
  itemId: string
  userId: string | null
}

export default function DragDropAssignmentPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [items, setItems] = useState<InquiryItemWithRelations[]>([])
  const [filteredItems, setFilteredItems] = useState<InquiryItemWithRelations[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [assignments, setAssignments] = useState<ItemAssignment[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showAssigned, setShowAssigned] = useState(false)
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
        Promise.all([
          apiClient.getUsers({ role: 'VP', active: 'true' }),
          apiClient.getUsers({ role: 'VPP', active: 'true' })
        ]).then(([vpResponse, vppResponse]) => {
          // Handle both direct array and wrapped response
          const vpData = Array.isArray(vpResponse) ? vpResponse : (vpResponse as any)?.data || []
          const vppData = Array.isArray(vppResponse) ? vppResponse : (vppResponse as any)?.data || []
          const allUsers = [...vpData, ...vppData]
          // Sort VPPs first, then VPs by name
          return allUsers.sort((a, b) => {
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
        usersData.map(async (user) => {
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
      toast.error('Failed to load data')
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const itemId = active.id as string
    const newUserId = over.id as string

    // Check if this is actually a user ID (not another item)
    const targetUser = users.find(u => u.id === newUserId)
    if (!targetUser) {
      setActiveId(null)
      return
    }

    // Update local state optimistically
    setAssignments(prev => 
      prev.map(a => a.itemId === itemId ? { ...a, userId: newUserId } : a)
    )

    // Update items state to reflect the new assignment
    setItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, assignedToId: newUserId, assignedTo: targetUser }
          : item
      )
    )

    try {
      // Make API call to persist the assignment
      await apiClient.assignItems({
        itemIds: [itemId],
        assigneeId: newUserId
      })

      toast.success(`Item assigned to ${targetUser.name}`)
      
      // Refresh workload data
      fetchData()
    } catch (error) {
      console.error('Failed to assign item:', error)
      toast.error('Failed to assign item')
      
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

  const activeItem = activeId ? filteredItems.find(item => item.id === activeId) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Check permissions
  const userRole = session?.user?.role
  if (userRole !== 'VPP' && userRole !== 'ADMIN' && userRole !== 'SUPERUSER') {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Item Assignments</h1>
        <p className="text-muted-foreground">You don't have permission to access this page</p>
      </div>
    )
  }

  const unassignedItems = getItemsForUser(null)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Drag & Drop Assignments</h1>
            <p className="text-sm text-muted-foreground">
              Drag items to assign them to VPs or VPPs
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-assigned"
                checked={showAssigned}
                onCheckedChange={setShowAssigned}
              />
              <Label htmlFor="show-assigned" className="text-sm">
                Show assigned items
              </Label>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Package className="h-3 w-3" />
              {filteredItems.length} assignable items
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {users.length} users
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
      <div className="flex-1 flex overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left Panel - Unassigned Items */}
          <div className="w-[30%] border-r bg-white p-4 overflow-y-auto">
            <div className="mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                Unassigned Items
                <Badge>{unassignedItems.length}</Badge>
              </h2>
            </div>
            
            <SortableContext 
              items={unassignedItems.map(item => item.id)} 
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {unassignedItems.map((item) => (
                  <DraggableItem key={item.id} item={item} />
                ))}
              </div>
            </SortableContext>

            {unassignedItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p className="text-sm">No unassigned items</p>
              </div>
            )}
          </div>

          {/* Right Panel - User Drop Zones */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-4 gap-4">
              {users.map((user) => (
                <UserDropZone
                  key={user.id}
                  user={user}
                  items={getItemsForUser(user.id)}
                  isOver={activeId ? user.id === activeId : false}
                />
              ))}
            </div>
          </div>

          {/* Drag Overlay */}
          <DragOverlay>
            {activeItem ? (
              <div className="opacity-80">
                <DraggableItem item={activeItem} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}