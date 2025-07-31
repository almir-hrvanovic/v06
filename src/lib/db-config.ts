// Database configuration for dynamic database provider switching
// Similar to auth-config.ts but for database connections

export const DB_PROVIDER = process.env.DB_PROVIDER || 'prisma' as const
export const DB_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'development' as const

// Database connection configurations
export const DB_CONFIGS = {
  development: {
    // v06-development Supabase
    supabaseUrl: 'https://qaakctjbseauaybfavth.supabase.co',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Prisma via Supabase (pooled connection)
    databaseUrl: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL!,
  },
  production: {
    // v06-production Supabase
    supabaseUrl: 'https://befqdelybliowmsgczph.supabase.co',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Prisma via Supabase (pooled connection)
    databaseUrl: process.env.DATABASE_URL!,
    directUrl: process.env.DIRECT_URL!,
  }
} as const

// Get current database configuration
export const getCurrentDbConfig = () => {
  return DB_CONFIGS[DB_ENVIRONMENT]
}

// Database provider types
export type DatabaseProvider = 'prisma' | 'supabase' | 'drizzle'

// Export provider constants
export const DATABASE_PROVIDERS = {
  PRISMA: 'prisma',
  SUPABASE: 'supabase',
  DRIZZLE: 'drizzle',
} as const