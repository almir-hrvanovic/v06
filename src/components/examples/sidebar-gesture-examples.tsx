'use client'

import React from 'react'
import { useSidebarGestures, useSidebarSwipe, type GestureConfig } from '@/hooks/use-sidebar-gestures'
import { cn } from '@/lib/utils'

// Example 1: Basic Integration with Mobile Sidebar
export function MobileSidebarWithGestures() {
  const {
    attachListeners,
    isGestureActive,
    dragOffset,
    isAnimating,
    platform,
    triggerHaptic
  } = useSidebarGestures()

  return (
    <div 
      ref={attachListeners}
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform',
        isAnimating && 'transition-transform duration-300 ease-out'
      )}
      style={{
        transform: `translateX(${dragOffset}px)`
      }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Navigation</h2>
          {platform.isTablet && (
            <div className="text-xs text-muted-foreground">
              Swipe to close
            </div>
          )}
        </div>
        
        {/* Gesture indicator */}
        {isGestureActive && (
          <div className="absolute top-4 right-4">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          </div>
        )}
        
        {/* Navigation content */}
        <nav className="space-y-2">
          <button 
            className="w-full text-left p-2 hover:bg-accent rounded"
            onClick={() => triggerHaptic({ type: 'selection' })}
          >
            Dashboard
          </button>
          <button 
            className="w-full text-left p-2 hover:bg-accent rounded"
            onClick={() => triggerHaptic({ type: 'selection' })}
          >
            Users
          </button>
          <button 
            className="w-full text-left p-2 hover:bg-accent rounded"
            onClick={() => triggerHaptic({ type: 'selection' })}
          >
            Settings
          </button>
        </nav>
      </div>
    </div>
  )
}

// Example 2: Custom Configuration
export function CustomConfigSidebar() {
  const customConfig: Partial<GestureConfig> = {
    minSwipeDistance: 80,
    velocityThreshold: 0.4,
    enableHapticFeedback: true,
    enableAccessibilityMode: true,
    edgeDetectionZone: 30,
    springConfig: {
      tension: 300,
      friction: 25
    }
  }

  const {
    ref,
    transform,
    isDragging,
    isAnimating,
    platform
  } = useSidebarSwipe(customConfig)

  return (
    <div className="relative">
      {/* Edge indicator for tablets */}
      {platform.isTablet && (
        <div className="fixed left-0 top-0 bottom-0 w-1 bg-primary/20 z-40" />
      )}
      
      <div 
        ref={ref}
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 bg-card border-r shadow-lg',
          isDragging && 'pointer-events-none',
          isAnimating && 'transition-transform duration-200 ease-out'
        )}
        style={{ transform }}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Custom Gestures</h2>
          
          {/* Platform info */}
          <div className="mb-4 p-3 bg-muted rounded text-sm">
            <div>Platform: {platform.isIOS ? 'iOS' : platform.isAndroid ? 'Android' : 'Desktop'}</div>
            <div>Device: {platform.isMobile ? 'Mobile' : platform.isTablet ? 'Tablet' : 'Desktop'}</div>
            <div>Haptics: {platform.supportsHaptics ? 'Supported' : 'Not supported'}</div>
            <div>Pixel Ratio: {platform.devicePixelRatio}</div>
          </div>
          
          {/* Gesture state */}
          <div className="mb-4 p-3 bg-accent rounded text-sm">
            <div>Dragging: {isDragging ? 'Yes' : 'No'}</div>
            <div>Animating: {isAnimating ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Example 3: Accessibility-First Implementation
export function AccessibleSidebar() {
  const accessibilityConfig: Partial<GestureConfig> = {
    enableAccessibilityMode: true,
    enableHapticFeedback: true,
    minSwipeDistance: 60, // Slightly lower for accessibility
    maxSwipeTime: 800,    // More time for accessibility
  }

  const {
    attachListeners,
    isGestureActive,
    dragOffset,
    announceAction,
    gestureDirection,
    platform
  } = useSidebarGestures(accessibilityConfig)

  return (
    <>
      {/* Screen reader instructions */}
      <div className="sr-only">
        Navigation sidebar. 
        {platform.isTablet && 'Swipe from left edge to open, swipe left to close. '}
        Use Alt+Enter to toggle, Escape to close.
      </div>
      
      <div 
        ref={attachListeners}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r"
        style={{ transform: `translateX(${dragOffset}px)` }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="p-4">
          {/* Visual gesture feedback */}
          {isGestureActive && (
            <div 
              className="absolute top-2 left-1/2 transform -translate-x-1/2"
              aria-hidden="true"
            >
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce delay-100" />
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce delay-200" />
              </div>
            </div>
          )}
          
          <nav aria-label="Main navigation">
            <ul className="space-y-1">
              <li>
                <button 
                  className="w-full text-left p-3 rounded hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => announceAction('Dashboard selected')}
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button 
                  className="w-full text-left p-3 rounded hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => announceAction('Profile selected')}
                >
                  Profile
                </button>
              </li>
              <li>
                <button 
                  className="w-full text-left p-3 rounded hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
                  onClick={() => announceAction('Settings selected')}
                >
                  Settings
                </button>
              </li>
            </ul>
          </nav>
          
          {/* Gesture direction indicator for debugging */}
          {process.env.NODE_ENV === 'development' && gestureDirection && (
            <div className="absolute bottom-4 right-4 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
              {gestureDirection}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Example 4: Performance Optimized Implementation
export function PerformanceSidebar() {
  const performanceConfig: Partial<GestureConfig> = {
    velocityThreshold: 0.5,
    momentumDecay: 0.98,
    springConfig: {
      tension: 320,
      friction: 40
    }
  }

  const {
    attachListeners,
    isGestureActive,
    dragOffset,
    gestureVelocity,
    isAnimating,
    platform
  } = useSidebarGestures(performanceConfig)

  // Memoized transform to prevent unnecessary re-renders
  const transform = React.useMemo(() => 
    `translateX(${dragOffset}px)`, 
    [dragOffset]
  )

  return (
    <div 
      ref={attachListeners}
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-background border-r',
        'will-change-transform', // Optimize for transforms
        isAnimating && 'transition-transform duration-200 ease-out'
      )}
      style={{ transform }}
    >
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Performance Sidebar</h2>
        
        {/* Performance metrics (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-muted rounded text-xs font-mono">
            <div>Velocity: {gestureVelocity.toFixed(3)}</div>
            <div>Offset: {dragOffset.toFixed(1)}px</div>
            <div>Active: {isGestureActive ? '1' : '0'}</div>
            <div>DPR: {platform.devicePixelRatio}</div>
          </div>
        )}
        
        <nav className="space-y-2">
          {Array.from({ length: 10 }, (_, i) => (
            <button
              key={i}
              className="w-full text-left p-2 hover:bg-accent rounded transition-colors"
            >
              Menu Item {i + 1}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

// Example 5: Integration with Existing Sidebar Context
export function IntegratedSidebar() {
  const gestureData = useSidebarGestures({
    enableHapticFeedback: false,
    enableAccessibilityMode: true
  })
  
  const {
    attachListeners,
    dragOffset,
    isGestureActive,
    platform,
    triggerHaptic
  } = gestureData

  return (
    <div 
      ref={attachListeners}
      className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform"
      style={{ transform: `translateX(${dragOffset}px)` }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold">Navigation</h1>
          {isGestureActive && (
            <div className="text-xs text-muted-foreground animate-pulse">
              Swiping...
            </div>
          )}
        </div>
        
        {/* Content with haptic feedback */}
        <nav className="flex-1 p-4 space-y-2">
          <button 
            className="w-full text-left p-3 rounded hover:bg-accent"
            onClick={() => triggerHaptic({ type: 'selection', intensity: 'light' })}
          >
            Dashboard
          </button>
          <button 
            className="w-full text-left p-3 rounded hover:bg-accent"
            onClick={() => triggerHaptic({ type: 'selection', intensity: 'light' })}
          >
            Analytics
          </button>
          <button 
            className="w-full text-left p-3 rounded hover:bg-accent"
            onClick={() => triggerHaptic({ type: 'selection', intensity: 'light' })}
          >
            Settings
          </button>
        </nav>
        
        {/* Footer */}
        <div className="p-4 border-t text-xs text-muted-foreground">
          {platform.isTablet ? 'Swipe to close' : 'Click outside to close'}
        </div>
      </div>
    </div>
  )
}

// Usage Examples Export
export const SidebarGestureExamples = {
  MobileSidebarWithGestures,
  CustomConfigSidebar,
  AccessibleSidebar,
  PerformanceSidebar,
  IntegratedSidebar
}