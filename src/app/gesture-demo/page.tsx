'use client'

import { useState } from 'react'
import { useSidebarGestures, useSidebarSwipe } from '@/hooks/use-sidebar-gestures'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function GestureDemoPage() {
  const [demoType, setDemoType] = useState<'basic' | 'advanced' | 'accessibility'>('basic')

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Enhanced Sidebar Gestures Demo</h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive touch and swipe gesture support for tablet and mobile devices
          </p>
        </div>

        {/* Demo Type Selector */}
        <div className="flex justify-center space-x-4">
          <Button
            variant={demoType === 'basic' ? 'default' : 'outline'}
            onClick={() => setDemoType('basic')}
          >
            Basic Demo
          </Button>
          <Button
            variant={demoType === 'advanced' ? 'default' : 'outline'}
            onClick={() => setDemoType('advanced')}
          >
            Advanced Features
          </Button>
          <Button
            variant={demoType === 'accessibility' ? 'default' : 'outline'}
            onClick={() => setDemoType('accessibility')}
          >
            Accessibility Demo
          </Button>
        </div>

        {/* Demo Content */}
        {demoType === 'basic' && <BasicGestureDemo />}
        {demoType === 'advanced' && <AdvancedGestureDemo />}
        {demoType === 'accessibility' && <AccessibilityDemo />}

        {/* Feature Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>✨ Key Features</CardTitle>
              <CardDescription>
                What makes this gesture system special
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Velocity Detection</Badge>
                <span className="text-sm">Smart gesture recognition based on speed</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Edge Detection</Badge>
                <span className="text-sm">Screen edge swipe activation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Momentum Physics</Badge>
                <span className="text-sm">Natural momentum-based interactions</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Platform Adaptive</Badge>
                <span className="text-sm">iOS/Android specific optimizations</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Haptic Feedback</Badge>
                <span className="text-sm">Tactile response (where supported)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Accessibility</Badge>
                <span className="text-sm">Screen reader and keyboard support</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📱 Device Support</CardTitle>
              <CardDescription>
                Optimized for all touch devices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge>iOS</Badge>
                <span className="text-sm">iPhone and iPad optimized</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge>Android</Badge>
                <span className="text-sm">Phone and tablet support</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge>Desktop</Badge>
                <span className="text-sm">Touch-enabled laptops</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge>Responsive</Badge>
                <span className="text-sm">Auto-adapts to screen size</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>📖 How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">On Touch Devices:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Swipe from the left edge to open sidebar</li>
                <li>Swipe left anywhere to close sidebar</li>
                <li>Quick swipes are more responsive</li>
                <li>Feel haptic feedback on supported devices</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Keyboard Shortcuts:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Alt + Enter</kbd> - Toggle sidebar</li>
                <li><kbd className="px-2 py-1 bg-muted rounded text-xs">Escape</kbd> - Close sidebar</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Basic gesture demonstration
function BasicGestureDemo() {
  const {
    ref,
    transform,
    isDragging,
    platform
  } = useSidebarSwipe()

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative">
      <Card>
        <CardHeader>
          <CardTitle>Basic Gesture Demo</CardTitle>
          <CardDescription>
            Simple swipe gestures with visual feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Platform:</span>
              <Badge variant="outline">
                {platform.isIOS ? 'iOS' : platform.isAndroid ? 'Android' : 'Desktop'}
                {platform.isTablet && ' Tablet'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Gesture Active:</span>
              <Badge variant={isDragging ? 'default' : 'secondary'}>
                {isDragging ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Transform:</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                translateX({Math.round(parseFloat(transform.replace(/[^\d.-]/g, '')))}px)
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Sidebar */}
      <div 
        ref={ref}
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-card border-r shadow-lg z-50 transition-transform',
          !sidebarOpen && '-translate-x-full'
        )}
        style={{ transform: sidebarOpen ? transform : undefined }}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Demo Sidebar</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Swipe left to close or try the gestures!
          </p>
          <Button 
            onClick={() => setSidebarOpen(false)}
            variant="outline"
            className="w-full"
          >
            Close Sidebar
          </Button>
        </div>
      </div>

      {/* Open Button */}
      {!sidebarOpen && (
        <Button 
          onClick={() => setSidebarOpen(true)}
          className="mt-4"
        >
          Open Sidebar (or swipe from left edge)
        </Button>
      )}
    </div>
  )
}

// Advanced gesture demonstration
function AdvancedGestureDemo() {
  const {
    attachListeners,
    isGestureActive,
    dragOffset,
    gestureVelocity,
    gestureDirection,
    isEdgeGesture,
    platform,
    triggerHaptic
  } = useSidebarGestures({
    enableHapticFeedback: true,
    velocityThreshold: 0.4,
    minSwipeDistance: 60
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Gesture Features</CardTitle>
          <CardDescription>
            Real-time gesture metrics and advanced configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Gesture Active:</span>
                <Badge variant={isGestureActive ? 'default' : 'secondary'}>
                  {isGestureActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Velocity:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {gestureVelocity.toFixed(3)}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Direction:</span>
                <Badge variant="outline">
                  {gestureDirection || 'None'}
                </Badge>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Edge Gesture:</span>
                <Badge variant={isEdgeGesture ? 'default' : 'secondary'}>
                  {isEdgeGesture ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Drag Offset:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {Math.round(dragOffset)}px
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Haptics:</span>
                <Badge variant={platform.supportsHaptics ? 'default' : 'secondary'}>
                  {platform.supportsHaptics ? 'Supported' : 'Not Available'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive demo area */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Demo Area</CardTitle>
          <CardDescription>
            Try gestures in this area to see real-time feedback
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={attachListeners}
            className="h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center relative overflow-hidden"
          >
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                {isGestureActive ? '👆 Gesture in progress...' : '👋 Swipe here to test gestures'}
              </p>
              {gestureDirection && (
                <Badge variant="default">
                  Direction: {gestureDirection}
                </Badge>
              )}
            </div>
            
            {/* Visual gesture indicator */}
            {isGestureActive && (
              <div 
                className="absolute top-1/2 left-0 w-1 h-8 bg-primary transform -translate-y-1/2 transition-transform"
                style={{ transform: `translateX(${Math.max(0, dragOffset)}px) translateY(-50%)` }}
              />
            )}
          </div>
          
          <div className="mt-4 flex space-x-2">
            <Button 
              onClick={() => triggerHaptic({ type: 'selection', intensity: 'light' })}
              size="sm"
              variant="outline"
            >
              Test Light Haptic
            </Button>
            <Button 
              onClick={() => triggerHaptic({ type: 'impact', intensity: 'medium' })}
              size="sm"
              variant="outline"
            >
              Test Medium Haptic
            </Button>
            <Button 
              onClick={() => triggerHaptic({ type: 'notification', intensity: 'heavy' })}
              size="sm"
              variant="outline"
            >
              Test Heavy Haptic
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Accessibility demonstration
function AccessibilityDemo() {
  const {
    attachListeners,
    announceAction,
    platform
  } = useSidebarGestures({
    enableAccessibilityMode: true,
    enableHapticFeedback: true
  })

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Accessibility Features</CardTitle>
          <CardDescription>
            Screen reader support and keyboard navigation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Screen Reader Support</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Gesture actions are announced via aria-live regions</li>
              <li>All interactive elements have proper ARIA labels</li>
              <li>Focus management for keyboard navigation</li>
            </ul>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Keyboard Navigation</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-background border rounded text-xs">Alt + Enter</kbd>
                <span className="text-sm">Toggle sidebar</span>
              </div>
              <div className="flex items-center space-x-2">
                <kbd className="px-2 py-1 bg-background border rounded text-xs">Escape</kbd>
                <span className="text-sm">Close sidebar</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Test Announcements</h4>
            <div className="space-x-2">
              <Button 
                onClick={() => announceAction('Test announcement for screen readers')}
                size="sm"
                variant="outline"
              >
                Test Announcement
              </Button>
              <Button 
                onClick={() => announceAction('Sidebar opened with gesture')}
                size="sm"
                variant="outline"
              >
                Sidebar Opened
              </Button>
              <Button 
                onClick={() => announceAction('Sidebar closed with gesture')}
                size="sm"
                variant="outline"
              >
                Sidebar Closed
              </Button>
            </div>
          </div>

          {/* Live region indicator */}
          <div className="p-4 border border-dashed border-primary/25 rounded-lg">
            <h4 className="font-semibold mb-2">Accessibility Demo Area</h4>
            <div 
              ref={attachListeners}
              className="h-32 bg-muted/25 rounded flex items-center justify-center"
              role="region"
              aria-label="Gesture testing area"
            >
              <p className="text-center text-sm text-muted-foreground">
                Swipe here - actions will be announced to screen readers
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live announcement area (visible for demo purposes) */}
      <Card className="border-primary/25">
        <CardHeader>
          <CardTitle className="text-sm">Live Announcements</CardTitle>
          <CardDescription className="text-xs">
            (Normally hidden - shown here for demo purposes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            id="demo-announcements"
            className="min-h-[40px] p-3 bg-muted/25 rounded text-sm font-mono"
            aria-live="polite"
            aria-atomic="true"
          >
            {/* Announcements will appear here */}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}