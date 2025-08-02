'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
} from '@/components/ui/dialog'
import { 
  Package,
  Search,
  Eye,
  Calendar,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  FileText,
  Truck,
  BarChart3
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

interface ProductionOrder {
  id: string
  orderNumber: string
  quoteId: string
  status: 'PENDING' | 'IN_PRODUCTION' | 'COMPLETED' | 'SHIPPED' | 'DELIVERED'
  startDate: string | null
  completionDate: string | null
  shippedDate: string | null
  deliveredDate: string | null
  createdAt: string
  updatedAt: string
  quote: {
    id: string
    quoteNumber: string
    totalAmount: number
    inquiry: {
      id: string
      title: string
      customer: {
        id: string
        name: string
        email: string
      }
    }
  }
  _count?: {
    items: number
  }
}

export default function ProductionOrdersPage() {
  const t = useTranslations()
  const { user } = useAuth()
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null)
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false)

  const userRole = user?.role

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/production-orders?${params}`)
      if (!response.ok) throw new Error('Failed to fetch production orders')
      
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Failed to fetch production orders:', error)
      toast.error('Failed to load production orders')
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/production-orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update status')
      
      toast.success('Status updated successfully')
      setStatusUpdateOpen(false)
      fetchOrders()
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }

  const getStatusIcon = (status: ProductionOrder['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />
      case 'IN_PRODUCTION':
        return <Play className="h-4 w-4" />
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />
      case 'SHIPPED':
        return <Truck className="h-4 w-4" />
      case 'DELIVERED':
        return <Package className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: ProductionOrder['status']) => {
    const statusMap = {
      PENDING: { variant: 'secondary' as const, label: t("common.status.pending") },
      IN_PRODUCTION: { variant: 'warning' as const, label: 'In Production' },
      COMPLETED: { variant: 'info' as const, label: t("common.status.completed") },
      SHIPPED: { variant: 'default' as const, label: 'Shipped' },
      DELIVERED: { variant: 'success' as const, label: 'Delivered' }
    }

    const { variant, label } = statusMap[status]
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {getStatusIcon(status)}
        <span>{label}</span>
      </Badge>
    )
  }

  const getNextStatus = (currentStatus: ProductionOrder['status']): string | null => {
    const statusFlow = {
      PENDING: 'IN_PRODUCTION',
      IN_PRODUCTION: 'COMPLETED',
      COMPLETED: 'SHIPPED',
      SHIPPED: 'DELIVERED',
      DELIVERED: null
    }
    return statusFlow[currentStatus]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Production Orders</h1>
            <p className="text-muted-foreground">
              Track and manage production orders
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading production orders...</div>
        </div>
      </div>
    )
  }

  // Only show to authorized roles
  if (!['SUPERUSER', 'ADMIN', 'MANAGER'].includes(userRole || '')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Production Orders</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">Production Orders</h1>
          <p className="text-muted-foreground">
            Track and manage production orders
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Production</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'IN_PRODUCTION').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.filter(o => o.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, o) => sum + o.quote.totalAmount, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t("forms.placeholders.searchOrders")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Production Order List</CardTitle>
          <CardDescription>
            {orders.length} orders found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Inquiry</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Completion Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.quote.inquiry.customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.quote.inquiry.customer.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate">
                        {order.quote.inquiry.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(order.quote.totalAmount)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {order.startDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.startDate)}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not started</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {order.completionDate ? (
                        <div className="flex items-center gap-1 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {formatDate(order.completionDate)}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">In progress</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.location.href = `/dashboard/production/${order.id}`
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {getNextStatus(order.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setStatusUpdateOpen(true)
                            }}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {orders.length === 0 && (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t("emptyStates.noProductionOrdersFound")}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Production orders will appear here once quotes are accepted'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the status of order {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm">
                  Current Status: <strong>{selectedOrder.status}</strong>
                </p>
                <p className="text-sm">
                  Customer: <strong>{selectedOrder.quote.inquiry.customer.name}</strong>
                </p>
                <p className="text-sm">
                  Next Status: <strong>{getNextStatus(selectedOrder.status)}</strong>
                </p>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This action will update the production order status and notify relevant parties.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedOrder) {
                  const nextStatus = getNextStatus(selectedOrder.status)
                  if (nextStatus) {
                    handleStatusUpdate(selectedOrder.id, nextStatus)
                  }
                }
              }}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}