# Redis Migration Guide: ioredis to Upstash

## Overview

The project was using ioredis which is not compatible with Next.js Edge Runtime. This caused critical errors in middleware. We've migrated to @upstash/redis which works in both Edge Runtime and Node.js environments.

## Changes Made

### 1. New Redis Implementation Files

- **`/src/lib/upstash-redis.ts`** - Edge-compatible Redis client using @upstash/redis
- **`/src/utils/supabase/optimized-auth-edge.ts`** - Edge-compatible auth without Redis/DB imports
- **`/src/middleware/optimized-auth-middleware-edge.ts`** - Edge-compatible middleware

### 2. Updated Dependencies

```bash
npm install @upstash/redis
```

### 3. Environment Variables (Already Configured)

```env
UPSTASH_REDIS_REST_URL="https://bursting-mongrel-5074.upstash.io"
UPSTASH_REDIS_REST_TOKEN="ARPSAAIjcDFhNDZmZWZkNzY2ZDI0NDRkYWQ5OWUzMzQ5YTRiZWQwOXAxMA"
```

## Migration Steps for API Routes

### Step 1: Update Imports

**Old (ioredis):**
```typescript
import { cache, cacheKeys } from '@/lib/redis';
```

**New (Upstash):**
```typescript
import { cache, cacheKeys } from '@/lib/upstash-redis';
```

### Step 2: API Usage Remains the Same

The cache API is compatible, so no changes needed:

```typescript
// Get from cache
const data = await cache.get(key);

// Set in cache
await cache.set(key, value, ttl);

// Delete from cache
await cache.del(key);

// Check if exists
const exists = await cache.exists(key);
```

## Files That Need Updates

### API Routes Using Redis (Node.js Runtime - Safe to use Redis)

1. `/src/app/api/users/me/route.ts`
2. `/src/app/api/inquiries/route.ts`
3. `/src/app/api/analytics/workload/route.ts`
4. `/src/app/api/cache/stats/route.ts`
5. `/src/app/api/auth/performance/route.ts`
6. `/src/utils/supabase/optimized-auth.ts` (used in API routes)

### Edge Runtime Files (Must NOT use Node.js Redis)

1. ✅ `/src/middleware.ts` - Already updated
2. ✅ `/src/middleware/optimized-auth-middleware.ts` - Created Edge version
3. ✅ `/src/utils/supabase/optimized-auth.ts` - Created Edge version

## Important Notes

### Edge Runtime Limitations

1. **No Pattern Deletion**: Upstash REST API doesn't support KEYS command
   - Solution: Track keys explicitly or use different cache invalidation strategy

2. **Simplified Auth**: Edge Runtime auth doesn't fetch full DB user
   - Full user details are fetched in API routes where DB access is available

3. **Performance**: Upstash REST API adds ~20-50ms latency vs local Redis
   - Still much faster than database queries
   - Good for global edge deployments

### Best Practices

1. **Middleware**: Use only Edge-compatible imports
2. **API Routes**: Can use either ioredis or Upstash
3. **Cache Keys**: Use the same cacheKeys utility for consistency
4. **Error Handling**: Both implementations have fallback to memory cache

## Testing

1. Dashboard should load without 500 errors
2. Authentication should work in middleware
3. API routes should use cache properly
4. Check `/api/cache/stats` for cache statistics

## Rollback Plan

If issues arise:

1. Revert middleware imports to use in-memory auth only
2. API routes can continue using ioredis if needed
3. Both cache implementations coexist safely

## Next Steps

1. Update all API route imports to use upstash-redis
2. Test cache performance with Upstash
3. Monitor error logs for any Edge Runtime issues
4. Consider implementing cache key tracking for pattern deletion