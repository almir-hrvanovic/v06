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
import { Search, Filter, X } from 'lucide-react'
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
}

export function AssignmentFilters({ 
  customers, 
  inquiries, 
  onFilterChange,
  className 
}: AssignmentFiltersProps) {
  const t = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    customerId: '',
    inquiryId: '',
    priority: '',
    search: '',
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Convert empty strings to undefined for the callback
    const callbackFilters = Object.entries(newFilters).reduce((acc, [k, v]) => {
      if (v) acc[k as keyof typeof filters] = v as any
      return acc
    }, {} as any)
    
    onFilterChange(callbackFilters)
  }

  const clearFilters = () => {
    setFilters({
      customerId: '',
      inquiryId: '',
      priority: '',
      search: '',
    })
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some(v => v)

  return (
    <div className={cn("space-y-2", className)}>
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
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
          Filters
          {hasActiveFilters && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full h-4 w-4 text-xs flex items-center justify-center">
              {Object.values(filters).filter(v => v).length}
            </span>
          )}
        </Button>
      </div>

      {/* Expandable Filters */}
      {isExpanded && (
        <div className="flex gap-2 items-end">
          <Select
            value={filters.customerId}
            onValueChange={(value) => handleFilterChange('customerId', value)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t("placeholders.allCustomers")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Customers</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.inquiryId}
            onValueChange={(value) => handleFilterChange('inquiryId', value)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t("placeholders.allInquiries")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Inquiries</SelectItem>
              {inquiries.map((inquiry) => (
                <SelectItem key={inquiry.id} value={inquiry.id}>
                  {inquiry.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority}
            onValueChange={(value) => handleFilterChange('priority', value)}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder={t("placeholders.allPriorities")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value=" ">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  )
}