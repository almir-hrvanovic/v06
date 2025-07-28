'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { 
  Breakpoints, 
  SidebarMode, 
  UseBreakpointReturn, 
  UseSidebarReturn,
  SidebarState,
  NavItem 
} from './types'
import { 
  getCurrentBreakpoint, 
  getSidebarMode, 
  persistSidebarState, 
  restoreSidebarState,
  searchNavItems,
  debounce 
} from './utils'

// Hook for responsive breakpoint detection with additional utilities
export function useBreakpoint(breakpoints: Breakpoints): UseBreakpointReturn {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof Breakpoints>('wide')
  const [windowWidth, setWindowWidth] = useState(0)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setWindowWidth(width)
      setCurrentBreakpoint(getCurrentBreakpoint(width, breakpoints))
    }

    // Set initial size
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoints])

  const derived = useMemo(() => ({
    isMobile: currentBreakpoint === 'mobile',
    isTablet: currentBreakpoint === 'tablet',
    isDesktop: currentBreakpoint === 'desktop',
    isWide: currentBreakpoint === 'wide',
  }), [currentBreakpoint])

  return { 
    currentBreakpoint, 
    windowWidth,
    ...derived
  }
}

// Enhanced sidebar hook with persistence and advanced state management
export function useResponsiveSidebar(
  breakpoints: Breakpoints,
  modeMap: Record<keyof Breakpoints, SidebarMode>,
  options: {
    enablePersistence?: boolean
    persistenceKey?: string
    defaultCollapsed?: boolean
    defaultOpen?: boolean
  } = {}
): UseSidebarReturn {
  const {
    enablePersistence = true,
    persistenceKey = 'responsive-sidebar-state',
    defaultCollapsed = false,
    defaultOpen = false
  } = options

  const { currentBreakpoint, windowWidth } = useBreakpoint(breakpoints)
  const currentMode = getSidebarMode(currentBreakpoint, modeMap)

  // Initialize state with persistence
  const [state, setState] = useState<SidebarState>(() => {
    const defaultState: SidebarState = {
      isCollapsed: defaultCollapsed,
      isOpen: defaultOpen,
      currentMode,
      currentBreakpoint,
      windowWidth: 0
    }

    if (enablePersistence && typeof window !== 'undefined') {
      return restoreSidebarState(persistenceKey, defaultState)
    }

    return defaultState
  })

  // Update state when breakpoint changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      currentMode,
      currentBreakpoint,
      windowWidth
    }))
  }, [currentMode, currentBreakpoint, windowWidth])

  // Persist state changes
  useEffect(() => {
    if (enablePersistence) {
      persistSidebarState(persistenceKey, {
        isCollapsed: state.isCollapsed,
        isOpen: state.isOpen
      })
    }
  }, [state.isCollapsed, state.isOpen, enablePersistence, persistenceKey])

  // State update functions
  const toggleCollapsed = useCallback(() => {
    setState(prev => ({ ...prev, isCollapsed: !prev.isCollapsed }))
  }, [])

  const setIsCollapsed = useCallback((collapsed: boolean) => {
    setState(prev => ({ ...prev, isCollapsed: collapsed }))
  }, [])

  const toggleOpen = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: !prev.isOpen }))
  }, [])

  const setIsOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isOpen: open }))
  }, [])

  const reset = useCallback(() => {
    const resetState: SidebarState = {
      isCollapsed: defaultCollapsed,
      isOpen: defaultOpen,
      currentMode,
      currentBreakpoint,
      windowWidth
    }
    setState(resetState)

    if (enablePersistence) {
      persistSidebarState(persistenceKey, {
        isCollapsed: defaultCollapsed,
        isOpen: defaultOpen
      })
    }
  }, [
    defaultCollapsed, 
    defaultOpen, 
    currentMode, 
    currentBreakpoint, 
    windowWidth, 
    enablePersistence, 
    persistenceKey
  ])

  return {
    ...state,
    toggleCollapsed,
    setIsCollapsed,
    toggleOpen,
    setIsOpen,
    reset
  }
}

// Hook for navigation search functionality
export function useNavigationSearch(navItems: NavItem[], debounceMs: number = 300) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<NavItem[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setIsSearching(true)
      const results = searchNavItems(navItems, query)
      setSearchResults(results)
      setIsSearching(false)
    }, debounceMs),
    [navItems, debounceMs]
  )

  // Handle search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery)
    } else {
      setSearchResults([])
      setIsSearching(false)
    }
  }, [searchQuery, debouncedSearch])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setIsSearching(false)
  }, [])

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    clearSearch,
    hasResults: searchResults.length > 0
  }
}

// Hook for active navigation tracking
export function useActiveNavigation(navItems: NavItem[]) {
  const pathname = usePathname()
  
  const activeItem = useMemo(() => {
    const findActive = (items: NavItem[]): NavItem | null => {
      for (const item of items) {
        if (item.href === pathname) return item
        if (item.children) {
          const childActive = findActive(item.children)
          if (childActive) return childActive
        }
      }
      return null
    }
    
    return findActive(navItems)
  }, [navItems, pathname])

  const getBreadcrumbs = useCallback(() => {
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

    findPath(navItems, pathname, [])
    return breadcrumbs
  }, [navItems, pathname])

  const isActive = useCallback((href: string) => {
    return pathname === href
  }, [pathname])

  const isParentActive = useCallback((item: NavItem) => {
    if (!item.children) return false
    
    const checkChildren = (children: NavItem[]): boolean => {
      for (const child of children) {
        if (child.href === pathname) return true
        if (child.children && checkChildren(child.children)) return true
      }
      return false
    }
    
    return checkChildren(item.children)
  }, [pathname])

  return {
    activeItem,
    breadcrumbs: getBreadcrumbs(),
    isActive,
    isParentActive
  }
}

// Hook for keyboard navigation
export function useKeyboardNavigation(
  navItems: NavItem[],
  onNavigate?: (href: string) => void
) {
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const flatItems = useMemo(() => {
    const flatten = (items: NavItem[]): NavItem[] => {
      const result: NavItem[] = []
      for (const item of items) {
        result.push(item)
        if (item.children) {
          result.push(...flatten(item.children))
        }
      }
      return result
    }
    return flatten(navItems)
  }, [navItems])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => 
            prev < flatItems.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : flatItems.length - 1
          )
          break
        case 'Enter':
        case ' ':
          event.preventDefault()
          if (focusedIndex >= 0 && focusedIndex < flatItems.length) {
            const item = flatItems[focusedIndex]
            onNavigate?.(item.href)
          }
          break
        case 'Escape':
          setFocusedIndex(-1)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedIndex, flatItems, onNavigate])

  return {
    focusedIndex,
    setFocusedIndex,
    focusedItem: focusedIndex >= 0 ? flatItems[focusedIndex] : null
  }
}

// Hook for managing sidebar animations
export function useSidebarAnimation(
  isVisible: boolean,  
  animationConfig: { duration: number; easing: string; disabled: boolean }
) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'exit' | 'idle'>('idle')

  useEffect(() => {
    if (animationConfig.disabled) return

    if (isVisible) {
      setAnimationPhase('enter')
      setIsAnimating(true)
      
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setAnimationPhase('idle')
      }, animationConfig.duration)
      
      return () => clearTimeout(timer)
    } else {
      setAnimationPhase('exit')
      setIsAnimating(true)
      
      const timer = setTimeout(() => {
        setIsAnimating(false)
        setAnimationPhase('idle')
      }, animationConfig.duration)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, animationConfig])

  return {
    isAnimating,
    animationPhase,
    shouldRender: isVisible || animationPhase === 'exit'
  }
}