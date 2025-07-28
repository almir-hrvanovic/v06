/**
 * Accessibility Testing Utilities for WCAG 2.2 Compliance
 * Provides automated testing and validation helpers
 */

import { FocusManager, ScreenReaderAnnouncer, AccessibilityPreferences } from './accessibility'

// WCAG 2.2 Success Criteria
export const WCAG_SUCCESS_CRITERIA = {
  // Level A
  'non-text-content': '1.1.1',
  'audio-only-video-only': '1.2.1',
  'captions-prerecorded': '1.2.2',
  'audio-description-prerecorded': '1.2.3',
  'info-and-relationships': '1.3.1',
  'meaningful-sequence': '1.3.2',
  'sensory-characteristics': '1.3.3',
  'use-of-color': '1.4.1',
  'audio-control': '1.4.2',
  'keyboard': '2.1.1',
  'no-keyboard-trap': '2.1.2',
  'timing-adjustable': '2.2.1',
  'pause-stop-hide': '2.2.2',
  'three-flashes': '2.3.1',
  'bypass-blocks': '2.4.1',
  'page-titled': '2.4.2',
  'focus-order': '2.4.3',
  'link-purpose': '2.4.4',
  'language-of-page': '3.1.1',
  'on-focus': '3.2.1',
  'on-input': '3.2.2',
  'error-identification': '3.3.1',
  'labels-or-instructions': '3.3.2',
  'parsing': '4.1.1',
  'name-role-value': '4.1.2',
  
  // Level AA
  'captions-live': '1.2.4',
  'audio-description-prerecorded-aa': '1.2.5',
  'orientation': '1.3.4',
  'identify-input-purpose': '1.3.5',
  'contrast-minimum': '1.4.3',
  'resize-text': '1.4.4',
  'images-of-text': '1.4.5',
  'reflow': '1.4.10',
  'non-text-contrast': '1.4.11',
  'text-spacing': '1.4.12',
  'content-on-hover-focus': '1.4.13',
  'character-key-shortcuts': '2.1.4',
  'pointer-gestures': '2.5.1',
  'pointer-cancellation': '2.5.2',
  'label-in-name': '2.5.3',
  'motion-actuation': '2.5.4',
  'target-size': '2.5.5',
  'concurrent-input-mechanisms': '2.5.6',
  'focus-not-obscured-minimum': '2.4.11',
  'focus-appearance-minimum': '2.4.12',
  'dragging': '2.5.7',
  'target-size-minimum': '2.5.8',
  'multiple-ways': '2.4.5',
  'headings-and-labels': '2.4.6',
  'focus-visible': '2.4.7',
  'language-of-parts': '3.1.2',
  'consistent-navigation': '3.2.3',
  'consistent-identification': '3.2.4',
  'error-suggestion': '3.3.3',
  'error-prevention-legal': '3.3.4',
  'status-messages': '4.1.3'
} as const

// Testing results interface
interface A11yTestResult {
  criterion: string
  level: 'A' | 'AA' | 'AAA'
  passed: boolean
  message: string
  element?: HTMLElement
  severity: 'error' | 'warning' | 'info'
}

interface A11yTestSuite {
  passed: number
  failed: number
  warnings: number
  results: A11yTestResult[]
  score: number
}

// Color contrast utilities
export class ColorContrastTester {
  /**
   * Calculate relative luminance of a color
   */
  static getRelativeLuminance(color: string): number {
    const rgb = this.hexToRgb(color) || this.getRgbFromComputedStyle(color)
    if (!rgb) return 0

    const [r, g, b] = rgb.map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number {
    const l1 = this.getRelativeLuminance(color1)
    const l2 = this.getRelativeLuminance(color2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  /**
   * Check if contrast ratio meets WCAG standards
   */
  static meetsWCAGStandard(
    ratio: number,
    level: 'AA' | 'AAA',
    size: 'normal' | 'large'
  ): boolean {
    const thresholds = {
      AA: { normal: 4.5, large: 3 },
      AAA: { normal: 7, large: 4.5 }
    }
    return ratio >= thresholds[level][size]
  }

  private static hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null
  }

  private static getRgbFromComputedStyle(color: string): [number, number, number] | null {
    const div = document.createElement('div')
    div.style.color = color
    document.body.appendChild(div)
    const computed = window.getComputedStyle(div).color
    document.body.removeChild(div)

    const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null
  }
}

// Focus testing utilities
export class FocusTester {
  /**
   * Test keyboard navigation flow
   */
  static testTabOrder(container: HTMLElement): A11yTestResult[] {
    const results: A11yTestResult[] = []
    const focusableElements = FocusManager.getFocusableElements(container)

    if (focusableElements.length === 0) {
      results.push({
        criterion: WCAG_SUCCESS_CRITERIA['focus-order'],
        level: 'A',
        passed: true,
        message: 'No focusable elements found',
        severity: 'info'
      })
      return results
    }

    // Test that elements can receive focus
    focusableElements.forEach((element, index) => {
      const canFocus = this.canElementReceiveFocus(element)
      results.push({
        criterion: WCAG_SUCCESS_CRITERIA['focus-order'],
        level: 'A',
        passed: canFocus,
        message: canFocus 
          ? `Element ${index + 1} can receive focus`
          : `Element ${index + 1} cannot receive focus`,
        element,
        severity: canFocus ? 'info' : 'error'
      })
    })

    // Test for focus traps
    const hasFocusTrap = this.testForFocusTrap(focusableElements)
    results.push({
      criterion: WCAG_SUCCESS_CRITERIA['no-keyboard-trap'],
      level: 'A',
      passed: !hasFocusTrap,
      message: hasFocusTrap 
        ? 'Focus trap detected - keyboard navigation may be blocked'
        : 'No focus traps detected',
      severity: hasFocusTrap ? 'error' : 'info'
    })

    return results
  }

  /**
   * Test focus visibility
   */
  static testFocusVisible(element: HTMLElement): A11yTestResult {
    element.focus()
    
    const computedStyle = window.getComputedStyle(element)
    const hasOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '0px'
    const hasBoxShadow = computedStyle.boxShadow !== 'none'
    const hasVisibleFocus = hasOutline || hasBoxShadow

    return {
      criterion: WCAG_SUCCESS_CRITERIA['focus-visible'],
      level: 'AA',
      passed: hasVisibleFocus,
      message: hasVisibleFocus 
        ? 'Element has visible focus indicator'
        : 'Element lacks visible focus indicator',
      element,
      severity: hasVisibleFocus ? 'info' : 'error'
    }
  }

  private static canElementReceiveFocus(element: HTMLElement): boolean {
    try {
      const activeElement = document.activeElement
      element.focus()
      const focused = document.activeElement === element
      if (activeElement && activeElement !== document.body) {
        (activeElement as HTMLElement).focus()
      }
      return focused
    } catch {
      return false
    }
  }

  private static testForFocusTrap(elements: HTMLElement[]): boolean {
    if (elements.length < 2) return false

    const first = elements[0]
    const last = elements[elements.length - 1]

    // Simple heuristic: if first and last elements are the same, might be a trap
    return first === last && elements.length > 1
  }
}

// ARIA testing utilities
export class AriaTester {
  /**
   * Test ARIA attribute validity
   */
  static testAriaAttributes(element: HTMLElement): A11yTestResult[] {
    const results: A11yTestResult[] = []
    const attributes = Array.from(element.attributes)
    
    attributes.forEach(attr => {
      if (attr.name.startsWith('aria-')) {
        const isValid = this.isValidAriaAttribute(attr.name, attr.value, element)
        results.push({
          criterion: WCAG_SUCCESS_CRITERIA['name-role-value'],
          level: 'A',
          passed: isValid,
          message: isValid 
            ? `${attr.name}="${attr.value}" is valid`
            : `${attr.name}="${attr.value}" is invalid`,
          element,
          severity: isValid ? 'info' : 'error'
        })
      }
    })

    return results
  }

  /**
   * Test landmark structure
   */
  static testLandmarks(container: HTMLElement = document.body): A11yTestResult[] {
    const results: A11yTestResult[] = []
    const landmarks = container.querySelectorAll('[role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], header, nav, main, aside, footer')
    
    const landmarkTypes = new Set<string>()
    landmarks.forEach(landmark => {
      const role = landmark.getAttribute('role') || landmark.tagName.toLowerCase()
      landmarkTypes.add(role)
    })

    // Check for essential landmarks
    const essentialLandmarks = ['main', 'navigation']
    essentialLandmarks.forEach(landmark => {
      const hasLandmark = landmarkTypes.has(landmark) || landmarkTypes.has(landmark === 'navigation' ? 'nav' : landmark)
      results.push({
        criterion: WCAG_SUCCESS_CRITERIA['bypass-blocks'],
        level: 'A',
        passed: hasLandmark,
        message: hasLandmark 
          ? `${landmark} landmark found`
          : `${landmark} landmark missing`,
        severity: hasLandmark ? 'info' : 'warning'
      })
    })

    return results
  }

  private static isValidAriaAttribute(name: string, value: string, element: HTMLElement): boolean {
    // Basic ARIA validation - this could be expanded
    const booleanAttrs = ['aria-expanded', 'aria-selected', 'aria-checked', 'aria-pressed', 'aria-hidden', 'aria-disabled']
    const idRefAttrs = ['aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns']
    
    if (booleanAttrs.includes(name)) {
      return ['true', 'false'].includes(value.toLowerCase())
    }
    
    if (idRefAttrs.includes(name)) {
      // Check if referenced IDs exist
      const ids = value.split(/\s+/)
      return ids.every(id => document.getElementById(id) !== null)
    }
    
    return true // Default to valid for other attributes
  }
}

// Comprehensive accessibility tester
export class AccessibilityTester {
  /**
   * Run comprehensive accessibility tests
   */
  static async runFullTest(container: HTMLElement = document.body): Promise<A11yTestSuite> {
    const results: A11yTestResult[] = []

    // Test focus management
    results.push(...FocusTester.testTabOrder(container))

    // Test ARIA attributes
    const elementsWithAria = container.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]')
    elementsWithAria.forEach(element => {
      results.push(...AriaTester.testAriaAttributes(element as HTMLElement))
    })

    // Test landmarks
    results.push(...AriaTester.testLandmarks(container))

    // Test color contrast
    await this.testColorContrast(container, results)

    // Test headings hierarchy
    results.push(...this.testHeadingHierarchy(container))

    // Test form labels
    results.push(...this.testFormLabels(container))

    // Test images
    results.push(...this.testImages(container))

    // Calculate score
    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed && r.severity === 'error').length
    const warnings = results.filter(r => !r.passed && r.severity === 'warning').length
    const score = Math.round((passed / results.length) * 100)

    return {
      passed,
      failed,
      warnings,
      results,
      score
    }
  }

  /**
   * Test color contrast for text elements
   */
  private static async testColorContrast(container: HTMLElement, results: A11yTestResult[]): Promise<void> {
    const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label, li')
    
    textElements.forEach(element => {
      const computedStyle = window.getComputedStyle(element)
      const color = computedStyle.color
      const backgroundColor = computedStyle.backgroundColor
      
      if (color && backgroundColor && backgroundColor !== 'rgba(0, 0, 0, 0)') {
        const ratio = ColorContrastTester.getContrastRatio(color, backgroundColor)
        const fontSize = parseFloat(computedStyle.fontSize)
        const isLarge = fontSize >= 18 || (fontSize >= 14 && computedStyle.fontWeight === 'bold')
        const meetsAA = ColorContrastTester.meetsWCAGStandard(ratio, 'AA', isLarge ? 'large' : 'normal')
        
        results.push({
          criterion: WCAG_SUCCESS_CRITERIA['contrast-minimum'],
          level: 'AA',
          passed: meetsAA,
          message: meetsAA 
            ? `Contrast ratio ${ratio.toFixed(2)}:1 meets WCAG AA standards`
            : `Contrast ratio ${ratio.toFixed(2)}:1 fails WCAG AA standards`,
          element: element as HTMLElement,
          severity: meetsAA ? 'info' : 'error'
        })
      }
    })
  }

  /**
   * Test heading hierarchy
   */
  private static testHeadingHierarchy(container: HTMLElement): A11yTestResult[] {
    const results: A11yTestResult[] = []
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    
    if (headings.length === 0) {
      results.push({
        criterion: WCAG_SUCCESS_CRITERIA['headings-and-labels'],
        level: 'AA',
        passed: false,
        message: 'No headings found',
        severity: 'warning'
      })
      return results
    }

    let hasH1 = false
    let prevLevel = 0

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      
      if (level === 1) hasH1 = true
      
      if (index === 0 && level !== 1) {
        results.push({
          criterion: WCAG_SUCCESS_CRITERIA['headings-and-labels'],
          level: 'AA',
          passed: false,
          message: 'First heading should be h1',
          element: heading as HTMLElement,
          severity: 'warning'
        })
      }
      
      if (prevLevel > 0 && level > prevLevel + 1) {
        results.push({
          criterion: WCAG_SUCCESS_CRITERIA['headings-and-labels'],
          level: 'AA',
          passed: false,
          message: `Heading level ${level} skipped from level ${prevLevel}`,
          element: heading as HTMLElement,
          severity: 'warning'
        })
      }
      
      prevLevel = level
    })

    results.push({
      criterion: WCAG_SUCCESS_CRITERIA['headings-and-labels'],
      level: 'AA',
      passed: hasH1,
      message: hasH1 ? 'Page has h1 heading' : 'Page missing h1 heading',
      severity: hasH1 ? 'info' : 'error'
    })

    return results
  }

  /**
   * Test form labels
   */
  private static testFormLabels(container: HTMLElement): A11yTestResult[] {
    const results: A11yTestResult[] = []
    const formControls = container.querySelectorAll('input, select, textarea')
    
    formControls.forEach(control => {
      const element = control as HTMLElement
      const hasLabel = this.hasAccessibleLabel(element)
      
      results.push({
        criterion: WCAG_SUCCESS_CRITERIA['labels-or-instructions'],
        level: 'A',
        passed: hasLabel,
        message: hasLabel 
          ? 'Form control has accessible label'
          : 'Form control missing accessible label',
        element,
        severity: hasLabel ? 'info' : 'error'
      })
    })

    return results
  }

  /**
   * Test images for alt text
   */
  private static testImages(container: HTMLElement): A11yTestResult[] {
    const results: A11yTestResult[] = []
    const images = container.querySelectorAll('img')
    
    images.forEach(img => {
      const hasAlt = img.hasAttribute('alt')
      const altText = img.getAttribute('alt')
      const isDecorative = altText === ''
      
      results.push({
        criterion: WCAG_SUCCESS_CRITERIA['non-text-content'],
        level: 'A',
        passed: hasAlt,
        message: hasAlt 
          ? (isDecorative ? 'Image marked as decorative' : `Image has alt text: "${altText}"`)
          : 'Image missing alt attribute',
        element: img,
        severity: hasAlt ? 'info' : 'error'
      })
    })

    return results
  }

  private static hasAccessibleLabel(element: HTMLElement): boolean {
    // Check for various labeling methods
    const hasAriaLabel = element.hasAttribute('aria-label')
    const hasAriaLabelledBy = element.hasAttribute('aria-labelledby')
    const hasTitle = element.hasAttribute('title')
    
    // Check for associated label element
    const id = element.id
    const hasLabelFor = id && document.querySelector(`label[for="${id}"]`)
    
    // Check for wrapping label
    const hasWrappingLabel = element.closest('label')
    
    return hasAriaLabel || hasAriaLabelledBy || hasTitle || !!hasLabelFor || !!hasWrappingLabel
  }
}

// Performance testing for accessibility features
export class A11yPerformanceTester {
  /**
   * Test focus management performance
   */
  static testFocusPerformance(container: HTMLElement): { averageTime: number, maxTime: number } {
    const focusableElements = FocusManager.getFocusableElements(container)
    const times: number[] = []
    
    focusableElements.forEach(element => {
      const start = performance.now()
      element.focus()
      const end = performance.now()
      times.push(end - start)
    })
    
    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      maxTime: Math.max(...times)
    }
  }

  /**
   * Test screen reader announcement performance
   */
  static testAnnouncementPerformance(): Promise<number> {
    return new Promise(resolve => {
      const start = performance.now()
      ScreenReaderAnnouncer.announce('Test announcement')
      // Rough estimate - screen readers typically announce within 100ms
      setTimeout(() => {
        const end = performance.now()
        resolve(end - start)
      }, 100)
    })
  }
}

// Automated testing runner
export class A11yTestRunner {
  private static observers: MutationObserver[] = []

  /**
   * Start continuous accessibility monitoring
   */
  static startMonitoring(options: {
    container?: HTMLElement
    interval?: number
    onIssueFound?: (issue: A11yTestResult) => void
  } = {}) {
    const { container = document.body, interval = 5000, onIssueFound } = options

    // Initial test
    this.runQuickTest(container, onIssueFound)

    // Set up periodic testing
    const intervalId = setInterval(() => {
      this.runQuickTest(container, onIssueFound)
    }, interval)

    // Set up DOM mutation observer
    const observer = new MutationObserver(() => {
      // Debounced test after DOM changes
      setTimeout(() => {
        this.runQuickTest(container, onIssueFound)
      }, 1000)
    })

    observer.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded', 'aria-selected', 'tabindex', 'role']
    })

    this.observers.push(observer)

    return () => {
      clearInterval(intervalId)
      observer.disconnect()
      this.observers = this.observers.filter(obs => obs !== observer)
    }
  }

  /**
   * Run quick accessibility test (essential checks only)
   */
  private static async runQuickTest(
    container: HTMLElement, 
    onIssueFound?: (issue: A11yTestResult) => void
  ) {
    const results: A11yTestResult[] = []

    // Quick focus test
    const focusableElements = FocusManager.getFocusableElements(container)
    focusableElements.slice(0, 5).forEach(element => { // Test first 5 elements only
      const focusResult = FocusTester.testFocusVisible(element)
      if (!focusResult.passed) {
        results.push(focusResult)
      }
    })

    // Quick ARIA test
    const elementsWithAria = Array.from(container.querySelectorAll('[role], [aria-expanded], [aria-selected]')).slice(0, 10)
    elementsWithAria.forEach(element => {
      const ariaResults = AriaTester.testAriaAttributes(element as HTMLElement)
      results.push(...ariaResults.filter(r => !r.passed))
    })

    // Report issues
    if (onIssueFound) {
      results.forEach(onIssueFound)
    }
  }

  /**
   * Stop all monitoring
   */
  static stopMonitoring() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Export comprehensive testing interface
export const a11yTest = {
  // Core testers
  focus: FocusTester,
  aria: AriaTester,
  contrast: ColorContrastTester,
  
  // Comprehensive testing
  runFullTest: AccessibilityTester.runFullTest.bind(AccessibilityTester),
  
  // Performance testing
  performance: A11yPerformanceTester,
  
  // Monitoring
  startMonitoring: A11yTestRunner.startMonitoring.bind(A11yTestRunner),
  stopMonitoring: A11yTestRunner.stopMonitoring.bind(A11yTestRunner),
  
  // Utilities
  WCAG_CRITERIA: WCAG_SUCCESS_CRITERIA
}