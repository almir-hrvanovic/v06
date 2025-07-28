/**
 * Application configuration
 * Exports all configuration modules
 */

export * from './env'

// Application constants
export const APP_NAME = 'GS-CMS'
export const APP_DESCRIPTION = 'Customer Relationship & Quote Management System'
export const APP_VERSION = '0.5.0'

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// Session configuration
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days
export const SESSION_UPDATE_AGE = 24 * 60 * 60 // 1 day

// Rate limiting (requests per minute)
export const RATE_LIMITS = {
  api: {
    authenticated: 100,
    unauthenticated: 20,
  },
  auth: {
    signin: 5,
    signup: 3,
    reset: 3,
  },
}

// Email templates
export const EMAIL_TEMPLATES = {
  welcome: 'welcome',
  resetPassword: 'reset-password',
  inquiryAssigned: 'inquiry-assigned',
  quoteSent: 'quote-sent',
  taskReminder: 'task-reminder',
  deadlineWarning: 'deadline-warning',
}

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const

// Business rules
export const BUSINESS_RULES = {
  QUOTE_VALIDITY_DAYS: 30,
  COST_APPROVAL_THRESHOLD: 10000,
  MAX_ITEMS_PER_INQUIRY: 50,
  WORKLOAD_BALANCE_THRESHOLD: 0.2, // 20% deviation allowed
}

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
}

// WebSocket events
export const WS_EVENTS = {
  // Client to server
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SEND_MESSAGE: 'send_message',
  
  // Server to client
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  NEW_MESSAGE: 'new_message',
  NOTIFICATION: 'notification',
  DATA_UPDATE: 'data_update',
}

// API endpoints
export const API_ROUTES = {
  auth: {
    signin: '/api/auth/signin',
    signout: '/api/auth/signout',
    session: '/api/auth/session',
  },
  inquiries: '/api/inquiries',
  quotes: '/api/quotes',
  users: '/api/users',
  notifications: '/api/notifications',
  reports: '/api/reports',
  automation: {
    rules: '/api/automation/rules',
    logs: '/api/automation/logs',
  },
}