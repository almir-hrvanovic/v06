/**
 * Development-specific configuration
 */

import { env } from './env'

export const developmentConfig = {
  // Database
  database: {
    logging: true,
    pool: {
      min: 2,
      max: 10,
    },
  },
  
  // Logging
  logging: {
    level: 'debug',
    prettyPrint: true,
    errorStack: true,
  },
  
  // Development tools
  devTools: {
    prismaStudio: true,
    apiPlayground: true,
    mockData: true,
  },
  
  // Security (relaxed for development)
  security: {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
    },
    rateLimit: {
      enabled: false,
    },
    csrf: {
      enabled: false,
    },
  },
  
  // Email (console logging)
  email: {
    transport: env.EMAIL_SERVER_HOST ? 'smtp' : 'console',
    preview: true, // Open emails in browser
  },
  
  // File uploads
  uploads: {
    provider: 'local', // Store files locally in development
    localPath: './uploads',
  },
  
  // Background jobs
  jobs: {
    enabled: env.ENABLE_CRON ?? false,
    interval: '*/5 * * * *', // Every 5 minutes
  },
  
  // Feature flags
  features: {
    debugPanel: true,
    performanceMonitoring: true,
    errorBoundaries: true,
  },
}