'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useAssignmentsData } from '@/hooks/use-assignments-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TableView } from '@/components/assignments/table-view'
import { DndView } from '@/components/assignments/dnd-view'
import { AssignmentFilters } from '@/components/assignments/assignment-filters'
import { Loader2, Table, Grip, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'

type ViewMode = 'table' | 'dnd'

export default function UnifiedAssignmentsPage() {
  const { user } = useAuth()
  const t = useTranslations()
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  
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

  // Save view mode preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('assignments-view-mode', mode)
  }

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

      {/* Filters */}
      <AssignmentFilters
        filters={filters}
        onFiltersChange={setFilters}
        customers={customers}
        inquiries={inquiries}
        users={users}
      />

      {/* View Mode Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => handleViewModeChange(v as ViewMode)}>
        <TabsList className="grid w-[200px] grid-cols-2">
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table className="h-4 w-4" />
            {t('assignments.tableView')}
          </TabsTrigger>
          <TabsTrigger value="dnd" className="flex items-center gap-2">
            <Grip className="h-4 w-4" />
            {t('assignments.dragDropView')}
          </TabsTrigger>
        </TabsList>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <TabsContent value="table" className="mt-6">
              <TableView
                items={filteredItems}
                users={users}
                canAssign={canAssign}
                onAssign={assignItems}
                userWorkloads={userWorkloads}
              />
            </TabsContent>

            <TabsContent value="dnd" className="mt-6">
              <DndView
                items={filteredItems}
                users={users}
                canAssign={canAssign}
                onAssign={assignItems}
                userWorkloads={userWorkloads}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}