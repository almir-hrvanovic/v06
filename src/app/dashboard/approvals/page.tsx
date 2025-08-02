'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { 
  CheckSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  FileText,
  Building2,
  User,
  DollarSign,
  MessageSquare
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { useTranslations } from 'next-intl'

interface ApprovalWithRelations {
  id: string
  type: string
  status: string
  comments?: string
  approvedAt?: string
  createdAt: string
  approver?: {
    id: string
    name: string
    email: string
  }
  costCalculation?: {
    id: string
    materialCost: number
    laborCost: number
    overheadCost: number
    totalCost: number
    notes?: string
    calculatedBy: {
      id: string
      name: string
      email: string
    }
    inquiryItem: {
      id: string
      name: string
      description?: string
      quantity: number
      unit?: string
      inquiry: {
        id: string
        title: string
        customer: {
          id: string
          name: string
        }
      }
    }
  }
}

export default function ApprovalsPage() {
  const t = useTranslations()
  const { user } = useAuth()
  const [approvals, setApprovals] = useState<ApprovalWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApproval, setSelectedApproval] = useState<ApprovalWithRelations | null>(null)
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'APPROVED' | 'REJECTED' | null>(null)
  const [comments, setComments] = useState('')

  const userRole = user?.role

  useEffect(() => {
    fetchApprovals()
  }, [])

  const fetchApprovals = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getApprovals() as any
      setApprovals(response.data)
    } catch (error) {
      console.error('Failed to fetch approvals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprovalAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval?.costCalculation) return

    try {
      setApprovalLoading(true)
      
      await apiClient.createApproval({
        costCalculationId: selectedApproval.costCalculation.id,
        status: action,
        comments: comments || undefined
      })

      // Reset state
      setSelectedApproval(null)
      setApprovalAction(null)
      setComments('')
      setApprovalDialogOpen(false)
      
      // Refresh data
      await fetchApprovals()
      
      alert(`Cost calculation ${action.toLowerCase()} successfully!`)
    } catch (error) {
      console.error('Failed to process approval:', error)
      alert('Failed to process approval. Please try again.')
    } finally {
      setApprovalLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { variant: 'warning' as const, icon: Clock, label: t("common.status.pending") },
      APPROVED: { variant: 'success' as const, icon: CheckCircle, label: t("common.status.approved") },
      REJECTED: { variant: 'destructive' as const, icon: XCircle, label: 'Rejected' },
      REQUIRES_REVISION: { variant: 'warning' as const, icon: AlertCircle, label: 'Needs Revision' },
    }

    const config = statusMap[status as keyof typeof statusMap] || statusMap.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
            <p className="text-muted-foreground">
              Review and approve cost calculations
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  // Only show to Manager role
  if (userRole !== 'MANAGER' && userRole !== 'ADMIN' && userRole !== 'SUPERUSER') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page
            </p>
          </div>
        </div>
      </div>
    )
  }

  const pendingApprovals = approvals.filter(a => a.status === 'PENDING')
  const approvedCount = approvals.filter(a => a.status === 'APPROVED').length
  const rejectedCount = approvals.filter(a => a.status === 'REJECTED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve cost calculations
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            <p className="text-xs text-muted-foreground">
              Require your attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">
              Successfully approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">
              Rejected for revision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                approvals
                  .filter(a => a.costCalculation)
                  .reduce((sum, a) => sum + Number(a.costCalculation!.totalCost), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cost value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              {pendingApprovals.length} cost calculations need your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">
                          {approval.costCalculation?.inquiryItem.name}
                        </h4>
                        <Badge variant="warning">Needs Review</Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>{approval.costCalculation?.inquiryItem.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span>
                            Quantity: {approval.costCalculation?.inquiryItem.quantity} {approval.costCalculation?.inquiryItem.unit}
                          </span>
                          <span>
                            Customer: {approval.costCalculation?.inquiryItem.inquiry.customer.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Material: </span>
                          <span className="font-medium">
                            {formatCurrency(Number(approval.costCalculation?.materialCost || 0))}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Labor: </span>
                          <span className="font-medium">
                            {formatCurrency(Number(approval.costCalculation?.laborCost || 0))}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Overhead: </span>
                          <span className="font-medium">
                            {formatCurrency(Number(approval.costCalculation?.overheadCost || 0))}
                          </span>
                        </div>
                        <div className="font-bold text-lg">
                          <span className="text-muted-foreground">Total: </span>
                          {formatCurrency(Number(approval.costCalculation?.totalCost || 0))}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Calculated by {approval.costCalculation?.calculatedBy.name} on{' '}
                        {formatDate(approval.createdAt)}
                      </div>

                      {approval.costCalculation?.notes && (
                        <div className="p-3 bg-muted rounded text-sm">
                          <strong>Notes:</strong> {approval.costCalculation.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval)
                          setApprovalAction('REJECTED')
                          setApprovalDialogOpen(true)
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedApproval(approval)
                          setApprovalAction('APPROVED')
                          setApprovalDialogOpen(true)
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Approvals</CardTitle>
          <CardDescription>
            {approvals.length} approvals found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="data-table-wrapper">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Inquiry</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Calculated By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvals.map((approval) => (
                  <TableRow key={approval.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {approval.costCalculation?.inquiryItem.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {approval.costCalculation?.inquiryItem.quantity} {approval.costCalculation?.inquiryItem.unit}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">
                          {approval.costCalculation?.inquiryItem.inquiry.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{approval.costCalculation?.inquiryItem.inquiry.customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(Number(approval.costCalculation?.totalCost || 0))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{approval.costCalculation?.calculatedBy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(approval.status)}</TableCell>
                    <TableCell>
                      {approval.approver ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{approval.approver.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {approval.approvedAt ? formatDate(approval.approvedAt) : formatDate(approval.createdAt)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {approvals.length === 0 && (
            <div className="empty-state">
              <CheckSquare className="empty-state-icon" />
              <h3 className="empty-state-title">{t("emptyStates.noApprovalsFound")}</h3>
              <p className="empty-state-description">
                {t("emptyStates.approvalsDescription")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'APPROVED' ? 'Approve' : 'Reject'} Cost Calculation
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'APPROVED' 
                ? 'Approve this cost calculation to proceed with quote generation.'
                : 'Reject this cost calculation and provide feedback for revision.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedApproval && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedApproval.costCalculation?.inquiryItem.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedApproval.costCalculation?.inquiryItem.description}
                </p>
                <div className="mt-2 text-sm">
                  <div>Customer: {selectedApproval.costCalculation?.inquiryItem.inquiry.customer.name}</div>
                  <div>Quantity: {selectedApproval.costCalculation?.inquiryItem.quantity} {selectedApproval.costCalculation?.inquiryItem.unit}</div>
                  <div className="font-bold text-lg mt-2">
                    Total Cost: {formatCurrency(Number(selectedApproval.costCalculation?.totalCost || 0))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">
                  {approvalAction === 'APPROVED' ? 'Comments (Optional)' : 'Reason for Rejection *'}
                </Label>
                <textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    approvalAction === 'APPROVED' 
                      ? 'Add any additional comments...'
                      : 'Please explain why this cost calculation is being rejected...'
                  }
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  required={approvalAction === 'REJECTED'}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApprovalDialogOpen(false)
                setComments('')
                setSelectedApproval(null)
                setApprovalAction(null)
              }}
              disabled={approvalLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => approvalAction && handleApprovalAction(approvalAction)}
              disabled={
                approvalLoading || 
                (approvalAction === 'REJECTED' && !comments.trim())
              }
              variant={approvalAction === 'APPROVED' ? 'default' : 'destructive'}
            >
              {approvalLoading ? t("common.actions.processing") : (
                approvalAction === 'APPROVED' ? 'Approve' : 'Reject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}