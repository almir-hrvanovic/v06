"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AttachmentManager } from '@/components/attachments/attachment-manager'
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  User, 
  Building2, 
  DollarSign,
  Package,
  FileText,
  ClipboardList
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatWithSystemCurrency } from '@/lib/currency-helpers'
import { apiClient } from '@/lib/api-client'

interface InquiryItem {
  id: string
  name: string
  description?: string | null
  quantity: number
  unit?: string | null
  status: string
  notes?: string | null
  requestedDelivery?: string | null
  priceEstimation?: number | null
  createdAt: string
  updatedAt: string
  inquiry: {
    id: string
    title: string
    customer: {
      id: string
      name: string
    }
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  } | null
  costCalculation?: {
    id: string
    materialCost: number
    laborCost: number
    overheadCost: number
    totalCost: number
    notes?: string | null
    isApproved: boolean
    approvedAt?: string | null
    calculatedBy: {
      id: string
      name: string
    }
  } | null
}

export default function ItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const t = useTranslations()
  const [item, setItem] = useState<InquiryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const itemId = params.id as string
  const userRole = user?.role

  const fetchItem = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/items/${itemId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch item: ${response.statusText}`)
      }
      
      const data = await response.json()
      setItem(data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to fetch item:', err)
      
      // Check if it's an authentication error
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('You need to be logged in to view this item. Please log in and try again.')
      } else if (err.message?.includes('404')) {
        setError('Item not found. It may have been deleted or you may not have permission to view it.')
      } else {
        setError(err.message || 'Failed to load item details')
      }
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => {
    if (itemId) {
      fetchItem()
    }
  }, [itemId, fetchItem])

  const getItemStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: any, labelKey: string } } = {
      PENDING: { variant: 'secondary', labelKey: 'common.status.pending' },
      ASSIGNED: { variant: 'info', labelKey: 'common.status.assigned' },
      IN_PROGRESS: { variant: 'warning', labelKey: 'common.status.inProgress' },
      COSTED: { variant: 'warning', labelKey: 'common.status.costed' },
      APPROVED: { variant: 'success', labelKey: 'common.status.approved' },
      QUOTED: { variant: 'success', labelKey: 'common.status.quoted' },
      COMPLETED: { variant: 'success', labelKey: 'common.status.completed' },
    }

    const mappedStatus = statusMap[status] || { variant: 'secondary', labelKey: 'common.status.pending' }
    return <Badge variant={mappedStatus.variant}>{t(mappedStatus.labelKey)}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{t("common.actions.loading")}</h1>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Error</h1>
            </div>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                {error || 'Item not found'}
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchItem}>Try Again</Button>
                {error?.includes('logged in') && (
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/auth/signin')}
                  >
                    Go to Login
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{item.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              {getItemStatusBadge(item.status)}
              <span className="text-sm text-muted-foreground">
                ID: {item.id.slice(-8)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {(userRole === 'VPP' || userRole === 'VP' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
            <Button asChild>
              <Link href={`/dashboard/items/${item.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Item
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inquiry</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold truncate">
              <Link 
                href={`/dashboard/inquiries/${item.inquiry.id}`}
                className="hover:underline"
              >
                {item.inquiry.title}
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">{item.inquiry.customer.name}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantity</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {item.quantity} {item.unit || 'units'}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.requestedDelivery ? `Delivery: ${formatDate(item.requestedDelivery)}` : 'No delivery date'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {item.costCalculation 
                ? formatWithSystemCurrency(item.costCalculation.totalCost)
                : 'TBD'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {item.costCalculation?.isApproved ? t('common.status.approved') : t('actions.pendingApproval')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned To</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {item.assignedTo?.name || 'Unassigned'}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.assignedTo?.email || 'Not assigned'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="costing">Cost Calculation</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Item Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="mt-1">{item.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{item.description || 'No description provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="mt-1">{item.notes || 'No notes provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Price Estimation</label>
                <p className="mt-1 text-lg font-semibold">
                  {item.priceEstimation ? formatWithSystemCurrency(item.priceEstimation) : 'Not estimated'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="mt-1">{formatDate(item.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="mt-1">{formatDate(item.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Calculation</CardTitle>
              <CardDescription>
                Detailed cost breakdown for this item
              </CardDescription>
            </CardHeader>
            <CardContent>
              {item.costCalculation ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Material Cost</label>
                      <p className="mt-1 text-lg font-semibold">{formatWithSystemCurrency(item.costCalculation.materialCost)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Labor Cost</label>
                      <p className="mt-1 text-lg font-semibold">{formatWithSystemCurrency(item.costCalculation.laborCost)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Overhead Cost</label>
                      <p className="mt-1 text-lg font-semibold">{formatWithSystemCurrency(item.costCalculation.overheadCost)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Cost</label>
                      <p className="mt-1 text-lg font-semibold text-green-600">
                        {formatWithSystemCurrency(item.costCalculation.totalCost)}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Calculation Notes</label>
                    <p className="mt-1">{item.costCalculation.notes || 'No notes provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Calculated By</label>
                    <p className="mt-1">{item.costCalculation.calculatedBy.name}</p>
                  </div>
                  {item.costCalculation.isApproved && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Approved At</label>
                      <p className="mt-1">
                        {item.costCalculation.approvedAt 
                          ? formatDate(item.costCalculation.approvedAt)
                          : 'Not available'
                        }
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cost calculation available</p>
                  {(userRole === 'VP' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
                    <Button 
                      className="mt-4"
                      onClick={() => router.push(`/dashboard/items/${item.id}/edit`)}
                    >
                      Add Cost Calculation
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          <AttachmentManager
            itemId={item.id}
            title={t("attachments.itemAttachments")}
            showUpload={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}