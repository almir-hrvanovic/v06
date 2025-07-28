/**
 * Redis client with support for local Redis, Upstash, and in-memory fallback
 */

import { Redis } from '@upstash/redis'
import { Redis as IORedis } from 'ioredis'

// In-memory cache fallback
class InMemoryCache {
  private cache: Map<string, { value: string; expiry?: number }> = new Map()
  
  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  async set(key: string, value: string): Promise<void> {
    this.cache.set(key, { value })
  }
  
  async setex(key: string, seconds: number, value: string): Promise<void> {
    this.cache.set(key, {
      value,
      expiry: Date.now() + (seconds * 1000)
    })
  }
  
  async del(...keys: string[]): Promise<void> {
    keys.forEach(key => this.cache.delete(key))
  }
  
  async exists(key: string): Promise<number> {
    return this.cache.has(key) ? 1 : 0
  }
  
  async expire(key: string, seconds: number): Promise<number> {
    const item = this.cache.get(key)
    if (!item) return 0
    
    this.cache.set(key, {
      ...item,
      expiry: Date.now() + (seconds * 1000)
    })
    return 1
  }
  
  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key)
    if (!item || !item.expiry) return -1
    
    const ttl = Math.floor((item.expiry - Date.now()) / 1000)
    return ttl > 0 ? ttl : -2
  }
  
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'))
    return Array.from(this.cache.keys()).filter(key => regex.test(key))
  }
  
  on() {} // No-op for compatibility
}

// Determine which Redis client to use
let redisClient: IORedis | Redis | InMemoryCache

const initializeRedis = () => {
  // Check for Upstash credentials first (production)
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log('🔗 Using Upstash Redis')
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  
  // Check for local Redis URL
  if (process.env.REDIS_URL) {
    try {
      console.log('🔗 Using local Redis via URL')
      const client = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      })
      
      // Test connection
      client.ping().catch(() => {
        console.log('⚠️ Local Redis not available, falling back to in-memory cache')
        redisClient = new InMemoryCache()
      })
      
      return client
    } catch (error) {
      console.log('⚠️ Redis connection failed, using in-memory cache')
      return new InMemoryCache()
    }
  }
  
  // Check for individual Redis config
  if (process.env.REDIS_HOST) {
    try {
      console.log('🔗 Using local Redis via host/port')
      const client = new IORedis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      })
      
      // Test connection
      client.ping().catch(() => {
        console.log('⚠️ Local Redis not available, falling back to in-memory cache')
        redisClient = new InMemoryCache()
      })
      
      return client
    } catch (error) {
      console.log('⚠️ Redis connection failed, using in-memory cache')
      return new InMemoryCache()
    }
  }
  
  // Fallback to in-memory cache
  console.log('📦 Using in-memory cache (no Redis configured)')
  return new InMemoryCache()
}

// Initialize Redis client
redisClient = initializeRedis()

// Unified cache interface
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key)
      return data ? JSON.parse(data as string) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  },

  async set(key: string, value: any, expirationInSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (expirationInSeconds) {
        if ('setex' in redisClient) {
          await (redisClient as any).setex(key, expirationInSeconds, serialized)
        } else {
          // Upstash Redis
          await (redisClient as any).set(key, serialized, { ex: expirationInSeconds })
        }
      } else {
        await (redisClient as any).set(key, serialized)
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  },

  async del(key: string | string[]): Promise<void> {
    try {
      if (Array.isArray(key)) {
        await redisClient.del(...key)
      } else {
        await redisClient.del(key)
      }
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  },

  async clearPattern(pattern: string): Promise<void> {
    try {
      if ('keys' in redisClient) {
        const keys = await redisClient.keys(pattern)
        if (keys.length > 0) {
          await redisClient.del(...keys)
        }
      }
    } catch (error) {
      console.error(`Cache clear error for pattern ${pattern}:`, error)
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      const result = await redisClient.exists(key)
      return result === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  },

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if ('expire' in redisClient) {
        const result = await redisClient.expire(key, seconds)
        return result === 1
      }
      return false
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error)
      return false
    }
  },

  async ttl(key: string): Promise<number> {
    try {
      if ('ttl' in redisClient) {
        return await redisClient.ttl(key)
      }
      return -1
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error)
      return -1
    }
  },
}

// Export cache key generators and other utilities from the original file
export { cacheKeys, cacheable, cacheInvalidation, sessionStore } from './redis'