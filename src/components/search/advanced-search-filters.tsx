"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  X, 
  Calendar,
  User,
  Building2,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { InquiryStatus, Priority, ItemStatus, UserRole } from '@/types'
import { formatDate } from '@/lib/utils'

interface AdvancedSearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void
  initialFilters?: Partial<SearchFilters>
  entityType: 'inquiries' | 'items' | 'users' | 'customers' | 'quotes' | 'orders'
  className?: string
}

export interface SearchFilters {
  // Common filters
  search?: string
  dateFrom?: Date
  dateTo?: Date
  
  // Inquiry-specific filters
  status?: InquiryStatus[]
  priority?: Priority[]
  assignedToId?: string
  customerId?: string
  hasAttachments?: boolean
  totalValueMin?: number
  totalValueMax?: number
  
  // Item-specific filters
  itemStatus?: ItemStatus[]
  inquiryId?: string
  hasCalculations?: boolean
  
  // User-specific filters
  role?: UserRole[]
  isActive?: boolean
  
  // Advanced filters
  tags?: string[]
  createdById?: string
  lastModifiedDays?: number
  attachmentType?: string[]
}

export function AdvancedSearchFilters({ 
  onFiltersChange, 
  initialFilters = {}, 
  entityType,
  className = "" 
}: AdvancedSearchFiltersProps) {
  const t = useTranslations()
  const tPlaceholders = useTranslations('placeholders')
  const tStatus = useTranslations('status')
  const tPriority = useTranslations('priority')
  const tRoles = useTranslations('roles')
  const tButtons = useTranslations('buttons')
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  // Mock data - in real app, these would come from API
  const [users, setUsers] = useState<Array<{id: string, name: string, role: string}>>([])
  const [customers, setCustomers] = useState<Array<{id: string, name: string}>>([])
  const [inquiries, setInquiries] = useState<Array<{id: string, title: string}>>([])

  useEffect(() => {
    // Count active filters
    let count = 0
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) count++
        else if (typeof value === 'string' && value.trim() !== '') count++
        else if (typeof value === 'number') count++
        else if (typeof value === 'boolean') count++
        else if (value instanceof Date) count++
      }
    })
    setActiveFilterCount(count)
    
    // Notify parent of filter changes
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearAllFilters = () => {
    setFilters({})
  }

  const removeFilter = (key: keyof SearchFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[key]
      return newFilters
    })
  }

  const renderActiveFilters = () => {
    const activeFilters: Array<{ key: keyof SearchFilters; label: string; value: any }> = []
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        let label = key
        let displayValue = value
        
        // Format display values
        if (key === 'dateFrom' || key === 'dateTo') {
          displayValue = formatDate(value as Date)
          label = key === 'dateFrom' ? 'From' : 'To'
        } else if (Array.isArray(value) && value.length > 0) {
          displayValue = `${value.length} selected`
        } else if (key === 'assignedToId' || key === 'createdById') {
          const user = users.find(u => u.id === value)
          displayValue = user?.name || 'Unknown User'
          label = key === 'assignedToId' ? t("actions.assignedTo") : 'Created By'
        } else if (key === 'customerId') {
          const customer = customers.find(c => c.id === value)
          displayValue = customer?.name || 'Unknown Customer'
          label = 'Customer'
        } else if (key === 'inquiryId') {
          const inquiry = inquiries.find(i => i.id === value)
          displayValue = inquiry?.title || 'Unknown Inquiry'
          label = 'Inquiry'
        }
        
        activeFilters.push({ key: key as keyof SearchFilters, label, value: displayValue })
      }
    })

    return activeFilters.map(({ key, label, value }) => (
      <Badge 
        key={key} 
        variant="secondary" 
        className="flex items-center gap-1 text-xs"
      >
        <span className="font-medium">{label}:</span>
        <span>{value}</span>
        <X 
          className="h-3 w-3 cursor-pointer hover:text-red-500" 
          onClick={() => removeFilter(key)}
        />
      </Badge>
    ))
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Search & Filter</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="outline">{activeFilterCount} active</Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-sm"
              >
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  More
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search Input */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="search"
              placeholder={tPlaceholders('search.searchEntity', { entity: entityType })}
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="space-y-2">
            <Label>Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {renderActiveFilters()}
            </div>
          </div>
        )}

        {/* Quick Filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {entityType === 'inquiries' && (
            <>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status?.[0] || ''}
                  onValueChange={(value) => updateFilter('status', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tPlaceholders('filters.allStatuses')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tPlaceholders('filters.allStatuses')}</SelectItem>
                    <SelectItem value="DRAFT">{tStatus('draft')}</SelectItem>
                    <SelectItem value="SUBMITTED">{tStatus('submitted')}</SelectItem>
                    <SelectItem value="ASSIGNED">{tStatus('assigned')}</SelectItem>
                    <SelectItem value="COSTING">{tStatus('costing')}</SelectItem>
                    <SelectItem value="QUOTED">{tStatus('quoted')}</SelectItem>
                    <SelectItem value="APPROVED">{tStatus('approved')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={filters.priority?.[0] || ''}
                  onValueChange={(value) => updateFilter('priority', value ? [value] : [])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tPlaceholders('filters.allPriorities')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{tPlaceholders('filters.allPriorities')}</SelectItem>
                    <SelectItem value="LOW">{tPriority('low')}</SelectItem>
                    <SelectItem value="MEDIUM">{tPriority('medium')}</SelectItem>
                    <SelectItem value="HIGH">{tPriority('high')}</SelectItem>
                    <SelectItem value="URGENT">{tPriority('urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          
          {entityType === 'items' && (
            <div className="space-y-2">
              <Label>Item Status</Label>
              <Select
                value={filters.itemStatus?.[0] || ''}
                onValueChange={(value) => updateFilter('itemStatus', value ? [value] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tPlaceholders('filters.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COSTED">Costed</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex space-x-2">
              <Input
                type="date"
                value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                className="text-sm"
              />
              <Input
                type="date"
                value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                onChange={(e) => updateFilter('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        {/* Advanced Filters (Expanded) */}
        {isExpanded && (
          <div className="space-y-6 border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Attachment Filters */}
              <div className="space-y-3">
                <Label>Attachments</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasAttachments"
                      checked={filters.hasAttachments || false}
                      onCheckedChange={(checked) => updateFilter('hasAttachments', checked)}
                    />
                    <Label htmlFor="hasAttachments" className="text-sm">Has attachments</Label>
                  </div>
                </div>
              </div>

              {/* Value Range */}
              {entityType === 'inquiries' && (
                <div className="space-y-3">
                  <Label>Total Value Range</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min value"
                      value={filters.totalValueMin || ''}
                      onChange={(e) => updateFilter('totalValueMin', e.target.value ? Number(e.target.value) : undefined)}
                    />
                    <Input
                      type="number"
                      placeholder="Max value"
                      value={filters.totalValueMax || ''}
                      onChange={(e) => updateFilter('totalValueMax', e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              )}

              {/* User Role Filter */}
              {entityType === 'users' && (
                <div className="space-y-3">
                  <Label>User Role</Label>
                  <Select
                    value={filters.role?.[0] || ''}
                    onValueChange={(value) => updateFilter('role', value ? [value] : [])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="SUPERUSER">Superuser</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="SALES">Sales</SelectItem>
                      <SelectItem value="VPP">VPP</SelectItem>
                      <SelectItem value="VP">VP</SelectItem>
                      <SelectItem value="TECH">Tech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Recent Activity */}
              <div className="space-y-3">
                <Label>Recent Activity</Label>
                <Select
                  value={filters.lastModifiedDays?.toString() || ''}
                  onValueChange={(value) => updateFilter('lastModifiedDays', value ? Number(value) : undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any time</SelectItem>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="7">Last week</SelectItem>
                    <SelectItem value="30">Last month</SelectItem>
                    <SelectItem value="90">Last 3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}