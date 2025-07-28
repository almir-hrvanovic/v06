/**
 * Environment configuration and validation
 * Centralizes all environment variable access and provides type safety
 */

import { z } from 'zod'

// Environment variable schema
const envSchema = z.object({
  // Required variables
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  
  // Optional variables with defaults
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // Redis configuration
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().optional(),
  
  // Email configuration
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  
  // UploadThing
  UPLOADTHING_TOKEN: z.string().optional(),
  UPLOADTHING_SECRET: z.string().optional(),
  
  // Development features
  ENABLE_CRON: z.string().transform(val => val === 'true').optional(),
  DEBUG: z.string().transform(val => val === 'true').optional(),
  SEED_DATABASE: z.string().transform(val => val === 'true').optional(),
  
  // Feature flags
  NEXT_PUBLIC_ENABLE_EXPERIMENTAL: z.string().transform(val => val === 'true').optional(),
  NEXT_PUBLIC_MAINTENANCE_MODE: z.string().transform(val => val === 'true').optional(),
  
  // Vercel-specific
  VERCEL: z.string().optional(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
  VERCEL_URL: z.string().optional(),
})

// Parse and validate environment variables
const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment variables')
}

export const env = parsed.data

// Helper functions
export const isDevelopment = () => env.NODE_ENV === 'development'
export const isProduction = () => env.NODE_ENV === 'production'
export const isTest = () => env.NODE_ENV === 'test'
export const isVercel = () => !!env.VERCEL

// Get the application URL
export const getAppUrl = () => {
  if (env.NEXT_PUBLIC_APP_URL) return env.NEXT_PUBLIC_APP_URL
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`
  return env.NEXTAUTH_URL
}

// Check if email is configured
export const isEmailConfigured = () => {
  return !!(
    env.EMAIL_SERVER_HOST &&
    env.EMAIL_SERVER_PORT &&
    env.EMAIL_SERVER_USER &&
    env.EMAIL_SERVER_PASSWORD
  )
}

// Check if Redis is configured
export const isRedisConfigured = () => {
  return !!(env.REDIS_URL || (env.REDIS_HOST && env.REDIS_PORT))
}

// Check if UploadThing is configured
export const isUploadThingConfigured = () => {
  return !!(env.UPLOADTHING_TOKEN && env.UPLOADTHING_SECRET)
}

// Get Redis configuration
export const getRedisConfig = () => {
  if (env.REDIS_URL) {
    return { url: env.REDIS_URL }
  }
  
  if (env.REDIS_HOST && env.REDIS_PORT) {
    return {
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT),
      password: env.REDIS_PASSWORD,
      db: env.REDIS_DB ? parseInt(env.REDIS_DB) : 0,
    }
  }
  
  return null
}

// Environment-specific configurations
export const config = {
  isDev: isDevelopment(),
  isProd: isProduction(),
  isTest: isTest(),
  
  // URLs
  appUrl: getAppUrl(),
  authUrl: env.NEXTAUTH_URL,
  
  // Features
  features: {
    email: isEmailConfigured(),
    redis: isRedisConfigured(),
    uploadThing: isUploadThingConfigured(),
    cron: env.ENABLE_CRON ?? false,
    debug: env.DEBUG ?? isDevelopment(),
    experimental: env.NEXT_PUBLIC_ENABLE_EXPERIMENTAL ?? false,
    maintenance: env.NEXT_PUBLIC_MAINTENANCE_MODE ?? false,
  },
  
  // Development
  dev: {
    seedDatabase: env.SEED_DATABASE ?? false,
  },
}