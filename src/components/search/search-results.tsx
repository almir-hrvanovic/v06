"use client"

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search,
  SortAsc,
  SortDesc,
  Eye,
  Edit,
  MoreHorizontal,
  FileText,
  User,
  Building2,
  Calendar,
  DollarSign,
  Package,
  Grid3X3,
  List,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import { SearchFilters } from './advanced-search-filters'
import { ExcelExportButton } from '@/components/excel/excel-export-button'

interface SearchResultsProps {
  entityType: 'inquiries' | 'items' | 'users' | 'customers' | 'quotes' | 'orders'
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  className?: string
}

type SortField = string
type SortDirection = 'asc' | 'desc'

interface SearchResult {
  id: string
  type: string
  [key: string]: any
}

export function SearchResults({ 
  entityType, 
  filters, 
  onFiltersChange,
  className = "" 
}: SearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const itemsPerPage = 20

  const fetchResults = useCallback(async () => {
    setLoading(true)
    try {
      // In a real app, this would make an API call
      // For now, we'll simulate the search results
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API delay
      
      // Mock results based on entity type
      const mockResults = generateMockResults(entityType, filters)
      setResults(mockResults)
      setTotalResults(mockResults.length)
      setTotalPages(Math.ceil(mockResults.length / itemsPerPage))
    } catch (error) {
      console.error('Failed to fetch search results:', error)
    } finally {
      setLoading(false)
    }
  }, [entityType, filters, itemsPerPage])

  useEffect(() => {
    fetchResults()
  }, [fetchResults, sortField, sortDirection, currentPage])

  const generateMockResults = (type: string, filters: SearchFilters): SearchResult[] => {
    // Generate mock data based on entity type
    const baseResults: SearchResult[] = []
    
    for (let i = 1; i <= 25; i++) {
      if (type === 'inquiries') {
        baseResults.push({
          id: `inq-${i}`,
          type: 'inquiry',
          title: `Inquiry ${i}: ${['Product Development', 'Manufacturing', 'Consulting', 'Design'][i % 4]}`,
          customer: { name: `Customer ${i}`, id: `cust-${i}` },
          status: ['DRAFT', 'SUBMITTED', 'ASSIGNED', 'COSTING', 'QUOTED'][i % 5],
          priority: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
          totalValue: (i * 1000) + Math.random() * 5000,
          createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
          assignedTo: i % 3 === 0 ? { name: `User ${i}`, id: `user-${i}` } : null,
          itemCount: i % 5 + 1,
          hasAttachments: i % 3 === 0
        })
      } else if (type === 'items') {
        baseResults.push({
          id: `item-${i}`,
          type: 'item',
          name: `Item ${i}: ${['Component A', 'Part B', 'Assembly C', 'Module D'][i % 4]}`,
          inquiry: { title: `Inquiry ${i}`, id: `inq-${i}` },
          status: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COSTED', 'APPROVED'][i % 5],
          quantity: i * 10,
          assignedTo: i % 2 === 0 ? { name: `VP ${i}`, id: `vp-${i}` } : null,
          hasCalculation: i % 3 === 0,
          createdAt: new Date(Date.now() - (i * 12 * 60 * 60 * 1000))
        })
      }
    }
    
    return baseResults
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleExport = () => {
    // Generate a report based on current search results and filters
    const reportTitle = `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Search Results`
    const exportData = {
      title: reportTitle,
      subtitle: `Search results for "${filters.search || 'All'}"`,
      type: entityType === 'inquiries' ? 'inquiries' : 'users',
      dateRange: {
        from: filters.dateFrom?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: filters.dateTo?.toISOString() || new Date().toISOString()
      },
      filters: filters,
      includeDetails: true,
      includeSummary: true
    }

    // Open report generator with pre-filled data
    const url = `/dashboard/reports/generator?data=${encodeURIComponent(JSON.stringify(exportData))}`
    window.open(url, '_blank')
  }

  const renderTableView = () => {
    if (entityType === 'inquiries') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center space-x-1">
                  <span>Title</span>
                  {sortField === 'title' && (
                    sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Items</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('totalValue')}
              >
                <div className="flex items-center space-x-1">
                  <span>Value</span>
                  {sortField === 'totalValue' && (
                    sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>Created</span>
                  {sortField === 'createdAt' && (
                    sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((inquiry) => (
              <TableRow key={inquiry.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="font-medium">{inquiry.title}</div>
                      {inquiry.hasAttachments && (
                        <Badge variant="outline" className="text-xs">
                          Has attachments
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span>{inquiry.customer.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(inquiry.status)}>
                    {inquiry.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityVariant(inquiry.priority)}>
                    {inquiry.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span>{inquiry.itemCount}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span>{formatCurrency(inquiry.totalValue)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {inquiry.assignedTo ? (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{inquiry.assignedTo.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(inquiry.createdAt)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/inquiries/${inquiry.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/inquiries/${inquiry.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )
    }

    // Similar table structure for other entity types...
    return <div>Table view for {entityType}</div>
  }

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base truncate">
                    {item.title || item.name}
                  </CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant={getStatusVariant(item.status)}>
                    {item.status}
                  </Badge>
                  {item.priority && (
                    <Badge variant={getPriorityVariant(item.priority)}>
                      {item.priority}
                    </Badge>
                  )}
                </div>
                {item.customer && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4" />
                    <span>{item.customer.name}</span>
                  </div>
                )}
                {item.totalValue && (
                  <div className="flex items-center space-x-2 text-sm">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{formatCurrency(item.totalValue)}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const getStatusVariant = (status: string) => {
    const statusMap: Record<string, any> = {
      DRAFT: 'secondary',
      SUBMITTED: 'warning',
      ASSIGNED: 'info',
      COSTING: 'warning',
      QUOTED: 'success',
      APPROVED: 'success',
      PENDING: 'secondary',
      IN_PROGRESS: 'warning',
      COSTED: 'info'
    }
    return statusMap[status] || 'secondary'
  }

  const getPriorityVariant = (priority: string) => {
    const priorityMap: Record<string, any> = {
      LOW: 'secondary',
      MEDIUM: 'warning',
      HIGH: 'destructive',
      URGENT: 'destructive'
    }
    return priorityMap[priority] || 'secondary'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found {totalResults} {entityType} matching your criteria
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              PDF Report
            </Button>
            {(entityType === 'inquiries' || entityType === 'users' || entityType === 'customers') && (
              <ExcelExportButton 
                entityType={entityType as 'inquiries' | 'users' | 'customers'}
                filters={filters}
                variant="outline"
                size="sm"
              />
            )}
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-l-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {viewMode === 'table' ? renderTableView() : renderGridView()}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalResults)} of {totalResults} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}