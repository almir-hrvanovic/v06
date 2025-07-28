import { UserRole } from '@prisma/client'
import { NavItem, NavGroup, Breakpoints, SidebarMode } from './types'

// Default breakpoints
export const defaultBreakpoints: Breakpoints = {
  mobile: 767,
  tablet: 1023,
  desktop: 1279,
  wide: 1280,
}

// Default mode mapping
export const defaultModeMap: Record<keyof Breakpoints, SidebarMode> = {
  mobile: 'overlay',     // Drawer overlay on mobile
  tablet: 'overlay',     // Drawer overlay on tablet
  desktop: 'collapsible', // Collapsible sidebar on desktop
  wide: 'persistent',    // Always visible on wide screens
}

// Default animation configuration
export const defaultAnimationConfig = {
  duration: 300,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
  stagger: false,
  disabled: false,
}

// Default theme configuration
export const defaultThemeConfig = {
  borderRadius: 'md' as const,
  shadows: true,
  blur: true,
}

// Utility function to filter navigation items by user role
export function filterNavItemsByRole(navItems: NavItem[], userRole?: UserRole): NavItem[] {
  if (!userRole) return []
  
  return navItems.filter(item => item.roles.includes(userRole))
    .map(item => ({
      ...item,
      children: item.children ? filterNavItemsByRole(item.children, userRole) : undefined
    }))
}

// Utility function to filter navigation groups by user role
export function filterNavGroupsByRole(navGroups: NavGroup[], userRole?: UserRole): NavGroup[] {
  if (!userRole) return []
  
  return navGroups.filter(group => 
    !group.roles || group.roles.includes(userRole)
  ).map(group => ({
    ...group,
    items: filterNavItemsByRole(group.items, userRole)
  })).filter(group => group.items.length > 0)
}

// Utility function to get current breakpoint
export function getCurrentBreakpoint(width: number, breakpoints: Breakpoints): keyof Breakpoints {
  if (width <= breakpoints.mobile) return 'mobile'
  if (width <= breakpoints.tablet) return 'tablet'
  if (width <= breakpoints.desktop) return 'desktop'
  return 'wide'
}

// Utility function to get sidebar mode for breakpoint
export function getSidebarMode(
  breakpoint: keyof Breakpoints,
  modeMap: Record<keyof Breakpoints, SidebarMode>
): SidebarMode {
  return modeMap[breakpoint] || 'persistent'
}

// Utility function to search navigation items
export function searchNavItems(navItems: NavItem[], query: string): NavItem[] {
  const searchTerm = query.toLowerCase().trim()
  if (!searchTerm) return navItems

  const matchesSearch = (item: NavItem): boolean => {
    return item.titleKey.toLowerCase().includes(searchTerm) ||
           item.href.toLowerCase().includes(searchTerm)
  }

  const searchResults: NavItem[] = []

  const searchRecursive = (items: NavItem[]) => {
    for (const item of items) {
      if (matchesSearch(item)) {
        searchResults.push(item)
      }
      if (item.children) {
        searchRecursive(item.children)
      }
    }
  }

  searchRecursive(navItems)
  return searchResults
}

// Utility function to find navigation item by href
export function findNavItemByHref(navItems: NavItem[], href: string): NavItem | null {
  for (const item of navItems) {
    if (item.href === href) return item
    if (item.children) {
      const found = findNavItemByHref(item.children, href)
      if (found) return found
    }
  }
  return null
}

// Utility function to get navigation breadcrumbs
export function getNavBreadcrumbs(navItems: NavItem[], href: string): NavItem[] {
  const breadcrumbs: NavItem[] = []

  const findPath = (items: NavItem[], targetHref: string, path: NavItem[]): boolean => {
    for (const item of items) {
      const currentPath = [...path, item]
      
      if (item.href === targetHref) {
        breadcrumbs.push(...currentPath)
        return true
      }
      
      if (item.children && findPath(item.children, targetHref, currentPath)) {
        return true
      }
    }
    return false
  }

  findPath(navItems, href, [])
  return breadcrumbs
}

// Utility function to flatten navigation hierarchy
export function flattenNavItems(navItems: NavItem[]): NavItem[] {
  const flattened: NavItem[] = []

  const flatten = (items: NavItem[]) => {
    for (const item of items) {
      flattened.push({ ...item, children: undefined })
      if (item.children) {
        flatten(item.children)
      }
    }
  }

  flatten(navItems)
  return flattened
}

// Utility function to group navigation items
export function groupNavItems(navItems: NavItem[], groupBy: (item: NavItem) => string): Record<string, NavItem[]> {
  const groups: Record<string, NavItem[]> = {}

  for (const item of navItems) {
    const groupKey = groupBy(item)
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(item)
  }

  return groups
}

// Utility function to sort navigation items
export function sortNavItems(navItems: NavItem[], sortBy: (a: NavItem, b: NavItem) => number): NavItem[] {
  return [...navItems].sort(sortBy)
}

// Utility function to validate navigation structure
export function validateNavStructure(navItems: NavItem[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const hrefs = new Set<string>()

  const validate = (items: NavItem[], depth: number = 0) => {
    if (depth > 3) {
      errors.push('Navigation hierarchy exceeds maximum depth of 3 levels')
    }

    for (const item of items) {
      // Check for duplicate hrefs
      if (hrefs.has(item.href)) {
        errors.push(`Duplicate href found: ${item.href}`)
      } else {
        hrefs.add(item.href)
      }

      // Check required fields
      if (!item.titleKey) {
        errors.push(`Missing titleKey for item with href: ${item.href}`)
      }
      if (!item.href) {
        errors.push(`Missing href for item with titleKey: ${item.titleKey}`)
      }
      if (!item.icon) {
        errors.push(`Missing icon for item: ${item.titleKey}`)
      }
      if (!item.roles || item.roles.length === 0) {
        errors.push(`Missing roles for item: ${item.titleKey}`)
      }

      // Validate children recursively
      if (item.children) {
        validate(item.children, depth + 1)
      }
    }
  }

  validate(navItems)

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Utility function to persist sidebar state
export function persistSidebarState(key: string, state: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch (error) {
    console.warn('Failed to persist sidebar state:', error)
  }
}

// Utility function to restore sidebar state
export function restoreSidebarState<T>(key: string, defaultState: T): T {
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      return { ...defaultState, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.warn('Failed to restore sidebar state:', error)
  }
  return defaultState
}

// Utility function to debounce function calls
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Utility function to throttle function calls
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// Utility function to create CSS class names with responsive variants
export function createResponsiveClasses(
  baseClasses: string,
  variants: Partial<Record<keyof Breakpoints, string>>
): string {
  let classes = baseClasses

  if (variants.mobile) classes += ` max-sm:${variants.mobile}`
  if (variants.tablet) classes += ` sm:max-lg:${variants.tablet}`
  if (variants.desktop) classes += ` lg:max-xl:${variants.desktop}`
  if (variants.wide) classes += ` xl:${variants.wide}`

  return classes
}

// Utility function to get responsive value
export function getResponsiveValue<T>(
  values: Partial<Record<keyof Breakpoints, T>>,
  currentBreakpoint: keyof Breakpoints,
  defaultValue: T
): T {
  return values[currentBreakpoint] ?? defaultValue
}