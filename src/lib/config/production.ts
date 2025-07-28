/**
 * Production-specific configuration
 */

export const productionConfig = {
  // Database
  database: {
    logging: false,
    pool: {
      min: 5,
      max: 30,
    },
    ssl: {
      rejectUnauthorized: false, // For Vercel/Supabase
    },
  },
  
  // Logging
  logging: {
    level: 'error',
    prettyPrint: false,
    errorStack: false,
  },
  
  // Security
  security: {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'https://gs-cms.vercel.app',
      credentials: true,
    },
    rateLimit: {
      enabled: true,
      windowMs: 60 * 1000, // 1 minute
      max: 100, // requests per window
    },
    csrf: {
      enabled: true,
    },
    headers: {
      hsts: true,
      noSniff: true,
      xssProtection: true,
      frameOptions: 'DENY',
    },
  },
  
  // Email
  email: {
    transport: 'smtp',
    preview: false,
  },
  
  // File uploads
  uploads: {
    provider: 'uploadthing',
  },
  
  // Background jobs
  jobs: {
    enabled: true,
    interval: '0 */1 * * *', // Every hour
  },
  
  // Caching
  cache: {
    defaultTTL: 3600, // 1 hour
    maxSize: 1000, // max items
  },
  
  // Performance
  performance: {
    compression: true,
    minification: true,
    imageOptimization: true,
  },
  
  // Monitoring
  monitoring: {
    sentry: process.env.SENTRY_DSN ? true : false,
    analytics: process.env.NEXT_PUBLIC_ANALYTICS_ID ? true : false,
  },
}