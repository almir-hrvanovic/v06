'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useAssignmentsData } from '@/hooks/use-assignments-data'
import { useSidebar } from '@/contexts/sidebar-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableView } from '@/components/assignments/table-view'
import { DndView } from '@/components/assignments/dnd-view'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Table, Grip, RefreshCw, Search, Filter, RotateCcw, Save } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

type ViewMode = 'table' | 'dnd'

export default function UnifiedAssignmentsPage() {
  const { user } = useAuth()
  const t = useTranslations()
  const { setIsCollapsed, setIsMobileOpen } = useSidebar()
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState({
    customerId: '',
    inquiryId: '',
    priority: '',
    search: '',
  })
  const [dndHasChanges, setDndHasChanges] = useState(false)
  
  // Refs for DnD view functions
  const dndResetRef = useRef<(() => void) | null>(null)
  const dndApplyRef = useRef<(() => void) | null>(null)
  
  const {
    items,
    users,
    customers,
    inquiries,
    loading,
    refreshing,
    filters,
    setFilters,
    refresh,
    assignItems,
    filteredItems,
    unassignedItems,
    assignedItems,
    userWorkloads
  } = useAssignmentsData()

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('assignments-view-mode') as ViewMode
    if (savedMode && ['table', 'dnd'].includes(savedMode)) {
      setViewMode(savedMode)
    }
  }, [])

  // Save view mode preference and handle sidebar
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('assignments-view-mode', mode)
    
    // Close sidebar when entering DnD mode for more space
    if (mode === 'dnd') {
      setIsCollapsed(true)
      setIsMobileOpen(false)
    }
  }

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    
    // Convert empty strings and "all" to undefined for the callback
    const callbackFilters = Object.entries(newFilters).reduce((acc, [k, v]) => {
      if (v && v.trim() !== '' && v !== 'all') acc[k as keyof typeof newFilters] = v as any
      return acc
    }, {} as any)
    
    setFilters(callbackFilters)
  }

  const hasActiveFilters = Object.values(localFilters).some(v => v && v.trim() !== '' && v !== 'all')

  if (!user) {
    return null
  }

  // Check permissions
  const canAssign = ['VPP', 'ADMIN', 'SUPERUSER'].includes(user.role)
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('assignments.title')}</h1>
          <p className="text-muted-foreground">
            {t('assignments.description')}
          </p>
        </div>
        <Button
          onClick={refresh}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {t('common.refresh')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('assignments.totalItems')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('assignments.unassigned')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unassignedItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('assignments.assigned')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {t('assignments.activeUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and View Mode Controls */}
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          {/* View Mode Switch */}
          <Tabs value={viewMode} onValueChange={(v) => handleViewModeChange(v as ViewMode)} className="mr-2">
            <TabsList className="grid grid-cols-2 h-9">
              <TabsTrigger value="table" className="flex items-center gap-1 text-xs px-3">
                <Table className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('assignments.tableView')}</span>
              </TabsTrigger>
              <TabsTrigger value="dnd" className="flex items-center gap-1 text-xs px-3">
                <Grip className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('assignments.dragDropView')}</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Reset and Apply Buttons (DnD mode only) */}
          {viewMode === 'dnd' && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => dndResetRef.current?.()}
                disabled={!dndHasChanges}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {t('common.actions.reset')}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-9"
                onClick={() => dndApplyRef.current?.()}
                disabled={!dndHasChanges}
              >
                <Save className="h-4 w-4 mr-1" />
                {t('common.actions.apply')}
              </Button>
            </>
          )}

          {/* Search Bar */}
          <div className="relative flex-1 transition-all duration-200">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("placeholders.searchItems")}
              value={localFilters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Filter Button */}
          <Button
            variant={isFilterExpanded ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="h-9"
          >
            <Filter className="h-4 w-4 mr-1" />
            {t("common.actions.filter")}
            {hasActiveFilters && (
              <span className="ml-1 bg-primary text-primary-foreground rounded-full h-4 w-4 text-xs flex items-center justify-center">
                {Object.values(localFilters).filter(v => v && v.trim() !== '' && v !== 'all').length}
              </span>
            )}
          </Button>
        </div>

        {/* Expandable Filters */}
        {isFilterExpanded && (
          <div className="flex gap-2 items-center animate-in slide-in-from-top-2 duration-200">
            <Select
              value={localFilters.customerId || 'all'}
              onValueChange={(value) => handleFilterChange('customerId', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={t("placeholders.allCustomers")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={localFilters.inquiryId || 'all'}
              onValueChange={(value) => handleFilterChange('inquiryId', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={t("placeholders.allInquiries")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                {inquiries.map((inquiry) => (
                  <SelectItem key={inquiry.id} value={inquiry.id}>
                    {inquiry.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={localFilters.priority || 'all'}
              onValueChange={(value) => handleFilterChange('priority', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={t("placeholders.allPriorities")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="LOW">{t('common.priority.low')}</SelectItem>
                <SelectItem value="MEDIUM">{t('common.priority.medium')}</SelectItem>
                <SelectItem value="HIGH">{t('common.priority.high')}</SelectItem>
                <SelectItem value="URGENT">{t('common.priority.urgent')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <TableView
              items={filteredItems}
              users={users}
              canAssign={canAssign}
              onAssign={assignItems}
              userWorkloads={userWorkloads}
            />
          ) : (
            <DndView
              items={filteredItems}
              users={users}
              canAssign={canAssign}
              onAssign={assignItems}
              userWorkloads={userWorkloads}
              onResetRef={dndResetRef}
              onApplyRef={dndApplyRef}
              onHasChangesUpdate={setDndHasChanges}
            />
          )}
        </>
      )}
    </div>
  )
}