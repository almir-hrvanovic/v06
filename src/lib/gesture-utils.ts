'use client'

// Utility functions for enhanced gesture handling
export interface TouchPoint {
  x: number
  y: number
  timestamp: number
  pressure?: number
  radiusX?: number
  radiusY?: number
}

export interface VelocityData {
  x: number
  y: number
  magnitude: number
  angle: number
}

export interface GestureMetrics {
  distance: number
  duration: number
  velocity: VelocityData
  direction: 'horizontal' | 'vertical' | 'diagonal'
  confidence: number
}

// Enhanced touch point tracking
export class TouchTracker {
  private points: TouchPoint[] = []
  private maxHistory = 5

  addPoint(touch: Touch): void {
    const point: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now(),
      pressure: touch.force || 1,
      radiusX: touch.radiusX || 1,
      radiusY: touch.radiusY || 1
    }

    this.points.push(point)
    
    // Keep only recent points for velocity calculation
    if (this.points.length > this.maxHistory) {
      this.points.shift()
    }
  }

  getVelocity(): VelocityData {
    if (this.points.length < 2) {
      return { x: 0, y: 0, magnitude: 0, angle: 0 }
    }

    const recent = this.points.slice(-2)
    const [start, end] = recent
    
    const deltaX = end.x - start.x
    const deltaY = end.y - start.y
    const deltaTime = end.timestamp - start.timestamp
    
    if (deltaTime === 0) {
      return { x: 0, y: 0, magnitude: 0, angle: 0 }
    }

    const velocityX = deltaX / deltaTime
    const velocityY = deltaY / deltaTime
    const magnitude = Math.sqrt(velocityX * velocityX + velocityY * velocityY)
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)

    return {
      x: velocityX,
      y: velocityY,
      magnitude,
      angle
    }
  }

  getAverageVelocity(): VelocityData {
    if (this.points.length < 2) {
      return { x: 0, y: 0, magnitude: 0, angle: 0 }
    }

    let totalVelX = 0
    let totalVelY = 0
    let count = 0

    for (let i = 1; i < this.points.length; i++) {
      const prev = this.points[i - 1]
      const curr = this.points[i]
      const deltaTime = curr.timestamp - prev.timestamp
      
      if (deltaTime > 0) {
        totalVelX += (curr.x - prev.x) / deltaTime
        totalVelY += (curr.y - prev.y) / deltaTime
        count++
      }
    }

    if (count === 0) {
      return { x: 0, y: 0, magnitude: 0, angle: 0 }
    }

    const avgVelX = totalVelX / count
    const avgVelY = totalVelY / count
    const magnitude = Math.sqrt(avgVelX * avgVelX + avgVelY * avgVelY)
    const angle = Math.atan2(avgVelY, avgVelX) * (180 / Math.PI)

    return {
      x: avgVelX,
      y: avgVelY,
      magnitude,
      angle
    }
  }

  getGestureMetrics(): GestureMetrics | null {
    if (this.points.length < 2) return null

    const first = this.points[0]
    const last = this.points[this.points.length - 1]
    
    const deltaX = last.x - first.x
    const deltaY = last.y - first.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const duration = last.timestamp - first.timestamp
    const velocity = this.getAverageVelocity()

    // Determine direction
    let direction: 'horizontal' | 'vertical' | 'diagonal'
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    
    if (absX > absY * 1.5) {
      direction = 'horizontal'
    } else if (absY > absX * 1.5) {
      direction = 'vertical'
    } else {
      direction = 'diagonal'
    }

    // Calculate confidence based on consistency
    let confidence = 1.0
    if (this.points.length > 2) {
      // Measure path straightness
      let totalDeviation = 0
      for (let i = 1; i < this.points.length - 1; i++) {
        const point = this.points[i]
        // Calculate distance from point to line between first and last
        const deviation = this.pointToLineDistance(point, first, last)
        totalDeviation += deviation
      }
      
      const avgDeviation = totalDeviation / (this.points.length - 2)
      confidence = Math.max(0, 1 - (avgDeviation / distance))
    }

    return {
      distance,
      duration,
      velocity,
      direction,
      confidence
    }
  }

  private pointToLineDistance(point: TouchPoint, lineStart: TouchPoint, lineEnd: TouchPoint): number {
    const A = point.x - lineStart.x
    const B = point.y - lineStart.y
    const C = lineEnd.x - lineStart.x
    const D = lineEnd.y - lineStart.y

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B)

    const param = dot / lenSq
    let xx, yy

    if (param < 0) {
      xx = lineStart.x
      yy = lineStart.y
    } else if (param > 1) {
      xx = lineEnd.x
      yy = lineEnd.y
    } else {
      xx = lineStart.x + param * C
      yy = lineStart.y + param * D
    }

    const dx = point.x - xx
    const dy = point.y - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  clear(): void {
    this.points = []
  }

  get length(): number {
    return this.points.length
  }

  get lastPoint(): TouchPoint | null {
    return this.points.length > 0 ? this.points[this.points.length - 1] : null
  }

  get firstPoint(): TouchPoint | null {
    return this.points.length > 0 ? this.points[0] : null
  }
}

// Device-specific optimization utilities
export class DeviceOptimizer {
  private static instance: DeviceOptimizer
  private deviceInfo: {
    isIOS: boolean
    isAndroid: boolean
    isSafari: boolean
    isChrome: boolean
    touchPoints: number
    screenDensity: number
    prefersReducedMotion: boolean
  }

  private constructor() {
    this.deviceInfo = this.detectDevice()
  }

  static getInstance(): DeviceOptimizer {
    if (!DeviceOptimizer.instance) {
      DeviceOptimizer.instance = new DeviceOptimizer()
    }
    return DeviceOptimizer.instance
  }

  private detectDevice() {
    if (typeof window === 'undefined') {
      return {
        isIOS: false,
        isAndroid: false,
        isSafari: false,
        isChrome: false,
        touchPoints: 0,
        screenDensity: 1,
        prefersReducedMotion: false
      }
    }

    const userAgent = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    const isAndroid = /Android/.test(userAgent)
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
    const isChrome = /Chrome/.test(userAgent)
    const touchPoints = navigator.maxTouchPoints || 0
    const screenDensity = window.devicePixelRatio || 1
    
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    return {
      isIOS,
      isAndroid,
      isSafari,
      isChrome,
      touchPoints,
      screenDensity,
      prefersReducedMotion
    }
  }

  getOptimalEventOptions(): AddEventListenerOptions {
    const options: AddEventListenerOptions = {
      passive: false,
      capture: false
    }

    // iOS Safari specific optimizations
    if (this.deviceInfo.isIOS && this.deviceInfo.isSafari) {
      options.passive = false // Need to prevent default for iOS
    }

    // Android Chrome optimizations
    if (this.deviceInfo.isAndroid && this.deviceInfo.isChrome) {
      options.passive = true // Better performance on Android
    }

    return options
  }

  getOptimalThresholds() {
    const base = {
      minSwipeDistance: 50,
      velocityThreshold: 0.3,
      edgeZone: 20
    }

    // Adjust for screen density
    const densityMultiplier = Math.max(1, this.deviceInfo.screenDensity)
    
    return {
      minSwipeDistance: base.minSwipeDistance * densityMultiplier,
      velocityThreshold: base.velocityThreshold / densityMultiplier,
      edgeZone: base.edgeZone * densityMultiplier
    }
  }

  getAnimationConfig() {
    if (this.deviceInfo.prefersReducedMotion) {
      return {
        duration: 0,
        easing: 'linear',
        springConfig: { tension: 500, friction: 50 }
      }
    }

    // iOS prefers spring animations
    if (this.deviceInfo.isIOS) {
      return {
        duration: 300,
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        springConfig: { tension: 280, friction: 30 }
      }
    }

    // Android prefers material design curves
    if (this.deviceInfo.isAndroid) {
      return {
        duration: 250,
        easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        springConfig: { tension: 300, friction: 35 }
      }
    }

    // Default configuration
    return {
      duration: 300,
      easing: 'ease-out',
      springConfig: { tension: 280, friction: 30 }
    }
  }

  shouldUseNativeScrolling(): boolean {
    // iOS handles native scrolling better
    return this.deviceInfo.isIOS
  }

  getHapticCapabilities() {
    return {
      supported: 'vibrate' in navigator,
      patterns: this.deviceInfo.isAndroid, // Android supports vibration patterns
      intensity: this.deviceInfo.isIOS     // iOS supports haptic intensity
    }
  }
}

// Accessibility utilities
export class AccessibilityManager {
  private announcer: HTMLElement | null = null

  constructor() {
    this.setupAnnouncer()
  }

  private setupAnnouncer(): void {
    if (typeof document === 'undefined') return

    // Create or find existing announcer
    this.announcer = document.getElementById('gesture-announcements')
    
    if (!this.announcer) {
      this.announcer = document.createElement('div')
      this.announcer.id = 'gesture-announcements'
      this.announcer.setAttribute('aria-live', 'polite')
      this.announcer.setAttribute('aria-atomic', 'true')
      this.announcer.className = 'sr-only'
      this.announcer.style.cssText = `
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
      `
      document.body.appendChild(this.announcer)
    }
  }

  announce(message: string): void {
    if (!this.announcer) return

    // Clear previous message and set new one
    this.announcer.textContent = ''
    setTimeout(() => {
      if (this.announcer) {
        this.announcer.textContent = message
      }
    }, 100)
  }

  announceGestureStart(direction?: string): void {
    let message = 'Gesture started'
    if (direction) {
      message += ` in ${direction} direction`
    }
    this.announce(message)
  }

  announceGestureEnd(action: string): void {
    this.announce(`Gesture completed: ${action}`)
  }

  announceError(error: string): void {
    this.announce(`Gesture error: ${error}`)
  }

  setupKeyboardHandlers(
    onToggle: () => void,
    onClose: () => void
  ): () => void {
    const handleKeydown = (e: KeyboardEvent) => {
      // Alt + Enter to toggle
      if (e.altKey && e.key === 'Enter') {
        e.preventDefault()
        onToggle()
        this.announce('Sidebar toggled with keyboard')
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        this.announce('Sidebar closed with keyboard')
      }
    }

    document.addEventListener('keydown', handleKeydown)
    
    return () => {
      document.removeEventListener('keydown', handleKeydown)
    }
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private frameTimes: number[] = []
  private maxSamples = 60
  private monitoring = false

  startMonitoring(): void {
    if (this.monitoring) return
    
    this.monitoring = true
    this.frameTimes = []
    
    let lastTime = performance.now()
    
    const measureFrame = () => {
      if (!this.monitoring) return
      
      const currentTime = performance.now()
      const frameTime = currentTime - lastTime
      
      this.frameTimes.push(frameTime)
      if (this.frameTimes.length > this.maxSamples) {
        this.frameTimes.shift()
      }
      
      lastTime = currentTime
      requestAnimationFrame(measureFrame)
    }
    
    requestAnimationFrame(measureFrame)
  }

  stopMonitoring(): void {
    this.monitoring = false
  }

  getMetrics() {
    if (this.frameTimes.length === 0) {
      return null
    }

    const sum = this.frameTimes.reduce((a, b) => a + b, 0)
    const average = sum / this.frameTimes.length
    const fps = 1000 / average
    const min = Math.min(...this.frameTimes)
    const max = Math.max(...this.frameTimes)
    
    // Calculate percentiles
    const sorted = [...this.frameTimes].sort((a, b) => a - b)
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    return {
      averageFrameTime: average,
      fps,
      minFrameTime: min,
      maxFrameTime: max,
      p95FrameTime: p95,
      p99FrameTime: p99,
      samples: this.frameTimes.length,
      isSmooth: fps >= 50 && p95 < 20 // Consider smooth if >= 50fps and 95% of frames < 20ms
    }
  }

  reset(): void {
    this.frameTimes = []
  }
}

// Export singleton instances
export const deviceOptimizer = DeviceOptimizer.getInstance()
export const accessibilityManager = new AccessibilityManager()
export const performanceMonitor = new PerformanceMonitor()

// Utility functions
export function createTouchTracker(): TouchTracker {
  return new TouchTracker()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}