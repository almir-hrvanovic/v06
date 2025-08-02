'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer'
import { useAuth } from '@/contexts/auth-context'
import { UserRole } from '@prisma/client'
import { useSidebar } from '@/contexts/sidebar-context'
import { useTranslations } from 'next-intl'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  FileText,
  Calculator,
  CheckSquare,
  FileCheck,
  Package,
  Settings,
  BarChart3,
  Search,
  FileBarChart,
  Workflow,
  ChevronLeft,
  ChevronRight,
  Database,
  Menu,
  X,
} from 'lucide-react'

// Navigation item interface
interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: number
}

// Responsive sidebar mode types
type SidebarMode = 'overlay' | 'persistent' | 'collapsible' | 'hidden'

// Breakpoint definitions
interface Breakpoints {
  mobile: number    // 0-767px
  tablet: number    // 768-1023px  
  desktop: number   // 1024-1279px
  wide: number      // 1280px+
}

// Props interface for ResponsiveSidebar
interface ResponsiveSidebarProps {
  className?: string
  breakpoints?: Partial<Breakpoints>
  navItems?: NavItem[]
  showLogo?: boolean
  logoComponent?: React.ReactNode
  onNavigate?: (href: string) => void
  enablePersistence?: boolean
  overlayBlur?: boolean
  customModeMap?: Partial<Record<keyof Breakpoints, SidebarMode>>
}

// Default navigation items
const defaultNavItems: NavItem[] = [
  {
    titleKey: 'navigation.main.dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
  {
    titleKey: 'navigation.main.customers',
    href: '/dashboard/customers',
    icon: Users,
    roles: ['SUPERUSER', 'ADMIN', 'SALES'],
  },
  {
    titleKey: 'navigation.main.users',
    href: '/dashboard/users',
    icon: UserCheck,
    roles: ['SUPERUSER', 'ADMIN'],
  },
  {
    titleKey: 'navigation.main.inquiries',
    href: '/dashboard/inquiries',
    icon: FileText,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'],
  },
  {
    titleKey: 'navigation.main.search',
    href: '/dashboard/search',
    icon: Search,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
  {
    titleKey: 'navigation.main.assignments',
    href: '/dashboard/assignments',
    icon: Calculator,
    roles: ['SUPERUSER', 'ADMIN', 'VPP'],
  },
  {
    titleKey: 'navigation.main.costs',
    href: '/dashboard/costs',
    icon: Calculator,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'VP'],
  },
  {
    titleKey: 'navigation.main.approvals',
    href: '/dashboard/approvals',
    icon: CheckSquare,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    titleKey: 'navigation.main.quotes',
    href: '/dashboard/quotes',
    icon: FileCheck,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'],
  },
  {
    titleKey: 'navigation.main.production',
    href: '/dashboard/production',
    icon: Package,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    titleKey: 'navigation.main.analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    titleKey: 'navigation.main.reports',
    href: '/dashboard/reports',
    icon: FileBarChart,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    titleKey: 'navigation.main.automation',
    href: '/dashboard/automation',
    icon: Workflow,
    roles: ['SUPERUSER', 'ADMIN'],
  },
]

// Default breakpoints
const defaultBreakpoints: Breakpoints = {
  mobile: 767,
  tablet: 1023,
  desktop: 1279,
  wide: 1280,
}

// Default mode mapping
const defaultModeMap: Record<keyof Breakpoints, SidebarMode> = {
  mobile: 'overlay',     // Drawer overlay on mobile
  tablet: 'overlay',     // Drawer overlay on tablet
  desktop: 'collapsible', // Collapsible sidebar on desktop
  wide: 'persistent',    // Always visible on wide screens
}

// Hook for responsive breakpoint detection
function useBreakpoint(breakpoints: Breakpoints) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof Breakpoints>('wide')
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setWindowWidth(width)

      if (width <= breakpoints.mobile) {
        setCurrentBreakpoint('mobile')
      } else if (width <= breakpoints.tablet) {
        setCurrentBreakpoint('tablet')
      } else if (width <= breakpoints.desktop) {
        setCurrentBreakpoint('desktop')
      } else {
        setCurrentBreakpoint('wide')
      }
    }

    // Set initial size
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoints])

  return { currentBreakpoint, windowWidth }
}

// Logo component
function SidebarLogo({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <div className="flex h-16 items-center sidebar-separator border-b px-4">
      {!isCollapsed && (
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-[hsl(var(--sidebar-logo-bg))] flex items-center justify-center shadow-sm transition-colors duration-300">
            <Database className="h-5 w-5 text-[hsl(var(--sidebar-badge-text))]" />
          </div>
          <div>
            <span className="font-semibold text-[hsl(var(--sidebar-foreground))] text-lg transition-colors duration-300">
              GS-CMS
            </span>
            <div className="text-xs text-[hsl(var(--sidebar-text-secondary))] transition-colors duration-300">
              v5.0
            </div>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="mx-auto">
          <div className="h-8 w-8 rounded-lg bg-[hsl(var(--sidebar-logo-bg))] flex items-center justify-center shadow-sm transition-colors duration-300">
            <Database className="h-4 w-4 text-[hsl(var(--sidebar-badge-text))]" />
          </div>
        </div>
      )}
    </div>
  )
}

// Navigation items component
function NavigationItems({ 
  navItems, 
  pathname, 
  userRole, 
  isCollapsed, 
  onNavigate 
}: {
  navItems: NavItem[]
  pathname: string
  userRole?: UserRole
  isCollapsed: boolean
  onNavigate?: (href: string) => void
}) {
  const t = useTranslations()

  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  return (
    <nav className="flex-1 overflow-y-auto p-3">
      <div className="space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          const title = t(item.titleKey as any)

          return (
            <Tooltip key={item.href} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link 
                  href={item.href}
                  onClick={() => onNavigate?.(item.href)}
                >
                  <div
                    className={cn(
                      'sidebar-nav-item',
                      isActive && 'sidebar-nav-item-active'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="truncate transition-colors duration-300">{title}</span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className="ml-auto bg-[hsl(var(--sidebar-badge-bg))]/10 text-[hsl(var(--sidebar-badge-bg))] border-0 transition-colors duration-300"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  <p>{title}</p>
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </div>
    </nav>
  )
}

// Persistent sidebar component
function PersistentSidebar({ 
  navItems, 
  logoComponent,
  showLogo = true,
  onNavigate,
  className 
}: {
  navItems: NavItem[]
  logoComponent?: React.ReactNode
  showLogo?: boolean
  onNavigate?: (href: string) => void
  className?: string
}) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isCollapsed, toggleCollapsed } = useSidebar()
  const userRole = user?.role

  return (
    <TooltipProvider>
      <div className={cn(
        'relative h-screen sidebar-nav border-r border-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}>
        {/* Header */}
        {showLogo && (
          <>
            {logoComponent || <SidebarLogo isCollapsed={isCollapsed} />}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className={cn(
                'absolute top-4 right-4 h-8 w-8 p-0 hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-icon))] hover:text-[hsl(var(--sidebar-foreground))] transition-all duration-300',
                isCollapsed ? 'hidden' : ''
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Navigation */}
        <NavigationItems
          navItems={navItems}
          pathname={pathname}
          userRole={userRole}
          isCollapsed={isCollapsed}
          onNavigate={onNavigate}
        />

        {/* Expand Button for Collapsed State */}
        {isCollapsed && (
          <div className="p-3 sidebar-separator border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className="sidebar-expand-button w-full h-8 p-0 relative"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Expand sidebar</span>
            </Button>
          </div>
        )}
        
        {/* Floating expand button when completely collapsed */}
        {isCollapsed && (
          <div className="absolute -right-3 top-20 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCollapsed}
              className="sidebar-expand-button h-8 w-8 p-0 rounded-full shadow-md"
              title="Expand sidebar"
            >
              <ChevronRight className="h-3 w-3" />
              <span className="sr-only">Expand sidebar</span>
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

// Overlay sidebar component (mobile/tablet drawer)
function OverlaySidebar({ 
  navItems, 
  logoComponent,
  showLogo = true,
  onNavigate,
  className,
  overlayBlur = true
}: {
  navItems: NavItem[]
  logoComponent?: React.ReactNode
  showLogo?: boolean
  onNavigate?: (href: string) => void
  className?: string
  overlayBlur?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()
  const userRole = user?.role
  const t = useTranslations()

  const handleNavigate = useCallback((href: string) => {
    setIsOpen(false)
    onNavigate?.(href)
  }, [onNavigate])

  const SidebarContent = () => (
    <div className="flex h-full w-full flex-col bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]">
      {/* Header */}
      {showLogo && (
        <div className="flex h-16 items-center justify-between px-6 border-b border-[hsl(var(--sidebar-separator))]">
          {logoComponent || (
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2"
              onClick={() => handleNavigate('/dashboard')}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--sidebar-logo-bg))] text-[hsl(var(--sidebar-badge-text))]">
                <Database className="h-4 w-4" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 32 32" className="text-primary-foreground">
                    <path d="M16 6l2.47 5.01L24 12.18l-4 3.9.94 5.5L16 19.15l-4.94 2.59.94-5.5-4-3.9 5.53-1.17L16 6z" fill="currentColor"/>
                  </svg>
                </div>
                <span className="text-lg font-semibold text-[hsl(var(--sidebar-foreground))]">GS-CMS v5.0</span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto" aria-label="Main navigation">
        {navItems.filter(item => userRole && item.roles.includes(userRole)).map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const title = t(item.titleKey as any)

          return (
            <Button
              key={item.href}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start px-3 py-3 text-left h-auto transition-all duration-300',
                isActive 
                  ? 'bg-[hsl(var(--sidebar-active))] text-[hsl(var(--sidebar-active-foreground))] [&>svg]:text-[hsl(var(--sidebar-icon-active))]'
                  : 'hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-foreground))] [&>svg]:text-[hsl(var(--sidebar-icon))]'
              )}
              asChild
              onClick={() => handleNavigate(item.href)}
            >
              <Link href={item.href}>
                <Icon className="mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-300" />
                <span className="truncate">{title}</span>
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="secondary"
                    className="ml-auto bg-[hsl(var(--sidebar-badge-bg))]/10 text-[hsl(var(--sidebar-badge-bg))] border-0"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </Button>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-[hsl(var(--sidebar-separator))] p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--sidebar-logo-bg))] text-[hsl(var(--sidebar-badge-text))] text-sm font-medium flex-shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[hsl(var(--sidebar-foreground))] truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-[hsl(var(--sidebar-text-secondary))] truncate">
              {userRole?.toLowerCase().replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Trigger Button */}
      <div className={className}>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-icon))] hover:text-[hsl(var(--sidebar-foreground))] transition-all duration-300"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </div>
      
      {/* Responsive Drawer */}
      <ResponsiveDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
        side="left"
        title="Navigation Menu"
        description="Main Navigation"
        className={cn(
          "p-0 bg-[hsl(var(--sidebar-background))]",
          overlayBlur && "backdrop-blur-sm"
        )}
      >
        <SidebarContent />
      </ResponsiveDrawer>
    </>
  )
}

// Main ResponsiveSidebar component
export function ResponsiveSidebar({
  className,
  breakpoints = {},
  navItems = defaultNavItems,
  showLogo = true,
  logoComponent,
  onNavigate,
  enablePersistence = true,
  overlayBlur = true,
  customModeMap = {},
}: ResponsiveSidebarProps) {
  const mergedBreakpoints = { ...defaultBreakpoints, ...breakpoints }
  const modeMap = { ...defaultModeMap, ...customModeMap }
  const { currentBreakpoint } = useBreakpoint(mergedBreakpoints)
  const currentMode = modeMap[currentBreakpoint]

  // Render based on current mode
  switch (currentMode) {
    case 'persistent':
    case 'collapsible':
      return (
        <PersistentSidebar
          navItems={navItems}
          logoComponent={logoComponent}
          showLogo={showLogo}
          onNavigate={onNavigate}
          className={className}
        />
      )

    case 'overlay':
      return (
        <OverlaySidebar
          navItems={navItems}
          logoComponent={logoComponent}
          showLogo={showLogo}
          onNavigate={onNavigate}
          className={className}
          overlayBlur={overlayBlur}
        />
      )

    case 'hidden':
      return null

    default:
      return (
        <PersistentSidebar
          navItems={navItems}
          logoComponent={logoComponent}
          showLogo={showLogo}
          onNavigate={onNavigate}
          className={className}
        />
      )
  }
}

// Export types and utilities
export type { 
  ResponsiveSidebarProps, 
  NavItem, 
  SidebarMode, 
  Breakpoints 
}

export { 
  defaultNavItems, 
  defaultBreakpoints, 
  defaultModeMap, 
  useBreakpoint 
}

// Default export
export default ResponsiveSidebar