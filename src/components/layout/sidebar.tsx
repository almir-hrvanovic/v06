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
    {
      titleKey: 'navigation.main.settings',
      href: '/dashboard/settings',
      icon: Settings,
      roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
    },
  ]

  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  return (
    <TooltipProvider>
      <div className={cn(
        'relative h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Header */}
        <div className="flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">GS</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                CMS
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              'h-8 w-8 p-0',
              isCollapsed ? 'mx-auto' : 'ml-auto'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const title = t(item.titleKey as any)

              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? 'default' : 'ghost'}
                        size="sm"
                        className={cn(
                          'w-full justify-start h-10',
                          isCollapsed && 'px-2',
                          isActive && 'bg-blue-600 text-white hover:bg-blue-700'
                        )}
                      >
                        <Icon className={cn(
                          'h-4 w-4',
                          !isCollapsed && 'mr-3'
                        )} />
                        {!isCollapsed && (
                          <>
                            <span className="truncate">{title}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right" sideOffset={5}>
                      <p>{title}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  )
}