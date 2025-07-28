'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer'
import { useSession } from 'next-auth/react'
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
  Menu,
  X,
  Workflow,
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
]

interface MobileSidebarProps {
  className?: string
}

export function MobileSidebar({ className }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const t = useTranslations()

  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  const SidebarContent = () => (
    <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
        <Link 
          href="/dashboard" 
          className="flex items-center space-x-2"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">GS</span>
          </div>
          <span className="text-lg font-semibold">CMS v05</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto" aria-label="Main navigation">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Button
              key={item.href}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start px-3 py-3 text-left h-auto',
                isActive && 'bg-secondary text-secondary-foreground'
              )}
              asChild
              onClick={() => setIsOpen(false)}
            >
              <Link href={item.href}>
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                <span className="truncate">{t(item.titleKey as any)}</span>
                {item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </Button>
          )
        })}
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
            {session?.user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {session?.user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {userRole?.toLowerCase().replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Show on ALL screen sizes */}
      <div className={className}>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </div>
      
      <ResponsiveDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
        side="left"
        title="Navigation Menu"
        description="Main Navigation"
        className="p-0"
      >
        <SidebarContent />
      </ResponsiveDrawer>
    </>
  )
}