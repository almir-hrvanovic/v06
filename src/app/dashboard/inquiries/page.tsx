'use client'

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { getPriorityBadge } from '@/lib/priority-utils'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Edit,
  Clock,
  User,
  Building2,
  ChevronDown,
  ChevronRight,
  Package,
  UserPlus,
  Loader2
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { formatWithSystemCurrency } from '@/lib/currency-helpers'
import { apiClient } from '@/lib/api-client'
import { InquiryWithRelations, InquiryStatus, Priority } from '@/types'
// import { ExcelExportButton } from '@/components/excel/excel-export-button'
import { MobileTable } from '@/components/mobile/mobile-table'
import { useTranslations } from 'next-intl'
import { getCachedCustomers } from '@/lib/customers-cache'

// Lazy load components
const AssignItemDialog = lazy(() => 
  import('@/components/inquiries/assign-item-dialog').then(mod => ({ 
    default: mod.AssignItemDialog 
  }))
)

const InquiryItemsRow = lazy(() => 
  import('@/components/inquiries/inquiry-items-row').then(mod => ({ 
    default: mod.InquiryItemsRow 
  }))
)

export default function InquiriesPage() {
  const t = useTranslations()
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [inquiries, setInquiries] = useState<InquiryWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const userRole = user?.role

  useEffect(() => {
    let isMounted = true
    
    const loadCustomers = async () => {
      if (isLoading || !user) {
        return
      }
      
      try {
        const customers = await getCachedCustomers()
        if (isMounted) {
          setCustomers(customers)
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error)
        if (isMounted) {
          setCustomers([])
        }
      }
    }
    
    loadCustomers()
    
    return () => {
      isMounted = false
    }
  }, [user, isLoading])

  useEffect(() => {
    let isMounted = true
    
    const loadInquiries = async () => {
      if (isLoading || !user) {
        return
      }
      
      try {
        // Use filterLoading for subsequent loads, loading only for initial load
        if (inquiries.length === 0) {
          setLoading(true)
        } else {
          setFilterLoading(true)
        }
        
        const params = new URLSearchParams()
        
        if (debouncedSearchTerm) params.append('search', debouncedSearchTerm)
        if (statusFilter) params.append('status', statusFilter)
        if (priorityFilter) params.append('priority', priorityFilter)
        if (customerFilter) params.append('customerId', customerFilter)
        params.append('limit', '20')

        const response = await apiClient.getInquiries(Object.fromEntries(params))
        
        if (isMounted) {
          // Handle both direct array and wrapped response formats
          const responseData = response as any
          setInquiries(Array.isArray(responseData) ? responseData : responseData.inquiries || responseData.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch inquiries:', error)
        if (isMounted) {
          setInquiries([])
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          setFilterLoading(false)
        }
      }
    }
    
    loadInquiries()
    
    return () => {
      isMounted = false
    }
  }, [user, isLoading, debouncedSearchTerm, statusFilter, priorityFilter, customerFilter])

  const refreshInquiries = async () => {
    if (isLoading || !user) {
      return
    }
    
    try {
      setFilterLoading(true)
      const params = new URLSearchParams()
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priority', priorityFilter)
      if (customerFilter) params.append('customerId', customerFilter)
      params.append('limit', '20')

      const response = await apiClient.getInquiries(Object.fromEntries(params))
      // Handle both direct array and wrapped response formats
      const responseData = response as any
      setInquiries(Array.isArray(responseData) ? responseData : responseData.inquiries || responseData.data || [])
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
      setInquiries([])
    } finally {
      setFilterLoading(false)
    }
  }

  const getStatusBadge = (status: InquiryStatus) => {
    const statusMap = {
      DRAFT: { variant: 'secondary' as const, label: t('inquiries.status.draft') },
      SUBMITTED: { variant: 'warning' as const, label: t('inquiries.status.submitted') },
      IN_REVIEW: { variant: 'info' as const, label: t('inquiries.status.inReview') },
      ASSIGNED: { variant: 'info' as const, label: t('inquiries.status.assigned') },
      COSTING: { variant: 'warning' as const, label: t('inquiries.status.costing') },
      QUOTED: { variant: 'success' as const, label: t('inquiries.status.quoted') },
      APPROVED: { variant: 'success' as const, label: t('inquiries.status.approved') },
      REJECTED: { variant: 'destructive' as const, label: t('inquiries.status.rejected') },
      CONVERTED: { variant: 'success' as const, label: t('inquiries.status.converted') },
    }

    const { variant, label } = statusMap[status]
    return <Badge variant={variant}>{label}</Badge>
  }


  const toggleRowExpanded = useCallback((inquiryId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(inquiryId)) {
        newSet.delete(inquiryId)
      } else {
        newSet.add(inquiryId)
      }
      return newSet
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('pages.inquiries.title')}</h1>
            <p className="text-muted-foreground">
              {t('pages.inquiries.subtitle')}
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">{t('pages.inquiries.title')}</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            {t('pages.inquiries.subtitle')}
          </p>
        </div>
        {(userRole === 'SALES' || userRole === 'ADMIN' || userRole === 'SUPERUSER') && (
          <Button 
            onClick={() => router.push('/dashboard/inquiries/new')}
            className="ml-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('inquiries.actions.create')}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('inquiries.inquiryStats.totalInquiries')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inquiries.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('inquiries.inquiryStats.unassignedItems')}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inquiries.reduce((total, inquiry: any) => 
                total + (inquiry.unassignedItemsCount || 0), 0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('inquiries.inquiryStats.highPriority')}</CardTitle>
            <FileText className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inquiries.filter(i => ['HIGH', 'URGENT'].includes(i.priority)).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('inquiries.inquiryStats.thisMonth')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inquiries.filter(i => {
                const date = new Date(i.createdAt)
                const now = new Date()
                return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('inquiries.filters.title')}</CardTitle>
            {filterLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.actions.loading')}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* All Filters in one row - responsive grid: 1 col mobile, 2 col sm, 3 col md, 4 col lg+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={t('inquiries.filters.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            {/* Customer Filter */}
            <select
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm w-full bg-background text-foreground border-input"
            >
              <option value="">{t('inquiries.filters.allCustomers')}</option>
              {(Array.isArray(customers) ? customers : []).map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InquiryStatus | '')}
              className="px-3 py-2 border rounded-md text-sm w-full bg-background text-foreground border-input"
            >
              <option value="">{t('inquiries.filters.allStatuses')}</option>
              <option value="DRAFT">{t('inquiries.status.draft')}</option>
              <option value="SUBMITTED">{t('inquiries.status.submitted')}</option>
              <option value="IN_REVIEW">{t('inquiries.status.inReview')}</option>
              <option value="ASSIGNED">{t('inquiries.status.assigned')}</option>
              <option value="COSTING">{t('inquiries.status.costing')}</option>
              <option value="QUOTED">{t('inquiries.status.quoted')}</option>
              <option value="APPROVED">{t('inquiries.status.approved')}</option>
              <option value="REJECTED">{t('inquiries.status.rejected')}</option>
              <option value="CONVERTED">{t('inquiries.status.converted')}</option>
            </select>
            
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
              className="px-3 py-2 border rounded-md text-sm w-full bg-background text-foreground border-input"
            >
              <option value="">{t('inquiries.filters.allPriorities')}</option>
              <option value="LOW">{t('inquiries.priority.low')}</option>
              <option value="MEDIUM">{t('inquiries.priority.medium')}</option>
              <option value="HIGH">{t('inquiries.priority.high')}</option>
              <option value="URGENT">{t('inquiries.priority.urgent')}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('inquiries.list.title')}</CardTitle>
          <CardDescription>
            {t('inquiries.list.count', { count: inquiries.length })} | Expanded: {expandedRows.size}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 lg:p-6">
          {/* Desktop Table - Show on lg screens and up */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto relative">
              {filterLoading && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('inquiries.table.title')}</TableHead>
                  <TableHead>{t('inquiries.table.customer')}</TableHead>
                  <TableHead>{t('inquiries.table.status')}</TableHead>
                  <TableHead>{t('inquiries.table.priority')}</TableHead>
                  <TableHead>{t('inquiries.table.items')}</TableHead>
                  <TableHead>{t('inquiries.table.created')}</TableHead>
                  <TableHead>{t('inquiries.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => {
                  const isExpanded = expandedRows.has(inquiry.id)
                  return (
                    <React.Fragment key={inquiry.id}>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30"
                        onClick={() => toggleRowExpanded(inquiry.id)}
                      >
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleRowExpanded(inquiry.id)
                              }}
                              className="mt-1 p-1 cursor-pointer hover:bg-muted rounded"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium">{inquiry.title}</div>
                              {inquiry.description && (
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                  {inquiry.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{inquiry.customer.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                        <TableCell>{getPriorityBadge(inquiry.priority, t(`inquiries.priority.${inquiry.priority.toLowerCase()}`))}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{t('inquiries.table.itemsCount', { count: (inquiry as any).itemsCount || 0 })}</div>
                            <div className="text-muted-foreground">
                              {t('inquiries.table.assignedCount', { count: (inquiry as any).assignedItemsCount || 0 })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDate(inquiry.createdAt)}</div>
                            <div className="text-muted-foreground">
                              {t('common.labels.by')} {inquiry.createdBy.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Link href={`/dashboard/inquiries/${inquiry.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                {t('buttons.view')}
                              </Link>
                            </Button>
                            {(userRole === 'SALES' || userRole === 'ADMIN' || userRole === 'SUPERUSER' || userRole === 'VPP') && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Link href={`/dashboard/inquiries/${inquiry.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  {t('buttons.edit')}
                                </Link>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="bg-muted/40 dark:bg-muted/20 p-4">
                              <Suspense fallback={
                                <div className="flex items-center justify-center p-8">
                                  <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                              }>
                                <InquiryItemsRow 
                                  inquiryId={inquiry.id} 
                                  onAssignItem={(item) => {
                                    setSelectedItem(item)
                                    setAssignDialogOpen(true)
                                  }}
                                />
                              </Suspense>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          </div>

          {/* Mobile Table - Show on screens smaller than lg */}
          <div className="block lg:hidden p-4 relative">
            {filterLoading && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            <MobileTable 
              inquiries={inquiries}
              isLoading={loading}
            />
          </div>

          {inquiries.length === 0 && (
            <div className="empty-state">
              <FileText className="empty-state-icon" />
              <h3 className="empty-state-title">{t('inquiries.empty.title')}</h3>
              <p className="empty-state-description">
                {searchTerm || statusFilter || priorityFilter
                  ? t('inquiries.empty.adjustFilters')
                  : t('inquiries.empty.createFirst')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Item Dialog */}
      {selectedItem && (
        <Suspense fallback={null}>
          <AssignItemDialog
            isOpen={assignDialogOpen}
            onClose={() => {
              setAssignDialogOpen(false)
              setSelectedItem(null)
            }}
            item={selectedItem}
            onAssigned={refreshInquiries}
          />
        </Suspense>
      )}
    </div>
  )
}