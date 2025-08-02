'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
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
  Workflow,
  ChevronLeft,
  ChevronRight,
  Database,
  Menu,
  X,
} from 'lucide-react'

interface NavItem {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: number
}

interface ResponsiveSidebarProps {
  className?: string
}

export function ResponsiveSidebarExample({ className }: ResponsiveSidebarProps) {
  const t = useTranslations()
  const pathname = usePathname()
  const { user } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const userRole = user?.role

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen && isMobile) {
      document.body.classList.add('body-scroll-locked')
    } else {
      document.body.classList.remove('body-scroll-locked')
    }

    return () => {
      document.body.classList.remove('body-scroll-locked')
    }
  }, [isMobileOpen, isMobile])

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
      badge: 3,
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
      badge: 12,
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
      badge: 5,
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

  const toggleCollapsed = () => {
    if (!isMobile) {
      setIsCollapsed(!isCollapsed)
    }
  }

  const toggleMobile = () => {
    if (isMobile) {
      setIsMobileOpen(!isMobileOpen)
    }
  }

  const closeMobileSidebar = () => {
    setIsMobileOpen(false)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <div className="lg:hidden">
          <button
            onClick={toggleMobile}
            className="inline-flex items-center justify-center p-2 rounded-md text-sidebar-icon hover:text-sidebar-foreground hover:bg-sidebar-hover focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors duration-sidebar"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            {isMobileOpen ? (
              <X className="block h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="block h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && (
        <div
          className={cn(
            'sidebar-overlay',
            isMobileOpen && 'active'
          )}
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'sidebar-responsive flex flex-col',
          {
            'expanded': !isMobile && !isCollapsed,
            'collapsed': !isMobile && isCollapsed,
            'mobile': isMobile,
            'open': isMobile && isMobileOpen,
          },
          className
        )}
      >
        {/* Header */}
        <div className={cn(
          'sidebar-header',
          isCollapsed && !isMobile && 'collapsed'
        )}>
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-sidebar-logo-bg flex items-center justify-center shadow-sm">
                <Database className="h-5 w-5 text-sidebar-badge-text" />
              </div>
              <div>
                <span className="font-semibold text-sidebar-foreground text-lg">
                  GS-CMS
                </span>
                <div className="text-xs text-sidebar-text-secondary">
                  v5.0
                </div>
              </div>
            </div>
          )}
          
          {isCollapsed && !isMobile && (
            <div className="h-8 w-8 rounded-lg bg-sidebar-logo-bg flex items-center justify-center shadow-sm">
              <Database className="h-4 w-4 text-sidebar-badge-text" />
            </div>
          )}
          
          {/* Desktop Toggle Button */}
          {!isMobile && (
            <button
              onClick={toggleCollapsed}
              className={cn(
                'ml-auto p-1.5 rounded-md text-sidebar-icon hover:text-sidebar-foreground hover:bg-sidebar-hover focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-sidebar',
                isCollapsed && 'hidden'
              )}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">
                {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              </span>
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={closeMobileSidebar}
              className="ml-auto p-1.5 rounded-md text-sidebar-icon hover:text-sidebar-foreground hover:bg-sidebar-hover focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-sidebar"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav-container">
          <ul className="sidebar-nav-list">
            {filteredNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const title = t(item.titleKey as any)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={isMobile ? closeMobileSidebar : undefined}
                    className={cn(
                      'sidebar-nav-item-responsive',
                      isActive && 'active'
                    )}
                    title={isCollapsed && !isMobile ? title : undefined}
                  >
                    <Icon className="sidebar-nav-icon" />
                    
                    {(!isCollapsed || isMobile) && (
                      <div className="sidebar-nav-content">
                        <span className="sidebar-nav-text">{title}</span>
                        {item.badge && item.badge > 0 && (
                          <span className="sidebar-nav-badge">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Floating Toggle Button for Collapsed State */}
        {isCollapsed && !isMobile && (
          <button
            onClick={toggleCollapsed}
            className="sidebar-toggle-button"
            title="Expand sidebar"
          >
            <ChevronRight className="h-3 w-3" />
            <span className="sr-only">Expand sidebar</span>
          </button>
        )}

        {/* Footer for mobile */}
        {isMobile && user && (
          <div className="border-t border-sidebar-separator p-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-sidebar-text-secondary truncate">
                  {userRole?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}