"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AttachmentManager } from '@/components/attachments/attachment-manager'
import { PDFExportButton } from '@/components/pdf/pdf-export-button'
import { OpenFolderButton } from '@/components/attachments/open-folder-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  User, 
  Building2, 
  DollarSign,
  Clock,
  FileText,
  Package,
  Eye,
  UserPlus,
  FolderOpen
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatWithSystemCurrency } from '@/lib/currency-helpers'
import { apiClient } from '@/lib/api-client'
import { InquiryWithRelations, InquiryStatus, Priority } from '@/types'
import { AssignItemDialog } from '@/components/inquiries/assign-item-dialog'
import { useTranslations } from 'next-intl'

export default function InquiryDetailPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [inquiry, setInquiry] = useState<InquiryWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const inquiryId = params.id as string
  const userRole = session?.user?.role

  useEffect(() => {
    if (inquiryId) {
      fetchInquiry()
    }
  }, [inquiryId])

  const fetchInquiry = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getInquiry(inquiryId) as any
      console.log('Inquiry response:', response)
      console.log('Items with assignments:', response.data?.items || response.items)
      
      if (response.data) {
        setInquiry(response.data)
        setError(null)
      } else if (response.error) {
        setError(response.error)
      } else {
        // Handle direct response format
        setInquiry(response)
        setError(null)
      }
    } catch (err: any) {
      console.error('Failed to fetch inquiry:', err)
      
      // Check if it's an authentication error
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        setError('You need to be logged in to view this inquiry. Please log in and try again.')
      } else if (err.message?.includes('404')) {
        setError('Inquiry not found. It may have been deleted or you may not have permission to view it.')
      } else {
        setError(err.message || 'Failed to load inquiry details')
      }
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: InquiryStatus) => {
    const statusMap = {
      DRAFT: { variant: 'secondary' as const, label: 'Draft' },
      SUBMITTED: { variant: 'warning' as const, label: 'Submitted' },
      IN_REVIEW: { variant: 'info' as const, label: 'In Review' },
      ASSIGNED: { variant: 'info' as const, label: t("common.status.assigned") },
      COSTING: { variant: 'warning' as const, label: 'Costing' },
      QUOTED: { variant: 'success' as const, label: 'Quoted' },
      APPROVED: { variant: 'success' as const, label: t("common.status.approved") },
      REJECTED: { variant: 'destructive' as const, label: 'Rejected' },
      CONVERTED: { variant: 'success' as const, label: 'Converted' },
    }

    const { variant, label } = statusMap[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  const getPriorityBadge = (priority: Priority) => {
    const priorityMap = {
      LOW: { variant: 'secondary' as const, label: t("common.priority.low") },
      MEDIUM: { variant: 'warning' as const, label: t("common.priority.medium") },
      HIGH: { variant: 'destructive' as const, label: t("common.priority.high") },
      URGENT: { variant: 'destructive' as const, label: t("common.priority.urgent") },
    }

    const { variant, label } = priorityMap[priority]
    return <Badge variant={variant}>{label}</Badge>
  }

  const getItemStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { variant: any, label: string } } = {
      PENDING: { variant: 'secondary', label: t("common.status.pending") },
      ASSIGNED: { variant: 'info', label: t("common.status.assigned") },
      IN_PROGRESS: { variant: 'warning', label: t("common.status.inProgress") },
      COSTED: { variant: 'warning', label: t("common.status.costed") },
      APPROVED: { variant: 'success', label: t("common.status.approved") },
      QUOTED: { variant: 'success', label: 'Quoted' },
    }

    const mappedStatus = statusMap[status] || { variant: 'secondary', label: status }
    return <Badge variant={mappedStatus.variant}>{mappedStatus.label}</Badge>
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

  if (error || !inquiry) {
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
                {error || 'Inquiry not found'}
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={fetchInquiry}>Try Again</Button>
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
            <h1 className="text-3xl font-bold tracking-tight">{inquiry.title}</h1>
            <div className="flex items-center space-x-4 mt-2">
              {getStatusBadge(inquiry.status)}
              {getPriorityBadge(inquiry.priority)}
              <span className="text-sm text-muted-foreground">
                ID: {inquiry.id.slice(-8)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <OpenFolderButton inquiryId={inquiry.id} />
          {inquiry.attachments && inquiry.attachments.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  {t('inquiries.form.documentation.viewFiles')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>{t('inquiries.form.documentation.uploadedFiles')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {inquiry.attachments.map((item) => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => {
                      if (item.attachment?.uploadThingUrl) {
                        window.open(item.attachment.uploadThingUrl, '_blank')
                      }
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span className="truncate">{item.attachment?.originalName || item.attachment?.fileName}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <PDFExportButton 
            type="quote" 
            inquiryId={inquiry.id}
            variant="outline"
            size="default"
          />
          {(userRole === 'SALES' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
            <Button asChild>
              <Link href={`/dashboard/inquiries/${inquiry.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Inquiry
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{inquiry.customer.name}</div>
            {inquiry.customer.email && (
              <p className="text-xs text-muted-foreground">{inquiry.customer.email}</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{inquiry.items.length}</div>
            <p className="text-xs text-muted-foreground">
              {inquiry.items.filter(item => item.status === 'COSTED').length} costed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {inquiry.items.reduce((sum, item) => 
                sum + (item.costCalculation?.totalCost ? Number(item.costCalculation.totalCost) : 0), 0
              ) > 0 
                ? formatWithSystemCurrency(inquiry.items.reduce((sum, item) => 
                    sum + (item.costCalculation?.totalCost ? Number(item.costCalculation.totalCost) : 0), 0
                  ))
                : 'TBD'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatDate(inquiry.createdAt)}</div>
            <p className="text-xs text-muted-foreground">
              by {inquiry.createdBy.name}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="items">Items ({inquiry.items.length})</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Inquiry Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1">{inquiry.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Deadline</label>
                  <p className="mt-1">
                    {inquiry.deadline ? formatDate(inquiry.deadline) : 'No deadline set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Priority</label>
                  <div className="mt-1">{getPriorityBadge(inquiry.priority)}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment & Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(inquiry.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assigned To</label>
                  <p className="mt-1">
                    {inquiry.assignedTo ? (
                      <span className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{inquiry.assignedTo.name}</span>
                      </span>
                    ) : (
                      'Unassigned'
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <p className="mt-1">
                    <span className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{inquiry.createdBy.name}</span>
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="items" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inquiry Items</CardTitle>
              <CardDescription>
                Items included in this inquiry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inquiry.items.map((item) => (
                  <Card key={item.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold">{item.name}</h4>
                            {getItemStatusBadge(item.status)}
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span>Quantity: {item.quantity}</span>
                            {item.unit && <span>Unit: {item.unit}</span>}
                            {item.assignedTo ? (
                              <span className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>Assigned to {item.assignedTo.name}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <Link href={`/dashboard/items/${item.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </Button>
                          {(userRole === 'VPP' || userRole === 'VP' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              asChild
                            >
                              <Link href={`/dashboard/items/${item.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Link>
                            </Button>
                          )}
                          {(userRole === 'VPP' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item)
                                setAssignDialogOpen(true)
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Item Attachments */}
                      <div className="mt-4">
                        <AttachmentManager
                          itemId={item.id}
                          title={`Attachments for ${item.name}`}
                          showUpload={true}
                          className="bg-muted/50 border-0"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {inquiry.items.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No items in this inquiry</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          <AttachmentManager
            inquiryId={inquiry.id}
            title={t("attachments.inquiryAttachments")}
            showUpload={true}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>
                Track changes and activities for this inquiry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Activity history feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Item Dialog */}
      {selectedItem && (
        <AssignItemDialog
          isOpen={assignDialogOpen}
          onClose={() => {
            setAssignDialogOpen(false)
            setSelectedItem(null)
          }}
          item={selectedItem}
          onAssigned={fetchInquiry}
        />
      )}
    </div>
  )
}