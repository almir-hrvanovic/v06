'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Menu, 
  Search, 
  ChevronRight,
  X,
  Home
} from 'lucide-react'
import { navigationGroups } from '@/data/navigation'
import { NavGroup, NavItem } from '@/types/navigation'
import { UserRole } from '@prisma/client'
import { useSwipeGestures } from '@/hooks/use-swipe-gestures'

interface MobileDropdownNavProps {
  className?: string
}

export function MobileDropdownNav({ className }: MobileDropdownNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const t = useTranslations()
  const userRole = user?.role

  // Filter navigation groups based on user role
  const filteredGroups = navigationGroups.filter(group => 
    userRole && group.roles.includes(userRole)
  ).map(group => ({
    ...group,
    items: group.items.filter(item => 
      userRole && item.roles.includes(userRole)
    )
  })).filter(group => group.items.length > 0)

  // Filter items based on search query
  const searchResults = searchQuery.trim() 
    ? filteredGroups.flatMap(group => 
        group.items.filter(item => 
          t(item.titleKey as any).toLowerCase().includes(searchQuery.toLowerCase()) ||
          t(group.titleKey as any).toLowerCase().includes(searchQuery.toLowerCase())
        ).map(item => ({ ...item, groupTitle: t(group.titleKey as any) }))
      )
    : []

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false)
    setActiveGroup(null)
    setSearchQuery('')
  }, [pathname])

  // Handle navigation
  const handleNavigation = useCallback((href: string) => {
    setIsOpen(false)
    setActiveGroup(null)
    setSearchQuery('')
    router.push(href)
  }, [router])

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      handleNavigation(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }, [searchQuery, handleNavigation])

  // Swipe gestures for dropdown
  const { attachListeners } = useSwipeGestures({
    onSwipeLeft: () => {
      if (isOpen) {
        setIsOpen(false)
        setActiveGroup(null)
      }
    },
    onSwipeUp: () => {
      // Scroll to top of dropdown
      const dropdownContent = document.querySelector('[role="menu"]')
      dropdownContent?.scrollTo({ top: 0, behavior: 'smooth' })
    },
    minSwipeDistance: 60,
    maxSwipeTime: 400
  })

  const NavMenuItem = ({ item, groupTitle }: { item: NavItem & { groupTitle?: string }, groupTitle?: string }) => {
    const isActive = pathname === item.href
    const Icon = item.icon

    return (
      <DropdownMenuItem
        onSelect={() => handleNavigation(item.href)}
        className={cn(
          'flex items-center px-3 py-3 min-h-[48px] cursor-pointer rounded-md mx-1 mb-1',
          'focus:bg-accent focus:text-accent-foreground',
          'active:scale-[0.98] transition-all duration-150',
          isActive && 'bg-accent text-accent-foreground font-medium'
        )}
        role="menuitem"
        aria-describedby={item.badge ? `${item.href}-badge` : undefined}
      >
        <Icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="truncate">{t(item.titleKey as any)}</div>
          {groupTitle && (
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {groupTitle}
            </div>
          )}
        </div>
        {item.badge && item.badge > 0 && (
          <Badge 
            id={`${item.href}-badge`}
            variant="secondary" 
            className="ml-2 h-5 min-w-[20px] text-xs"
            aria-label={`${item.badge} notifications`}
          >
            {item.badge}
          </Badge>
        )}
        {isActive && (
          <div className="ml-2 w-2 h-2 rounded-full bg-primary flex-shrink-0" />
        )}
      </DropdownMenuItem>
    )
  }

  const NavGroupSection = ({ group }: { group: NavGroup }) => {
    const GroupIcon = group.icon

    return (
      <div className="px-1 py-2">
        <DropdownMenuLabel className="flex items-center px-2 py-1 text-sm font-medium text-muted-foreground">
          <GroupIcon className="mr-2 h-4 w-4" />
          {t(group.titleKey as any)}
        </DropdownMenuLabel>
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavMenuItem key={item.href} item={item} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-10 w-10 p-0 hover:bg-accent',
              'focus:ring-2 focus:ring-primary focus:ring-offset-2',
              'active:scale-95 transition-all duration-150'
            )}
            aria-label="Open navigation menu"
            aria-expanded={isOpen}
            aria-haspopup="menu"
          >
            {isOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent
          align="start"
          sideOffset={8}
          avoidCollisions={true}
          collisionPadding={16}
          className={cn(
            'w-80 max-w-[calc(100vw-2rem)] max-h-[70vh]',
            'overflow-y-auto overscroll-contain',
            'p-2',
            // Enhanced animations
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2',
            'data-[side=top]:slide-in-from-bottom-2',
            // Touch optimization
            'touch-manipulation'
          )}
          onCloseAutoFocus={(e) => {
            e.preventDefault()
            // Focus management - return focus to main content
            document.getElementById('main-content')?.focus()
          }}
          ref={(el) => attachListeners(el)}
          role="menu"
          aria-label="Navigation menu"
        >
          {/* Search Header */}
          <div className="sticky top-0 bg-popover z-10 pb-2 mb-2 border-b">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('header.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                  autoComplete="off"
                />
              </div>
              {searchQuery && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="h-9 w-9 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </form>
          </div>

          {/* Quick Home Link */}
          <div className="pb-2 mb-2 border-b">
            <NavMenuItem 
              item={{
                titleKey: 'navigation.main.dashboard',
                href: '/dashboard',
                icon: Home,
                roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'] as UserRole[]
              }} 
            />
          </div>

          {/* Search Results */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="pb-2 mb-2 border-b">
              <DropdownMenuLabel className="px-2 py-1 text-sm font-medium text-muted-foreground">
                {t('navigation.searchResults')} ({searchResults.length})
              </DropdownMenuLabel>
              <div className="space-y-0.5">
                {searchResults.slice(0, 8).map((item) => (
                  <NavMenuItem key={item.href} item={item} />
                ))}
              </div>
              {searchResults.length > 8 && (
                <div className="px-2 py-1 text-xs text-muted-foreground">
                  {t('navigation.showingFirst', { count: 8, total: searchResults.length })}
                </div>
              )}
            </div>
          )}

          {/* No Search Results */}
          {searchQuery.trim() && searchResults.length === 0 && (
            <div className="px-2 py-8 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2" />
              <div className="text-sm">{t('navigation.noResults')}</div>
              <div className="text-xs mt-1">{t('navigation.tryDifferentSearch')}</div>
            </div>
          )}

          {/* Navigation Groups */}
          {!searchQuery.trim() && filteredGroups.map((group, index) => (
            <div key={group.id}>
              <NavGroupSection group={group} />
              {index < filteredGroups.length - 1 && (
                <DropdownMenuSeparator className="my-2" />
              )}
            </div>
          ))}

          {/* Footer */}
          <div className="sticky bottom-0 bg-popover pt-2 mt-2 border-t">
            <div className="flex items-center justify-between px-2 py-1">
              <div className="text-xs text-muted-foreground">
                {user?.name || 'User'}
              </div>
              <div className="text-xs text-muted-foreground">
                GS-CMS v5.0
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}