# Authentication Optimization

## Overview

Optimize authentication flow to reduce redundant checks and improve session management performance.

## Current Issues

- Multiple auth checks per request
- No session caching
- Sequential validation calls
- Heavy database queries for each check

## Optimization Strategy

### 1. Session Token Caching

```typescript
// src/utils/supabase/optimized-auth.ts
import { cache } from '@/lib/cache';
import { createClient } from '@/utils/supabase/server';

const SESSION_CACHE_TTL = 300; // 5 minutes

export async function getOptimizedAuthUser(request: Request) {
  // Extract session token
  const token = getSessionToken(request);
  if (!token) return null;
  
  // Check cache first
  const cacheKey = `session:${token}`;
  const cachedSession = await cache.get(cacheKey);
  
  if (cachedSession) {
    console.log('[Auth] Session cache hit');
    return cachedSession;
  }
  
  // Cache miss - validate with Supabase
  console.log('[Auth] Session cache miss, validating...');
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    console.error('[Auth] Session validation failed:', error);
    return null;
  }
  
  // Fetch user data with optimized query
  const userData = await fetchUserWithProfile(session.user.id);
  
  // Cache the complete session data
  const sessionData = {
    ...session,
    user: userData
  };
  
  await cache.set(cacheKey, sessionData, SESSION_CACHE_TTL);
  
  return sessionData;
}
```

### 2. Optimized User Query

```typescript
// src/utils/auth/user-queries.ts
import { db } from '@/lib/db';

export async function fetchUserWithProfile(userId: string) {
  // Single query with all needed data
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      profile: {
        select: {
          avatar: true,
          preferences: true,
          settings: true
        }
      },
      permissions: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  return user;
}
```

### 3. Request-Level Caching

```typescript
// src/middleware/auth-middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const REQUEST_AUTH_KEY = 'x-auth-cached';

export async function authMiddleware(request: NextRequest) {
  // Check if auth already processed for this request
  if (request.headers.get(REQUEST_AUTH_KEY)) {
    return NextResponse.next();
  }
  
  // Perform auth check once
  const session = await getOptimizedAuthUser(request);
  
  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Mark request as auth-processed
  const response = NextResponse.next();
  response.headers.set(REQUEST_AUTH_KEY, 'true');
  
  // Attach user data to request
  if (session) {
    response.headers.set('x-user-id', session.user.id);
    response.headers.set('x-user-role', session.user.role);
  }
  
  return response;
}
```

### 4. Parallel Permission Checks

```typescript
// src/utils/auth/permissions.ts
export async function checkPermissions(
  userId: string, 
  requiredPermissions: string[]
): Promise<boolean> {
  // Parallel check for all permissions
  const permissionChecks = requiredPermissions.map(permission =>
    checkSinglePermission(userId, permission)
  );
  
  const results = await Promise.all(permissionChecks);
  return results.every(result => result === true);
}

async function checkSinglePermission(
  userId: string, 
  permission: string
): Promise<boolean> {
  const cacheKey = `perm:${userId}:${permission}`;
  
  // Try cache
  const cached = await cache.get(cacheKey);
  if (cached !== null) return cached;
  
  // Check database
  const hasPermission = await db.userPermission.findFirst({
    where: {
      userId,
      permission: { name: permission }
    }
  });
  
  // Cache result for 10 minutes
  await cache.set(cacheKey, !!hasPermission, 600);
  
  return !!hasPermission;
}
```

### 5. JWT Optimization

```typescript
// src/utils/auth/jwt-helper.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_CACHE = new Map<string, any>();

export function decodeAndCacheJWT(token: string): any {
  // Memory cache for decoded tokens
  if (JWT_CACHE.has(token)) {
    return JWT_CACHE.get(token);
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    JWT_CACHE.set(token, decoded);
    
    // Clean old entries if cache grows too large
    if (JWT_CACHE.size > 1000) {
      const firstKey = JWT_CACHE.keys().next().value;
      JWT_CACHE.delete(firstKey);
    }
    
    return decoded;
  } catch (error) {
    console.error('[JWT] Decode error:', error);
    return null;
  }
}
```

## Implementation Checklist

### Phase 1: Basic Caching

- [ ] Implement Redis session caching
- [ ] Add request-level auth caching
- [ ] Deploy auth middleware

### Phase 2: Query Optimization

- [ ] Optimize user data queries
- [ ] Implement permission caching
- [ ] Add parallel permission checks

### Phase 3: Advanced Features

- [ ] JWT caching layer
- [ ] Session pre-warming
- [ ] Background session refresh

## Performance Targets

| Metric | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Auth Check Time | ~3s | < 50ms | 60x |
| DB Queries per Auth | 5-7 | 1 | 5-7x |
| Session Cache Hit Rate | 0% | > 90% | N/A |
| Permission Check Time | ~500ms | < 20ms | 25x |

## Monitoring & Metrics

```typescript
// src/utils/auth/metrics.ts
export class AuthMetrics {
  private metrics = {
    cacheHits: 0,
    cacheMisses: 0,
    authTime: [],
    dbQueries: 0
  };
  
  logAuthCheck(duration: number, cacheHit: boolean) {
    if (cacheHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    this.metrics.authTime.push(duration);
    
    // Log every 100 requests
    if ((this.metrics.cacheHits + this.metrics.cacheMisses) % 100 === 0) {
      this.printMetrics();
    }
  }
  
  private printMetrics() {
    const avgTime = this.metrics.authTime.reduce((a, b) => a + b, 0) / this.metrics.authTime.length;
    const hitRate = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) * 100;
    
    console.log('[Auth Metrics]', {
      avgAuthTime: `${avgTime.toFixed(2)}ms`,
      cacheHitRate: `${hitRate.toFixed(2)}%`,
      totalChecks: this.metrics.cacheHits + this.metrics.cacheMisses
    });
  }
}
```

## Troubleshooting Guide

### Issue: Session Cache Inconsistency

**Solution**: Implement cache invalidation on logout

```typescript
export async function logout(sessionId: string) {
  await cache.invalidate(`session:${sessionId}`);
  await cache.invalidate(`perm:${userId}:*`);
}
```

### Issue: Memory Leak in JWT Cache

**Solution**: Implement TTL-based cleanup

```typescript
setInterval(() => {
  JWT_CACHE.clear();
}, 3600000); // Clear every hour
```

## Rollback Plan

1. Remove cache calls from auth functions
2. Restore original auth queries
3. Clear all session caches
4. Monitor for stability

---
*Status: Ready for Implementation*
