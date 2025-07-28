/**
 * Comprehensive Accessibility Utilities for WCAG 2.2 Compliance
 * Provides focus management, ARIA helpers, keyboard navigation, and more
 */

import React, { RefObject } from 'react'

// ARIA role definitions
export const ARIA_ROLES = {
  navigation: 'navigation',
  banner: 'banner',
  main: 'main',
  complementary: 'complementary',
  contentinfo: 'contentinfo',
  search: 'search',
  button: 'button',
  menu: 'menu',
  menuitem: 'menuitem',
  menubar: 'menubar',
  region: 'region',
  dialog: 'dialog',
  alertdialog: 'alertdialog',
  tablist: 'tablist',
  tab: 'tab',
  tabpanel: 'tabpanel',
  listbox: 'listbox',
  option: 'option',
  tree: 'tree',
  treeitem: 'treeitem',
  grid: 'grid',
  gridcell: 'gridcell',
  presentation: 'presentation',
  none: 'none'
} as const

// ARIA state and property helpers
export const ARIA_STATES = {
  expanded: 'aria-expanded',
  selected: 'aria-selected',
  checked: 'aria-checked',
  pressed: 'aria-pressed',
  current: 'aria-current',
  hidden: 'aria-hidden',
  disabled: 'aria-disabled',
  invalid: 'aria-invalid',
  required: 'aria-required',
  readonly: 'aria-readonly',
  live: 'aria-live',
  atomic: 'aria-atomic',
  busy: 'aria-busy',
  controls: 'aria-controls',
  describedby: 'aria-describedby',
  labelledby: 'aria-labelledby',
  owns: 'aria-owns',
  activedescendant: 'aria-activedescendant',
  haspopup: 'aria-haspopup',
  orientation: 'aria-orientation',
  level: 'aria-level',
  posinset: 'aria-posinset',
  setsize: 'aria-setsize',
  valuemin: 'aria-valuemin',
  valuemax: 'aria-valuemax',
  valuenow: 'aria-valuenow',
  valuetext: 'aria-valuetext'
} as const

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  F6: 'F6'
} as const

// Focus management utilities
export class FocusManager {
  private static focusStack: HTMLElement[] = []
  private static trapStack: { element: HTMLElement; previousFocus?: HTMLElement }[] = []

  /**
   * Save the currently focused element to restore later
   */
  static saveFocus(): HTMLElement | null {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement !== document.body) {
      this.focusStack.push(activeElement)
      return activeElement
    }
    return null
  }

  /**
   * Restore the previously saved focus
   */
  static restoreFocus(): boolean {
    const elementToFocus = this.focusStack.pop()
    if (elementToFocus && document.contains(elementToFocus)) {
      elementToFocus.focus()
      return true
    }
    return false
  }

  /**
   * Move focus to the first focusable element within a container
   */
  static focusFirst(container: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
      return true
    }
    return false
  }

  /**
   * Move focus to the last focusable element within a container
   */
  static focusLast(container: HTMLElement): boolean {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus()
      return true
    }
    return false
  }

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter((element) => {
        const el = element as HTMLElement
        return this.isVisible(el) && !this.isInert(el)
      }) as HTMLElement[]
  }

  /**
   * Check if an element is visible
   */
  static isVisible(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element)
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetParent !== null
    )
  }

  /**
   * Check if an element is inert (cannot be focused)
   */
  static isInert(element: HTMLElement): boolean {
    return element.hasAttribute('inert') || element.closest('[inert]') !== null
  }

  /**
   * Create a focus trap within a container
   */
  static trapFocus(container: HTMLElement): () => void {
    const previousFocus = document.activeElement as HTMLElement
    this.trapStack.push({ element: container, previousFocus })

    // Focus the first focusable element
    this.focusFirst(container)

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYBOARD_KEYS.TAB) {
        const focusableElements = this.getFocusableElements(container)
        if (focusableElements.length === 0) {
          event.preventDefault()
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]
        const currentFocus = document.activeElement as HTMLElement

        if (event.shiftKey) {
          // Shift + Tab
          if (currentFocus === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab
          if (currentFocus === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      const trapInfo = this.trapStack.pop()
      if (trapInfo?.previousFocus && document.contains(trapInfo.previousFocus)) {
        trapInfo.previousFocus.focus()
      }
    }
  }
}

// Screen reader announcement utilities
export class ScreenReaderAnnouncer {
  private static liveRegion: HTMLElement | null = null
  private static politeRegion: HTMLElement | null = null

  /**
   * Initialize live regions for screen reader announcements
   */
  static initialize(): void {
    if (!this.liveRegion) {
      this.liveRegion = document.createElement('div')
      this.liveRegion.setAttribute('aria-live', 'assertive')
      this.liveRegion.setAttribute('aria-atomic', 'true')
      this.liveRegion.setAttribute('class', 'sr-only')
      this.liveRegion.style.cssText = `
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      `
      document.body.appendChild(this.liveRegion)
    }

    if (!this.politeRegion) {
      this.politeRegion = document.createElement('div')
      this.politeRegion.setAttribute('aria-live', 'polite')
      this.politeRegion.setAttribute('aria-atomic', 'true')
      this.politeRegion.setAttribute('class', 'sr-only')
      this.politeRegion.style.cssText = this.liveRegion.style.cssText
      document.body.appendChild(this.politeRegion)
    }
  }

  /**
   * Announce a message to screen readers (assertive)
   */
  static announce(message: string): void {
    this.initialize()
    if (this.liveRegion) {
      // Clear and then set to ensure announcement
      this.liveRegion.textContent = ''
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = message
        }
      }, 100)
    }
  }

  /**
   * Announce a message to screen readers (polite)
   */
  static announcePolite(message: string): void {
    this.initialize()
    if (this.politeRegion) {
      this.politeRegion.textContent = ''
      setTimeout(() => {
        if (this.politeRegion) {
          this.politeRegion.textContent = message
        }
      }, 100)
    }
  }
}

// Keyboard navigation helpers
export class KeyboardNavigation {
  /**
   * Handle arrow key navigation in a list
   */
  static handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    onSelect?: (index: number) => void
  ): number {
    let newIndex = currentIndex

    switch (event.key) {
      case KEYBOARD_KEYS.ARROW_UP:
        event.preventDefault()
        newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        break
      case KEYBOARD_KEYS.ARROW_DOWN:
        event.preventDefault()
        newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        break
      case KEYBOARD_KEYS.HOME:
        event.preventDefault()
        newIndex = 0
        break
      case KEYBOARD_KEYS.END:
        event.preventDefault()
        newIndex = items.length - 1
        break
      case KEYBOARD_KEYS.ENTER:
      case KEYBOARD_KEYS.SPACE:
        event.preventDefault()
        if (onSelect) {
          onSelect(currentIndex)
        }
        return currentIndex
    }

    if (newIndex !== currentIndex && items[newIndex]) {
      items[newIndex].focus()
    }

    return newIndex
  }

  /**
   * Handle tab navigation with F6 landmark navigation
   */
  static handleLandmarkNavigation(event: KeyboardEvent): void {
    if (event.key === KEYBOARD_KEYS.F6) {
      event.preventDefault()
      const landmarks = document.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]')
      const landmarkArray = Array.from(landmarks) as HTMLElement[]
      
      if (landmarkArray.length === 0) return

      const activeElement = document.activeElement as HTMLElement
      let currentIndex = -1

      // Find current landmark
      for (let i = 0; i < landmarkArray.length; i++) {
        if (landmarkArray[i].contains(activeElement)) {
          currentIndex = i
          break
        }
      }

      // Move to next landmark
      const nextIndex = event.shiftKey 
        ? (currentIndex <= 0 ? landmarkArray.length - 1 : currentIndex - 1)
        : (currentIndex >= landmarkArray.length - 1 ? 0 : currentIndex + 1)

      FocusManager.focusFirst(landmarkArray[nextIndex])
    }
  }
}

// User preference detection
export class AccessibilityPreferences {
  /**
   * Check if user prefers reduced motion
   */
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Check if user prefers high contrast
   */
  static prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches
  }

  /**
   * Check if user prefers dark theme
   */
  static prefersDarkTheme(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  /**
   * Get user's preferred font size scale
   */
  static getFontSizeScale(): number {
    const testElement = document.createElement('div')
    testElement.style.width = '1rem'
    testElement.style.position = 'absolute'
    testElement.style.visibility = 'hidden'
    document.body.appendChild(testElement)
    
    const remSize = testElement.offsetWidth
    document.body.removeChild(testElement)
    
    return remSize / 16 // 16px is the default browser font size
  }

  /**
   * Watch for preference changes
   */
  static watchPreferences(callback: (preferences: {
    reducedMotion: boolean
    highContrast: boolean
    darkTheme: boolean
    fontScale: number
  }) => void): () => void {
    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)')
    ]

    const handleChange = () => {
      callback({
        reducedMotion: this.prefersReducedMotion(),
        highContrast: this.prefersHighContrast(),
        darkTheme: this.prefersDarkTheme(),
        fontScale: this.getFontSizeScale()
      })
    }

    mediaQueries.forEach(mq => mq.addListener(handleChange))

    // Return cleanup function
    return () => {
      mediaQueries.forEach(mq => mq.removeListener(handleChange))
    }
  }
}

// ARIA attribute helpers
export const ariaProps = {
  /**
   * Create ARIA properties for a button
   */
  button: (options: {
    pressed?: boolean
    expanded?: boolean
    hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
    controls?: string
    describedBy?: string
    labelledBy?: string
  } = {}) => ({
    role: ARIA_ROLES.button,
    ...(options.pressed !== undefined && { [ARIA_STATES.pressed]: options.pressed.toString() }),
    ...(options.expanded !== undefined && { [ARIA_STATES.expanded]: options.expanded.toString() }),
    ...(options.hasPopup !== undefined && { [ARIA_STATES.haspopup]: options.hasPopup === true ? 'true' : options.hasPopup.toString() }),
    ...(options.controls && { [ARIA_STATES.controls]: options.controls }),
    ...(options.describedBy && { [ARIA_STATES.describedby]: options.describedBy }),
    ...(options.labelledBy && { [ARIA_STATES.labelledby]: options.labelledBy })
  }),

  /**
   * Create ARIA properties for navigation
   */
  navigation: (label?: string, current?: string) => ({
    role: ARIA_ROLES.navigation,
    ...(label && { 'aria-label': label }),
    ...(current && { [ARIA_STATES.current]: current })
  }),

  /**
   * Create ARIA properties for a menu
   */
  menu: (options: {
    orientation?: 'horizontal' | 'vertical'
    labelledBy?: string
    activeDescendant?: string
  } = {}) => ({
    role: ARIA_ROLES.menu,
    ...(options.orientation && { [ARIA_STATES.orientation]: options.orientation }),
    ...(options.labelledBy && { [ARIA_STATES.labelledby]: options.labelledBy }),
    ...(options.activeDescendant && { [ARIA_STATES.activedescendant]: options.activeDescendant })
  }),

  /**
   * Create ARIA properties for a menuitem
   */
  menuitem: (options: {
    disabled?: boolean
    selected?: boolean
    hasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  } = {}) => ({
    role: ARIA_ROLES.menuitem,
    ...(options.disabled !== undefined && { [ARIA_STATES.disabled]: options.disabled.toString() }),
    ...(options.selected !== undefined && { [ARIA_STATES.selected]: options.selected.toString() }),
    ...(options.hasPopup !== undefined && { [ARIA_STATES.haspopup]: options.hasPopup === true ? 'true' : options.hasPopup.toString() })
  }),

  /**
   * Create ARIA properties for a dialog
   */
  dialog: (options: {
    modal?: boolean
    labelledBy?: string
    describedBy?: string
  } = {}) => ({
    role: options.modal ? ARIA_ROLES.alertdialog : ARIA_ROLES.dialog,
    ...(options.labelledBy && { [ARIA_STATES.labelledby]: options.labelledBy }),
    ...(options.describedBy && { [ARIA_STATES.describedby]: options.describedBy })
  }),

  /**
   * Create ARIA properties for live regions
   */
  liveRegion: (options: {
    level?: 'polite' | 'assertive' | 'off'
    atomic?: boolean
    relevant?: string
  } = {}) => ({
    [ARIA_STATES.live]: options.level || 'polite',
    ...(options.atomic !== undefined && { [ARIA_STATES.atomic]: options.atomic.toString() }),
    ...(options.relevant && { 'aria-relevant': options.relevant })
  })
}

// Utility functions
export const a11yUtils = {
  /**
   * Generate a unique ID for ARIA relationships
   */
  generateId: (prefix = 'a11y'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * Create screen reader only text
   */
  srOnly: (text: string): React.ReactElement => {
    return React.createElement('span', {
      className: 'sr-only',
      style: {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0'
      }
    }, text)
  },

  /**
   * Combine class names with accessibility considerations
   */
  combineClasses: (...classes: (string | undefined | false)[]): string => {
    return classes.filter(Boolean).join(' ')
  },

  /**
   * Debounce function for performance optimization
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }
  }
}

// Initialize accessibility features
export const initializeAccessibility = (): void => {
  // Initialize screen reader announcer
  ScreenReaderAnnouncer.initialize()

  // Add global keyboard navigation listeners
  document.addEventListener('keydown', KeyboardNavigation.handleLandmarkNavigation)

  // Add skip link functionality
  const skipLinks = document.querySelectorAll('a[href^="#"]')
  skipLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector((event.target as HTMLAnchorElement).getAttribute('href')!)
      if (target) {
        (target as HTMLElement).focus()
      }
    })
  })
}