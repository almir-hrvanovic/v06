/**
 * Example usage of useResponsiveBreakpoint hook
 * 
 * This file demonstrates various ways to use the responsive breakpoint hook
 * in real-world scenarios with the existing component architecture.
 */

'use client';

import { useResponsiveBreakpoint, useSpecificBreakpoints, useMediaQuery } from './use-responsive-breakpoint';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Example 1: Basic responsive layout with breakpoint detection
 */
export function ResponsiveLayoutExample() {
  const { current, is, isAbove, isBelow, dimensions } = useResponsiveBreakpoint();

  return (
    <div className="p-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Responsive Layout Example</h2>
        
        <div className="space-y-4">
          <div>
            <strong>Current Breakpoint:</strong> {current}
          </div>
          
          <div>
            <strong>Viewport:</strong> {dimensions.width} × {dimensions.height}px
          </div>

          {/* Conditional rendering based on breakpoints */}
          {is('xs') && (
            <div className="bg-red-100 p-4 rounded">
              Extra small devices (phones)
            </div>
          )}

          {is('sm') && (
            <div className="bg-orange-100 p-4 rounded">
              Small devices (large phones)
            </div>
          )}

          {is('md') && (
            <div className="bg-yellow-100 p-4 rounded">
              Medium devices (tablets)
            </div>
          )}

          {is('lg') && (
            <div className="bg-green-100 p-4 rounded">
              Large devices (desktops)
            </div>
          )}

          {is('xl') && (
            <div className="bg-blue-100 p-4 rounded">
              Extra large devices (large desktops)
            </div>
          )}

          {is('2xl') && (
            <div className="bg-purple-100 p-4 rounded">
              2X large devices (larger desktops)
            </div>
          )}

          {/* iPad Pro specific detection */}
          {is('ipad-pro') && (
            <div className="bg-pink-100 p-4 rounded">
              iPad Pro detected (1024px)
            </div>
          )}

          {/* 4K+ monitor detection */}
          {isAbove('4xl') && (
            <div className="bg-indigo-100 p-4 rounded">
              4K+ monitor detected (2560px+)
            </div>
          )}

          {/* Range-based detection */}
          {isBelow('md') && (
            <Button variant="outline" size="sm">
              Mobile Action
            </Button>
          )}

          {isAbove('lg') && (
            <Button variant="default">
              Desktop Action
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * Example 2: Performance-optimized specific breakpoint watching
 */
export function OptimizedBreakpointExample() {
  // Only watch specific breakpoints for better performance
  const breakpoints = useSpecificBreakpoints(['sm', 'md', 'lg', 'xl']);

  return (
    <div className="p-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Optimized Breakpoint Example</h2>
        
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {breakpoints.current === 'sm' && (
              <span className="px-2 py-1 bg-orange-200 rounded text-sm">SM Active</span>
            )}
            {breakpoints.current === 'md' && (
              <span className="px-2 py-1 bg-yellow-200 rounded text-sm">MD Active</span>
            )}
            {breakpoints.current === 'lg' && (
              <span className="px-2 py-1 bg-green-200 rounded text-sm">LG Active</span>
            )}
            {breakpoints.current === 'xl' && (
              <span className="px-2 py-1 bg-blue-200 rounded text-sm">XL Active</span>
            )}
          </div>

          <div className="text-sm text-gray-600">
            Current: {breakpoints.current} | Dimensions: {breakpoints.dimensions.width}×{breakpoints.dimensions.height}
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Example 3: Custom breakpoints for specific project needs
 */
export function CustomBreakpointsExample() {
  const { current, is, dimensions } = useResponsiveBreakpoint({
    customBreakpoints: {
      mobile: 480,
      'tablet-portrait': 768,
      'tablet-landscape': 1024,
      'desktop-small': 1280,
      'desktop-large': 1920,
      'ultrawide': 2560,
    },
    debounceMs: 200, // Slower debouncing for better performance
    enableLogging: process.env.NODE_ENV === 'development', // Debug logging in dev
  });

  return (
    <div className="p-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Custom Breakpoints Example</h2>
        
        <div className="space-y-4">
          <div>
            <strong>Custom Breakpoint:</strong> {current}
          </div>

          {(is('xs') || is('sm')) && (
            <div className="bg-red-100 border border-red-300 p-4 rounded">
              📱 Mobile view optimized for touch interaction
            </div>
          )}

          {is('ipad-pro') && (
            <div className="bg-blue-100 border border-blue-300 p-4 rounded">
              📱 iPad Pro - perfect for reading
            </div>
          )}

          {is('md') && (
            <div className="bg-green-100 border border-green-300 p-4 rounded">
              📱 Tablet landscape - great for productivity
            </div>
          )}

          {(is('3xl') || is('4xl') || is('5xl') || is('6xl')) && (
            <div className="bg-purple-100 border border-purple-300 p-4 rounded">
              🖥️ Ultrawide monitor - maximize screen real estate
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * Example 4: Media query hook for CSS-in-JS and advanced queries
 */
export function MediaQueryExample() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const hasHover = useMediaQuery('(hover: hover)');

  return (
    <div className="p-4">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Media Query Example</h2>
        
        <div className="grid gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isMobile ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span>Mobile (≤768px): {isMobile ? 'Yes' : 'No'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isLandscape ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span>Landscape: {isLandscape ? 'Yes' : 'No'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${prefersReducedMotion ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span>Reduced Motion: {prefersReducedMotion ? 'Yes' : 'No'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span>Dark Mode: {isDarkMode ? 'Yes' : 'No'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${hasHover ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            <span>Hover Support: {hasHover ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Example 5: Integration with existing header component pattern
 */
export function ResponsiveHeaderExample() {
  const { is, isBelow, isAbove } = useResponsiveBreakpoint();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo - always visible */}
        <div className="mr-4">
          <h1 className="text-lg font-semibold">MyApp</h1>
        </div>

        {/* Search - hidden on mobile */}
        {isAbove('md') && (
          <div className="flex-1 max-w-sm">
            <input
              type="search"
              placeholder="Search..."
              className="w-full px-3 py-2 text-sm border rounded-md"
            />
          </div>
        )}

        {/* Actions - adaptive based on screen size */}
        <div className="ml-auto flex items-center space-x-2">
          {/* Mobile: Show compact buttons */}
          {isBelow('md') && (
            <>
              <Button variant="ghost" size="sm">
                🔍
              </Button>
              <Button variant="ghost" size="sm">
                🔔
              </Button>
            </>
          )}

          {/* Tablet and up: Show full buttons */}
          {isAbove('md') && (
            <>
              <Button variant="ghost">
                Notifications
              </Button>
              <Button variant="ghost">
                Settings
              </Button>
            </>
          )}

          {/* Desktop: Show additional features */}
          {isAbove('lg') && (
            <Button variant="default">
              Premium Features
            </Button>
          )}

          {/* User menu - always visible but content varies */}
          <Button variant="ghost" size={isBelow('md') ? 'sm' : 'default'}>
            {isBelow('md') ? '👤' : 'Profile'}
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Example 6: Complete responsive dashboard layout
 */
export function ResponsiveDashboardExample() {
  const { current, is, isAbove, isBetween, dimensions } = useResponsiveBreakpoint({
    debounceMs: 100, // Fast response for dashboard
    enableLogging: true, // Debug mode
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Status bar - development only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm">
          Debug: {current} breakpoint | {dimensions.width}×{dimensions.height}px
        </div>
      )}

      <div className="flex">
        {/* Sidebar - conditional rendering */}
        {isAbove('lg') && (
          <aside className="w-64 bg-white shadow-sm h-screen">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Navigation</h2>
              <nav className="space-y-2">
                <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Dashboard</a>
                <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Analytics</a>
                <a href="#" className="block px-3 py-2 rounded hover:bg-gray-100">Settings</a>
              </nav>
            </div>
          </aside>
        )}

        {/* Main content */}
        <main className="flex-1">
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Dashboard</h1>
                
                {/* Mobile menu button */}
                {(current === 'xs' || current === 'sm' || current === 'md') && (
                  <Button variant="outline" size="sm">
                    ☰ Menu
                  </Button>
                )}
              </div>
            </div>
          </header>

          {/* Content area */}
          <div className="p-6">
            {/* Grid layout - responsive columns */}
            <div className={`grid gap-6 ${
              is('xs') || is('sm') ? 'grid-cols-1' :
              is('md') ? 'grid-cols-2' :
              isBetween('lg', 'xl') ? 'grid-cols-3' :
              'grid-cols-4'
            }`}>
              {/* Cards */}
              {Array.from({ length: 8 }, (_, i) => (
                <Card key={i} className="p-6">
                  <h3 className="font-semibold mb-2">Card {i + 1}</h3>
                  <p className="text-sm text-gray-600">
                    {(current === 'xs' || current === 'sm') ? 'Mobile view' : 'Desktop view'} content
                  </p>
                  <div className="mt-4">
                    <Button 
                      size={(current === 'xs' || current === 'sm') ? 'sm' : 'default'}
                      variant="outline"
                    >
                      Action
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ResponsiveLayoutExample;