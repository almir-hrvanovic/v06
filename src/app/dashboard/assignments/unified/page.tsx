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
import { Loader2, Table, Grip, RefreshCw, Search, Filter, RotateCcw, Save, Users, BarChart3, ChevronDown, Package, AlertTriangle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { UserFilterDropdown } from '@/components/assignments/user-filter-dropdown'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { WorkloadChart } from '@/components/assignments/workload-chart'
import { Badge } from '@/components/ui/badge'

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
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [tableSelectedItems, setTableSelectedItems] = useState<string[]>([])
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)
  const [showWorkloadChart, setShowWorkloadChart] = useState(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('show-workload-chart') === 'true'
    }
    return false
  })
  
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

  // Initialize selected users
  useEffect(() => {
    if (users.length > 0 && selectedUserIds.length === 0) {
      const userIds = users.map(u => u.id)
      // Load saved selection or select all
      const saved = localStorage.getItem('dnd-selected-users')
      if (saved) {
        try {
          const savedIds = JSON.parse(saved)
          const validIds = savedIds.filter((id: string) => userIds.includes(id))
          setSelectedUserIds(validIds.length > 0 ? validIds : userIds)
        } catch {
          setSelectedUserIds(userIds)
        }
      } else {
        setSelectedUserIds(userIds)
      }
    }
  }, [users, selectedUserIds.length])

  // Save selected users preference
  useEffect(() => {
    if (selectedUserIds.length > 0) {
      localStorage.setItem('dnd-selected-users', JSON.stringify(selectedUserIds))
    }
  }, [selectedUserIds])

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

  // Toggle workload chart visibility
  const toggleWorkloadChart = () => {
    const newValue = !showWorkloadChart
    setShowWorkloadChart(newValue)
    localStorage.setItem('show-workload-chart', String(newValue))
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
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
        <div className="flex gap-2">
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
          {viewMode === 'table' && canAssign && (
            <Popover open={showAssignDropdown} onOpenChange={setShowAssignDropdown}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={tableSelectedItems.length === 0}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {t('assignments.actions.assign')} {tableSelectedItems.length > 0 && `(${tableSelectedItems.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="end">
                <div className="space-y-2">
                  <p className="text-sm font-medium px-2 py-1">
                    {t('assignments.assignTo')}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={async () => {
                      const success = await assignItems(tableSelectedItems, null)
                      if (success) {
                        setTableSelectedItems([])
                        setShowAssignDropdown(false)
                      }
                    }}
                  >
                    <Package className="h-4 w-4 mr-2 text-muted-foreground" />
                    {t('assignments.unassigned')}
                  </Button>
                  {users.filter(u => selectedUserIds.includes(u.id)).map((user) => {
                    const workload = userWorkloads.get(user.id)
                    const avgPending = users.reduce((sum, u) => {
                      const w = userWorkloads.get(u.id)
                      return sum + (w?.pending || 0)
                    }, 0) / users.length
                    const isOverloaded = (workload?.pending || 0) > avgPending * 1.5
                    
                    return (
                      <Button
                        key={user.id}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={async () => {
                          const success = await assignItems(tableSelectedItems, user.id)
                          if (success) {
                            setTableSelectedItems([])
                            setShowAssignDropdown(false)
                          }
                        }}
                      >
                        <span className="flex items-center justify-between w-full">
                          <span className="flex items-center gap-2">
                            <span>{user.name}</span>
                            {user.role === 'VPP' && (
                              <Badge variant="outline" className="text-xs h-4 px-1">VPP</Badge>
                            )}
                          </span>
                          <span className={cn(
                            "flex items-center gap-1 text-xs",
                            isOverloaded ? "text-destructive font-semibold" : "text-muted-foreground"
                          )}>
                            {workload?.pending || 0}
                            {isOverloaded && <AlertTriangle className="h-3 w-3" />}
                          </span>
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
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
        <Card 
          className={cn(
            "cursor-pointer transition-all",
            "hover:shadow-md hover:border-primary/50",
            showWorkloadChart && "border-primary shadow-md"
          )}
          onClick={toggleWorkloadChart}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              {t('assignments.assigned')}
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('assignments.viewDistribution')}
            </p>
          </CardContent>
        </Card>
        <Card className={cn(
          "cursor-pointer transition-all",
          "hover:shadow-md hover:border-primary/50"
        )}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              {t('assignments.activeUsers')}
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {selectedUserIds.length}
                </div>
                {selectedUserIds.length !== users.length && (
                  <span className="text-sm text-muted-foreground">/ {users.length}</span>
                )}
              </div>
              {users.length > 0 && (
                <UserFilterDropdown
                  users={users}
                  selectedUserIds={selectedUserIds}
                  onSelectionChange={setSelectedUserIds}
                  userWorkloads={userWorkloads}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Collapsible Workload Chart */}
      {showWorkloadChart && users.length > 0 && selectedUserIds && selectedUserIds.length > 0 && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <Card className="transition-all duration-200">
            <CardContent className="pt-6">
              <WorkloadChart 
                users={users.filter(u => selectedUserIds.includes(u.id))}
                userWorkloads={userWorkloads}
                loading={loading}
              />
            </CardContent>
          </Card>
        </div>
      )}

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
                {t('assignments.actions.reassign')}
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

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalFilters({
                  customerId: '',
                  inquiryId: '',
                  priority: '',
                  search: '',
                })
                setFilters({})
              }}
              className="h-9"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              {t('common.actions.reset')}
            </Button>
          )}

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
              selectedUserIds={selectedUserIds}
              selectedItems={tableSelectedItems}
              onSelectedItemsChange={setTableSelectedItems}
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
              selectedUserIds={selectedUserIds}
            />
          )}
        </>
      )}
    </div>
  )
}