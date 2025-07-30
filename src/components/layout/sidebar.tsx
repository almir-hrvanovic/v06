'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@prisma/client'
import { useSidebar } from '@/contexts/sidebar-context'
import { useTranslations } from 'next-intl'
import { useA11yListNavigation, useA11yKeyboardNav, useA11yId } from '@/hooks/use-accessibility'
import { KEYBOARD_KEYS, ariaProps } from '@/lib/accessibility'
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
  Wrench,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
  const { user } = useAuth()
  const { 
    isCollapsed, 
    toggleCollapsed, 
    accessibility, 
    announceStateChange,
    activeItemIndex,
    setActiveItemIndex 
  } = useSidebar()
  const userRole = user?.role

  // Accessibility IDs
  const sidebarId = useA11yId('sidebar')
  const navId = useA11yId('nav')
  const logoId = useA11yId('logo')
  const collapseButtonId = useA11yId('collapse-btn')
  const expandButtonId = useA11yId('expand-btn')

  // Refs for focus management
  const sidebarRef = useRef<HTMLElement>(null)
  const navItemRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)

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

  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  // Create navigation elements for keyboard navigation
  const navElements = Array.from(navItemRefs.current.values())

  // List navigation hook for keyboard navigation
  const listNavigation = useA11yListNavigation(navElements, {
    orientation: 'vertical',
    loop: true,
    onSelect: (index) => {
      const item = filteredNavItems[index]
      if (item) {
        // Navigate to the selected item
        window.location.href = item.href
      }
    },
    onEscape: () => {
      // Move focus to the collapse/expand button
      const button = document.getElementById(isCollapsed ? expandButtonId : collapseButtonId)
      if (button) {
        button.focus()
      }
    }
  })

  // Keyboard navigation for sidebar actions
  const sidebarKeyboard = useA11yKeyboardNav({
    onEscape: () => {
      // Move focus to main content or first landmark
      const main = document.querySelector('main, [role="main"]') as HTMLElement
      if (main) {
        main.focus()
      }
    },
    onArrowDown: () => {
      if (navElements.length > 0) {
        listNavigation.moveNext()
      }
    },
    onArrowUp: () => {
      if (navElements.length > 0) {
        listNavigation.movePrevious()
      }
    },
    onHome: () => {
      if (navElements.length > 0) {
        listNavigation.moveToFirst()
      }
    },
    onEnd: () => {
      if (navElements.length > 0) {
        listNavigation.moveToLast()
      }
    }
  })

  // Register navigation item refs
  const registerNavItem = (id: string, element: HTMLElement | null) => {
    if (element) {
      navItemRefs.current.set(id, element)
    } else {
      navItemRefs.current.delete(id)
    }
  }

  // Handle sidebar toggle with accessibility announcements
  const handleToggleCollapsed = () => {
    toggleCollapsed()
    const newState = !isCollapsed
    announceStateChange(
      'Sidebar', 
      newState ? 'collapsed' : 'expanded',
      newState ? 'Use Ctrl+] to expand' : 'Use Ctrl+[ to collapse'
    )
  }

  // Skip link for screen readers
  const skipToMainContent = () => {
    const main = document.querySelector('main, [role="main"]') as HTMLElement
    if (main) {
      main.focus()
      main.scrollIntoView()
    }
  }

  return (
    <TooltipProvider>
      {/* Skip link for screen readers */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded"
        onClick={skipToMainContent}
      >
        Skip to main content
      </a>

      <aside
        ref={sidebarRef}
        id={sidebarId}
        className={cn(
          'relative h-screen sidebar-nav border-r border-border transition-all',
          accessibility.reducedMotion ? '' : 'duration-300',
          isCollapsed ? 'w-16' : 'w-64',
          accessibility.highContrast && 'border-2 border-solid'
        )}
        role="navigation"
        aria-label={isCollapsed ? 'Collapsed navigation menu' : 'Main navigation menu'}
      >
        {/* Header */}
        <div className="flex h-16 items-center sidebar-separator border-b px-4">
          {!isCollapsed && (
            <div className="flex items-center space-x-3" role="banner" aria-labelledby={logoId}>
              <div 
                className="h-9 w-9 rounded-lg bg-[hsl(var(--sidebar-logo-bg))] flex items-center justify-center shadow-sm transition-colors duration-300"
                aria-hidden="true"
              >
                <svg width="20" height="20" viewBox="0 0 32 32" className="text-[hsl(var(--sidebar-badge-text))]">
                  <path d="M16 6l2.47 5.01L24 12.18l-4 3.9.94 5.5L16 19.15l-4.94 2.59.94-5.5-4-3.9 5.53-1.17L16 6z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <span 
                  id={logoId}
                  className="font-semibold text-[hsl(var(--sidebar-foreground))] text-lg transition-colors duration-300"
                >
                  GS-Star
                </span>
                <div 
                  className="text-xs text-[hsl(var(--sidebar-text-secondary))] transition-colors duration-300"
                  aria-label="Version 5.0"
                >
                  v5.1
                </div>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="mx-auto" role="banner" aria-label="GS-Star">
              <div 
                className="h-8 w-8 rounded-lg bg-[hsl(var(--sidebar-logo-bg))] flex items-center justify-center shadow-sm transition-colors duration-300"
                aria-hidden="true"
              >
                <svg width="16" height="16" viewBox="0 0 32 32" className="text-[hsl(var(--sidebar-badge-text))]">
                  <path d="M16 6l2.47 5.01L24 12.18l-4 3.9.94 5.5L16 19.15l-4.94 2.59.94-5.5-4-3.9 5.53-1.17L16 6z" fill="currentColor"/>
                </svg>
              </div>
            </div>
          )}
          <Button
            id={collapseButtonId}
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapsed}
            className={cn(
              'h-8 w-8 p-0 hover:bg-[hsl(var(--sidebar-hover))] text-[hsl(var(--sidebar-icon))] hover:text-[hsl(var(--sidebar-foreground))] transition-all',
              accessibility.reducedMotion ? '' : 'duration-300',
              isCollapsed ? 'hidden' : 'ml-auto'
            )}
            aria-expanded={!isCollapsed}
            aria-controls={navId}
            aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} sidebar navigation. Keyboard shortcut: Control B`}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav 
          id={navId}
          className="flex-1 overflow-y-auto p-3"
          aria-labelledby={logoId}
        >
          <div 
            className="space-y-1" 
            role="menu"
            aria-orientation="vertical"
            aria-activedescendant={focusedItemId || undefined}
          >
            {filteredNavItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const title = t(item.titleKey as any)
              const itemId = `nav-item-${item.href.replace(/\//g, '-')}`
              const isFocused = activeItemIndex === index

              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link 
                      href={item.href}
                      ref={(el) => registerNavItem(itemId, el)}
                      id={itemId}
                      className={cn(
                        'sidebar-nav-item block',
                        isActive && 'sidebar-nav-item-active',
                        isFocused && 'ring-2 ring-primary ring-offset-2',
                        accessibility.highContrast && isActive && 'border-2 border-current'
                      )}
                      role="menuitem"
                      tabIndex={isFocused ? 0 : -1}
                      aria-current={isActive ? 'page' : undefined}
                      aria-describedby={item.badge ? `${itemId}-badge` : undefined}
                      onFocus={() => {
                        setActiveItemIndex(index)
                        setFocusedItemId(itemId)
                      }}
                      onBlur={() => {
                        if (focusedItemId === itemId) {
                          setFocusedItemId(null)
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <Icon 
                          className="h-4 w-4 flex-shrink-0" 
                          aria-hidden="true"
                        />
                        {!isCollapsed && (
                          <>
                            <span className="truncate transition-colors duration-300 ml-3">
                              {title}
                            </span>
                            {item.badge && (
                              <Badge 
                                id={`${itemId}-badge`}
                                variant="secondary" 
                                className="ml-auto bg-[hsl(var(--sidebar-badge-bg))]/10 text-[hsl(var(--sidebar-badge-bg))] border-0 transition-colors duration-300"
                                aria-label={`${item.badge} notification${item.badge > 1 ? 's' : ''}`}
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
                    <TooltipContent 
                      side="right" 
                      sideOffset={8}
                      role="tooltip"
                    >
                      <p>
                        {title}
                        {item.badge && ` (${item.badge} notification${item.badge > 1 ? 's' : ''})`}
                      </p>
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
              id={expandButtonId}
              variant="ghost"
              size="sm"
              onClick={handleToggleCollapsed}
              className="sidebar-expand-button w-full h-8 p-0 relative"
              aria-expanded={false}
              aria-controls={navId}
              aria-label="Expand sidebar navigation. Keyboard shortcut: Control right bracket"
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
              onClick={handleToggleCollapsed}
              className="sidebar-expand-button h-8 w-8 p-0 rounded-full shadow-md"
              aria-expanded={false}
              aria-controls={navId}
              aria-label="Expand sidebar navigation"
            >
              <ChevronRight className="h-3 w-3" />
              <span className="sr-only">Expand sidebar</span>
            </Button>
          </div>
        )}

        {/* Live region for dynamic announcements */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          id={`${sidebarId}-announcements`}
        />
      </aside>
    </TooltipProvider>
  )
}