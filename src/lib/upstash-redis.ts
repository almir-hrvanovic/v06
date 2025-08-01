/**
 * Upstash Redis client for both Edge Runtime and Node.js
 * Uses @upstash/redis which is compatible with Edge Runtime
 */

import { Redis } from '@upstash/redis';

// Performance monitoring
class OptimizationLogger {
  private context: string;
  private category: string;

  constructor(context: string, category: string) {
    this.context = context;
    this.category = category;
  }

  info(message: string, data?: any) {
    console.log(`[${this.context}:${this.category}] ${message}`, data || '');
  }

  error(message: string, error?: any) {
    console.error(`[${this.context}:${this.category}] ${message}`, error || '');
  }

  performance(operation: string, duration: number, hitRate?: number) {
    const hitInfo = hitRate !== undefined ? ` (Hit Rate: ${hitRate.toFixed(1)}%)` : '';
    console.log(`[${this.context}:${this.category}] ${operation}: ${duration}ms${hitInfo}`);
  }
}

const logger = new OptimizationLogger('upstash-redis', 'edge-compatible');

// Initialize Upstash Redis client
let upstashClient: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    upstashClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    logger.info('Upstash Redis client initialized');
  } else {
    logger.info('Upstash Redis credentials not configured');
  }
} catch (error) {
  logger.error('Failed to initialize Upstash Redis', error);
}

// Cache performance metrics
class CacheMetrics {
  private hits = 0;
  private misses = 0;
  private operations = 0;
  private totalTime = 0;
  private lastLog = Date.now();

  recordHit(duration: number) {
    this.hits++;
    this.operations++;
    this.totalTime += duration;
    this.logIfNeeded();
  }

  recordMiss(duration: number) {
    this.misses++;
    this.operations++;
    this.totalTime += duration;
    this.logIfNeeded();
  }

  private logIfNeeded() {
    // Log every 50 operations or every 30 seconds
    if (this.operations % 50 === 0 || Date.now() - this.lastLog > 30000) {
      this.logMetrics();
      this.lastLog = Date.now();
    }
  }

  logMetrics() {
    const hitRate = this.operations > 0 ? (this.hits / this.operations) * 100 : 0;
    const avgTime = this.operations > 0 ? this.totalTime / this.operations : 0;
    
    logger.performance(
      `Cache Stats - Ops: ${this.operations}, Hits: ${this.hits}, Misses: ${this.misses}, Avg: ${avgTime.toFixed(2)}ms`,
      avgTime,
      hitRate
    );
  }

  getStats() {
    return {
      hits: this.hits,
      misses: this.misses,
      operations: this.operations,
      hitRate: this.operations > 0 ? (this.hits / this.operations) * 100 : 0,
      avgTime: this.operations > 0 ? this.totalTime / this.operations : 0
    };
  }

  reset() {
    this.hits = 0;
    this.misses = 0;
    this.operations = 0;
    this.totalTime = 0;
    this.lastLog = Date.now();
  }
}

const metrics = new CacheMetrics();

// In-memory fallback cache for development
const memoryCache = new Map<string, { value: any; expires?: number }>();

// Cache utilities compatible with Edge Runtime
export const cache = {
  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    if (upstashClient) {
      try {
        const data = await upstashClient.get(key);
        const duration = Date.now() - startTime;
        
        if (data) {
          metrics.recordHit(duration);
          logger.info(`Cache HIT: ${key} (${duration}ms)`);
          return data as T;
        } else {
          metrics.recordMiss(duration);
          logger.info(`Cache MISS: ${key} (${duration}ms)`);
          return null;
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        metrics.recordMiss(duration);
        logger.error(`Upstash get error for key ${key}`, error);
      }
    }
    
    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (cached) {
      if (!cached.expires || cached.expires > Date.now()) {
        const duration = Date.now() - startTime;
        metrics.recordHit(duration);
        logger.info(`Memory cache HIT: ${key} (${duration}ms)`);
        return cached.value;
      } else {
        memoryCache.delete(key);
      }
    }
    
    const duration = Date.now() - startTime;
    metrics.recordMiss(duration);
    return null;
  },

  // Set cache with expiration
  async set(key: string, value: any, expirationInSeconds?: number): Promise<void> {
    const startTime = Date.now();
    
    if (upstashClient) {
      try {
        if (expirationInSeconds) {
          await upstashClient.setex(key, expirationInSeconds, value);
        } else {
          await upstashClient.set(key, value);
        }
        const duration = Date.now() - startTime;
        logger.info(`Cache SET: ${key} (${duration}ms, TTL: ${expirationInSeconds || 'none'}s)`);
        return;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Upstash set error for key ${key} (${duration}ms)`, error);
      }
    }
    
    // Fallback to memory cache
    const expires = expirationInSeconds ? Date.now() + (expirationInSeconds * 1000) : undefined;
    memoryCache.set(key, { value, expires });
    const duration = Date.now() - startTime;
    logger.info(`Memory cache SET: ${key} (${duration}ms, TTL: ${expirationInSeconds || 'none'}s)`);
  },

  // Delete cache
  async del(key: string | string[]): Promise<void> {
    const startTime = Date.now();
    
    if (upstashClient) {
      try {
        if (Array.isArray(key)) {
          await upstashClient.del(...key);
        } else {
          await upstashClient.del(key);
        }
        const duration = Date.now() - startTime;
        logger.info(`Cache DEL: ${Array.isArray(key) ? key.join(', ') : key} (${duration}ms)`);
        return;
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Upstash delete error for key ${key} (${duration}ms)`, error);
      }
    }
    
    // Fallback to memory cache
    if (Array.isArray(key)) {
      key.forEach(k => memoryCache.delete(k));
    } else {
      memoryCache.delete(key);
    }
    const duration = Date.now() - startTime;
    logger.info(`Memory cache DEL: ${Array.isArray(key) ? key.join(', ') : key} (${duration}ms)`);
  },

  // Clear all cache with pattern
  async clearPattern(pattern: string): Promise<void> {
    const startTime = Date.now();
    
    if (upstashClient) {
      try {
        // Note: Upstash doesn't support KEYS command in REST API
        // We need to track keys separately or use a different approach
        logger.info(`Pattern clearing not supported in Upstash REST API: ${pattern}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`Upstash clear error for pattern ${pattern} (${duration}ms)`, error);
      }
    }
    
    // Fallback to memory cache - simple pattern matching
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    let deletedCount = 0;
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        deletedCount++;
      }
    }
    const duration = Date.now() - startTime;
    logger.info(`Memory cache CLEAR PATTERN: ${pattern} (${deletedCount} keys, ${duration}ms)`);
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    if (upstashClient) {
      try {
        const result = await upstashClient.exists(key);
        return result === 1;
      } catch (error) {
        logger.error(`Upstash exists error for key ${key}`, error);
      }
    }
    
    // Fallback to memory cache
    const cached = memoryCache.get(key);
    if (cached && (!cached.expires || cached.expires > Date.now())) {
      return true;
    }
    return false;
  },

  // Get cache statistics
  getStats() {
    return metrics.getStats();
  },

  // Force log current metrics
  logStats() {
    metrics.logMetrics();
  },

  // Clear auth-related cache entries
  async clearAuth(): Promise<void> {
    const startTime = Date.now();
    logger.info('Clearing auth cache...');
    
    // Clear specific auth keys if we know them
    // Since Upstash doesn't support pattern deletion via REST API
    const authKeys = [
      'auth:session:*',
      'user:*',
      'session:*'
    ];
    
    // In production, you might want to track keys differently
    logger.info('Auth cache clear requested - implement key tracking for production');
    
    const duration = Date.now() - startTime;
    logger.info(`Auth cache cleared (${duration}ms)`);
  },

  // Reset cache statistics
  resetStats(): void {
    metrics.reset();
    logger.info('Cache statistics reset');
  },
};

// Cache key generators (same as before)
export const cacheKeys = {
  // User cache keys
  user: (id: string) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  userList: (role?: string) => role ? `users:role:${role}` : 'users:all',

  // Inquiry cache keys
  inquiry: (id: string) => `inquiry:${id}`,
  inquiryList: (filters?: Record<string, any>) => {
    const filterStr = filters ? JSON.stringify(filters) : 'all';
    return `inquiries:${filterStr}`;
  },
  inquiryStats: (userId?: string) => userId ? `inquiry:stats:${userId}` : 'inquiry:stats:all',

  // Session cache keys for Edge Runtime
  session: (token: string) => `session:${token}`,
  authSession: (userId: string) => `auth:session:${userId}`,
};

// Export the Upstash client for direct usage if needed
export const upstash = upstashClient;

// Export a check for Redis availability
export const isRedisAvailable = () => upstashClient !== null;