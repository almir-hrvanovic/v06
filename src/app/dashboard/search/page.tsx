"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdvancedSearchFilters, SearchFilters } from '@/components/search/advanced-search-filters'
import { SearchResults } from '@/components/search/search-results'
import { 
  Search,
  FileText,
  Package,
  Users,
  Building2,
  Quote,
  ShoppingCart,
  TrendingUp,
  Clock
} from 'lucide-react'
import { useSession } from 'next-auth/react'

type EntityType = 'inquiries' | 'items' | 'users' | 'customers' | 'quotes' | 'orders'

export default function SearchPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [activeTab, setActiveTab] = useState<EntityType>('inquiries')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [recentSearches, setRecentSearches] = useState<Array<{ query: string; type: EntityType; timestamp: Date }>>([])
  
  const userRole = session?.user?.role

  useEffect(() => {
    // Load initial filters from URL params
    const initialFilters: SearchFilters = {}
    const search = searchParams.get('q')
    const type = searchParams.get('type') as EntityType
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    
    if (search) initialFilters.search = search
    if (status) initialFilters.status = [status as any]
    if (priority) initialFilters.priority = [priority as any]
    
    if (type && ['inquiries', 'items', 'users', 'customers', 'quotes', 'orders'].includes(type)) {
      setActiveTab(type)
    }
    
    setFilters(initialFilters)
    
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setRecentSearches(parsed.slice(0, 5)) // Keep only 5 recent searches
      } catch (error) {
        console.error('Failed to parse recent searches:', error)
      }
    }
  }, [searchParams])

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters)
    
    // Update URL with search params
    const params = new URLSearchParams()
    if (newFilters.search) params.set('q', newFilters.search)
    if (activeTab !== 'inquiries') params.set('type', activeTab)
    if (newFilters.status?.[0]) params.set('status', newFilters.status[0])
    if (newFilters.priority?.[0]) params.set('priority', newFilters.priority[0])
    
    const newUrl = params.toString() ? `/dashboard/search?${params.toString()}` : '/dashboard/search'
    router.replace(newUrl, { scroll: false })
    
    // Save to recent searches if there's a search term
    if (newFilters.search && newFilters.search.trim() !== '') {
      const newSearch = {
        query: newFilters.search,
        type: activeTab,
        timestamp: new Date()
      }
      
      const updated = [newSearch, ...recentSearches.filter(s => s.query !== newFilters.search)].slice(0, 5)
      setRecentSearches(updated)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    }
  }

  const handleTabChange = (value: string) => {
    const newTab = value as EntityType
    setActiveTab(newTab)
    setFilters({}) // Clear filters when switching tabs
  }

  const getTabIcon = (type: EntityType) => {
    const icons = {
      inquiries: <FileText className="h-4 w-4" />,
      items: <Package className="h-4 w-4" />,
      users: <Users className="h-4 w-4" />,
      customers: <Building2 className="h-4 w-4" />,
      quotes: <Quote className="h-4 w-4" />,
      orders: <ShoppingCart className="h-4 w-4" />
    }
    return icons[type]
  }

  const getTabLabel = (type: EntityType) => {
    const labels = {
      inquiries: 'Inquiries',
      items: 'Items',  
      users: 'Users',
      customers: 'Customers',
      quotes: 'Quotes',
      orders: 'Orders'
    }
    return labels[type]
  }

  const canAccessTab = (type: EntityType): boolean => {
    if (!userRole) return false
    
    // Define access permissions based on user role
    const permissions: Record<string, EntityType[]> = {
      SUPERUSER: ['inquiries', 'items', 'users', 'customers', 'quotes', 'orders'],
      ADMIN: ['inquiries', 'items', 'users', 'customers', 'quotes', 'orders'],
      MANAGER: ['inquiries', 'items', 'users', 'customers', 'quotes', 'orders'],
      SALES: ['inquiries', 'items', 'customers', 'quotes'],
      VPP: ['inquiries', 'items', 'users'],
      VP: ['inquiries', 'items'],
      TECH: ['inquiries', 'items']
    }
    
    return permissions[userRole]?.includes(type) || false
  }

  const availableTabs = (['inquiries', 'items', 'users', 'customers', 'quotes', 'orders'] as EntityType[])
    .filter(canAccessTab)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Search</h1>
          <p className="text-muted-foreground">
            Search and filter across all your data with powerful filters
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Search className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <CardTitle className="text-sm">Recent Searches</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTab(search.type)
                    setFilters({ search: search.query })
                  }}
                  className="text-xs"
                >
                  {getTabIcon(search.type)}
                  <span className="ml-1">{search.query}</span>
                  <span className="ml-2 text-muted-foreground">in {getTabLabel(search.type)}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Interface */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {availableTabs.map(tab => (
            <TabsTrigger key={tab} value={tab} className="flex items-center space-x-2">
              {getTabIcon(tab)}
              <span className="hidden sm:inline">{getTabLabel(tab)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {availableTabs.map(tab => (
          <TabsContent key={tab} value={tab} className="space-y-6">
            {/* Search Filters */}
            <AdvancedSearchFilters
              entityType={tab}
              onFiltersChange={handleFiltersChange}
              initialFilters={filters}
            />
            
            {/* Search Results */}
            <SearchResults
              entityType={tab}
              filters={filters}
              onFiltersChange={setFilters}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Searched</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Inquiries</div>
            <p className="text-xs text-muted-foreground">
              45% of all searches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">245ms</div>
            <p className="text-xs text-muted-foreground">
              -15ms from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Results Found</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}