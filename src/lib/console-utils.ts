/**
 * Console utilities for development
 * Helps suppress known non-critical warnings and errors
 */

// Known safe warnings that can be suppressed in development
const SAFE_WARNINGS_TO_SUPPRESS = [
  'Download the React DevTools for a better development experience',
  'ReactDOM.useFormState has been renamed to React.useActionState',
  'Warning: Label \'JIT TOTAL\' already exists for console.time()',
  'Warning: No such label \'JIT TOTAL\' for console.timeEnd()',
  '[auth][warn][debug-enabled]',
  'The resource at "http://localhost:3000/_next/static/media/',
]

const originalConsoleError = console.error
const originalConsoleWarn = console.warn

/**
 * Initialize console filtering to suppress known safe warnings
 * Only active in development mode
 */
export function initConsoleFiltering() {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // Filter console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ')
    
    // Suppress known safe warnings
    const shouldSuppress = SAFE_WARNINGS_TO_SUPPRESS.some(warning => 
      message.includes(warning)
    )
    
    if (!shouldSuppress) {
      originalConsoleError.apply(console, args)
    }
  }

  // Filter console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ')
    
    // Suppress known safe warnings
    const shouldSuppress = SAFE_WARNINGS_TO_SUPPRESS.some(warning => 
      message.includes(warning)
    )
    
    if (!shouldSuppress) {
      originalConsoleWarn.apply(console, args)
    }
  }
}

/**
 * Restore original console methods
 */
export function restoreConsole() {
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
}

// Auto-initialize in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  initConsoleFiltering()
}