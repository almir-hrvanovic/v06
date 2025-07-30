// Centralized auth configuration
// This allows switching between NextAuth and Supabase Auth easily

export const AUTH_PROVIDER = 'supabase' as const // 'nextauth' | 'supabase'

// Auth URLs
export const AUTH_URLS = {
  signIn: '/auth/signin',
  signOut: '/api/auth/signout',
  dashboard: '/dashboard',
  home: '/'
} as const

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/auth',
  '/',
  '/api/auth',
  '/api/uploadthing',
  '/api/health'
] as const

// Protected route patterns
export const PROTECTED_ROUTES = {
  dashboard: '/dashboard',
  api: '/api'
} as const