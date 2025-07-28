'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
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
import { 
  Calculator, 
  DollarSign, 
  FileText, 
  Building2,
  User,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { CostCalculationWithRelations, InquiryItemWithRelations, ItemStatus } from '@/types'

export default function CostsPage() {
  const t = useTranslations()
  const { data: session } = useSession()
  const [costCalculations, setCostCalculations] = useState<CostCalculationWithRelations[]>([])
  const [assignedItems, setAssignedItems] = useState<InquiryItemWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InquiryItemWithRelations | null>(null)
  const [createLoading, setCreateLoading] = useState(false)
  
  // Form state
  const [materialCost, setMaterialCost] = useState('')
  const [laborCost, setLaborCost] = useState('')
  const [overheadCost, setOverheadCost] = useState('')
  const [notes, setNotes] = useState('')

  const userRole = session?.user?.role

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      const [costsResponse, itemsResponse] = await Promise.all([
        apiClient.getCostCalculations(),
        userRole === 'VP' ? apiClient.getInquiryItems({ 
          assignedToId: session?.user?.id,
          status: 'ASSIGNED,IN_PROGRESS' 
        }) : Promise.resolve({ data: [] })
      ]) as any

      setCostCalculations(costsResponse.data)
      setAssignedItems(itemsResponse.data.filter((item: InquiryItemWithRelations) => 
        !item.costCalculation
      ))
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCostCalculation = async () => {
    if (!selectedItem) return

    try {
      setCreateLoading(true)
      
      await apiClient.createCostCalculation({
        inquiryItemId: selectedItem.id,
        materialCost: parseFloat(materialCost),
        laborCost: parseFloat(laborCost),
        overheadCost: parseFloat(overheadCost),
        notes: notes || undefined
      })

      // Reset form
      setMaterialCost('')
      setLaborCost('')
      setOverheadCost('')
      setNotes('')
      setSelectedItem(null)
      setCreateDialogOpen(false)
      
      // Refresh data
      await fetchData()
      
      alert('Cost calculation created successfully!')
    } catch (error) {
      console.error('Failed to create cost calculation:', error)
      alert('Failed to create cost calculation. Please try again.')
    } finally {
      setCreateLoading(false)
    }
  }

  const calculateTotal = () => {
    const material = parseFloat(materialCost) || 0
    const labor = parseFloat(laborCost) || 0
    const overhead = parseFloat(overheadCost) || 0
    return material + labor + overhead
  }

  const getApprovalStatus = (costCalc: CostCalculationWithRelations) => {
    if (costCalc.isApproved) {
      return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
    }
    
    const latestApproval = costCalc.approvals[0]
    if (latestApproval) {
      if (latestApproval.status === 'PENDING') {
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      } else if (latestApproval.status === 'REJECTED') {
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      }
    }
    
    return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Awaiting Review</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cost Calculations</h1>
            <p className="text-muted-foreground">
              Manage and review cost calculations for inquiry items
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Calculations</h1>
          <p className="text-muted-foreground">
            Manage and review cost calculations for inquiry items
          </p>
        </div>
        {userRole === 'VP' && assignedItems.length > 0 && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Calculate Costs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Cost Calculation</DialogTitle>
                <DialogDescription>
                  Calculate material, labor, and overhead costs for an assigned item.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="item">Select Item</Label>
                  <select
                    id="item"
                    value={selectedItem?.id || ''}
                    onChange={(e) => {
                      const item = assignedItems.find(i => i.id === e.target.value)
                      setSelectedItem(item || null)
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Choose an item...</option>
                    {assignedItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.inquiry.customer.name} ({item.quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedItem && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium">{selectedItem.name}</h4>
                    <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span>Quantity: {selectedItem.quantity} {selectedItem.unit}</span>
                      <span>Customer: {selectedItem.inquiry.customer.name}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="materialCost">Material Cost ($)</Label>
                    <Input
                      id="materialCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={materialCost}
                      onChange={(e) => setMaterialCost(e.target.value)}
                      placeholder={t("forms.placeholders.zeroAmount")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="laborCost">Labor Cost ($)</Label>
                    <Input
                      id="laborCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={laborCost}
                      onChange={(e) => setLaborCost(e.target.value)}
                      placeholder={t("forms.placeholders.zeroAmount")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overheadCost">Overhead Cost ($)</Label>
                    <Input
                      id="overheadCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={overheadCost}
                      onChange={(e) => setOverheadCost(e.target.value)}
                      placeholder={t("forms.placeholders.zeroAmount")}
                    />
                  </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Cost:</span>
                    <span className="text-2xl font-bold">
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("forms.placeholders.costNotes")}
                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCostCalculation}
                  disabled={!selectedItem || calculateTotal() === 0 || createLoading}
                >
                  {createLoading ? t("common.actions.creating") : t("actions.createCostCalculation")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("forms.headers.totalCalculations")}</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costCalculations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("forms.headers.approved")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costCalculations.filter(c => c.isApproved).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("forms.headers.pendingApproval")}</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costCalculations.filter(c => !c.isApproved).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("forms.headers.totalValue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                costCalculations.reduce((sum, c) => sum + Number(c.totalCost), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Items (for VPs) */}
      {userRole === 'VP' && assignedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items Awaiting Cost Calculation</CardTitle>
            <CardDescription>
              {assignedItems.length} items assigned to you need cost calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assignedItems.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span>{item.quantity} {item.unit}</span>
                        <span>{item.inquiry.customer.name}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item)
                        setCreateDialogOpen(true)
                      }}
                    >
                      Calculate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Calculations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Calculations</CardTitle>
          <CardDescription>
            {costCalculations.length} cost calculations found
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
                  <TableHead>Material</TableHead>
                  <TableHead>Labor</TableHead>
                  <TableHead>Overhead</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Calculated By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costCalculations.map((costCalc) => (
                  <TableRow key={costCalc.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{costCalc.inquiryItem.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {costCalc.inquiryItem.quantity} {costCalc.inquiryItem.unit}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">
                          {costCalc.inquiryItem.inquiry.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{costCalc.inquiryItem.inquiry.customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(Number(costCalc.materialCost))}</TableCell>
                    <TableCell>{formatCurrency(Number(costCalc.laborCost))}</TableCell>
                    <TableCell>{formatCurrency(Number(costCalc.overheadCost))}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(Number(costCalc.totalCost))}
                      </span>
                    </TableCell>
                    <TableCell>{getApprovalStatus(costCalc)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{costCalc.calculatedBy.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(costCalc.createdAt)}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {costCalculations.length === 0 && (
            <div className="empty-state">
              <Calculator className="empty-state-icon" />
              <h3 className="empty-state-title">{t("emptyStates.noCostCalculationsFound")}</h3>
              <p className="empty-state-description">
                {userRole === 'VP'
                  ? 'Start by calculating costs for your assigned items.'
                  : 'Cost calculations will appear here once VPs begin their work.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}