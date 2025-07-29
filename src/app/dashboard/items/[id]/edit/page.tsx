"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatWithSystemCurrency } from '@/lib/currency-helpers'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

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
  } | null
}

interface User {
  id: string
  name: string
  role: string
}

export default function ItemEditPage() {
  const t = useTranslations()
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [item, setItem] = useState<InquiryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vpUsers, setVpUsers] = useState<User[]>([])
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    unit: '',
    status: '',
    notes: '',
    requestedDelivery: '',
    assignedToId: ''
  })

  // Cost calculation form state
  const [costData, setCostData] = useState({
    materialCost: 0,
    laborCost: 0,
    overheadCost: 0,
    notes: ''
  })

  const itemId = params.id as string
  const userRole = session?.user?.role

  useEffect(() => {
    if (itemId) {
      fetchItem()
      fetchVpUsers()
    }
  }, [itemId])

  const fetchItem = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/items/${itemId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch item: ${response.statusText}`)
      }
      
      const data = await response.json()
      setItem(data)
      
      // Initialize form with existing data
      setFormData({
        name: data.name,
        description: data.description || '',
        quantity: data.quantity,
        unit: data.unit || '',
        status: data.status,
        notes: data.notes || '',
        requestedDelivery: data.requestedDelivery ? new Date(data.requestedDelivery).toISOString().split('T')[0] : '',
        assignedToId: data.assignedTo?.id || 'unassigned'
      })

      // Initialize cost data if exists
      if (data.costCalculation) {
        setCostData({
          materialCost: data.costCalculation.materialCost,
          laborCost: data.costCalculation.laborCost,
          overheadCost: data.costCalculation.overheadCost,
          notes: data.costCalculation.notes || ''
        })
      }
    } catch (err: any) {
      console.error('Failed to fetch item:', err)
      toast.error(err.message || 'Failed to load item')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const fetchVpUsers = async () => {
    try {
      // Fetch both VP and VPP users
      const [vpResponse, vppResponse] = await Promise.all([
        fetch('/api/users?role=VP'),
        fetch('/api/users?role=VPP')
      ])
      
      if (vpResponse.ok && vppResponse.ok) {
        const vpData = await vpResponse.json()
        const vppData = await vppResponse.json()
        // Combine and sort by name
        const allUsers = [...(vpData || []), ...(vppData || [])]
        allUsers.sort((a, b) => a.name.localeCompare(b.name))
        setVpUsers(allUsers)
      }
    } catch (error) {
      console.error('Failed to fetch VP/VPP users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity),
          requestedDelivery: formData.requestedDelivery || null,
          assignedToId: formData.assignedToId === 'unassigned' ? null : formData.assignedToId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update item')
      }

      toast.success('Item updated successfully')

      router.push(`/dashboard/items/${itemId}`)
    } catch (error) {
      console.error('Failed to update item:', error)
      toast.error('Failed to update item')
    } finally {
      setSaving(false)
    }
  }

  const handleCostSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const totalCost = Number(costData.materialCost) + Number(costData.laborCost) + Number(costData.overheadCost)
      
      const response = await fetch(`/api/costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inquiryItemId: itemId,
          materialCost: Number(costData.materialCost),
          laborCost: Number(costData.laborCost),
          overheadCost: Number(costData.overheadCost),
          totalCost,
          notes: costData.notes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save cost calculation')
      }

      toast.success('Cost calculation saved successfully')

      router.push(`/dashboard/items/${itemId}`)
    } catch (error) {
      console.error('Failed to save cost calculation:', error)
      toast.error('Failed to save cost calculation')
    } finally {
      setSaving(false)
    }
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

  if (!item) {
    return null
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
            <h1 className="text-3xl font-bold tracking-tight">Edit Item</h1>
            <p className="text-muted-foreground">
              {item.name} - {item.inquiry.title}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Item Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
            <CardDescription>
              Update the item information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder={t("forms.placeholders.unitExample")}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COSTED">Costed</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(userRole === 'VPP' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
                <div>
                  <Label htmlFor="assignedTo">Assign to VP</Label>
                  <Select
                    value={formData.assignedToId || undefined}
                    onValueChange={(value) => setFormData({ ...formData, assignedToId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("placeholders.selectVP")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {vpUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="requestedDelivery">Requested Delivery Date</Label>
                <Input
                  id="requestedDelivery"
                  type="date"
                  value={formData.requestedDelivery}
                  onChange={(e) => setFormData({ ...formData, requestedDelivery: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {item.priceEstimation && (
                <div>
                  <Label>Price Estimation</Label>
                  <div className="text-lg font-semibold">
                    {formatWithSystemCurrency(item.priceEstimation)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sales price estimation for forecasting
                  </p>
                </div>
              )}

              <Button type="submit" disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? t("common.status.saving") : t("actions.saveChanges")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cost Calculation Form */}
        {(userRole === 'VP' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
          <Card>
            <CardHeader>
              <CardTitle>Cost Calculation</CardTitle>
              <CardDescription>
                {item.costCalculation ? 'Update cost breakdown' : 'Add cost breakdown for this item'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCostSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="materialCost">Material Cost</Label>
                  <Input
                    id="materialCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={costData.materialCost}
                    onChange={(e) => setCostData({ ...costData, materialCost: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="laborCost">Labor Cost</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={costData.laborCost}
                    onChange={(e) => setCostData({ ...costData, laborCost: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="overheadCost">Overhead Cost</Label>
                  <Input
                    id="overheadCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={costData.overheadCost}
                    onChange={(e) => setCostData({ ...costData, overheadCost: Number(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label>Total Cost</Label>
                  <div className="text-2xl font-bold text-green-600">
                    {formatWithSystemCurrency(Number(costData.materialCost) + Number(costData.laborCost) + Number(costData.overheadCost))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="costNotes">Calculation Notes</Label>
                  <Textarea
                    id="costNotes"
                    value={costData.notes}
                    onChange={(e) => setCostData({ ...costData, notes: e.target.value })}
                    rows={3}
                    placeholder={t("forms.placeholders.calculationNotes")}
                  />
                </div>

                <Button type="submit" disabled={saving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? t("common.status.saving") : item.costCalculation ? t("actions.updateCostCalculation") : t("actions.saveCostCalculation")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}