/**
 * Comprehensive Accessibility Hooks for React Components
 * Provides focus management, keyboard navigation, and ARIA support
 */

import { useEffect, useRef, useState, useCallback, useMemo, useId } from 'react'
import {
  FocusManager,
  ScreenReaderAnnouncer,
  KeyboardNavigation,
  AccessibilityPreferences,
  KEYBOARD_KEYS,
  a11yUtils
} from '@/lib/accessibility'

// Focus trap hook
export function useA11yFocusTrap(isActive: boolean = false) {
  const containerRef = useRef<HTMLElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (isActive && containerRef.current) {
      // Save current focus
      const savedFocus = FocusManager.saveFocus()
      
      // Create focus trap
      cleanupRef.current = FocusManager.trapFocus(containerRef.current)
      
      return () => {
        // Cleanup trap
        if (cleanupRef.current) {
          cleanupRef.current()
          cleanupRef.current = null
        }
        
        // Restore focus if no saved focus exists
        if (!savedFocus) {
          FocusManager.restoreFocus()
        }
      }
    }
  }, [isActive])

  // Manual cleanup function
  const releaseTrap = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
  }, [])

  return {
    containerRef,
    releaseTrap,
    isTrapped: isActive && cleanupRef.current !== null
  }
}

// Keyboard navigation hook
export function useA11yKeyboardNav<T extends HTMLElement = HTMLElement>(
  options: {
    onEscape?: () => void
    onEnter?: (element: T) => void
    onSpace?: (element: T) => void
    onArrowUp?: (element: T) => void
    onArrowDown?: (element: T) => void
    onArrowLeft?: (element: T) => void
    onArrowRight?: (element: T) => void
    onHome?: (element: T) => void
    onEnd?: (element: T) => void
    onTab?: (element: T, shiftKey: boolean) => void
    role?: string
    preventDefaultKeys?: string[]
  } = {}
) {
  const elementRef = useRef<T>(null)
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!elementRef.current) return
    
    const {
      onEscape,
      onEnter,
      onSpace,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onHome,
      onEnd,
      onTab,
      preventDefaultKeys = []
    } = options
    
    const element = elementRef.current
    const shouldPreventDefault = preventDefaultKeys.includes(event.key)
    
    if (shouldPreventDefault) {
      event.preventDefault()
    }
    
    switch (event.key) {
      case KEYBOARD_KEYS.ESCAPE:
        if (onEscape) {
          event.preventDefault()
          onEscape()
        }
        break
      case KEYBOARD_KEYS.ENTER:
        if (onEnter) {
          event.preventDefault()
          onEnter(element)
        }
        break
      case KEYBOARD_KEYS.SPACE:
        if (onSpace) {
          event.preventDefault()
          onSpace(element)
        }
        break
      case KEYBOARD_KEYS.ARROW_UP:
        if (onArrowUp) {
          event.preventDefault()
          onArrowUp(element)
        }
        break
      case KEYBOARD_KEYS.ARROW_DOWN:
        if (onArrowDown) {
          event.preventDefault()
          onArrowDown(element)
        }
        break
      case KEYBOARD_KEYS.ARROW_LEFT:
        if (onArrowLeft) {
          event.preventDefault()
          onArrowLeft(element)
        }
        break
      case KEYBOARD_KEYS.ARROW_RIGHT:
        if (onArrowRight) {
          event.preventDefault()
          onArrowRight(element)
        }
        break
      case KEYBOARD_KEYS.HOME:
        if (onHome) {
          event.preventDefault()
          onHome(element)
        }
        break
      case KEYBOARD_KEYS.END:
        if (onEnd) {
          event.preventDefault()
          onEnd(element)
        }
        break
      case KEYBOARD_KEYS.TAB:
        if (onTab) {
          onTab(element, event.shiftKey)
        }
        break
    }
  }, [options])
  
  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    
    element.addEventListener('keydown', handleKeyDown)
    return () => element.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
  
  return {
    elementRef,
    handleKeyDown
  }
}

// Screen reader announcements hook
export function useA11yAnnouncements() {
  const announce = useCallback((message: string, priority: 'assertive' | 'polite' = 'polite') => {
    if (priority === 'assertive') {
      ScreenReaderAnnouncer.announce(message)
    } else {
      ScreenReaderAnnouncer.announcePolite(message)
    }
  }, [])

  const announceNavigation = useCallback((from: string, to: string) => {
    announce(`Navigated from ${from} to ${to}`, 'polite')
  }, [announce])

  const announceStateChange = useCallback((element: string, state: string, value?: string) => {
    const message = value 
      ? `${element} ${state} ${value}`
      : `${element} ${state}`
    announce(message, 'assertive')
  }, [announce])

  const announceError = useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive')
  }, [announce])

  const announceSuccess = useCallback((message: string) => {
    announce(`Success: ${message}`, 'polite')
  }, [announce])

  return {
    announce,
    announceNavigation,
    announceStateChange,
    announceError,
    announceSuccess
  }
}

// User preferences hook
export function useA11yPreferences() {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    darkTheme: false,
    fontScale: 1
  })

  useEffect(() => {
    // Initialize preferences
    setPreferences({
      reducedMotion: AccessibilityPreferences.prefersReducedMotion(),
      highContrast: AccessibilityPreferences.prefersHighContrast(),
      darkTheme: AccessibilityPreferences.prefersDarkTheme(),
      fontScale: AccessibilityPreferences.getFontSizeScale()
    })

    // Watch for changes
    const cleanup = AccessibilityPreferences.watchPreferences(setPreferences)
    
    return cleanup
  }, [])

  return preferences
}

// ARIA state management hook
export function useA11yState<T = any>(initialState: T) {
  const [state, setState] = useState<T>(initialState)
  const [announcements, setAnnouncements] = useState<string[]>([])
  const { announce } = useA11yAnnouncements()

  const setStateWithAnnouncement = useCallback((
    newState: T | ((prevState: T) => T),
    announcement?: string
  ) => {
    setState(prevState => {
      const nextState = typeof newState === 'function' 
        ? (newState as (prevState: T) => T)(prevState)
        : newState

      if (announcement) {
        announce(announcement, 'assertive')
        setAnnouncements(prev => [...prev, announcement])
      }

      return nextState
    })
  }, [announce])

  const clearAnnouncements = useCallback(() => {
    setAnnouncements([])
  }, [])

  return {
    state,
    setState: setStateWithAnnouncement,
    announcements,
    clearAnnouncements
  }
}

// List navigation hook (for menus, sidebars, etc.)
export function useA11yListNavigation<T extends HTMLElement = HTMLElement>(
  items: T[],
  options: {
    loop?: boolean
    orientation?: 'horizontal' | 'vertical'
    onSelect?: (index: number, item: T) => void
    onEscape?: () => void
    autoFocus?: boolean
  } = {}
) {
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const { loop = true, orientation = 'vertical', onSelect, onEscape, autoFocus = false } = options
  const containerRef = useRef<HTMLElement>(null)

  // Auto-focus first item when items change
  useEffect(() => {
    if (autoFocus && items.length > 0 && currentIndex === -1) {
      setCurrentIndex(0)
      items[0]?.focus()
    }
  }, [items, autoFocus, currentIndex])

  const moveToIndex = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index)
      items[index]?.focus()
    }
  }, [items])

  const moveNext = useCallback(() => {
    const nextIndex = currentIndex >= items.length - 1 
      ? (loop ? 0 : currentIndex)
      : currentIndex + 1
    moveToIndex(nextIndex)
  }, [currentIndex, items.length, loop, moveToIndex])

  const movePrevious = useCallback(() => {
    const prevIndex = currentIndex <= 0 
      ? (loop ? items.length - 1 : 0)
      : currentIndex - 1
    moveToIndex(prevIndex)
  }, [currentIndex, items.length, loop, moveToIndex])

  const moveToFirst = useCallback(() => {
    moveToIndex(0)
  }, [moveToIndex])

  const moveToLast = useCallback(() => {
    moveToIndex(items.length - 1)
  }, [items.length, moveToIndex])

  const selectCurrent = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < items.length && onSelect) {
      onSelect(currentIndex, items[currentIndex])
    }
  }, [currentIndex, items, onSelect])

  const keyboardProps = useA11yKeyboardNav({
    onArrowUp: orientation === 'vertical' ? movePrevious : undefined,
    onArrowDown: orientation === 'vertical' ? moveNext : undefined,
    onArrowLeft: orientation === 'horizontal' ? movePrevious : undefined,
    onArrowRight: orientation === 'horizontal' ? moveNext : undefined,
    onHome: moveToFirst,
    onEnd: moveToLast,
    onEnter: selectCurrent,
    onSpace: selectCurrent,
    onEscape: onEscape,
    preventDefaultKeys: [
      KEYBOARD_KEYS.ARROW_UP,
      KEYBOARD_KEYS.ARROW_DOWN,
      KEYBOARD_KEYS.ARROW_LEFT,
      KEYBOARD_KEYS.ARROW_RIGHT,
      KEYBOARD_KEYS.HOME,
      KEYBOARD_KEYS.END,
      KEYBOARD_KEYS.ENTER,
      KEYBOARD_KEYS.SPACE
    ]
  })

  return {
    currentIndex,
    setCurrentIndex,
    moveToIndex,
    moveNext,
    movePrevious,
    moveToFirst,
    moveToLast,
    selectCurrent,
    containerRef: keyboardProps.elementRef,
    keyboardProps: {
      ref: keyboardProps.elementRef,
      onKeyDown: keyboardProps.handleKeyDown
    }
  }
}

// Landmark navigation hook
export function useA11yLandmarks() {
  const [landmarks, setLandmarks] = useState<HTMLElement[]>([])
  const [currentLandmark, setCurrentLandmark] = useState<number>(-1)

  useEffect(() => {
    const updateLandmarks = () => {
      const landmarkSelectors = [
        '[role="banner"]',
        '[role="navigation"]', 
        '[role="main"]',
        '[role="complementary"]',
        '[role="contentinfo"]',
        'header',
        'nav',
        'main',
        'aside',
        'footer'
      ]
      
      const found = document.querySelectorAll(landmarkSelectors.join(', '))
      setLandmarks(Array.from(found) as HTMLElement[])
    }

    updateLandmarks()
    
    // Update landmarks when DOM changes
    const observer = new MutationObserver(updateLandmarks)
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => observer.disconnect()
  }, [])

  const navigateToLandmark = useCallback((index: number) => {
    if (index >= 0 && index < landmarks.length) {
      setCurrentLandmark(index)
      FocusManager.focusFirst(landmarks[index])
    }
  }, [landmarks])

  const navigateToNext = useCallback(() => {
    const nextIndex = currentLandmark >= landmarks.length - 1 ? 0 : currentLandmark + 1
    navigateToLandmark(nextIndex)
  }, [currentLandmark, landmarks.length, navigateToLandmark])

  const navigateToPrevious = useCallback(() => {
    const prevIndex = currentLandmark <= 0 ? landmarks.length - 1 : currentLandmark - 1
    navigateToLandmark(prevIndex)
  }, [currentLandmark, landmarks.length, navigateToLandmark])

  return {
    landmarks,
    currentLandmark,
    navigateToLandmark,
    navigateToNext,
    navigateToPrevious
  }
}

// ID generation hook for ARIA relationships
export function useA11yId(prefix?: string) {
  const reactId = useId()
  const id = useMemo(() => {
    return prefix ? `${prefix}-${reactId}` : reactId
  }, [prefix, reactId])
  
  return id
}

// Composite accessibility hook for complex components
export function useA11yComposite<T extends HTMLElement = HTMLElement>(
  options: {
    role?: string
    label?: string
    description?: string
    focusTrap?: boolean
    keyboardNav?: boolean
    announcements?: boolean
    listNavigation?: {
      items: T[]
      orientation?: 'horizontal' | 'vertical'
      onSelect?: (index: number, item: T) => void
    }
  } = {}
) {
  const {
    role,
    label,
    description,
    focusTrap = false,
    keyboardNav = true,
    announcements = true,
    listNavigation
  } = options

  // Generate IDs for ARIA relationships
  const labelId = useA11yId('label')
  const descriptionId = useA11yId('desc')

  // Focus trap
  const focusTrapHook = useA11yFocusTrap(focusTrap)

  // Keyboard navigation
  const keyboardHook = useA11yKeyboardNav(keyboardNav ? {} : undefined)

  // Announcements
  const announcementHook = useA11yAnnouncements()

  // List navigation
  const listHook = useA11yListNavigation(
    listNavigation?.items || [],
    listNavigation ? {
      orientation: listNavigation.orientation,
      onSelect: listNavigation.onSelect
    } : undefined
  )

  // Combine refs
  const combinedRef = useCallback((element: T | null) => {
    if (focusTrapHook.containerRef) {
      focusTrapHook.containerRef.current = element
    }
    if (keyboardHook.elementRef) {
      keyboardHook.elementRef.current = element
    }
    if (listHook?.containerRef) {
      listHook.containerRef.current = element
    }
  }, [focusTrapHook, keyboardHook, listHook])

  // Combined props
  const ariaProps = useMemo(() => ({
    ...(role && { role }),
    ...(label && { 'aria-label': label, 'aria-labelledby': labelId }),
    ...(description && { 'aria-describedby': descriptionId }),
    ...(listHook && {
      'aria-activedescendant': listHook.currentIndex >= 0 
        ? `item-${listHook.currentIndex}` 
        : undefined
    })
  }), [role, label, description, labelId, descriptionId, listHook])

  return {
    // Refs
    ref: combinedRef,
    labelId,
    descriptionId,
    
    // Props
    ariaProps,
    
    // Focus management
    focusTrap: focusTrapHook,
    
    // Keyboard navigation
    keyboard: keyboardHook,
    
    // Announcements
    announcements: announcements ? announcementHook : null,
    
    // List navigation
    list: listHook,
    
    // Utility functions
    focusFirst: () => {
      const element = focusTrapHook.containerRef.current || keyboardHook.elementRef.current
      if (element) {
        FocusManager.focusFirst(element)
      }
    },
    
    focusLast: () => {
      const element = focusTrapHook.containerRef.current || keyboardHook.elementRef.current
      if (element) {
        FocusManager.focusLast(element)
      }
    }
  }
}