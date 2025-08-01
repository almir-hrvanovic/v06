import { cache, cacheKeys } from '@/lib/upstash-redis'

// Helper function to invalidate user cache
export async function invalidateUserCache(userId: string, email: string) {
  await cache.del([
    cacheKeys.user(userId),
    cacheKeys.userByEmail(email),
    cacheKeys.userList(), // Clear user lists that might include this user
    cacheKeys.userList('VP'),
    cacheKeys.userList('VPP'), 
    cacheKeys.userList('SALES'),
    cacheKeys.userList('ADMIN'),
    cacheKeys.userList('SUPERUSER')
  ])
  console.log(`[Cache] Invalidated user cache for ${email} (${userId})`)
}

// Helper function to invalidate inquiry cache
export async function invalidateInquiryCache(inquiryId?: string) {
  const keysToDelete: string[] = []
  
  if (inquiryId) {
    keysToDelete.push(cacheKeys.inquiry(inquiryId))
  }
  
  // Clear all inquiry list caches (they might be affected)
  keysToDelete.push(
    cacheKeys.inquiryList(),
    cacheKeys.inquiryStats()
  )
  
  await cache.del(keysToDelete)
  console.log(`[Cache] Invalidated inquiry cache${inquiryId ? ` for ${inquiryId}` : ''}`)
}

// Helper function to invalidate customer cache
export async function invalidateCustomerCache(customerId?: string) {
  const keysToDelete: string[] = []
  
  if (customerId) {
    keysToDelete.push(`customer:${customerId}`)
  }
  
  // Clear customer list cache
  keysToDelete.push('customers:all')
  
  await cache.del(keysToDelete)
  console.log(`[Cache] Invalidated customer cache${customerId ? ` for ${customerId}` : ''}`)
}