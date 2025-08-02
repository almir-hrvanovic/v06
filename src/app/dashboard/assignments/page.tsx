'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Calculator, 
  Users, 
  Search, 
  UserCheck,
  Building2,
  FileText,
  Clock,
  CheckSquare2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { InquiryItemWithRelations, User, ItemStatus } from '@/types'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

export default function AssignmentsPage() {
  const t = useTranslations()
  const { user } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<InquiryItemWithRelations[]>([])
  const [vpUsers, setVpUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('PENDING')
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  const [workloadExpanded, setWorkloadExpanded] = useState(false)

  const userRole = user?.role

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Fetch unassigned or pending items
      const itemsParams = new URLSearchParams()
      if (selectedStatus) itemsParams.append('status', selectedStatus)
      if (searchTerm) itemsParams.append('search', searchTerm)
      if (selectedCustomer) itemsParams.append('customerId', selectedCustomer)
      itemsParams.append('limit', '50')

      const [itemsResponse, usersResponse, customersResponse] = await Promise.all([
        apiClient.getInquiryItems(Object.fromEntries(itemsParams)),
        apiClient.getUsers({ roles: 'VP,VPP', active: 'true' }),
        apiClient.getCustomers({ active: 'true' })
      ]) as any

      setItems(itemsResponse.data)
      setVpUsers(usersResponse)
      setCustomers(customersResponse.data || customersResponse || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, selectedCustomer, selectedStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      toast.success(t('assignments.itemsAssignedSuccess'))
    } catch (error) {
      console.error('Failed to assign items:', error)
      toast.error(t('errors.failedToAssignItems'))
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Item Assignments</h1>
            <p className="text-muted-foreground">
              Assign inquiry items to VP/VPP users for cost calculation
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

  const selectedAssigneeName = vpUsers?.find(vp => vp.id === selectedAssignee)?.name

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Assignments</h1>
          <p className="text-muted-foreground">
            Assign inquiry items to VP/VPP users for cost calculation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/assignments/dnd')}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            EyeCandy
          </Button>
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={selectedItems.length === 0}>
                <UserCheck className="mr-2 h-4 w-4" />
                Assign Selected ({selectedItems.length})
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('assignments.assignItemsTitle')}</DialogTitle>
              <DialogDescription>
                {t('assignments.assignItemsDescription', { count: selectedItems.length })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assignee">{t('assignments.selectVPUser')}</Label>
                <Select
                  value={selectedAssignee}
                  onValueChange={setSelectedAssignee}
                >
                  <SelectTrigger id="assignee">
                    <SelectValue placeholder={t('assignments.chooseVPUser')} />
                  </SelectTrigger>
                  <SelectContent>
                    {vpUsers?.map((vp) => (
                      <SelectItem key={vp.id} value={vp.id}>
                        {vp.name} ({vp.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {t('assignments.selectedItems')}:
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
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned Items</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.filter(item => !item.assignedToId).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available VP/VPP</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vpUsers?.length || 0}</div>
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
          <CardTitle>{t("assignments.filterItems")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t("forms.placeholders.searchItems")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCustomer || "all"} onValueChange={(value) => setSelectedCustomer(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder={t("assignments.allCustomers")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("assignments.allCustomers")}</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus || "PENDING"} onValueChange={(value) => setSelectedStatus(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder={t("assignments.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("assignments.allStatuses")}</SelectItem>
                <SelectItem value="PENDING">{t("common.status.pending")}</SelectItem>
                <SelectItem value="ASSIGNED">{t("common.status.assigned")}</SelectItem>
                <SelectItem value="IN_PROGRESS">{t("common.status.inProgress")}</SelectItem>
                <SelectItem value="COSTED">{t("common.status.costed")}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCustomer('')
                setSelectedStatus('PENDING')
              }}
            >
              {t("common.actions.clearFilters")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* VP Workload Overview */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setWorkloadExpanded(!workloadExpanded)}>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>VP/VPP Workload Overview</CardTitle>
              <CardDescription>
                Current workload distribution among VP and VPP users
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              {workloadExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {workloadExpanded && (
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vpUsers?.map((vp) => {
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
              }) || []}
            </div>
          </CardContent>
        )}
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
                {searchTerm || selectedCustomer || selectedStatus
                  ? t('assignments.noItemsMatchFilter')
                  : t('assignments.noItemsAvailable')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}