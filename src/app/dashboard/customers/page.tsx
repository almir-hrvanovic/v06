'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Building2, 
  Search, 
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  Edit,
  Trash2,
  Globe
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  website: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    inquiries: number
  }
}

export default function CustomersPage() {
  const { user } = useAuth()
  const t = useTranslations()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: ''
  })

  const userRole = user?.role

  useEffect(() => {
    fetchCustomers()
  }, [searchTerm])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/customers?${params}`)
      if (!response.ok) throw new Error('Failed to fetch customers')
      
      const data = await response.json()
      setCustomers(data.data || [])
    } catch (error) {
      console.error('Failed to fetch customers:', error)
      toast.error(t('messages.error.failedToLoad'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to create customer')
      
      toast.success(t('customers.messages.created'))
      setIsCreateOpen(false)
      resetForm()
      fetchCustomers()
    } catch (error) {
      console.error('Failed to create customer:', error)
      toast.error(t('customers.messages.createFailed'))
    }
  }

  const handleUpdate = async () => {
    if (!selectedCustomer) return
    
    try {
      const response = await fetch(`/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) throw new Error('Failed to update customer')
      
      toast.success(t('customers.messages.updated'))
      setIsEditOpen(false)
      resetForm()
      fetchCustomers()
    } catch (error) {
      console.error('Failed to update customer:', error)
      toast.error(t('customers.messages.updateFailed'))
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('customers.messages.confirmDeactivate'))) return
    
    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to deactivate customer')
      
      toast.success(t('customers.messages.deactivated'))
      fetchCustomers()
    } catch (error) {
      console.error('Failed to deactivate customer:', error)
      toast.error(t('customers.messages.deactivateFailed'))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      website: ''
    })
    setSelectedCustomer(null)
  }

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer)
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      website: customer.website || ''
    })
    setIsEditOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('pages.customers.title')}</h1>
            <p className="text-muted-foreground">
              {t('pages.customers.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">{t('customers.loading')}</div>
        </div>
      </div>
    )
  }

  // Only show to authorized roles
  if (!['SUPERUSER', 'ADMIN', 'SALES'].includes(userRole || '')) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('pages.customers.title')}</h1>
            <p className="text-muted-foreground">
              {t('auth.errors.unauthorized')}
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
          <h1 className="text-3xl font-bold tracking-tight">{t('pages.customers.title')}</h1>
          <p className="text-muted-foreground">
            {t('pages.customers.subtitle')}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('customers.actions.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('customers.form.create.title')}</DialogTitle>
              <DialogDescription>
                {t('customers.form.create.subtitle')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('common.labels.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('customers.form.fields.namePlaceholder')}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t('common.labels.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('customers.form.fields.emailPlaceholder')}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t('common.labels.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('customers.form.fields.phonePlaceholder')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">{t('customers.form.fields.website')}</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder={t('customers.form.fields.websitePlaceholder')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">{t('common.labels.address')}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('customers.form.fields.addressPlaceholder')}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t('common.actions.cancel')}
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name || !formData.email}>
                {t('customers.actions.create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('customers.stats.total')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('customers.stats.active')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('customers.stats.withInquiries')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c._count && c._count.inquiries > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('common.time.thisMonth')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => {
                const date = new Date(c.createdAt)
                const now = new Date()
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>{t('customers.search.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t('customers.search.placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('customers.list.title')}</CardTitle>
          <CardDescription>
            {t('customers.list.count', { count: customers.length })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('customers.table.customer')}</TableHead>
                  <TableHead>{t('customers.table.contact')}</TableHead>
                  <TableHead>{t('customers.table.inquiries')}</TableHead>
                  <TableHead>{t('common.labels.status')}</TableHead>
                  <TableHead>{t('common.labels.created')}</TableHead>
                  <TableHead className="text-right">{t('common.labels.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        {customer.website && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Globe className="mr-1 h-3 w-3" />
                            {customer.website}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="mr-1 h-3 w-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t('customers.table.inquiriesCount', { count: customer._count?.inquiries || 0 })}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.isActive ? 'success' : 'secondary'}>
                        {customer.isActive ? t('status.active') : t('status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(customer.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {customers.length === 0 && (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('customers.empty.title')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? t('customers.empty.adjustFilters')
                  : t('customers.empty.createFirst')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('customers.form.edit.title')}</DialogTitle>
            <DialogDescription>
              {t('customers.form.edit.subtitle')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">{t('common.labels.name')} *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('customers.form.fields.namePlaceholder')}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">{t('common.labels.email')} *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('customers.form.fields.emailPlaceholder')}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">{t('common.labels.phone')}</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('customers.form.fields.phonePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-website">{t('customers.form.fields.website')}</Label>
              <Input
                id="edit-website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder={t('customers.form.fields.websitePlaceholder')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address">{t('common.labels.address')}</Label>
              <Textarea
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t('customers.form.fields.addressPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t('common.actions.cancel')}
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name || !formData.email}>
              {t('customers.actions.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}