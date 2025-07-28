import Redis from 'ioredis'

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Don't connect immediately
}

// Redis client - only create if Redis is configured
let redis: Redis | null = null

// Initialize Redis only if URL is provided or in development
function getRedisClient(): Redis | null {
  if (redis) return redis
  
  // Only create Redis client if explicitly configured or in development
  if (process.env.REDIS_URL || (process.env.NODE_ENV === 'development' && process.env.REDIS_HOST !== 'disabled')) {
    try {
      if (process.env.REDIS_URL) {
        // Use Redis URL (works for both local and Upstash)
        redis = new Redis(process.env.REDIS_URL, {
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000)
            return delay
          },
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 10000,
          commandTimeout: 5000,
          // Upstash requires TLS
          tls: {
            rejectUnauthorized: false
          },
        })
      } else {
        // Use individual config for local development
        redis = new Redis(redisConfig)
      }

      // Handle connection events
      redis.on('connect', () => {
        console.log('✅ Redis connected')
      })

      redis.on('error', (error) => {
        console.error('❌ Redis error:', error)
      })

      redis.on('close', () => {
        console.log('🔌 Redis connection closed')
      })
      
      return redis
    } catch (error) {
      console.warn('⚠️ Redis initialization failed, falling back to in-memory cache:', error)
      return null
    }
  }
  
  return null
}

// Export redis getter
export { getRedisClient as redis }

// In-memory cache fallback
const memoryCache = new Map<string, { value: any; expires?: number }>()

// Cache utilities
export const cache = {
  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    const redisClient = getRedisClient()
    
    if (redisClient) {
      try {
        const data = await redisClient.get(key)
        return data ? JSON.parse(data) : null
      } catch (error) {
        console.error(`Redis get error for key ${key}:`, error)
      }
    }
    
    // Fallback to memory cache
    const cached = memoryCache.get(key)
    if (cached) {
      if (!cached.expires || cached.expires > Date.now()) {
        return cached.value
      } else {
        memoryCache.delete(key)
      }
    }
    return null
  },

  // Set cache with expiration
  async set(key: string, value: any, expirationInSeconds?: number): Promise<void> {
    const redisClient = getRedisClient()
    
    if (redisClient) {
      try {
        const serialized = JSON.stringify(value)
        if (expirationInSeconds) {
          await redisClient.setex(key, expirationInSeconds, serialized)
        } else {
          await redisClient.set(key, serialized)
        }
        return
      } catch (error) {
        console.error(`Redis set error for key ${key}:`, error)
      }
    }
    
    // Fallback to memory cache
    const expires = expirationInSeconds ? Date.now() + (expirationInSeconds * 1000) : undefined
    memoryCache.set(key, { value, expires })
  },

  // Delete cache
  async del(key: string | string[]): Promise<void> {
    const redisClient = getRedisClient()
    
    if (redisClient) {
      try {
        if (Array.isArray(key)) {
          await redisClient.del(...key)
        } else {
          await redisClient.del(key)
        }
        return
      } catch (error) {
        console.error(`Redis delete error for key ${key}:`, error)
      }
    }
    
    // Fallback to memory cache
    if (Array.isArray(key)) {
      key.forEach(k => memoryCache.delete(k))
    } else {
      memoryCache.delete(key)
    }
  },

  // Clear all cache with pattern
  async clearPattern(pattern: string): Promise<void> {
    const redisClient = getRedisClient()
    
    if (redisClient) {
      try {
        const keys = await redisClient.keys(pattern)
        if (keys.length > 0) {
          await redisClient.del(...keys)
        }
        return
      } catch (error) {
        console.error(`Redis clear error for pattern ${pattern}:`, error)
      }
    }
    
    // Fallback to memory cache - simple pattern matching
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key)
      }
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    const redisClient = getRedisClient()
    
    if (redisClient) {
      try {
        const result = await redisClient.exists(key)
        return result === 1
      } catch (error) {
        console.error(`Redis exists error for key ${key}:`, error)
      }
    }
    
    // Fallback to memory cache
    const cached = memoryCache.get(key)
    if (cached && (!cached.expires || cached.expires > Date.now())) {
      return true
    }
    return false
  },

  // Set expiration on existing key
  async expire(key: string, seconds: number): Promise<boolean> {
    const redisClient = getRedisClient()
    
    if (redisClient) {
      try {
        const result = await redisClient.expire(key, seconds)
        return result === 1
      } catch (error) {
        console.error(`Redis expire error for key ${key}:`, error)
      }
    }
    
    // Fallback to memory cache
    const cached = memoryCache.get(key)
    if (cached) {
      cached.expires = Date.now() + (seconds * 1000)
      return true
    }
    return false
  },

  // Get TTL for a key
  async ttl(key: string): Promise<number> {
    const redisClient = getRedisClient()
    
    if (redisClient) {
      try {
        return await redisClient.ttl(key)
      } catch (error) {
        console.error(`Redis TTL error for key ${key}:`, error)
      }
    }
    
    // Fallback to memory cache
    const cached = memoryCache.get(key)
    if (cached?.expires) {
      const ttl = Math.floor((cached.expires - Date.now()) / 1000)
      return ttl > 0 ? ttl : -2
    }
    return -1
  },
}

// Cache key generators
export const cacheKeys = {
  // User cache keys
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userList: (role?: string) => role ? `users:role:${role}` : 'users:all',

  // Inquiry cache keys
  inquiry: (id: string) => `inquiry:${id}`,
  inquiryList: (filters?: Record<string, any>) => {
    const filterStr = filters ? JSON.stringify(filters) : 'all'
    return `inquiries:${filterStr}`
  },
  inquiryStats: (userId?: string) => userId ? `inquiry:stats:${userId}` : 'inquiry:stats:all',

  // Item cache keys
  item: (id: string) => `item:${id}`,
  itemsByInquiry: (inquiryId: string) => `items:inquiry:${inquiryId}`,
  itemsByUser: (userId: string) => `items:user:${userId}`,

  // Cost calculation cache keys
  costCalc: (id: string) => `costcalc:${id}`,
  costCalcByItem: (itemId: string) => `costcalc:item:${itemId}`,

  // Analytics cache keys
  analytics: (type: string, timeRange: string) => `analytics:${type}:${timeRange}`,
  
  // Search cache keys
  search: (entityType: string, query: string, filters?: Record<string, any>) => {
    const filterStr = filters ? JSON.stringify(filters) : ''
    return `search:${entityType}:${query}:${filterStr}`
  },

  // Session cache keys
  session: (token: string) => `session:${token}`,
  
  // Notification cache keys
  notifications: (userId: string) => `notifications:${userId}`,
  notificationCount: (userId: string) => `notifications:count:${userId}`,
}

// Cache decorators
export function cacheable(keyGenerator: (...args: any[]) => string, ttl: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator(...args)
      
      // Try to get from cache
      const cached = await cache.get(cacheKey)
      if (cached !== null) {
        console.log(`Cache hit: ${cacheKey}`)
        return cached
      }

      // Execute original method
      const result = await originalMethod.apply(this, args)
      
      // Store in cache
      await cache.set(cacheKey, result, ttl)
      console.log(`Cache miss: ${cacheKey}`)
      
      return result
    }

    return descriptor
  }
}

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate user-related caches
  async invalidateUser(userId: string) {
    await cache.del([
      cacheKeys.user(userId),
      cacheKeys.userList(),
      cacheKeys.userList('VP'),
      cacheKeys.userList('SALES'),
    ])
  },

  // Invalidate inquiry-related caches
  async invalidateInquiry(inquiryId: string) {
    await cache.del([
      cacheKeys.inquiry(inquiryId),
      cacheKeys.inquiryList(),
    ])
    // Clear all inquiry list caches with filters
    await cache.clearPattern('inquiries:*')
  },

  // Invalidate item-related caches
  async invalidateItem(itemId: string, inquiryId?: string) {
    const keys = [cacheKeys.item(itemId)]
    if (inquiryId) {
      keys.push(cacheKeys.itemsByInquiry(inquiryId))
    }
    await cache.del(keys)
    // Clear all items caches
    await cache.clearPattern('items:*')
  },

  // Invalidate analytics caches
  async invalidateAnalytics() {
    await cache.clearPattern('analytics:*')
  },

  // Invalidate search caches
  async invalidateSearch(entityType?: string) {
    if (entityType) {
      await cache.clearPattern(`search:${entityType}:*`)
    } else {
      await cache.clearPattern('search:*')
    }
  },
}

// Session store for NextAuth
export const sessionStore = {
  async get(sessionToken: string) {
    return cache.get(cacheKeys.session(sessionToken))
  },

  async set(sessionToken: string, session: any, maxAge: number) {
    await cache.set(cacheKeys.session(sessionToken), session, maxAge)
  },

  async delete(sessionToken: string) {
    await cache.del(cacheKeys.session(sessionToken))
  },
}