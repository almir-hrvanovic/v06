'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSession, signOut } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
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
  ChevronRight,
  Workflow,
  LogOut,
} from 'lucide-react'

interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: number
}

const navItems: NavItem[] = [
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
  {
    titleKey: 'navigation.main.settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
]

interface TabletSidebarProps {
  className?: string
}

export function TabletSidebar({ className }: TabletSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const t = useTranslations()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  // Touch handling for swipe gestures
  const sidebarRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const swipeThreshold = 50
  
  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current
    
    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0 && isExpanded) {
        // Swiped left - collapse
        setIsExpanded(false)
      } else if (swipeDistance < 0 && !isExpanded) {
        // Swiped right - expand
        setIsExpanded(true)
      }
    }
  }

  if (!isMounted) {
    return null
  }

  return (
    <aside 
      ref={sidebarRef}
      className={cn(
        "fixed left-0 top-0 h-full bg-background border-r border-border transition-all duration-300 z-30 flex flex-col",
        isExpanded ? "w-[280px]" : "w-[88px]",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header - Logo only, matching main header height */}
      <div className="h-16 border-b bg-[hsl(var(--header-background))] relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-primary flex items-center justify-center hover:shadow-lg transition-shadow hover:scale-110"
          style={{ left: '44px' }} // Half of 88px (collapsed width) to keep it centered in collapsed state
        >
          <svg width="20" height="20" viewBox="0 0 32 32" className="text-primary-foreground">
            <path d="M16 6l2.47 5.01L24 12.18l-4 3.9.94 5.5L16 19.15l-4.94 2.59.94-5.5-4-3.9 5.53-1.17L16 6z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Expand/Collapse Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-accent z-10",
          "flex items-center justify-center"
        )}
      >
        <ChevronRight className={cn(
          "h-3 w-3 transition-transform",
          isExpanded && "rotate-180"
        )} />
      </Button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overscroll-contain p-3">
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const title = t(item.titleKey as any)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center rounded-lg transition-all hover:bg-muted group',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:text-foreground',
                  isExpanded ? 'px-3 py-2.5' : 'p-3 justify-center'
                )}
              >
                <div className={cn(
                  "flex items-center justify-center flex-shrink-0",
                  isExpanded ? "h-8 w-8" : "h-9 w-9"
                )}>
                  <Icon className={cn(
                    isExpanded ? "h-5 w-5" : "h-6 w-6"
                  )} />
                </div>
                
                {isExpanded && (
                  <>
                    <span className="ml-3 text-sm font-medium truncate flex-1">
                      {title}
                    </span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto h-5 min-w-[20px] px-1 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                
                {!isExpanded && item.badge && item.badge > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                      {item.badge}
                    </Badge>
                  </div>
                )}
                
                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-md">
                    {title}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer - User Section */}
      <div className="border-t p-3">
        {isExpanded ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
              </div>
            </div>
            <Button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 mx-auto flex relative group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-md">
                {session?.user?.name || 'User'}
              </div>
            </Button>
            <Button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              variant="ghost"
              size="icon"
              className="h-10 w-10 mx-auto flex text-destructive hover:text-destructive hover:bg-destructive/10 relative group"
            >
              <LogOut className="h-5 w-5" />
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-md">
                Sign Out
              </div>
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}