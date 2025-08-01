import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { gzipSync, brotliCompressSync } from 'zlib'
// Import logging utility (fallback to console if not available)
let OptimizationLogger: any
try {
  const loggingModule = require('@/Optimising_Doc/Templates/logging-utility')
  OptimizationLogger = loggingModule.OptimizationLogger
} catch {
  // Fallback logger if optimization logger is not available
  OptimizationLogger = class {
    constructor(public issueId: string, public phase: string) {}
    startOperation(name: string) { console.log(`[${this.issueId}] Starting: ${name}`) }
    endOperation(name: string, success: boolean, details?: any) { 
      console.log(`[${this.issueId}] ${success ? 'Completed' : 'Failed'}: ${name}`, details) 
    }
    log(level: string, message: string, data?: any) { 
      console.log(`[${this.issueId}] ${level}: ${message}`, data) 
    }
  }
}

// Initialize logger for API optimization tracking
const logger = new OptimizationLogger('api-optimization', 'quick-wins')

export interface ApiOptimizationOptions {
  enableCaching?: boolean
  cacheMaxAge?: number
  enableCompression?: boolean
  enableETag?: boolean
  enableResponseTiming?: boolean
  optimizePayload?: boolean
  excludeFields?: string[]
}

export interface OptimizedResponse {
  data: any
  metadata?: {
    cached?: boolean
    compressed?: boolean
    etag?: string
    responseTime?: number
    optimized?: boolean
  }
}

/**
 * Enhanced API response wrapper with optimization features
 */
export class ApiOptimizer {
  private static defaultOptions: ApiOptimizationOptions = {
    enableCaching: true,
    cacheMaxAge: 300, // 5 minutes
    enableCompression: true,
    enableETag: true,
    enableResponseTiming: true,
    optimizePayload: true,
    excludeFields: ['password', '__v', 'createdAt', 'updatedAt']
  }

  /**
   * Create optimized API response with all performance enhancements
   */
  static async createOptimizedResponse(
    request: NextRequest,
    data: any,
    options: ApiOptimizationOptions = {}
  ): Promise<NextResponse> {
    const startTime = performance.now()
    const opts = { ...this.defaultOptions, ...options }
    
    logger.startOperation('create-optimized-response')

    try {
      // 1. Optimize payload size
      let optimizedData = data
      if (opts.optimizePayload) {
        optimizedData = this.optimizePayload(data, opts.excludeFields || [])
      }

      // 2. Generate ETag for caching
      const etag = opts.enableETag ? this.generateETag(optimizedData) : undefined

      // 3. Check if client has cached version (If-None-Match header)
      if (etag && request.headers.get('if-none-match') === etag) {
        logger.log('INFO', 'Client cache HIT - returning 304', { etag })
        const response = new NextResponse(null, { status: 304 })
        return this.addOptimizationHeaders(response, request, {
          etag,
          responseTime: performance.now() - startTime,
          cached: true
        }, opts)
      }

      // 4. Serialize data
      const jsonData = JSON.stringify(optimizedData)
      
      // 5. Apply compression
      let responseBody = jsonData
      let contentEncoding: string | undefined
      
      if (opts.enableCompression) {
        const acceptEncoding = request.headers.get('accept-encoding') || ''
        
        if (acceptEncoding.includes('br')) {
          responseBody = brotliCompressSync(Buffer.from(jsonData)).toString('base64')
          contentEncoding = 'br'
        } else if (acceptEncoding.includes('gzip')) {
          responseBody = gzipSync(Buffer.from(jsonData)).toString('base64')
          contentEncoding = 'gzip'
        }
      }

      // 6. Create response
      const response = new NextResponse(
        opts.enableCompression && contentEncoding ? 
          Buffer.from(responseBody, 'base64') : 
          jsonData,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...(contentEncoding && { 'Content-Encoding': contentEncoding })
          }
        }
      )

      // 7. Add optimization headers
      const responseTime = performance.now() - startTime
      const optimizedResponse = this.addOptimizationHeaders(response, request, {
        etag,
        responseTime,
        compressed: !!contentEncoding,
        optimized: true
      }, opts)

      logger.log('INFO', 'Optimized response created', {
        responseTime,
        compressed: !!contentEncoding,
        originalSize: jsonData.length,
        finalSize: responseBody.length,
        compressionRatio: contentEncoding ? (jsonData.length / responseBody.length).toFixed(2) : 1
      })

      logger.endOperation('create-optimized-response', true, { responseTime })
      return optimizedResponse

    } catch (error) {
      logger.endOperation('create-optimized-response', false, { error })
      throw error
    }
  }

  /**
   * Add optimization headers to response
   */
  private static addOptimizationHeaders(
    response: NextResponse,
    request: NextRequest,
    metadata: {
      etag?: string
      responseTime?: number
      cached?: boolean
      compressed?: boolean
      optimized?: boolean
    },
    options: ApiOptimizationOptions
  ): NextResponse {
    // Caching headers
    if (options.enableCaching) {
      response.headers.set('Cache-Control', `public, max-age=${options.cacheMaxAge}, stale-while-revalidate=60`)
    }

    // ETag header
    if (metadata.etag) {
      response.headers.set('ETag', metadata.etag)
    }

    // Response timing headers
    if (options.enableResponseTiming && metadata.responseTime) {
      response.headers.set('X-Response-Time', `${metadata.responseTime.toFixed(2)}ms`)
    }

    // Optimization metadata headers
    response.headers.set('X-API-Optimized', 'true')
    response.headers.set('X-Cache-Status', metadata.cached ? 'HIT' : 'MISS')
    
    if (metadata.compressed) {
      response.headers.set('X-Compression-Enabled', 'true')
    }

    // CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, If-None-Match')
    response.headers.set('Access-Control-Expose-Headers', 'ETag, X-Response-Time, X-Cache-Status')

    return response
  }

  /**
   * Generate ETag from data
   */
  private static generateETag(data: any): string {
    const hash = createHash('md5')
    hash.update(JSON.stringify(data))
    return `"${hash.digest('hex')}"`
  }

  /**
   * Optimize payload by removing unnecessary fields
   */
  private static optimizePayload(data: any, excludeFields: string[]): any {
    if (!data) return data

    const removeFields = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(removeFields)
      }
      
      if (obj && typeof obj === 'object') {
        const cleaned: any = {}
        for (const [key, value] of Object.entries(obj)) {
          if (!excludeFields.includes(key)) {
            cleaned[key] = removeFields(value)
          }
        }
        return cleaned
      }
      
      return obj
    }

    return removeFields(data)
  }

  /**
   * Create batch request handler for multiple API operations
   */
  static async handleBatchRequest(
    request: NextRequest,
    batchOperations: Array<{
      id: string
      method: string
      url: string
      body?: any
    }>
  ): Promise<NextResponse> {
    logger.startOperation('batch-request')
    const startTime = performance.now()

    try {
      const results = await Promise.allSettled(
        batchOperations.map(async (op) => {
          try {
            // Create absolute URL for internal API call
            const baseUrl = new URL(request.url).origin
            const response = await fetch(`${baseUrl}${op.url}`, {
              method: op.method,
              headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('Authorization') || ''
              },
              body: op.body ? JSON.stringify(op.body) : undefined
            })

            const data = await response.json()
            return {
              id: op.id,
              status: response.status,
              data: response.ok ? data : { error: data.error || 'Request failed' }
            }
          } catch (error) {
            return {
              id: op.id,
              status: 500,
              data: { error: error instanceof Error ? error.message : 'Unknown error' }
            }
          }
        })
      )

      const batchResponse = {
        success: true,
        results: results.map((result, index) => ({
          ...batchOperations[index],
          ...(result.status === 'fulfilled' ? result.value : {
            status: 500,
            data: { error: 'Operation failed' }
          })
        })),
        timing: {
          total: performance.now() - startTime,
          operations: batchOperations.length
        }
      }

      logger.endOperation('batch-request', true, {
        operations: batchOperations.length,
        responseTime: performance.now() - startTime
      })

      return this.createOptimizedResponse(request, batchResponse, {
        enableCaching: false, // Batch requests shouldn't be cached
        enableCompression: true
      })

    } catch (error) {
      logger.endOperation('batch-request', false, { error })
      return NextResponse.json(
        { error: 'Batch request failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }

  /**
   * Middleware for adding compression to existing routes
   */
  static compressionMiddleware() {
    return async (request: NextRequest, response: NextResponse) => {
      const acceptEncoding = request.headers.get('accept-encoding') || ''
      
      if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('br')) {
        return response
      }

      // Get response body
      const body = await response.text()
      
      if (body.length < 1024) {
        // Don't compress small responses
        return response
      }

      let compressedBody: Buffer
      let encoding: string

      if (acceptEncoding.includes('br')) {
        compressedBody = brotliCompressSync(Buffer.from(body))
        encoding = 'br'
      } else {
        compressedBody = gzipSync(Buffer.from(body))
        encoding = 'gzip'
      }

      const newResponse = new NextResponse(compressedBody, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'application/json',
          'Content-Encoding': encoding,
          'Content-Length': compressedBody.length.toString()
        }
      })

      return newResponse
    }
  }
}

/**
 * Express-style middleware for API optimization
 */
export function apiOptimizationMiddleware(options: ApiOptimizationOptions = {}) {
  return async (request: NextRequest, handler: Function) => {
    const startTime = performance.now()
    
    try {
      // Execute the original handler
      const result = await handler(request)
      
      // If result is already a NextResponse, add optimization headers
      if (result instanceof NextResponse) {
        const responseTime = performance.now() - startTime
        result.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`)
        result.headers.set('X-API-Optimized', 'true')
        
        if (options.enableCaching) {
          result.headers.set('Cache-Control', `public, max-age=${options.cacheMaxAge || 300}`)
        }
        
        return result
      }
      
      // If result is data, create optimized response
      return ApiOptimizer.createOptimizedResponse(request, result, options)
      
    } catch (error) {
      logger.log('ERROR', 'API optimization middleware error', { error })
      throw error
    }
  }
}

/**
 * Quick optimization wrapper for existing API routes
 */
export const optimizeApiRoute = (
  handler: (request: NextRequest) => Promise<NextResponse | any>,
  options: ApiOptimizationOptions = {}
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    logger.startOperation(`optimize-${request.method}-${request.nextUrl.pathname}`)
    
    try {
      const result = await handler(request)
      
      if (result instanceof NextResponse) {
        // Add optimization headers to existing response
        const responseTime = performance.now()
        result.headers.set('X-Response-Time', `${responseTime.toFixed(2)}ms`)
        result.headers.set('X-API-Optimized', 'true')
        
        if (options.enableCaching) {
          result.headers.set('Cache-Control', `public, max-age=${options.cacheMaxAge || 300}`)
        }
        
        logger.endOperation(`optimize-${request.method}-${request.nextUrl.pathname}`, true)
        return result
      }
      
      // Create optimized response from data
      const optimizedResponse = await ApiOptimizer.createOptimizedResponse(request, result, options)
      logger.endOperation(`optimize-${request.method}-${request.nextUrl.pathname}`, true)
      return optimizedResponse
      
    } catch (error) {
      logger.endOperation(`optimize-${request.method}-${request.nextUrl.pathname}`, false, { error })
      throw error
    }
  }
}

export default ApiOptimizer