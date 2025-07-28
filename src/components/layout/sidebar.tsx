'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useSession } from 'next-auth/react'
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
} from 'lucide-react'

interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: number
}

export function Sidebar() {
  const t = useTranslations()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isCollapsed, toggleCollapsed } = useSidebar()
  const userRole = session?.user?.role

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
  ]

  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  return (
    <TooltipProvider>
      <div className={cn(
        'relative h-screen sidebar-nav border-r border-border transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Header */}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              'h-8 w-8 p-0 hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-icon))] hover:text-[hsl(var(--sidebar-foreground))] transition-all duration-300',
              isCollapsed ? 'hidden' : 'ml-auto'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const title = t(item.titleKey as any)

              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
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