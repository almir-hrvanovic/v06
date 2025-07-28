'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Calculator, 
  Users, 
  Search, 
  UserCheck,
  Building2,
  FileText,
  Clock,
  CheckSquare2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { InquiryItemWithRelations, User, ItemStatus } from '@/types'
import { useTranslations } from 'next-intl'

export default function AssignmentsPage() {
  const t = useTranslations()
  const { data: session } = useSession()
  const [items, setItems] = useState<InquiryItemWithRelations[]>([])
  const [vpUsers, setVpUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)

  const userRole = session?.user?.role

  useEffect(() => {
    fetchData()
  }, [searchTerm])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch unassigned or pending items
      const itemsParams = new URLSearchParams()
      itemsParams.append('status', 'PENDING')
      if (searchTerm) itemsParams.append('search', searchTerm)
      itemsParams.append('limit', '50')

      const [itemsResponse, usersResponse] = await Promise.all([
        apiClient.getInquiryItems(Object.fromEntries(itemsParams)),
        apiClient.getUsers({ role: 'VP', active: 'true' })
      ]) as any

      setItems(itemsResponse.data)
      setVpUsers(usersResponse.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleItemSelection = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId])
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(items.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleAssignItems = async () => {
    if (!selectedAssignee || selectedItems.length === 0) return

    try {
      setAssignLoading(true)
      
      await apiClient.assignItems({
        itemIds: selectedItems,
        assigneeId: selectedAssignee
      })

      // Refresh data
      await fetchData()
      
      // Reset state
      setSelectedItems([])
      setSelectedAssignee('')
      setAssignDialogOpen(false)
      
      // Show success message (you could use a toast library here)
      alert('Items assigned successfully!')
    } catch (error) {
      console.error('Failed to assign items:', error)
      alert('Failed to assign items. Please try again.')
    } finally {
      setAssignLoading(false)
    }
  }

  const getStatusBadge = (status: ItemStatus) => {
    const statusMap = {
      PENDING: { variant: 'secondary' as const, label: t("common.status.pending") },
      ASSIGNED: { variant: 'info' as const, label: t("common.status.assigned") },
      IN_PROGRESS: { variant: 'warning' as const, label: t("common.status.inProgress") },
      COSTED: { variant: 'success' as const, label: t("common.status.costed") },
      APPROVED: { variant: 'success' as const, label: t("common.status.approved") },
      QUOTED: { variant: 'success' as const, label: 'Quoted' },
    }

    const { variant, label } = statusMap[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  const selectedAssigneeName = vpUsers.find(vp => vp.id === selectedAssignee)?.name

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Item Assignments</h1>
            <p className="text-muted-foreground">
              Assign inquiry items to VPs for cost calculation
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  // Only show to VPP role
  if (userRole !== 'VPP' && userRole !== 'ADMIN' && userRole !== 'SUPERUSER') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Item Assignments</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Assignments</h1>
          <p className="text-muted-foreground">
            Assign inquiry items to VPs for cost calculation
          </p>
        </div>
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={selectedItems.length === 0}>
              <UserCheck className="mr-2 h-4 w-4" />
              Assign Selected ({selectedItems.length})
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Items to VP</DialogTitle>
              <DialogDescription>
                Assign {selectedItems.length} selected items to a VP for cost calculation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignee">Select VP</Label>
                <select
                  id="assignee"
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Choose a VP...</option>
                  {vpUsers.map((vp) => (
                    <option key={vp.id} value={vp.id}>
                      {vp.name} ({vp.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-sm text-muted-foreground">
                Selected items:
                <ul className="mt-2 space-y-1">
                  {items
                    .filter(item => selectedItems.includes(item.id))
                    .map(item => (
                      <li key={item.id} className="flex items-center space-x-2">
                        <CheckSquare2 className="h-3 w-3" />
                        <span>{item.name} - {item.inquiry.customer.name}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAssignDialogOpen(false)}
                disabled={assignLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignItems}
                disabled={!selectedAssignee || assignLoading}
              >
                {assignLoading ? 'Assigning...' : `Assign to ${selectedAssigneeName}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.filter(item => item.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available VPs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vpUsers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected Items</CardTitle>
            <CheckSquare2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedItems.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder={t("forms.placeholders.searchItems")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VP Workload Overview */}
      <Card>
        <CardHeader>
          <CardTitle>VP Workload Overview</CardTitle>
          <CardDescription>
            Current workload distribution among VPs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vpUsers.map((vp) => {
              const assignedCount = (vp as any)._count?.inquiryItems || 0
              return (
                <div key={vp.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{vp.name}</div>
                    <div className="text-sm text-muted-foreground">{vp.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{assignedCount}</div>
                    <div className="text-sm text-muted-foreground">items</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Items for Assignment</CardTitle>
          <CardDescription>
            {items.length} items available for assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="data-table-wrapper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedItems.length === items.length && items.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Inquiry</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={(checked) => 
                          handleItemSelection(item.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{item.inquiry.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{item.inquiry.customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{item.quantity}</span>
                        {item.unit && (
                          <span className="text-sm text-muted-foreground ml-1">
                            {item.unit}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(item.createdAt)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {items.length === 0 && (
            <div className="empty-state">
              <Calculator className="empty-state-icon" />
              <h3 className="empty-state-title">No items to assign</h3>
              <p className="empty-state-description">
                {searchTerm
                  ? 'No items match your search criteria.'
                  : 'All items have been assigned or there are no pending items.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}