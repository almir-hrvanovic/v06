'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Standard Tailwind CSS breakpoint definitions
 */
export const TAILWIND_BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Extended breakpoint definitions including iPad Pro and 4K+ monitors
 */
export const EXTENDED_BREAKPOINTS = {
  ...TAILWIND_BREAKPOINTS,
  'ipad-pro': 1024,  // iPad Pro portrait
  '3xl': 1920,       // Full HD
  '4xl': 2560,       // 1440p
  '5xl': 3840,       // 4K
  '6xl': 5120,       // 5K
} as const;

/**
 * Breakpoint names type
 */
export type BreakpointName = keyof typeof EXTENDED_BREAKPOINTS;

/**
 * Custom breakpoint configuration
 */
export interface CustomBreakpoints {
  [key: string]: number;
}

/**
 * Viewport dimensions
 */
export interface ViewportDimensions {
  width: number;
  height: number;
}

/**
 * Breakpoint detection result
 */
export interface BreakpointState {
  /** Current active breakpoint name */
  current: BreakpointName;
  /** Current viewport dimensions */
  dimensions: ViewportDimensions;
  /** Check if current breakpoint matches */
  is: (breakpoint: BreakpointName) => boolean;
  /** Check if current breakpoint is above specified breakpoint */
  isAbove: (breakpoint: BreakpointName) => boolean;
  /** Check if current breakpoint is below specified breakpoint */
  isBelow: (breakpoint: BreakpointName) => boolean;
  /** Check if current breakpoint is between two breakpoints (inclusive) */
  isBetween: (min: BreakpointName, max: BreakpointName) => boolean;
  /** Get all currently active breakpoints */
  activeBreakpoints: BreakpointName[];
  /** Check if any of the provided breakpoints are active */
  isAnyOf: (breakpoints: BreakpointName[]) => boolean;
}

/**
 * Hook configuration options
 */
export interface UseResponsiveBreakpointOptions {
  /** Custom breakpoints to merge with defaults */
  customBreakpoints?: CustomBreakpoints;
  /** Use only custom breakpoints (ignore defaults) */
  useCustomOnly?: boolean;
  /** Debounce delay in milliseconds for resize events */
  debounceMs?: number;
  /** Initial dimensions for SSR */
  initialDimensions?: ViewportDimensions;
  /** Enable detailed logging for debugging */
  enableLogging?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_OPTIONS: Required<UseResponsiveBreakpointOptions> = {
  customBreakpoints: {},
  useCustomOnly: false,
  debounceMs: 150,
  initialDimensions: { width: 1024, height: 768 }, // Default to tablet size for SSR
  enableLogging: false,
};

/**
 * Debounce utility function
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * Get current viewport dimensions safely
 */
function getViewportDimensions(): ViewportDimensions {
  if (typeof window === 'undefined') {
    return DEFAULT_OPTIONS.initialDimensions;
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Determine the current breakpoint based on width
 */
function getCurrentBreakpoint(
  width: number,
  breakpoints: Record<string, number>
): string {
  const sortedBreakpoints = Object.entries(breakpoints)
    .sort(([, a], [, b]) => b - a); // Sort descending by width
  
  for (const [name, minWidth] of sortedBreakpoints) {
    if (width >= minWidth) {
      return name;
    }
  }
  
  // Fallback to the smallest breakpoint
  const smallestBreakpoint = Object.entries(breakpoints)
    .sort(([, a], [, b]) => a - b)[0];
  
  return smallestBreakpoint?.[0] || 'xs';
}

/**
 * Get all active breakpoints for current width
 */
function getActiveBreakpoints(
  width: number,
  breakpoints: Record<string, number>
): string[] {
  return Object.entries(breakpoints)
    .filter(([, minWidth]) => width >= minWidth)
    .map(([name]) => name);
}

/**
 * Comprehensive responsive breakpoint detection hook
 * 
 * Provides real-time breakpoint detection with performance optimization,
 * custom breakpoint support, and SSR-safe implementation.
 * 
 * @param options Configuration options for the hook
 * @returns Breakpoint state and utility functions
 * 
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const { current, is, isAbove, dimensions } = useResponsiveBreakpoint({
 *     customBreakpoints: { mobile: 480 },
 *     debounceMs: 200
 *   });
 * 
 *   if (is('mobile')) {
 *     return <MobileLayout />;
 *   }
 * 
 *   if (isAbove('lg')) {
 *     return <DesktopLayout />;
 *   }
 * 
 *   return <TabletLayout />;
 * }
 * ```
 */
export function useResponsiveBreakpoint(
  options: UseResponsiveBreakpointOptions = {}
): BreakpointState {
  const config = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...options }),
    [options]
  );

  // Merge breakpoints based on configuration
  const breakpoints = useMemo(() => {
    if (config.useCustomOnly) {
      return config.customBreakpoints;
    }
    return { ...EXTENDED_BREAKPOINTS, ...config.customBreakpoints };
  }, [config.customBreakpoints, config.useCustomOnly]);

  // State for dimensions and current breakpoint
  const [dimensions, setDimensions] = useState<ViewportDimensions>(
    config.initialDimensions
  );

  const [isClient, setIsClient] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    setDimensions(getViewportDimensions());
  }, []);

  // Debounced resize handler
  const handleResize = useCallback(
    debounce(() => {
      const newDimensions = getViewportDimensions();
      setDimensions(newDimensions);
      
      if (config.enableLogging) {
        console.log('📱 Viewport resize:', newDimensions);
      }
    }, config.debounceMs),
    [config.debounceMs, config.enableLogging]
  );

  // Set up resize listener
  useEffect(() => {
    if (!isClient) return;

    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, isClient]);

  // Calculate current breakpoint
  const current = useMemo(() => {
    const breakpointName = getCurrentBreakpoint(dimensions.width, breakpoints);
    
    if (config.enableLogging) {
      console.log('🎯 Current breakpoint:', breakpointName, `(${dimensions.width}px)`);
    }
    
    return breakpointName as BreakpointName;
  }, [dimensions.width, breakpoints, config.enableLogging]);

  // Calculate active breakpoints
  const activeBreakpoints = useMemo(
    () => getActiveBreakpoints(dimensions.width, breakpoints) as BreakpointName[],
    [dimensions.width, breakpoints]
  );

  // Utility functions
  const breakpointUtils = useMemo(() => ({
    /**
     * Check if current breakpoint matches the specified breakpoint
     */
    is: (breakpoint: BreakpointName): boolean => {
      return current === breakpoint;
    },

    /**
     * Check if current viewport is above the specified breakpoint
     */
    isAbove: (breakpoint: BreakpointName): boolean => {
      const breakpointWidth = breakpoints[breakpoint];
      if (breakpointWidth === undefined) {
        console.warn(`⚠️ Breakpoint '${breakpoint}' not found`);
        return false;
      }
      return dimensions.width > breakpointWidth;
    },

    /**
     * Check if current viewport is below the specified breakpoint
     */
    isBelow: (breakpoint: BreakpointName): boolean => {
      const breakpointWidth = breakpoints[breakpoint];
      if (breakpointWidth === undefined) {
        console.warn(`⚠️ Breakpoint '${breakpoint}' not found`);
        return false;
      }
      return dimensions.width < breakpointWidth;
    },

    /**
     * Check if current viewport is between two breakpoints (inclusive)
     */
    isBetween: (min: BreakpointName, max: BreakpointName): boolean => {
      const minWidth = breakpoints[min];
      const maxWidth = breakpoints[max];
      
      if (minWidth === undefined || maxWidth === undefined) {
        console.warn(`⚠️ Breakpoint not found: min='${min}' max='${max}'`);
        return false;
      }
      
      return dimensions.width >= minWidth && dimensions.width <= maxWidth;
    },

    /**
     * Check if any of the provided breakpoints are currently active
     */
    isAnyOf: (breakpointList: BreakpointName[]): boolean => {
      return breakpointList.some(bp => activeBreakpoints.includes(bp));
    },
  }), [current, dimensions.width, breakpoints, activeBreakpoints]);

  return {
    current,
    dimensions,
    activeBreakpoints,
    ...breakpointUtils,
  };
}

/**
 * Hook variant that only tracks specific breakpoints for better performance
 * 
 * @param watchedBreakpoints Array of breakpoints to watch
 * @param options Configuration options
 * @returns Simplified breakpoint state for watched breakpoints only
 * 
 * @example
 * ```tsx
 * function MobileFirstComponent() {
 *   const { isMobile, isTablet } = useSpecificBreakpoints(['sm', 'lg']);
 *   
 *   return (
 *     <div>
 *       {isMobile && <MobileNav />}
 *       {isTablet && <TabletLayout />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useSpecificBreakpoints(
  watchedBreakpoints: BreakpointName[],
  options: UseResponsiveBreakpointOptions = {}
) {
  const { current, dimensions, is, isAbove, isBelow } = useResponsiveBreakpoint(options);

  return useMemo(() => {
    const result: Record<string, boolean> = {};
    
    watchedBreakpoints.forEach(breakpoint => {
      const camelKey = `is${breakpoint.charAt(0).toUpperCase()}${breakpoint.slice(1)}`;
      result[camelKey] = is(breakpoint);
      result[`isAbove${breakpoint.charAt(0).toUpperCase()}${breakpoint.slice(1)}`] = isAbove(breakpoint);
      result[`isBelow${breakpoint.charAt(0).toUpperCase()}${breakpoint.slice(1)}`] = isBelow(breakpoint);
    });

    return {
      current,
      dimensions,
      ...result,
    };
  }, [current, dimensions, is, isAbove, isBelow, watchedBreakpoints]);
}

/**
 * Simple media query hook for CSS-in-JS solutions
 * 
 * @param query Media query string
 * @param options Configuration options
 * @returns Boolean indicating if media query matches
 * 
 * @example
 * ```tsx
 * function MediaQueryComponent() {
 *   const isMobile = useMediaQuery('(max-width: 768px)');
 *   const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 *   
 *   return (
 *     <div className={`${isMobile ? 'mobile' : 'desktop'} ${isDarkMode ? 'dark' : 'light'}`}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(
  query: string,
  options: Pick<UseResponsiveBreakpointOptions, 'debounceMs' | 'enableLogging'> = {}
): boolean {
  const [matches, setMatches] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { debounceMs = 150, enableLogging = false } = options;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = debounce((event: MediaQueryListEvent) => {
      setMatches(event.matches);
      
      if (enableLogging) {
        console.log(`📺 Media query "${query}":`, event.matches);
      }
    }, debounceMs);

    // Use both addEventListener and addListener for broader compatibility
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handler);
      }
    };
  }, [query, debounceMs, enableLogging, isClient]);

  return matches;
}

/**
 * Export common breakpoint utilities
 */
export const breakpointUtils = {
  /**
   * Get breakpoint value by name
   */
  getBreakpointValue: (name: BreakpointName): number => {
    return EXTENDED_BREAKPOINTS[name] || 0;
  },

  /**
   * Convert breakpoint to CSS media query
   */
  toMediaQuery: (breakpoint: BreakpointName, type: 'min' | 'max' = 'min'): string => {
    const value = EXTENDED_BREAKPOINTS[breakpoint];
    if (!value) return '';
    
    const width = type === 'max' ? value - 1 : value;
    return `(${type}-width: ${width}px)`;
  },

  /**
   * Get all breakpoint names sorted by width
   */
  getSortedBreakpoints: (): BreakpointName[] => {
    return Object.entries(EXTENDED_BREAKPOINTS)
      .sort(([, a], [, b]) => a - b)
      .map(([name]) => name as BreakpointName);
  },

  /**
   * Check if a width falls within a breakpoint range
   */
  isWidthInBreakpoint: (width: number, breakpoint: BreakpointName): boolean => {
    const sortedBreakpoints = breakpointUtils.getSortedBreakpoints();
    const currentIndex = sortedBreakpoints.indexOf(breakpoint);
    
    if (currentIndex === -1) return false;
    
    const currentValue = EXTENDED_BREAKPOINTS[breakpoint];
    const nextBreakpoint = sortedBreakpoints[currentIndex + 1];
    const nextValue = nextBreakpoint ? EXTENDED_BREAKPOINTS[nextBreakpoint] : Infinity;
    
    return width >= currentValue && width < nextValue;
  },
};

export default useResponsiveBreakpoint;