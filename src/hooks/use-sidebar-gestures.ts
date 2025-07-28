'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSidebar } from '@/contexts/sidebar-context'

// Types and interfaces
interface TouchEvent {
  clientX: number
  clientY: number
  timeStamp: number
}

interface GestureConfig {
  // Basic gesture settings
  minSwipeDistance: number
  maxSwipeTime: number
  velocityThreshold: number
  momentumDecay: number
  
  // Edge detection
  edgeDetectionZone: number
  edgeActivationDistance: number
  
  // Platform specific
  enableHapticFeedback: boolean
  enableAccessibilityMode: boolean
  
  // Thresholds
  openThreshold: number
  closeThreshold: number
  
  // Animation
  springConfig: {
    tension: number
    friction: number
  }
}

interface PlatformInfo {
  isIOS: boolean
  isAndroid: boolean
  isMobile: boolean
  isTablet: boolean
  supportsHaptics: boolean
  devicePixelRatio: number
}

interface GestureState {
  isActive: boolean
  startX: number
  startY: number
  startTime: number
  currentX: number
  currentY: number
  deltaX: number
  deltaY: number
  velocity: number
  direction: 'left' | 'right' | 'up' | 'down' | null
  isEdgeGesture: boolean
  momentum: number
}

interface HapticPattern {
  type: 'selection' | 'impact' | 'notification'
  intensity?: 'light' | 'medium' | 'heavy'
}

// Default configuration
const DEFAULT_CONFIG: GestureConfig = {
  minSwipeDistance: 50,
  maxSwipeTime: 500,
  velocityThreshold: 0.3,
  momentumDecay: 0.95,
  edgeDetectionZone: 20,
  edgeActivationDistance: 100,
  enableHapticFeedback: true,
  enableAccessibilityMode: false,
  openThreshold: 0.3,
  closeThreshold: 0.7,
  springConfig: {
    tension: 280,
    friction: 30
  }
}

// Platform detection utilities
function detectPlatform(): PlatformInfo {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isTablet: false,
      supportsHaptics: false,
      devicePixelRatio: 1
    }
  }

  const userAgent = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(userAgent)
  const isAndroid = /Android/.test(userAgent)
  const isMobile = /Mobi|Android/i.test(userAgent)
  const isTablet = /iPad/.test(userAgent) || 
    (isAndroid && !/Mobile/.test(userAgent)) ||
    (window.innerWidth >= 768 && window.innerHeight >= 1024)

  // Check for haptic support
  const supportsHaptics = 'vibrate' in navigator || 
    ('hapticActuators' in navigator && (navigator as any).hapticActuators?.length > 0)

  return {
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
    supportsHaptics,
    devicePixelRatio: window.devicePixelRatio || 1
  }
}

// Haptic feedback utility
function triggerHapticFeedback(pattern: HapticPattern, platform: PlatformInfo): void {
  if (!platform.supportsHaptics) return

  try {
    if ('vibrate' in navigator) {
      // Basic vibration patterns
      const patterns = {
        selection: [10],
        impact: pattern.intensity === 'heavy' ? [50] : pattern.intensity === 'medium' ? [30] : [15],
        notification: [100, 50, 100]
      }
      navigator.vibrate(patterns[pattern.type])
    }

    // iOS specific haptic feedback (if available)
    if (platform.isIOS && (window as any).DeviceMotionEvent?.requestPermission) {
      // iOS haptic feedback through web APIs (limited support)
      // This would require additional permissions and specific implementation
    }
  } catch (error) {
    // Silently fail if haptics aren't supported
    console.debug('Haptic feedback not available:', error)
  }
}

// Velocity calculation utility
function calculateVelocity(
  deltaX: number,
  deltaY: number,
  deltaTime: number
): { velocity: number; direction: 'left' | 'right' | 'up' | 'down' | null } {
  if (deltaTime === 0) return { velocity: 0, direction: null }

  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const velocity = distance / deltaTime

  // Determine primary direction
  let direction: 'left' | 'right' | 'up' | 'down' | null = null
  const absDeltaX = Math.abs(deltaX)
  const absDeltaY = Math.abs(deltaY)

  if (absDeltaX > absDeltaY) {
    direction = deltaX > 0 ? 'right' : 'left'
  } else if (absDeltaY > absDeltaX) {
    direction = deltaY > 0 ? 'down' : 'up'
  }

  return { velocity, direction }
}

// Edge detection utility
function isEdgeGesture(startX: number, screenWidth: number, edgeZone: number): boolean {
  return startX <= edgeZone || startX >= screenWidth - edgeZone
}

// Momentum calculation
function calculateMomentum(velocity: number, direction: string, decay: number): number {
  const baseMultiplier = direction === 'left' || direction === 'right' ? 1.2 : 1.0
  return velocity * baseMultiplier * decay
}

// Accessibility helpers
function announceGestureAction(action: string): void {
  if (typeof window === 'undefined') return

  // Create or update live region for screen readers
  let liveRegion = document.getElementById('gesture-announcements')
  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'gesture-announcements'
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.style.position = 'absolute'
    liveRegion.style.left = '-10000px'
    liveRegion.style.width = '1px'
    liveRegion.style.height = '1px'
    liveRegion.style.overflow = 'hidden'
    document.body.appendChild(liveRegion)
  }

  liveRegion.textContent = action
}

// Spring animation utility
function createSpringAnimation(
  from: number,
  to: number,
  config: { tension: number; friction: number },
  onUpdate: (value: number) => void,
  onComplete?: () => void
): () => void {
  let isActive = true
  let position = from
  let velocity = 0
  
  const animate = () => {
    if (!isActive) return

    const spring = -config.tension * (position - to)
    const damper = -config.friction * velocity
    const acceleration = spring + damper

    velocity += acceleration * 0.016 // 60fps
    position += velocity * 0.016

    onUpdate(position)

    // Check if animation is complete
    if (Math.abs(velocity) < 0.01 && Math.abs(position - to) < 0.01) {
      onUpdate(to)
      onComplete?.()
      return
    }

    requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)

  return () => {
    isActive = false
  }
}

// Main hook
export function useSidebarGestures(customConfig?: Partial<GestureConfig>) {
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const config = { ...DEFAULT_CONFIG, ...customConfig }
  const platform = useRef<PlatformInfo>(detectPlatform())
  
  // State
  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    direction: null,
    isEdgeGesture: false,
    momentum: 0
  })

  const [dragOffset, setDragOffset] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<(() => void) | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)

  // Enhanced touch handlers
  const handleTouchStart = useCallback((e: globalThis.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch) return

    const currentTime = Date.now()
    const screenWidth = window.innerWidth
    const isEdge = isEdgeGesture(touch.clientX, screenWidth, config.edgeDetectionZone)

    // Platform-specific optimizations
    if (platform.current.isIOS) {
      e.preventDefault() // Prevent iOS bounce
    }

    setGestureState({
      isActive: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: currentTime,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
      direction: null,
      isEdgeGesture: isEdge,
      momentum: 0
    })

    // Haptic feedback for gesture start
    if (config.enableHapticFeedback && isEdge) {
      triggerHapticFeedback({ type: 'selection', intensity: 'light' }, platform.current)
    }

    // Accessibility announcement
    if (config.enableAccessibilityMode) {
      announceGestureAction('Gesture started')
    }
  }, [config])

  const handleTouchMove = useCallback((e: globalThis.TouchEvent) => {
    if (!gestureState.isActive) return

    const touch = e.touches[0]
    if (!touch) return

    const currentTime = Date.now()
    const deltaX = touch.clientX - gestureState.startX
    const deltaY = touch.clientY - gestureState.startY
    const deltaTime = currentTime - gestureState.startTime

    // Calculate velocity and direction
    const { velocity, direction } = calculateVelocity(deltaX, deltaY, deltaTime)

    // Update gesture state
    const newState = {
      ...gestureState,
      currentX: touch.clientX,
      currentY: touch.clientY,
      deltaX,
      deltaY,
      velocity,
      direction
    }

    setGestureState(newState)

    // Handle sidebar drag behavior
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) { // Horizontal gesture
      e.preventDefault()

      // Calculate drag offset based on gesture type
      let offset = 0
      
      if (gestureState.isEdgeGesture && !isCollapsed) {
        // Edge gesture to close
        offset = Math.min(0, deltaX)
      } else if (gestureState.isEdgeGesture && isCollapsed) {
        // Edge gesture to open
        offset = Math.max(0, deltaX)
      } else if (!isCollapsed) {
        // Regular gesture on open sidebar
        offset = Math.min(0, deltaX)
      }

      // Apply platform-specific adjustments
      if (platform.current.isAndroid) {
        offset *= 0.8 // Slightly less sensitive on Android
      }

      setDragOffset(offset)

      // Progressive haptic feedback
      if (config.enableHapticFeedback && Math.abs(deltaX) > 50 && velocity > config.velocityThreshold) {
        const intensity = velocity > 1 ? 'heavy' : velocity > 0.5 ? 'medium' : 'light'
        triggerHapticFeedback({ type: 'impact', intensity }, platform.current)
      }
    }
  }, [gestureState, isCollapsed, config])

  const handleTouchEnd = useCallback((e: globalThis.TouchEvent) => {
    if (!gestureState.isActive) return

    const touch = e.changedTouches[0]
    if (!touch) return

    const currentTime = Date.now()
    const totalTime = currentTime - gestureState.startTime
    const { velocity, direction } = calculateVelocity(
      gestureState.deltaX,
      gestureState.deltaY,
      totalTime
    )

    // Calculate momentum
    const momentum = calculateMomentum(velocity, direction || '', config.momentumDecay)

    // Determine action based on gesture characteristics
    let shouldToggle = false
    let action = 'none'

    // Distance-based decision
    const distanceThreshold = window.innerWidth * (isCollapsed ? config.openThreshold : config.closeThreshold)
    const distanceMet = Math.abs(gestureState.deltaX) > distanceThreshold

    // Velocity-based decision
    const velocityMet = velocity > config.velocityThreshold

    // Edge gesture logic
    if (gestureState.isEdgeGesture) {
      if (isCollapsed && gestureState.deltaX > config.edgeActivationDistance) {
        shouldToggle = true
        action = 'open'
      } else if (!isCollapsed && gestureState.deltaX < -config.edgeActivationDistance) {
        shouldToggle = true
        action = 'close'
      }
    } else {
      // Regular gesture logic
      if (velocityMet || distanceMet) {
        if (direction === 'left' && !isCollapsed) {
          shouldToggle = true
          action = 'close'
        } else if (direction === 'right' && isCollapsed) {
          shouldToggle = true
          action = 'open'
        }
      }
    }

    // Execute action with animation
    if (shouldToggle) {
      setIsAnimating(true)
      
      // Haptic feedback for successful gesture
      if (config.enableHapticFeedback) {
        triggerHapticFeedback({ type: 'notification', intensity: 'medium' }, platform.current)
      }

      // Accessibility announcement
      if (config.enableAccessibilityMode) {
        announceGestureAction(`Sidebar ${action}ed`)
      }

      // Animate to final position
      const targetOffset = action === 'open' ? 0 : -window.innerWidth * 0.8
      animationRef.current = createSpringAnimation(
        dragOffset,
        targetOffset,
        config.springConfig,
        setDragOffset,
        () => {
          setIsCollapsed(action === 'close')
          setDragOffset(0)
          setIsAnimating(false)
        }
      )
    } else {
      // Spring back to original position
      setIsAnimating(true)
      animationRef.current = createSpringAnimation(
        dragOffset,
        0,
        config.springConfig,
        setDragOffset,
        () => {
          setDragOffset(0)
          setIsAnimating(false)
        }
      )
    }

    // Reset gesture state
    setGestureState({
      isActive: false,
      startX: 0,
      startY: 0,
      startTime: 0,
      currentX: 0,
      currentY: 0,
      deltaX: 0,
      deltaY: 0,
      velocity: 0,
      direction: null,
      isEdgeGesture: false,
      momentum: 0
    })
  }, [gestureState, isCollapsed, dragOffset, config, setIsCollapsed])

  // Attach event listeners
  const attachListeners = useCallback((element: HTMLElement | null) => {
    // Clean up previous listeners
    if (containerRef.current) {
      containerRef.current.removeEventListener('touchstart', handleTouchStart)
      containerRef.current.removeEventListener('touchmove', handleTouchMove)
      containerRef.current.removeEventListener('touchend', handleTouchEnd)
    }

    containerRef.current = element

    if (element) {
      // Use passive listeners where appropriate for better performance
      element.addEventListener('touchstart', handleTouchStart, { 
        passive: !platform.current.isIOS 
      })
      element.addEventListener('touchmove', handleTouchMove, { 
        passive: false // Need to prevent default for drag behavior
      })
      element.addEventListener('touchend', handleTouchEnd, { 
        passive: true 
      })
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current()
      }
      if (containerRef.current) {
        containerRef.current.removeEventListener('touchstart', handleTouchStart)
        containerRef.current.removeEventListener('touchmove', handleTouchMove)
        containerRef.current.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  // Keyboard accessibility
  const handleKeyboard = useCallback((e: KeyboardEvent) => {
    if (!config.enableAccessibilityMode) return

    // Handle keyboard shortcuts for accessibility
    if (e.key === 'Escape' && !isCollapsed) {
      setIsCollapsed(true)
      if (config.enableHapticFeedback) {
        triggerHapticFeedback({ type: 'selection' }, platform.current)
      }
      announceGestureAction('Sidebar closed with keyboard')
    } else if (e.key === 'Enter' && e.altKey) {
      setIsCollapsed(!isCollapsed)
      if (config.enableHapticFeedback) {
        triggerHapticFeedback({ type: 'selection' }, platform.current)
      }
      announceGestureAction(`Sidebar ${isCollapsed ? 'opened' : 'closed'} with keyboard`)
    }
  }, [config.enableAccessibilityMode, isCollapsed, setIsCollapsed, config.enableHapticFeedback])

  // Attach keyboard listeners
  useEffect(() => {
    if (config.enableAccessibilityMode) {
      document.addEventListener('keydown', handleKeyboard)
      return () => document.removeEventListener('keydown', handleKeyboard)
    }
  }, [config.enableAccessibilityMode, handleKeyboard])

  // Public API
  return {
    // Gesture attachment
    attachListeners,
    containerRef,

    // Gesture state
    isGestureActive: gestureState.isActive,
    dragOffset,
    isAnimating,
    gestureDirection: gestureState.direction,
    gestureVelocity: gestureState.velocity,
    isEdgeGesture: gestureState.isEdgeGesture,

    // Platform info
    platform: platform.current,

    // Manual controls
    triggerHaptic: (pattern: HapticPattern) => 
      triggerHapticFeedback(pattern, platform.current),
    
    // Configuration
    config,

    // Accessibility helpers
    announceAction: announceGestureAction,

    // Direct gesture handlers (for custom implementation)
    gestureHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  }
}

// Helper hook for easy integration with existing components
export function useSidebarSwipe(customConfig?: Partial<GestureConfig>) {
  const gestures = useSidebarGestures(customConfig)
  
  return {
    ...gestures,
    // Simplified ref for easy attachment
    ref: gestures.attachListeners,
    // CSS transform for drag effect
    transform: `translateX(${gestures.dragOffset}px)`,
    // Simplified state
    isDragging: gestures.isGestureActive,
    isAnimating: gestures.isAnimating
  }
}

export type { GestureConfig, PlatformInfo, HapticPattern }