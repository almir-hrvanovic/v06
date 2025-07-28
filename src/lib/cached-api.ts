import { cache, cacheKeys, cacheInvalidation } from './redis'
import { prisma } from './db'
import { 
  Inquiry, 
  InquiryItem, 
  CostCalculation, 
  User,
  InquiryStatus,
  Priority,
  ItemStatus 
} from '@prisma/client'

// Cache TTL values (in seconds)
const TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes  
  LONG: 3600,       // 1 hour
  VERY_LONG: 86400, // 24 hours
}

export class CachedAPI {
  // User queries with caching
  static async getUserById(id: string): Promise<User | null> {
    const cacheKey = cacheKeys.user(id)
    
    // Try cache first
    const cached = await cache.get<User>(cacheKey)
    if (cached) return cached
    
    // Fetch from database
    const user = await prisma.user.findUnique({
      where: { id }
    })
    
    // Cache the result
    if (user) {
      await cache.set(cacheKey, user, TTL.LONG)
    }
    
    return user
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const cacheKey = cacheKeys.userByEmail(email)
    
    const cached = await cache.get<User>(cacheKey)
    if (cached) return cached
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (user) {
      await cache.set(cacheKey, user, TTL.LONG)
      // Also cache by ID
      await cache.set(cacheKeys.user(user.id), user, TTL.LONG)
    }
    
    return user
  }

  static async getUsers(role?: string) {
    const cacheKey = cacheKeys.userList(role)
    
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    const users = await prisma.user.findMany({
      where: role ? { role: role as any } : undefined,
      orderBy: { name: 'asc' }
    })
    
    await cache.set(cacheKey, users, TTL.MEDIUM)
    return users
  }

  // Inquiry queries with caching
  static async getInquiryById(id: string) {
    const cacheKey = cacheKeys.inquiry(id)
    
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: true,
        assignedTo: true,
        items: {
          include: {
            assignedTo: true,
            costCalculation: true,
            attachments: {
              include: {
                attachment: true
              }
            }
          }
        },
        attachments: {
          include: {
            attachment: true
          }
        }
      }
    })
    
    if (inquiry) {
      await cache.set(cacheKey, inquiry, TTL.SHORT)
    }
    
    return inquiry
  }

  static async getInquiries(filters?: {
    status?: InquiryStatus[]
    priority?: Priority[]
    customerId?: string
    assignedToId?: string
    createdById?: string
    skip?: number
    take?: number
  }) {
    const cacheKey = cacheKeys.inquiryList(filters)
    
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    const where: any = {}
    
    if (filters?.status?.length) {
      where.status = { in: filters.status }
    }
    if (filters?.priority?.length) {
      where.priority = { in: filters.priority }
    }
    if (filters?.customerId) {
      where.customerId = filters.customerId
    }
    if (filters?.assignedToId) {
      where.assignedToId = filters.assignedToId
    }
    if (filters?.createdById) {
      where.createdById = filters.createdById
    }
    
    const [data, total] = await Promise.all([
      prisma.inquiry.findMany({
        where,
        include: {
          customer: true,
          createdBy: true,
          assignedTo: true,
          _count: {
            select: {
              items: true,
              attachments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: filters?.skip,
        take: filters?.take || 20
      }),
      prisma.inquiry.count({ where })
    ])
    
    const result = { data, total }
    await cache.set(cacheKey, result, TTL.SHORT)
    
    return result
  }

  // Inquiry item queries with caching
  static async getItemById(id: string) {
    const cacheKey = cacheKeys.item(id)
    
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    const item = await prisma.inquiryItem.findUnique({
      where: { id },
      include: {
        inquiry: {
          include: {
            customer: true
          }
        },
        assignedTo: true,
        costCalculation: {
          include: {
            calculatedBy: true,
            approvals: true
          }
        },
        attachments: {
          include: {
            attachment: true
          }
        }
      }
    })
    
    if (item) {
      await cache.set(cacheKey, item, TTL.SHORT)
    }
    
    return item
  }

  static async getItemsByInquiry(inquiryId: string) {
    const cacheKey = cacheKeys.itemsByInquiry(inquiryId)
    
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    const items = await prisma.inquiryItem.findMany({
      where: { inquiryId },
      include: {
        assignedTo: true,
        costCalculation: true,
        attachments: {
          include: {
            attachment: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })
    
    await cache.set(cacheKey, items, TTL.SHORT)
    return items
  }

  static async getItemsByUser(userId: string, status?: ItemStatus[]) {
    const cacheKey = cacheKeys.itemsByUser(userId)
    
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    const items = await prisma.inquiryItem.findMany({
      where: {
        assignedToId: userId,
        status: status?.length ? { in: status } : undefined
      },
      include: {
        inquiry: {
          include: {
            customer: true
          }
        },
        costCalculation: true
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    await cache.set(cacheKey, items, TTL.SHORT)
    return items
  }

  // Cost calculation queries with caching
  static async getCostCalculation(id: string) {
    const cacheKey = cacheKeys.costCalc(id)
    
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    const costCalc = await prisma.costCalculation.findUnique({
      where: { id },
      include: {
        inquiryItem: {
          include: {
            inquiry: {
              include: {
                customer: true
              }
            }
          }
        },
        calculatedBy: true,
        approvals: {
          include: {
            approver: true
          }
        }
      }
    })
    
    if (costCalc) {
      await cache.set(cacheKey, costCalc, TTL.SHORT)
    }
    
    return costCalc
  }

  static async getCostCalculationByItem(itemId: string) {
    const cacheKey = cacheKeys.costCalcByItem(itemId)
    
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    const costCalc = await prisma.costCalculation.findUnique({
      where: { inquiryItemId: itemId },
      include: {
        calculatedBy: true,
        approvals: {
          include: {
            approver: true
          }
        }
      }
    })
    
    if (costCalc) {
      await cache.set(cacheKey, costCalc, TTL.SHORT)
    }
    
    return costCalc
  }

  // Analytics queries with caching
  static async getAnalytics(type: string, timeRange: string, userId?: string) {
    const cacheKey = cacheKeys.analytics(type, timeRange)
    
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    // Analytics logic would go here
    // This is a placeholder - implement based on your specific analytics needs
    const analytics = {}
    
    await cache.set(cacheKey, analytics, TTL.MEDIUM)
    return analytics
  }

  // Search with caching
  static async search(entityType: string, query: string, filters?: Record<string, any>) {
    const cacheKey = cacheKeys.search(entityType, query, filters)
    
    const cached = await cache.get<any[]>(cacheKey)
    if (cached) return cached
    
    // Search logic would go here
    // This is a placeholder - implement based on your search requirements
    const results: any[] = []
    
    await cache.set(cacheKey, results, TTL.SHORT)
    return results
  }

  // Cache management methods
  static async invalidateUser(userId: string) {
    await cacheInvalidation.invalidateUser(userId)
  }

  static async invalidateInquiry(inquiryId: string) {
    await cacheInvalidation.invalidateInquiry(inquiryId)
  }

  static async invalidateItem(itemId: string, inquiryId?: string) {
    await cacheInvalidation.invalidateItem(itemId, inquiryId)
  }

  static async invalidateAll() {
    await cache.clearPattern('*')
  }
}