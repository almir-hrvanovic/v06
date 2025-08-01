#!/usr/bin/env tsx

import { performance } from 'perf_hooks'

interface TestResult {
  endpoint: string
  method: string
  responseTime: number
  status: number
  cached: boolean
  compressed: boolean
  hasETag: boolean
  optimized: boolean
  payloadSize: number
  compressionRatio?: number
  error?: string
}

class ApiOptimizationTester {
  private baseUrl: string
  private authToken: string | null = null
  private results: TestResult[] = []

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl
  }

  /**
   * Simulate user authentication to get auth token
   */
  async authenticate(email: string = 'almir.hrvanovic@icloud.com', password: string = 'QG\'"^Ukj:_9~%9F') {
    console.log('🔐 Authenticating test user...')
    
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const cookies = response.headers.get('set-cookie')
        if (cookies) {
          // Extract auth token from cookies (simplified)
          this.authToken = cookies
        }
        console.log('✅ Authentication successful')
      } else {
        console.log('⚠️  Authentication failed, testing without auth token')
      }
    } catch (error) {
      console.log('⚠️  Authentication error, testing without auth token:', error)
    }
  }

  /**
   * Test a single API endpoint
   */
  async testEndpoint(
    endpoint: string, 
    method: string = 'GET', 
    body?: any,
    expectAuth: boolean = true
  ): Promise<TestResult> {
    const startTime = performance.now()
    
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, br',
        'User-Agent': 'API-Optimization-Tester/1.0'
      }

      if (body) {
        headers['Content-Type'] = 'application/json'
      }

      if (this.authToken && expectAuth) {
        headers['Cookie'] = this.authToken
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      })

      const responseTime = performance.now() - startTime
      const responseText = await response.text()
      const payloadSize = responseText.length

      // Parse optimization headers
      const cached = response.headers.get('x-cache-status') === 'HIT'
      const compressed = !!response.headers.get('content-encoding')
      const hasETag = !!response.headers.get('etag')
      const optimized = response.headers.get('x-api-optimized') === 'true'
      const serverResponseTime = response.headers.get('x-response-time')

      let compressionRatio: number | undefined
      if (compressed) {
        const originalSize = parseInt(response.headers.get('x-original-size') || '0')
        if (originalSize > 0) {
          compressionRatio = originalSize / payloadSize
        }
      }

      const result: TestResult = {
        endpoint,
        method,
        responseTime,
        status: response.status,
        cached,
        compressed,
        hasETag,
        optimized,
        payloadSize,
        compressionRatio
      }

      console.log(`📊 ${method} ${endpoint}:`, {
        status: response.status,
        time: `${responseTime.toFixed(2)}ms`,
        serverTime: serverResponseTime,
        size: `${payloadSize} bytes`,
        cached: cached ? '✅' : '❌',
        compressed: compressed ? '✅' : '❌',
        etag: hasETag ? '✅' : '❌',
        optimized: optimized ? '✅' : '❌'
      })

      return result

    } catch (error) {
      const responseTime = performance.now() - startTime
      const result: TestResult = {
        endpoint,
        method,
        responseTime,
        status: 0,
        cached: false,
        compressed: false,
        hasETag: false,
        optimized: false,
        payloadSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      console.log(`❌ ${method} ${endpoint}:`, {
        error: result.error,
        time: `${responseTime.toFixed(2)}ms`
      })

      return result
    }
  }

  /**
   * Test ETag caching behavior
   */
  async testETagCaching(endpoint: string): Promise<void> {
    console.log(`🔍 Testing ETag caching for ${endpoint}...`)

    // First request to get ETag
    const firstResponse = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Cookie': this.authToken || '',
        'Accept': 'application/json'
      }
    })

    const etag = firstResponse.headers.get('etag')
    if (!etag) {
      console.log('❌ No ETag header found')
      return
    }

    console.log(`📋 ETag received: ${etag}`)

    // Second request with If-None-Match header
    const secondResponse = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Cookie': this.authToken || '',
        'Accept': 'application/json',
        'If-None-Match': etag
      }
    })

    if (secondResponse.status === 304) {
      console.log('✅ ETag caching working correctly (304 Not Modified)')
    } else {
      console.log(`❌ ETag caching failed (status: ${secondResponse.status})`)
    }
  }

  /**
   * Test batch API functionality
   */
  async testBatchAPI(): Promise<void> {
    console.log('🔄 Testing batch API...')

    const batchRequest = {
      operations: [
        {
          id: 'get-users',
          method: 'GET',
          url: '/api/users?limit=5'
        },
        {
          id: 'get-customers',
          method: 'GET', 
          url: '/api/customers?limit=5'
        },
        {
          id: 'get-analytics',
          method: 'GET',
          url: '/api/analytics?type=overview&timeRange=7'
        }
      ]
    }

    const result = await this.testEndpoint('/api/batch', 'POST', batchRequest)
    
    if (result.status === 200) {
      console.log('✅ Batch API working correctly')
      console.log(`📊 Batch processing time: ${result.responseTime.toFixed(2)}ms`)
    } else {
      console.log('❌ Batch API failed:', result.error)
    }
  }

  /**
   * Test compression efficiency
   */
  async testCompression(endpoint: string): Promise<void> {
    console.log(`🗜️  Testing compression for ${endpoint}...`)

    // Request without compression
    const uncompressedResponse = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Cookie': this.authToken || '',
        'Accept': 'application/json'
        // No Accept-Encoding header
      }
    })

    const uncompressedSize = parseInt(uncompressedResponse.headers.get('content-length') || '0')
    const uncompressedText = await uncompressedResponse.text()
    const actualUncompressedSize = uncompressedText.length

    // Request with compression
    const compressedResponse = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Cookie': this.authToken || '',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, br'
      }
    })

    const compressedSize = parseInt(compressedResponse.headers.get('content-length') || '0')
    const contentEncoding = compressedResponse.headers.get('content-encoding')

    if (contentEncoding) {
      const compressionRatio = actualUncompressedSize / compressedSize
      console.log(`✅ Compression enabled (${contentEncoding})`)
      console.log(`📊 Compression ratio: ${compressionRatio.toFixed(2)}x`)
      console.log(`📊 Size reduction: ${actualUncompressedSize} → ${compressedSize} bytes`)
    } else {
      console.log('❌ Compression not working')
    }
  }

  /**
   * Run comprehensive API optimization tests
   */
  async runTests(): Promise<void> {
    console.log('🚀 Starting API optimization tests...\n')

    // Authenticate first
    await this.authenticate()

    // Test endpoints
    const endpoints = [
      { path: '/api/health', auth: false },
      { path: '/api/users', auth: true },
      { path: '/api/customers', auth: true },
      { path: '/api/inquiries?limit=5', auth: true },
      { path: '/api/analytics?type=overview&timeRange=7', auth: true }
    ]

    console.log('\n📋 Testing API endpoints...')
    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(endpoint.path, 'GET', undefined, endpoint.auth)
      this.results.push(result)
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log('\n🔍 Testing ETag caching...')
    await this.testETagCaching('/api/users')
    await this.testETagCaching('/api/customers')

    console.log('\n🗜️  Testing compression...')
    await this.testCompression('/api/users')
    await this.testCompression('/api/inquiries?limit=10')

    console.log('\n🔄 Testing batch API...')
    await this.testBatchAPI()

    // Performance analysis
    this.analyzeResults()
  }

  /**
   * Analyze test results and provide recommendations
   */
  analyzeResults(): void {
    console.log('\n📊 API Optimization Analysis')
    console.log('=' .repeat(50))

    const successfulRequests = this.results.filter(r => r.status >= 200 && r.status < 300)
    const avgResponseTime = successfulRequests.reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests.length

    console.log(`✅ Successful requests: ${successfulRequests.length}/${this.results.length}`)
    console.log(`⏱️  Average response time: ${avgResponseTime.toFixed(2)}ms`)

    const optimizedCount = successfulRequests.filter(r => r.optimized).length
    const cachedCount = successfulRequests.filter(r => r.cached).length
    const compressedCount = successfulRequests.filter(r => r.compressed).length
    const etagCount = successfulRequests.filter(r => r.hasETag).length

    console.log(`🔧 Optimized responses: ${optimizedCount}/${successfulRequests.length} (${((optimizedCount/successfulRequests.length)*100).toFixed(1)}%)`)
    console.log(`💾 Cached responses: ${cachedCount}/${successfulRequests.length} (${((cachedCount/successfulRequests.length)*100).toFixed(1)}%)`)
    console.log(`🗜️  Compressed responses: ${compressedCount}/${successfulRequests.length} (${((compressedCount/successfulRequests.length)*100).toFixed(1)}%)`)
    console.log(`🏷️  ETag enabled: ${etagCount}/${successfulRequests.length} (${((etagCount/successfulRequests.length)*100).toFixed(1)}%)`)

    // Performance categories
    const fast = successfulRequests.filter(r => r.responseTime < 100).length
    const medium = successfulRequests.filter(r => r.responseTime >= 100 && r.responseTime < 500).length
    const slow = successfulRequests.filter(r => r.responseTime >= 500).length

    console.log(`\n⚡ Performance distribution:`)
    console.log(`  Fast (<100ms): ${fast} requests`)
    console.log(`  Medium (100-500ms): ${medium} requests`)
    console.log(`  Slow (>500ms): ${slow} requests`)

    // Recommendations
    console.log('\n💡 Recommendations:')
    if (optimizedCount < successfulRequests.length) {
      console.log('  - Enable API optimization for remaining endpoints')
    }
    if (compressedCount < successfulRequests.length) {
      console.log('  - Enable compression for all API responses')
    }
    if (etagCount < successfulRequests.length) {
      console.log('  - Implement ETag support for better caching')
    }
    if (slow > 0) {
      console.log('  - Investigate slow endpoints for further optimization')
    }

    console.log('\n🎉 API optimization testing completed!')
  }
}

// Run tests if script is executed directly
if (require.main === module) {
  const tester = new ApiOptimizationTester()
  tester.runTests().catch(console.error)
}

export default ApiOptimizationTester