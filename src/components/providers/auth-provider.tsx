'use client'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  // For Supabase, we don't need a provider as it handles its own state
  // The useAuth hook will manage the Supabase session directly
  return <>{children}</>
}

// Re-export useAuth from the hook
export { useAuth } from '@/hooks/use-auth'