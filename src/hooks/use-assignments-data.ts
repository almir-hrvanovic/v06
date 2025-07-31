'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api-client'
import { InquiryItemWithRelations, User, Customer, Inquiry } from '@/types'
import { toast } from 'sonner'

export interface AssignmentsFilters {
  search: string
  customerId: string
  inquiryId: string
  priority: string
  status: string
  assignedToId: string
}

export interface UseAssignmentsDataReturn {
  // Data
  items: InquiryItemWithRelations[]
  users: User[]
  customers: Customer[]
  inquiries: Inquiry[]
  
  // Loading states
  loading: boolean
  refreshing: boolean
  
  // Filters
  filters: AssignmentsFilters
  setFilters: (filters: Partial<AssignmentsFilters>) => void
  
  // Actions
  refresh: () => Promise<void>
  assignItems: (itemIds: string[], userId: string | null) => Promise<boolean>
  
  // Computed
  filteredItems: InquiryItemWithRelations[]
  unassignedItems: InquiryItemWithRelations[]
  assignedItems: InquiryItemWithRelations[]
  userWorkloads: Map<string, { pending: number; completed: number; total: number }>
}

/**
 * Shared hook for assignments data
 * Used by both table view and drag-and-drop view
 */
export function useAssignmentsData(): UseAssignmentsDataReturn {
  const [items, setItems] = useState<InquiryItemWithRelations[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFiltersState] = useState<AssignmentsFilters>({
    search: '',
    customerId: '',
    inquiryId: '',
    priority: '',
    status: '',
    assignedToId: ''
  })

  // Fetch all data
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      // Fetch all data in parallel
      let itemsRes, usersRes, customersRes, inquiriesRes
      
      try {
        itemsRes = await apiClient.getInquiryItems({ limit: 200 })
      } catch (e) {
        console.error('Failed to fetch items:', e)
        throw new Error('Failed to fetch items: ' + (e as any).message)
      }
      
      try {
        usersRes = await apiClient.getUsers({ roles: 'VP,VPP', active: 'true' })
      } catch (e) {
        console.error('Failed to fetch users:', e)
        throw new Error('Failed to fetch users: ' + (e as any).message)
      }
      
      try {
        customersRes = await apiClient.getCustomers({ active: 'true', limit: 100 })
      } catch (e) {
        console.error('Failed to fetch customers:', e)
        throw new Error('Failed to fetch customers: ' + (e as any).message)
      }
      
      try {
        inquiriesRes = await apiClient.getInquiries({ limit: 100 })
      } catch (e) {
        console.error('Failed to fetch inquiries:', e)
        throw new Error('Failed to fetch inquiries: ' + (e as any).message)
      }

      setItems((itemsRes as any).data || [])
      setUsers((usersRes as any).data || [])
      setCustomers((customersRes as any).data || [])
      setInquiries((inquiriesRes as any).data || [])

    } catch (error: any) {
      console.error('Failed to fetch assignments data:', error)
      // Show more specific error message
      const errorMessage = error?.message || 'Failed to load assignments data'
      if (errorMessage.includes('Forbidden') || errorMessage.includes('Unauthorized')) {
        toast.error('Nemate ovlasti za upravljanje zadacima')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter items based on current filters
  const filteredItems = items.filter(item => {
    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase()
      const matchesSearch = 
        item.name?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.inquiry?.title?.toLowerCase().includes(search) ||
        item.inquiry?.customer?.name?.toLowerCase().includes(search)
      if (!matchesSearch) return false
    }

    // Customer filter
    if (filters.customerId && item.inquiry?.customerId !== filters.customerId) {
      return false
    }

    // Inquiry filter
    if (filters.inquiryId && item.inquiryId !== filters.inquiryId) {
      return false
    }

    // Priority filter
    if (filters.priority && item.inquiry?.priority !== filters.priority) {
      return false
    }

    // Status filter
    if (filters.status && item.status !== filters.status) {
      return false
    }

    // Assigned to filter
    if (filters.assignedToId) {
      if (filters.assignedToId === 'unassigned' && item.assignedToId) {
        return false
      } else if (filters.assignedToId !== 'unassigned' && item.assignedToId !== filters.assignedToId) {
        return false
      }
    }

    return true
  })

  // Computed values
  const unassignedItems = filteredItems.filter(item => !item.assignedToId)
  const assignedItems = filteredItems.filter(item => item.assignedToId)

  // Calculate user workloads
  const userWorkloads = new Map<string, { pending: number; completed: number; total: number }>()
  users.forEach(user => {
    const userItems = items.filter(item => item.assignedToId === user.id)
    const pending = userItems.filter(item => 
      ['PENDING', 'ASSIGNED', 'IN_PROGRESS'].includes(item.status)
    ).length
    const completed = userItems.filter(item => 
      ['COSTED', 'APPROVED', 'QUOTED'].includes(item.status)
    ).length
    
    userWorkloads.set(user.id, {
      pending,
      completed,
      total: userItems.length
    })
  })

  // Assign items to a user (or unassign if userId is null)
  const assignItems = async (itemIds: string[], userId: string | null): Promise<boolean> => {
    try {
      if (userId === null) {
        // Unassign items
        await apiClient.unassignItems({ itemIds })
        toast.success(`Unassigned ${itemIds.length} item(s)`)
      } else {
        // Assign items
        await apiClient.assignItems({ itemIds, assigneeId: userId })
        const user = users.find(u => u.id === userId)
        toast.success(`Assigned ${itemIds.length} item(s) to ${user?.name}`)
      }
      
      // Refresh data
      await fetchData(true)
      return true
    } catch (error) {
      console.error('Failed to assign items:', error)
      toast.error('Failed to assign items')
      return false
    }
  }

  // Update filters
  const setFilters = (newFilters: Partial<AssignmentsFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }

  return {
    // Data
    items,
    users,
    customers,
    inquiries,
    
    // Loading states
    loading,
    refreshing,
    
    // Filters
    filters,
    setFilters,
    
    // Actions
    refresh: () => fetchData(true),
    assignItems,
    
    // Computed
    filteredItems,
    unassignedItems,
    assignedItems,
    userWorkloads
  }
}