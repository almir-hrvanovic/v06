import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from './auth-helpers'
import { z } from 'zod'
import { getAuthenticatedUser } from '@/utils/supabase/api-auth'

// API response helpers with security headers
export function jsonResponse(data: any, status: number = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}

export function errorResponse(message: string, status: number = 400) {
  return jsonResponse({ error: message }, status)
}

export function unauthorizedResponse() {
  return errorResponse('Unauthorized', 401)
}

export function forbiddenResponse() {
  return errorResponse('Forbidden', 403)
}

export function notFoundResponse(resource: string = 'Resource') {
  return errorResponse(`${resource} not found`, 404)
}

// Input validation wrapper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Validation failed', error.errors)
    }
    throw error
  }
}

// Custom error class for validation
export class ValidationError extends Error {
  constructor(message: string, public errors: z.ZodError['errors']) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Permission checking utilities
export async function requireAuth(request?: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) {
    throw new AuthError('Authentication required')
  }
  return session
}

export async function requireRole(roles: string[], request?: NextRequest) {
  const session = await requireAuth(request)
  if (!roles.includes(user.role)) {
    throw new AuthError('Insufficient permissions')
  }
  return session
}

// Custom error class for auth
export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// Sanitize user input
export function sanitizeInput(input: string): string {
  // Remove any potential XSS attempts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

// Sanitize object recursively
export function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject)
  }
  
  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeInput(key)] = sanitizeObject(value)
    }
    return sanitized
  }
  
  return obj
}

// API route wrapper with error handling
export function apiHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      return await handler(req)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof AuthError) {
        return error.message === 'Authentication required' 
          ? unauthorizedResponse()
          : forbiddenResponse()
      }
      
      if (error instanceof ValidationError) {
        return jsonResponse({
          error: error.message,
          details: error.errors
        }, 400)
      }
      
      if (error instanceof z.ZodError) {
        return jsonResponse({
          error: 'Validation failed',
          details: error.errors
        }, 400)
      }
      
      // Log internal errors but don't expose details
      console.error('Internal error:', error)
      return errorResponse('Internal server error', 500)
    }
  }
}

// Request body parser with size limit
export async function parseBody<T>(
  request: NextRequest,
  schema?: z.ZodSchema<T>,
  maxSize: number = 1024 * 1024 // 1MB default
): Promise<T> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > maxSize) {
    throw new ValidationError('Request body too large', [])
  }
  
  try {
    const body = await request.json()
    const sanitized = sanitizeObject(body)
    
    if (schema) {
      return validateInput(schema, sanitized)
    }
    
    return sanitized as T
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ValidationError('Invalid JSON', [])
    }
    throw error
  }
}

// SQL injection prevention helper
export function escapeSqlIdentifier(identifier: string): string {
  // Remove any characters that could be used for SQL injection
  return identifier.replace(/[^a-zA-Z0-9_]/g, '')
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  const values = new Uint8Array(length)
  crypto.getRandomValues(values)
  
  for (let i = 0; i < length; i++) {
    token += chars[values[i] % chars.length]
  }
  
  return token
}

// IP address validation
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}