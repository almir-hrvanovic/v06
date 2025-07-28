'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResponsiveDrawer } from '@/components/ui/responsive-drawer'
import { useSession } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useSidebar } from '@/contexts/sidebar-context'
import { 
  useA11yFocusTrap, 
  useA11yListNavigation, 
  useA11yKeyboardNav,
  useA11yId 
} from '@/hooks/use-accessibility'
import { KEYBOARD_KEYS, ariaProps, FocusManager } from '@/lib/accessibility'
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
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role
  const t = useTranslations()
  
  // Use enhanced sidebar context
  const { 
    isMobileOpen: isOpen, 
    setIsMobileOpen: setIsOpen, 
    toggleMobile: toggleOpen,
    accessibility,
    announceStateChange,
    activeItemIndex,
    setActiveItemIndex
  } = useSidebar()

  // Accessibility IDs
  const menuButtonId = useA11yId('mobile-menu-btn')
  const menuId = useA11yId('mobile-menu')
  const navId = useA11yId('mobile-nav')
  const closeButtonId = useA11yId('mobile-close-btn')

  // Refs for focus management
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const navItemRefs = useRef<Map<string, HTMLElement>>(new Map())
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)

  const filteredNavItems = navItems.filter(item => 
    userRole && item.roles.includes(userRole)
  )

  // Focus trap for mobile menu
  const focusTrap = useA11yFocusTrap(isOpen)

  // Navigation elements for keyboard navigation
  const navElements = Array.from(navItemRefs.current.values())

  // List navigation for menu items
  const listNavigation = useA11yListNavigation(navElements, {
    orientation: 'vertical',
    loop: true,
    onSelect: (index) => {
      const item = filteredNavItems[index]
      if (item) {
        setIsOpen(false)
        // Small delay to allow drawer to close before navigation
        setTimeout(() => {
          window.location.href = item.href
        }, 150)
      }
    },
    onEscape: () => {
      setIsOpen(false)
      // Return focus to menu button
      setTimeout(() => {
        menuButtonRef.current?.focus()
      }, 150)
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

  // Handle menu open/close
  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    
    if (accessibility.announceStateChanges) {
      announceStateChange(
        'Mobile menu', 
        newState ? 'opened' : 'closed',
        newState ? 'Use Escape to close' : undefined
      )
    }
  }

  // Handle item selection
  const handleItemClick = (item: NavItem) => {
    setIsOpen(false)
    
    if (accessibility.announceStateChanges) {
      announceStateChange('Navigation', `selected ${t(item.titleKey as any)}`)
    }
  }

  // Auto-focus first item when menu opens
  useEffect(() => {
    if (isOpen && navElements.length > 0) {
      // Small delay to ensure drawer is fully rendered
      setTimeout(() => {
        listNavigation.moveToFirst()
      }, 200)
    }
  }, [isOpen, navElements.length])

  // Keyboard navigation for menu button
  const menuButtonKeyboard = useA11yKeyboardNav({
    onEnter: handleToggle,
    onSpace: handleToggle,
    onArrowDown: () => {
      if (isOpen && navElements.length > 0) {
        listNavigation.moveToFirst()
      }
    }
  })

  const SidebarContent = () => (
    <div 
      className={cn(
        "flex h-full w-full flex-col bg-white dark:bg-gray-900",
        accessibility.highContrast && "border border-solid"
      )}
    >
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
        <Link 
          href="/dashboard" 
          className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
          onClick={() => {
            setIsOpen(false)
            announceStateChange('Navigation', 'selected Dashboard')
          }}
          aria-label="Go to Dashboard - GS CMS version 5"
        >
          <div 
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 32 32" className="text-primary-foreground">
              <path d="M16 6l2.47 5.01L24 12.18l-4 3.9.94 5.5L16 19.15l-4.94 2.59.94-5.5-4-3.9 5.53-1.17L16 6z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-lg font-semibold">CMS v05</span>
        </Link>
        
        {/* Close button for better accessibility */}
        <Button
          id={closeButtonId}
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(false)}
          className="h-8 w-8 p-0"
          aria-label="Close mobile navigation menu"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close menu</span>
        </Button>
      </header>

      {/* Navigation */}
      <nav 
        id={navId}
        className="flex-1 space-y-1 px-3 py-4 overflow-y-auto" 
        aria-label="Main navigation"
      >
        <div 
          role="menu"
          aria-orientation="vertical"
          aria-activedescendant={focusedItemId || undefined}
        >
          {filteredNavItems.map((item, index) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            const title = t(item.titleKey as any)
            const itemId = `mobile-nav-item-${item.href.replace(/\//g, '-')}`
            const isFocused = activeItemIndex === index

            return (
              <Button
                key={item.href}
                ref={(el) => registerNavItem(itemId, el)}
                id={itemId}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start px-3 py-3 text-left h-auto',
                  isActive && 'bg-secondary text-secondary-foreground',
                  isFocused && 'ring-2 ring-primary ring-offset-2',
                  accessibility.highContrast && isActive && 'border-2 border-current'
                )}
                asChild
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
                onClick={() => handleItemClick(item)}
              >
                <Link href={item.href}>
                  <Icon 
                    className="mr-3 h-5 w-5 flex-shrink-0" 
                    aria-hidden="true"
                  />
                  <span className="truncate">{title}</span>
                  {item.badge && item.badge > 0 && (
                    <Badge 
                      id={`${itemId}-badge`}
                      variant="destructive" 
                      className="ml-auto"
                      aria-label={`${item.badge} notification${item.badge > 1 ? 's' : ''}`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </Button>
            )
          })}
        </div>
      </nav>

      {/* User Info */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4" role="contentinfo">
        <div className="flex items-center space-x-3">
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0"
            aria-hidden="true"
          >
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

      {/* Live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id={`${menuId}-announcements`}
      />
    </div>
  )

  return (
    <>
      {/* Show on ALL screen sizes */}
      <div className={className || "block"}>
        <Button
          id={menuButtonId}
          ref={menuButtonRef}
          variant="ghost"
          size="sm"
          className="mobile-sidebar-trigger h-9 w-9 p-0"
          onClick={handleToggle}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-controls={menuId}
          aria-label={`${isOpen ? 'Close' : 'Open'} mobile navigation menu`}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">
            {isOpen ? 'Close' : 'Open'} navigation menu
          </span>
        </Button>
      </div>
      
      <ResponsiveDrawer
        open={isOpen}
        onOpenChange={setIsOpen}
        side="left"
        title="Navigation Menu"
        description="Main Navigation"
        className="p-0"
        aria-modal="true"
        aria-labelledby={menuId}
        aria-describedby={`${menuId}-description`}
      >
        <div id={`${menuId}-description`} className="sr-only">
          Use arrow keys to navigate, Enter to select, Escape to close.
        </div>
        <SidebarContent />
      </ResponsiveDrawer>
    </>
  )
}