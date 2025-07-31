'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'
import { Customer, Inquiry, Priority } from '@/types'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface AssignmentFiltersProps {
  customers: Customer[]
  inquiries: Inquiry[]
  onFilterChange: (filters: {
    customerId?: string
    inquiryId?: string
    priority?: Priority
    search?: string
  }) => void
  className?: string
  defaultExpanded?: boolean
}

export function AssignmentFilters({ 
  customers, 
  inquiries, 
  onFilterChange,
  className,
  defaultExpanded = false 
}: AssignmentFiltersProps) {
  const t = useTranslations()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [filters, setFilters] = useState({
    customerId: '',
    inquiryId: '',
    priority: '',
    search: '',
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Convert empty strings and "all" to undefined for the callback
    const callbackFilters = Object.entries(newFilters).reduce((acc, [k, v]) => {
      if (v && v.trim() !== '' && v !== 'all') acc[k as keyof typeof newFilters] = v as any
      return acc
    }, {} as any)
    
    onFilterChange(callbackFilters)
  }

  const hasActiveFilters = Object.values(filters).some(v => v && v.trim() !== '' && v !== 'all')

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("placeholders.searchItems")}
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Button
          variant={isExpanded ? "secondary" : "outline"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-9"
        >
          <Filter className="h-4 w-4 mr-1" />
          {t("common.actions.filter")}
          {hasActiveFilters && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full h-4 w-4 text-xs flex items-center justify-center">
              {Object.values(filters).filter(v => v && v.trim() !== '' && v !== 'all').length}
            </span>
          )}
        </Button>
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="flex gap-2 items-center">
          <Select
            value={filters.customerId || 'all'}
            onValueChange={(value) => handleFilterChange('customerId', value)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t("placeholders.allCustomers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("placeholders.allCustomers")}</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.inquiryId || 'all'}
            onValueChange={(value) => handleFilterChange('inquiryId', value)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t("placeholders.allInquiries")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("placeholders.allInquiries")}</SelectItem>
              {inquiries.map((inquiry) => (
                <SelectItem key={inquiry.id} value={inquiry.id}>
                  {inquiry.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority || 'all'}
            onValueChange={(value) => handleFilterChange('priority', value)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t("placeholders.allPriorities")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("placeholders.allPriorities")}</SelectItem>
              <SelectItem value="LOW">{t("common.priority.low")}</SelectItem>
              <SelectItem value="MEDIUM">{t("common.priority.medium")}</SelectItem>
              <SelectItem value="HIGH">{t("common.priority.high")}</SelectItem>
              <SelectItem value="URGENT">{t("common.priority.urgent")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}