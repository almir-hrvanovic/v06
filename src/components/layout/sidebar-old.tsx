'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { UserRole } from '@prisma/client'
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
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: number
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
  {
    title: 'Customers',
    href: '/dashboard/customers',
    icon: Users,
    roles: ['SUPERUSER', 'ADMIN', 'SALES'],
  },
  {
    title: 'Users',
    href: '/dashboard/users',
    icon: UserCheck,
    roles: ['SUPERUSER', 'ADMIN'],
  },
  {
    title: 'Inquiries',
    href: '/dashboard/inquiries',
    icon: FileText,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP'],
  },
  {
    title: 'Search',
    href: '/dashboard/search',
    icon: Search,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES', 'VPP', 'VP', 'TECH'],
  },
  {
    title: 'Assignments',
    href: '/dashboard/assignments',
    icon: Calculator,
    roles: ['SUPERUSER', 'ADMIN', 'VPP'],
  },
  {
    title: 'Cost Calculations',
    href: '/dashboard/costs',
    icon: Calculator,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'VP'],
  },
  {
    title: 'Approvals',
    href: '/dashboard/approvals',
    icon: CheckSquare,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    title: 'Quotes',
    href: '/dashboard/quotes',
    icon: FileCheck,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER', 'SALES'],
  },
  {
    title: 'Production Orders',
    href: '/dashboard/production',
    icon: Package,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileBarChart,
    roles: ['SUPERUSER', 'ADMIN', 'MANAGER'],
  },
  {
    title: 'Automation',
    href: '/dashboard/automation',
    icon: Workflow,
    roles: ['SUPERUSER', 'ADMIN'],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['SUPERUSER', 'ADMIN'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const userRole = user?.role

  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-sm font-bold">GS</span>
          </div>
          <span className="text-lg font-semibold">CMS v05</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Button
              key={item.href}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start px-3 py-2 text-left',
                isActive && 'bg-secondary text-secondary-foreground'
              )}
              asChild
            >
              <Link href={item.href}>
                <Icon className="mr-3 h-4 w-4" />
                {item.title}
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

      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {userRole?.toLowerCase().replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}