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