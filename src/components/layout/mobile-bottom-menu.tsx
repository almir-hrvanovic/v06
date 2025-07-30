'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useSidebar } from '@/contexts/sidebar-context'
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
  ChevronRight,
  LogOut,
  Database,
  Wrench,
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
    icon: Database,
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
    titleKey: 'navigation.main.systemSettings',
    href: '/dashboard/system-settings',
    icon: Wrench,
    roles: ['SUPERUSER'],
  },
]

interface MobileBottomMenuProps {
  className?: string
}

export function MobileBottomMenu({ className }: MobileBottomMenuProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const userRole = user?.role
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)

  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  // Prevent rendering until client-side to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("h-9 w-9 p-0", className)}
        disabled
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Loading navigation menu</span>
      </Button>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-9 w-9 p-0", className)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] max-h-[600px] rounded-t-2xl p-0 safe-area-inset-bottom" showCloseButton={false}>
        <div className="flex h-full flex-col">
          {/* Handle bar */}
          <div className="flex justify-center py-3 touch-none">
            <div className="h-1 w-12 rounded-full bg-border/60" />
          </div>

          {/* Header with Sheet Title for accessibility */}
          <div className="px-4 pb-3">
            <SheetTitle>
              <span className="text-lg font-semibold">Navigation</span>
            </SheetTitle>
            <SheetDescription className="sr-only">
              Main navigation menu. Swipe down to close.
            </SheetDescription>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overscroll-contain px-3 pb-safe">
            <div className="space-y-0.5">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                const title = t(item.titleKey as any)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center justify-between rounded-lg px-3 py-3 text-sm font-medium transition-all active:scale-[0.98]',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted active:bg-muted'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="truncate">{title}</span>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="h-5 min-w-[20px] px-1 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className={cn(
                        "h-4 w-4 transition-transform",
                        isActive && "text-primary"
                      )} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t bg-muted/30 p-4 pb-safe">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setIsOpen(false)
                  signOut()
                }}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}