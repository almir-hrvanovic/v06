# Enhanced Sidebar Gesture System Documentation

## Overview

The enhanced sidebar gesture system provides comprehensive touch and swipe gesture support for tablet and mobile devices, with platform-specific optimizations, accessibility features, and haptic feedback integration.

## Features

### ✨ Core Features

- **Velocity Detection**: Smart gesture recognition based on swipe speed
- **Edge Detection**: Screen edge swipe activation zones
- **Momentum-Based Interactions**: Natural physics-based gesture handling
- **Platform-Specific Behaviors**: Optimized for iOS and Android
- **Haptic Feedback Integration**: Tactile response where supported
- **Accessibility-Friendly**: Screen reader and keyboard navigation support
- **Performance Optimized**: 60fps smooth animations with cleanup
- **Configurable**: Extensive customization options

### 📱 Device Support

- **iOS**: iPhone and iPad with native iOS gesture patterns
- **Android**: Phones and tablets with Material Design feel
- **Desktop**: Touch-enabled laptops and hybrid devices
- **Responsive**: Auto-adapts to different screen sizes

## Installation & Usage

### Basic Usage

```typescript
import { useSidebarGestures } from '@/hooks/use-sidebar-gestures'

function MySidebar() {
  const { attachListeners, dragOffset, isGestureActive } = useSidebarGestures()
  
  return (
    <div 
      ref={attachListeners}
      style={{ transform: `translateX(${dragOffset}px)` }}
    >
      {/* Sidebar content */}
    </div>
  )
}
```

### Simplified Usage

```typescript
import { useSidebarSwipe } from '@/hooks/use-sidebar-gestures'

function SimpleSidebar() {
  const { ref, transform, isDragging } = useSidebarSwipe()
  
  return (
    <div ref={ref} style={{ transform }}>
      {/* Sidebar content */}
    </div>
  )
}
```

## Configuration Options

### GestureConfig Interface

```typescript
interface GestureConfig {
  // Basic gesture settings
  minSwipeDistance: number        // Minimum distance for gesture (default: 50)
  maxSwipeTime: number           // Maximum time for gesture (default: 500)
  velocityThreshold: number      // Minimum velocity (default: 0.3)
  momentumDecay: number          // Momentum decay rate (default: 0.95)
  
  // Edge detection
  edgeDetectionZone: number      // Edge zone width (default: 20)
  edgeActivationDistance: number // Distance to activate (default: 100)
  
  // Platform specific
  enableHapticFeedback: boolean  // Enable haptic feedback (default: true)
  enableAccessibilityMode: boolean // Enable accessibility (default: false)
  
  // Thresholds
  openThreshold: number          // Open threshold ratio (default: 0.3)
  closeThreshold: number         // Close threshold ratio (default: 0.7)
  
  // Animation
  springConfig: {
    tension: number              // Spring tension (default: 280)
    friction: number             // Spring friction (default: 30)
  }
}
```

### Custom Configuration Example

```typescript
const customConfig = {
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

const gestures = useSidebarGestures(customConfig)
```

## API Reference

### useSidebarGestures Hook

Returns an object with the following properties:

```typescript
{
  // Gesture attachment
  attachListeners: (element: HTMLElement | null) => void
  containerRef: RefObject<HTMLElement>

  // Gesture state
  isGestureActive: boolean
  dragOffset: number
  isAnimating: boolean
  gestureDirection: 'left' | 'right' | 'up' | 'down' | null
  gestureVelocity: number
  isEdgeGesture: boolean

  // Platform info
  platform: PlatformInfo

  // Manual controls
  triggerHaptic: (pattern: HapticPattern) => void
  announceAction: (message: string) => void

  // Configuration
  config: GestureConfig

  // Direct handlers (for custom implementation)
  gestureHandlers: {
    onTouchStart: (e: TouchEvent) => void
    onTouchMove: (e: TouchEvent) => void
    onTouchEnd: (e: TouchEvent) => void
  }
}
```

### useSidebarSwipe Hook (Simplified)

Returns an object with simplified properties:

```typescript
{
  // All properties from useSidebarGestures
  ...gestures,
  
  // Simplified API
  ref: (element: HTMLElement | null) => void
  transform: string  // CSS transform value
  isDragging: boolean
  isAnimating: boolean
}
```

## Platform Detection

The system automatically detects the platform and adjusts behavior:

```typescript
interface PlatformInfo {
  isIOS: boolean
  isAndroid: boolean
  isMobile: boolean
  isTablet: boolean
  supportsHaptics: boolean
  devicePixelRatio: number
}
```

### Platform-Specific Optimizations

- **iOS**: Prevents bounce scrolling, uses spring animations
- **Android**: Optimized event listeners, Material Design curves
- **Desktop**: Fallback support for touch-enabled devices

## Haptic Feedback

### Haptic Patterns

```typescript
interface HapticPattern {
  type: 'selection' | 'impact' | 'notification'
  intensity?: 'light' | 'medium' | 'heavy'
}

// Usage
triggerHaptic({ type: 'selection', intensity: 'light' })
triggerHaptic({ type: 'impact', intensity: 'medium' })
triggerHaptic({ type: 'notification', intensity: 'heavy' })
```

### Haptic Support Detection

```typescript
const { platform } = useSidebarGestures()

if (platform.supportsHaptics) {
  // Haptic feedback is available
}
```

## Accessibility Features

### Screen Reader Support

- Automatic announcements via `aria-live` regions
- Gesture actions are announced to screen readers
- Proper ARIA labels and roles

### Keyboard Navigation

- `Alt + Enter`: Toggle sidebar
- `Escape`: Close sidebar
- Focus management for interactive elements

### Accessibility Configuration

```typescript
const accessibilityConfig = {
  enableAccessibilityMode: true,
  minSwipeDistance: 60,        // Slightly lower for accessibility
  maxSwipeTime: 800,          // More time for accessibility
}

const { announceAction } = useSidebarGestures(accessibilityConfig)

// Manual announcements
announceAction('Sidebar opened with gesture')
```

## Performance Optimizations

### Frame Rate Monitoring

The system includes built-in performance monitoring:

```typescript
import { performanceMonitor } from '@/lib/gesture-utils'

// Start monitoring
performanceMonitor.startMonitoring()

// Get metrics
const metrics = performanceMonitor.getMetrics()
console.log(`Average FPS: ${metrics.fps}`)
console.log(`Frame time: ${metrics.averageFrameTime}ms`)
```

### Memory Management

- Automatic cleanup of event listeners
- Debounced and throttled functions
- Efficient animation frame handling

### Best Practices

1. **Use passive listeners where possible**
2. **Batch DOM updates**
3. **Avoid unnecessary re-renders**
4. **Clean up resources properly**

## Advanced Features

### Touch Tracking

Enhanced touch point tracking with velocity calculation:

```typescript
import { TouchTracker } from '@/lib/gesture-utils'

const tracker = new TouchTracker()
tracker.addPoint(touch)
const velocity = tracker.getVelocity()
const metrics = tracker.getGestureMetrics()
```

### Device Optimization

Automatic device-specific optimizations:

```typescript
import { deviceOptimizer } from '@/lib/gesture-utils'

const thresholds = deviceOptimizer.getOptimalThresholds()
const animationConfig = deviceOptimizer.getAnimationConfig()
```

## Examples

### Basic Integration

```typescript
import { useSidebarGestures } from '@/hooks/use-sidebar-gestures'

function MobileSidebar() {
  const { attachListeners, dragOffset, platform } = useSidebarGestures()
  
  return (
    <div 
      ref={attachListeners}
      className="fixed inset-y-0 left-0 w-64 bg-white transform"
      style={{ transform: `translateX(${dragOffset}px)` }}
    >
      <div className="p-4">
        <h2>Navigation</h2>
        {platform.isTablet && (
          <p className="text-sm text-gray-500">Swipe to close</p>
        )}
      </div>
    </div>
  )
}
```

### Advanced Configuration

```typescript
function AdvancedSidebar() {
  const gestures = useSidebarGestures({
    enableHapticFeedback: true,
    enableAccessibilityMode: true,
    velocityThreshold: 0.5,
    edgeDetectionZone: 25,
    springConfig: {
      tension: 320,
      friction: 40
    }
  })
  
  return (
    <div ref={gestures.attachListeners}>
      {/* Sidebar with all advanced features */}
    </div>
  )
}
```

### Accessibility First

```typescript
function AccessibleSidebar() {
  const { attachListeners, announceAction } = useSidebarGestures({
    enableAccessibilityMode: true,
    minSwipeDistance: 60,
    maxSwipeTime: 800
  })
  
  return (
    <>
      <div className="sr-only">
        Navigation sidebar. Swipe from left edge to open, swipe left to close.
        Use Alt+Enter to toggle, Escape to close.
      </div>
      <div ref={attachListeners} role="navigation" aria-label="Main navigation">
        {/* Accessible sidebar content */}
      </div>
    </>
  )
}
```

## Testing

### Automated Testing

The system includes comprehensive Playwright tests:

```bash
npm run test tests/ui-validation/sidebar-gestures-validation.spec.ts
```

### Test Coverage

- ✅ Desktop behavior
- ✅ Mobile/tablet gestures
- ✅ Platform-specific behavior
- ✅ Accessibility features
- ✅ Edge detection
- ✅ Performance monitoring
- ✅ Error handling

### Manual Testing

1. **Desktop**: Verify mouse interactions work normally
2. **Mobile**: Test edge swipes and regular swipes
3. **Tablet**: Test landscape/portrait orientations
4. **Accessibility**: Test with screen readers
5. **Performance**: Monitor frame rates during gestures

## Troubleshooting

### Common Issues

1. **Gestures not working**
   - Check if `attachListeners` is properly connected
   - Verify touch events are not being prevented elsewhere
   - Ensure the element has proper dimensions

2. **Poor performance**
   - Check for memory leaks in event listeners
   - Monitor frame rates with performance tools
   - Reduce complexity in gesture handlers

3. **Accessibility issues**
   - Enable accessibility mode in configuration
   - Test with screen readers
   - Verify keyboard shortcuts work

### Debug Mode

Enable debug mode for development:

```typescript
const gestures = useSidebarGestures({
  // Add debug logging in development
})

if (process.env.NODE_ENV === 'development') {
  console.log('Gesture state:', gestures)
}
```

## Browser Support

- **Chrome/Edge**: Full support including haptics
- **Safari**: Full support with iOS optimizations
- **Firefox**: Core gestures supported
- **Mobile browsers**: Optimized for mobile Safari and Chrome

## License

This gesture system is part of the GS-CMS project and follows the same licensing terms.

## Contributing

When contributing to the gesture system:

1. Follow the existing code patterns
2. Add tests for new features
3. Update documentation
4. Test across different devices
5. Consider accessibility impact

---

For more examples, see the `/src/components/examples/sidebar-gesture-examples.tsx` file and the demo page at `/gesture-demo`.