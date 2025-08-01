import { cache, cacheKeys } from './redis'
import { db } from './db/index'

class OptimizationLogger {
  private context: string
  private category: string

  constructor(context: string, category: string) {
    this.context = context
    this.category = category
  }

  info(message: string, data?: any) {
    console.log(`[${this.context}:${this.category}] ${message}`, data || '')
  }

  error(message: string, error?: any) {
    console.error(`[${this.context}:${this.category}] ${message}`, error || '')
  }
}

const logger = new OptimizationLogger('redis-implementation', 'cache-warming')

export class CacheWarmer {
  // Warm user caches for active users
  static async warmUserCaches(): Promise<void> {
    logger.info('Starting user cache warming')
    
    try {
      // Get all active users
      const users = await db.user.findMany({
        where: { isActive: true },
        select: { id: true, email: true, name: true, role: true }
      })

      // Warm cache for each user
      for (const user of users) {
        await cache.set(cacheKeys.user(user.id), user, 3600) // 1 hour
        await cache.set(cacheKeys.userByEmail(user.email), user, 3600) // 1 hour
      }

      // Warm user lists by role
      const roles = ['VP', 'VPP', 'SALES', 'ADMIN', 'SUPERUSER']
      for (const role of roles) {
        const roleUsers = users.filter(u => u.role === role)
        await cache.set(cacheKeys.userList(role), roleUsers, 1800) // 30 minutes
      }

      // All users list
      await cache.set(cacheKeys.userList(), users, 1800) // 30 minutes

      logger.info(`User cache warming completed - ${users.length} users cached`)
    } catch (error) {
      logger.error('User cache warming failed', error)
    }
  }

  // Warm analytics caches for common time ranges
  static async warmAnalyticsCaches(): Promise<void> {
    logger.info('Starting analytics cache warming')
    
    try {
      const timeRanges = [7, 30, 90] // Common time ranges
      
      for (const timeRange of timeRanges) {
        const cacheKey = `analytics:workload:${timeRange}`
        
        // Check if already cached
        const exists = await cache.exists(cacheKey)
        if (exists) {
          logger.info(`Analytics cache already warm for timeRange ${timeRange}`)
          continue
        }

        const startDate = new Date()
        startDate.setDate(startDate.getDate() - timeRange)

        // Get VP/VPP users
        const vpUsers = await db.user.findMany({
          where: {
            role: { in: ['VP', 'VPP'] },
            isActive: true
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        })

        // Get workload data (simplified version)
        const allAssignedItems = await db.inquiryItem.findMany({
          where: {
            assignedToId: { in: vpUsers.map(u => u.id) },
            status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] }
          },
          select: {
            assignedToId: true
          }
        })

        // Count items per user
        const itemCountByUser = allAssignedItems.reduce((acc, item) => {
          if (item.assignedToId) {
            acc[item.assignedToId] = (acc[item.assignedToId] || 0) + 1
          }
          return acc
        }, {} as Record<string, number>)

        // Build simplified response
        const vpData = vpUsers.map(vp => ({
          id: vp.id,
          name: vp.name,
          email: vp.email,
          role: vp.role,
          activeItems: itemCountByUser[vp.id] || 0,
          completedItems: 0 // Simplified for warming
        }))

        const warmedData = {
          vpWorkload: vpData,
          techWorkload: [],
          itemsByStatus: [],
          assignmentTrends: []
        }

        // Cache for 5 minutes
        await cache.set(cacheKey, warmedData, 300)
        logger.info(`Analytics cache warmed for timeRange ${timeRange}`)
      }

      logger.info('Analytics cache warming completed')
    } catch (error) {
      logger.error('Analytics cache warming failed', error)
    }
  }

  // Warm all caches
  static async warmAllCaches(): Promise<void> {
    logger.info('Starting comprehensive cache warming')
    
    const startTime = Date.now()
    
    await Promise.all([
      this.warmUserCaches(),
      this.warmAnalyticsCaches()
    ])
    
    const duration = Date.now() - startTime
    logger.info(`Cache warming completed in ${duration}ms`)
  }

  // Schedule cache warming (can be called periodically)
  static async scheduleWarmup(): Promise<void> {
    logger.info('Scheduled cache warmup starting')
    
    try {
      await this.warmAllCaches()
      
      // Schedule next warmup in 30 minutes
      setTimeout(() => {
        this.scheduleWarmup()
      }, 30 * 60 * 1000) // 30 minutes
      
    } catch (error) {
      logger.error('Scheduled cache warmup failed', error)
      
      // Retry in 5 minutes on failure
      setTimeout(() => {
        this.scheduleWarmup()
      }, 5 * 60 * 1000) // 5 minutes
    }
  }
}

// Auto-start cache warming in production
if (process.env.NODE_ENV === 'production') {
  // Warm caches after a 30-second delay to allow app to start
  setTimeout(() => {
    CacheWarmer.scheduleWarmup()
  }, 30000)
}