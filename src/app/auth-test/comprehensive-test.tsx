'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ApiTest {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  requiresAuth: boolean
  body?: any
  params?: any
}

interface ApiResponse {
  success: boolean
  status: number
  data: any
  error?: string
  duration: number
  cached?: boolean
  authDuration?: number
}

const API_TESTS: Record<string, ApiTest[]> = {
  'Authentication': [
    // These will be handled specially for Supabase auth testing
  ],
  'Core APIs': [
    { endpoint: '/api/users/me', method: 'GET', description: 'Get current user', requiresAuth: true },
    { endpoint: '/api/system-settings', method: 'GET', description: 'Get system settings', requiresAuth: true },
    { endpoint: '/api/notifications', method: 'GET', description: 'Get notifications', requiresAuth: true },
  ],
  'User Management': [
    { endpoint: '/api/users', method: 'GET', description: 'List all users', requiresAuth: true },
    { endpoint: '/api/user/language', method: 'GET', description: 'Get user language preference', requiresAuth: true },
  ],
  'Business Logic': [
    { endpoint: '/api/customers', method: 'GET', description: 'List customers', requiresAuth: true },
    { endpoint: '/api/inquiries', method: 'GET', description: 'List inquiries', requiresAuth: true },
    { endpoint: '/api/quotes', method: 'GET', description: 'List quotes', requiresAuth: true },
    { endpoint: '/api/production-orders', method: 'GET', description: 'List production orders', requiresAuth: true },
    { endpoint: '/api/business-partners', method: 'GET', description: 'List business partners', requiresAuth: true },
    { endpoint: '/api/items', method: 'GET', description: 'List items', requiresAuth: true },
    { endpoint: '/api/costs', method: 'GET', description: 'Get costs', requiresAuth: true },
    { endpoint: '/api/approvals', method: 'GET', description: 'List approvals', requiresAuth: true },
  ],
  'Analytics & Reports': [
    { endpoint: '/api/analytics', method: 'GET', description: 'Get analytics data', requiresAuth: true },
    { endpoint: '/api/analytics/workload', method: 'GET', description: 'Get workload analytics', requiresAuth: true },
    { endpoint: '/api/analytics/workload-optimized', method: 'GET', description: 'Get optimized workload', requiresAuth: true },
    { endpoint: '/api/search', method: 'GET', description: 'Search functionality', requiresAuth: true },
  ],
  'System & Health': [
    { endpoint: '/api/health', method: 'GET', description: 'Health check', requiresAuth: false },
    { endpoint: '/api/auth/health', method: 'GET', description: 'Auth health check', requiresAuth: false },
    { endpoint: '/api/auth/performance', method: 'GET', description: 'Auth performance metrics', requiresAuth: false },
    { endpoint: '/api/cache/stats', method: 'GET', description: 'Cache statistics', requiresAuth: true },
    { endpoint: '/api/monitoring/metrics', method: 'GET', description: 'Monitoring metrics', requiresAuth: true },
    { endpoint: '/api/console-monitor/status', method: 'GET', description: 'Console monitor status', requiresAuth: false },
  ],
  'Automation': [
    { endpoint: '/api/automation/rules', method: 'GET', description: 'List automation rules', requiresAuth: true },
  ],
  'Debug & Test': [
    { endpoint: '/api/debug-cookies', method: 'GET', description: 'Debug cookies', requiresAuth: false },
    { endpoint: '/api/test-auth-new', method: 'GET', description: 'Test auth endpoint', requiresAuth: false },
  ]
}

export default function ComprehensiveApiTest() {
  const [results, setResults] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [activeTab, setActiveTab] = useState('Authentication')
  const [authResults, setAuthResults] = useState<any>({})
  const supabase = createClient()

  const runAuthTests = async () => {
    setLoading(prev => ({ ...prev, auth: true }))
    const authTestResults: any = {}

    try {
      // Test 1: Check current session
      console.log('🔍 Test 1: Checking current session...')
      const sessionStart = Date.now()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      authTestResults.session = {
        success: !!session && !sessionError,
        hasSession: !!session,
        user: session?.user?.email,
        error: sessionError?.message,
        duration: Date.now() - sessionStart
      }

      // Test 2: Check auth user
      console.log('🔍 Test 2: Checking auth user...')
      const userStart = Date.now()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      authTestResults.authUser = {
        success: !!user && !userError,
        hasUser: !!user,
        email: user?.email,
        error: userError?.message,
        duration: Date.now() - userStart
      }

      // Test 3: Check cookies
      console.log('🔍 Test 3: Checking cookies...')
      const cookiesStart = Date.now()
      try {
        const response = await fetch('/api/debug-cookies')
        const data = await response.json()
        authTestResults.cookies = {
          success: response.ok,
          totalCookies: data.totalCookies,
          supabaseCookies: data.supabaseCookies,
          hasSbCookie: data.supabaseCookies?.length > 0,
          duration: Date.now() - cookiesStart
        }
      } catch (e) {
        authTestResults.cookies = {
          success: false,
          error: e instanceof Error ? e.message : 'Unknown error',
          duration: Date.now() - cookiesStart
        }
      }

    } catch (error) {
      console.error('Auth test error:', error)
    }

    setAuthResults(authTestResults)
    setLoading(prev => ({ ...prev, auth: false }))
  }

  const testEndpoint = async (test: ApiTest) => {
    const key = `${test.method} ${test.endpoint}`
    setLoading(prev => ({ ...prev, [key]: true }))

    try {
      const options: RequestInit = {
        method: test.method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }

      if (test.body) {
        options.body = JSON.stringify(test.body)
      }

      const startTime = Date.now()
      const response = await fetch(test.endpoint, options)
      const duration = Date.now() - startTime
      
      let data = null
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        try {
          data = await response.json()
        } catch {
          data = { error: 'Failed to parse JSON response' }
        }
      } else {
        data = { message: 'Non-JSON response' }
      }

      // Extract auth performance headers
      const authDuration = response.headers.get('x-auth-duration')
      const authCached = response.headers.get('x-auth-cached')
      const userRole = response.headers.get('x-user-role')
      
      setResults(prev => ({
        ...prev,
        [key]: {
          success: response.ok,
          status: response.status,
          statusText: response.statusText,
          duration,
          authDuration: authDuration ? parseInt(authDuration) : undefined,
          authCached: authCached === 'true',
          userRole,
          data: response.ok ? data : { error: data?.error || response.statusText },
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [key]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  const testAllInCategory = async (category: string) => {
    const tests = API_TESTS[category]
    for (const test of tests) {
      await testEndpoint(test)
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  useEffect(() => {
    runAuthTests()
  }, [])

  const getStatusEmoji = (result: any) => {
    if (!result) return '⏳'
    if (result.success) return '✅'
    if (result.status === 401) return '🔒'
    if (result.status === 404) return '❓'
    return '❌'
  }

  const getStatusColor = (result: any) => {
    if (!result) return 'text-gray-500'
    if (result.success) return 'text-green-500'
    if (result.status === 401) return 'text-yellow-500'
    return 'text-red-500'
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Authentication & API Test Dashboard</CardTitle>
              <CardDescription>
                Comprehensive testing for authentication and all API endpoints
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
            >
              Back to Home
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              {Object.keys(API_TESTS).slice(0, 4).map(category => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsList className="grid grid-cols-4 w-full mt-2">
              {Object.keys(API_TESTS).slice(4).map(category => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Authentication Tab */}
            <TabsContent value="Authentication" className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button 
                  onClick={runAuthTests}
                  disabled={loading.auth}
                >
                  {loading.auth ? 'Running Auth Tests...' : 'Run All Auth Tests'}
                </Button>
              </div>

              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {/* Session Test */}
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {getStatusEmoji(authResults.session)}
                          </span>
                          <code className={`text-sm font-mono ${getStatusColor(authResults.session)}`}>
                            Supabase Session
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Check current authentication session</p>
                        
                        {authResults.session && (
                          <div className="mt-3">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span>Status: {authResults.session.success ? 'Active' : 'Not Found'}</span>
                              {authResults.session.duration && <span>Duration: {authResults.session.duration}ms</span>}
                              {authResults.session.user && <span>User: {authResults.session.user}</span>}
                            </div>
                            <details className="cursor-pointer">
                              <summary className="text-sm text-muted-foreground hover:text-foreground">
                                Response Data
                              </summary>
                              <pre className="mt-2 text-xs bg-background text-muted-foreground p-2 rounded overflow-auto border border-border">
                                {JSON.stringify(authResults.session, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={runAuthTests}
                        disabled={loading.auth}
                        className="ml-4"
                      >
                        {loading.auth ? 'Testing...' : 'Test'}
                      </Button>
                    </div>
                  </div>

                  {/* Auth User Test */}
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {getStatusEmoji(authResults.authUser)}
                          </span>
                          <code className={`text-sm font-mono ${getStatusColor(authResults.authUser)}`}>
                            Supabase Auth User
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Verify authenticated user details</p>
                        
                        {authResults.authUser && (
                          <div className="mt-3">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span>Status: {authResults.authUser.success ? 'Authenticated' : 'Not Authenticated'}</span>
                              {authResults.authUser.duration && <span>Duration: {authResults.authUser.duration}ms</span>}
                              {authResults.authUser.email && <span>Email: {authResults.authUser.email}</span>}
                            </div>
                            <details className="cursor-pointer">
                              <summary className="text-sm text-muted-foreground hover:text-foreground">
                                Response Data
                              </summary>
                              <pre className="mt-2 text-xs bg-background text-muted-foreground p-2 rounded overflow-auto border border-border">
                                {JSON.stringify(authResults.authUser, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={runAuthTests}
                        disabled={loading.auth}
                        className="ml-4"
                      >
                        {loading.auth ? 'Testing...' : 'Test'}
                      </Button>
                    </div>
                  </div>

                  {/* Cookies Test */}
                  <div className="border border-border rounded-lg p-4 bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {getStatusEmoji(authResults.cookies?.hasSbCookie ? authResults.cookies : null)}
                          </span>
                          <code className={`text-sm font-mono ${getStatusColor(authResults.cookies?.hasSbCookie ? authResults.cookies : null)}`}>
                            Authentication Cookies
                          </code>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">Verify Supabase authentication cookies</p>
                        
                        {authResults.cookies && (
                          <div className="mt-3">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span>Status: {authResults.cookies.hasSbCookie ? 'Set' : 'Missing'}</span>
                              {authResults.cookies.duration && <span>Duration: {authResults.cookies.duration}ms</span>}
                              <span>Total Cookies: {authResults.cookies.totalCookies}</span>
                            </div>
                            <details className="cursor-pointer">
                              <summary className="text-sm text-muted-foreground hover:text-foreground">
                                Response Data
                              </summary>
                              <pre className="mt-2 text-xs bg-background text-muted-foreground p-2 rounded overflow-auto border border-border">
                                {JSON.stringify(authResults.cookies, null, 2)}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={runAuthTests}
                        disabled={loading.auth}
                        className="ml-4"
                      >
                        {loading.auth ? 'Testing...' : 'Test'}
                      </Button>
                    </div>
                  </div>

                  {/* Auth Summary */}
                  {Object.keys(authResults).length > 0 && (
                    <div className="border border-border rounded-lg p-4 bg-card">
                      <h3 className="font-semibold mb-2 text-foreground">Authentication Summary</h3>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Session: {authResults.session?.hasSession ? 'Active' : 'Not Found'}</li>
                        <li>User: {authResults.authUser?.email || authResults.session?.user || 'Not Logged In'}</li>
                        <li>Cookies: {authResults.cookies?.hasSbCookie ? 'Set Correctly' : 'Missing'}</li>
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {Object.entries(API_TESTS).filter(([category]) => category !== 'Authentication').map(([category, tests]) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <Button 
                    onClick={() => testAllInCategory(category)}
                    disabled={Object.values(loading).some(l => l)}
                  >
                    Test All in {category}
                  </Button>
                </div>

                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-3">
                    {tests.map((test) => {
                      const key = `${test.method} ${test.endpoint}`
                      const result = results[key]
                      const isLoading = loading[key]

                      return (
                        <div 
                          key={key} 
                          className="border border-border rounded-lg p-4 bg-muted/50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">
                                  {getStatusEmoji(result)}
                                </span>
                                <code className={`text-sm font-mono ${getStatusColor(result)}`}>
                                  {test.method} {test.endpoint}
                                </code>
                                {test.requiresAuth && (
                                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                    Auth Required
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{test.description}</p>
                              
                              {result && (
                                <div className="mt-3">
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                    <span>Status: {result.status} {result.statusText}</span>
                                    {result.duration && <span>Duration: {result.duration}ms</span>}
                                    {result.authDuration && (
                                      <span className={result.authCached ? 'text-green-600' : 'text-blue-600'}>
                                        Auth: {result.authDuration}ms {result.authCached ? '(cached)' : '(computed)'}
                                      </span>
                                    )}
                                    {result.userRole && <span>Role: {result.userRole}</span>}
                                  </div>
                                  <details className="cursor-pointer">
                                    <summary className="text-sm text-muted-foreground hover:text-foreground">
                                      Response Data
                                    </summary>
                                    <pre className="mt-2 text-xs bg-background text-muted-foreground p-2 rounded overflow-auto border border-border">
                                      {JSON.stringify(result.data, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => testEndpoint(test)}
                              disabled={isLoading}
                              className="ml-4"
                            >
                              {isLoading ? 'Testing...' : 'Test'}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>

          {/* Summary */}
          <div className="mt-6 border border-border rounded-lg p-4 bg-card">
            <h3 className="font-semibold mb-2 text-foreground">Overall Test Summary</h3>
            <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="text-green-500">✅ API Tests Passed:</span> {
                  Object.values(results).filter(r => r.success).length
                }
              </div>
              <div>
                <span className="text-yellow-500">🔒 Auth Required:</span> {
                  Object.values(results).filter(r => r.status === 401).length
                }
              </div>
              <div>
                <span className="text-red-500">❌ API Tests Failed:</span> {
                  Object.values(results).filter(r => !r.success && r.status !== 401).length
                }
              </div>
              <div>
                <span className={authResults.session?.hasSession ? "text-green-500" : "text-red-500"}>
                  {authResults.session?.hasSession ? "🔐 Authenticated" : "🔓 Not Authenticated"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}