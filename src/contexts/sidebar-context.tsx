'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useA11yAnnouncements, useA11yPreferences } from '@/hooks/use-accessibility'
import { FocusManager, ScreenReaderAnnouncer } from '@/lib/accessibility'

interface AccessibilityFeatures {
  reducedMotion: boolean
  highContrast: boolean
  darkTheme: boolean
  fontScale: number
  announceStateChanges: boolean
  keyboardNavigationEnabled: boolean
  focusTrapActive: boolean
}

interface SidebarContextType {
  // Core sidebar state
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  toggleCollapsed: () => void
  
  // Mobile state
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  toggleMobile: () => void
  
  // Accessibility features
  accessibility: AccessibilityFeatures
  updateAccessibility: (updates: Partial<AccessibilityFeatures>) => void
  
  // Navigation state
  activeItemIndex: number
  setActiveItemIndex: (index: number) => void
  navigationItems: Array<{ id: string; label: string; href: string }>
  
  // Focus management
  focusFirstItem: () => void
  focusLastItem: () => void
  focusActiveItem: () => void
  
  // Screen reader announcements
  announceNavigation: (message: string) => void
  announceStateChange: (element: string, state: string, value?: string) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Core sidebar state
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  // Navigation state
  const [activeItemIndex, setActiveItemIndex] = useState(-1)
  const [navigationItems, setNavigationItems] = useState<Array<{ id: string; label: string; href: string }>>([])
  
  // Accessibility preferences
  const preferences = useA11yPreferences()
  const { announce, announceNavigation: baseAnnounceNavigation, announceStateChange: baseAnnounceStateChange } = useA11yAnnouncements()
  
  // Accessibility features state
  const [accessibility, setAccessibility] = useState<AccessibilityFeatures>({
    reducedMotion: false,
    highContrast: false,
    darkTheme: false,
    fontScale: 1,
    announceStateChanges: true,
    keyboardNavigationEnabled: true,
    focusTrapActive: false
  })

  // Refs for focus management
  const sidebarRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    const savedA11y = localStorage.getItem('sidebar-accessibility')
    
    if (savedCollapsed) {
      setIsCollapsed(savedCollapsed === 'true')
    }
    
    if (savedA11y) {
      try {
        const parsedA11y = JSON.parse(savedA11y)
        setAccessibility(prev => ({ ...prev, ...parsedA11y }))
      } catch (error) {
        console.warn('Failed to parse saved accessibility preferences:', error)
      }
    }
  }, [])

  // Update accessibility preferences from system
  useEffect(() => {
    setAccessibility(prev => ({
      ...prev,
      reducedMotion: preferences.reducedMotion,
      highContrast: preferences.highContrast,
      darkTheme: preferences.darkTheme,
      fontScale: preferences.fontScale
    }))
  }, [preferences])

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString())
  }, [isCollapsed])

  // Save accessibility preferences
  useEffect(() => {
    localStorage.setItem('sidebar-accessibility', JSON.stringify(accessibility))
  }, [accessibility])

  // Toggle functions
  const toggleCollapsed = useCallback(() => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    
    if (accessibility.announceStateChanges) {
      baseAnnounceStateChange('Sidebar', newState ? 'collapsed' : 'expanded')
    }
  }, [isCollapsed, accessibility.announceStateChanges, baseAnnounceStateChange])

  const toggleMobile = useCallback(() => {
    const newState = !isMobileOpen
    setIsMobileOpen(newState)
    
    if (accessibility.announceStateChanges) {
      baseAnnounceStateChange('Mobile menu', newState ? 'opened' : 'closed')
    }

    // Manage focus trap for mobile menu
    if (newState) {
      setAccessibility(prev => ({ ...prev, focusTrapActive: true }))
    } else {
      setAccessibility(prev => ({ ...prev, focusTrapActive: false }))
    }
  }, [isMobileOpen, accessibility.announceStateChanges, baseAnnounceStateChange])

  // Update accessibility features
  const updateAccessibility = useCallback((updates: Partial<AccessibilityFeatures>) => {
    setAccessibility(prev => ({ ...prev, ...updates }))
  }, [])

  // Focus management functions
  const focusFirstItem = useCallback(() => {
    if (sidebarRef.current) {
      FocusManager.focusFirst(sidebarRef.current)
      setActiveItemIndex(0)
    }
  }, [])

  const focusLastItem = useCallback(() => {
    if (sidebarRef.current) {
      FocusManager.focusLast(sidebarRef.current)
      setActiveItemIndex(navigationItems.length - 1)
    }
  }, [navigationItems.length])

  const focusActiveItem = useCallback(() => {
    if (activeItemIndex >= 0 && activeItemIndex < navigationItems.length) {
      const item = navigationItems[activeItemIndex]
      const element = itemRefs.current.get(item.id)
      if (element) {
        element.focus()
      }
    }
  }, [activeItemIndex, navigationItems])

  // Register navigation item
  const registerNavigationItem = useCallback((id: string, element: HTMLElement, label: string, href: string) => {
    itemRefs.current.set(id, element)
    setNavigationItems(prev => {
      const existing = prev.find(item => item.id === id)
      if (existing) {
        return prev.map(item => item.id === id ? { id, label, href } : item)
      }
      return [...prev, { id, label, href }]
    })
  }, [])

  // Unregister navigation item
  const unregisterNavigationItem = useCallback((id: string) => {
    itemRefs.current.delete(id)
    setNavigationItems(prev => prev.filter(item => item.id !== id))
  }, [])

  // Enhanced announcement functions
  const announceNavigation = useCallback((message: string) => {
    if (accessibility.announceStateChanges) {
      baseAnnounceNavigation('Sidebar', message)
    }
  }, [accessibility.announceStateChanges, baseAnnounceNavigation])

  const announceStateChange = useCallback((element: string, state: string, value?: string) => {
    if (accessibility.announceStateChanges) {
      baseAnnounceStateChange(element, state, value)
    }
  }, [accessibility.announceStateChanges, baseAnnounceStateChange])

  // Keyboard event handlers
  useEffect(() => {
    if (!accessibility.keyboardNavigationEnabled) return

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Sidebar-specific keyboard shortcuts
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'b': // Ctrl/Cmd + B to toggle sidebar
            event.preventDefault()
            toggleCollapsed()
            break
          case '[': // Ctrl/Cmd + [ to collapse sidebar
            event.preventDefault()
            if (!isCollapsed) {
              setIsCollapsed(true)
              announceStateChange('Sidebar', 'collapsed')
            }
            break
          case ']': // Ctrl/Cmd + ] to expand sidebar
            event.preventDefault()
            if (isCollapsed) {
              setIsCollapsed(false)
              announceStateChange('Sidebar', 'expanded')
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [accessibility.keyboardNavigationEnabled, isCollapsed, toggleCollapsed, announceStateChange])

  // Initialize screen reader announcer
  useEffect(() => {
    ScreenReaderAnnouncer.initialize()
  }, [])

  // Announce when sidebar state changes for screen readers
  useEffect(() => {
    if (accessibility.announceStateChanges) {
      const message = isCollapsed ? 'Sidebar collapsed' : 'Sidebar expanded'
      announce(message, 'polite')
    }
  }, [isCollapsed, accessibility.announceStateChanges, announce])

  const contextValue: SidebarContextType = {
    // Core sidebar state
    isCollapsed,
    setIsCollapsed,
    toggleCollapsed,
    
    // Mobile state
    isMobileOpen,
    setIsMobileOpen,
    toggleMobile,
    
    // Accessibility features
    accessibility,
    updateAccessibility,
    
    // Navigation state
    activeItemIndex,
    setActiveItemIndex,
    navigationItems,
    
    // Focus management
    focusFirstItem,
    focusLastItem,
    focusActiveItem,
    
    // Screen reader announcements
    announceNavigation,
    announceStateChange
  }

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}

// Helper hook for registering navigation items
export function useSidebarNavItem(id: string, label: string, href: string) {
  const { accessibility } = useSidebar()
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (element) {
      // Register the navigation item
      const sidebar = element.closest('[role="navigation"]') as HTMLElement
      if (sidebar) {
        // Add to navigation items list
        element.setAttribute('role', 'menuitem')
        element.setAttribute('data-nav-id', id)
      }
    }
  }, [id, label, href])

  return {
    elementRef,
    ariaProps: {
      role: 'menuitem',
      'data-nav-id': id,
      ...(accessibility.keyboardNavigationEnabled && {
        tabIndex: -1 // Managed by roving tabindex
      })
    }
  }
}