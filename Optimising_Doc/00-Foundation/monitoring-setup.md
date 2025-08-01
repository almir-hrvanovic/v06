# Monitoring Setup

## Overview
Establish comprehensive monitoring to track performance improvements throughout the optimization project.

## Monitoring Stack

### 1. Application Performance Monitoring (APM)
- **Tool**: [To be determined - OpenTelemetry recommended]
- **Metrics to Track**:
  - Page load times
  - API response times
  - Database query performance
  - Error rates
  - Resource utilization

### 2. Real User Monitoring (RUM)
- **Metrics**:
  - Time to First Byte (TTFB)
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Time to Interactive (TTI)
  - Cumulative Layout Shift (CLS)

### 3. Infrastructure Monitoring
- **Server Metrics**:
  - CPU usage
  - Memory utilization
  - Disk I/O
  - Network throughput
- **Database Metrics**:
  - Query execution times
  - Connection pool usage
  - Cache hit rates
  - Index usage

## Implementation Steps

### Phase 1: Basic Monitoring (IMMEDIATE - Week 1)
1. Add performance timing to critical paths
2. Implement console-based performance logging using OptimizationLogger
3. Create performance tracking for:
   - Database abstraction layer calls
   - Authentication flow timing
   - Analytics query performance
   - API endpoint response times

### Phase 2: Advanced Monitoring (Week 2)
1. Integrate APM solution (OpenTelemetry recommended)
2. Set up real-time alerts for:
   - Page load > 5 seconds
   - API response > 1 second
   - Database query > 500ms
   - Memory usage > 80%
3. Implement distributed tracing for auth flow

## Key Performance Indicators (KPIs)

| Metric | Current | Target | Alert Threshold |
|--------|---------|--------|----------------|
| Page Load Time | 27s | < 2s | > 5s |
| API Response Time | 2-20s | < 200ms | > 500ms |
| Database Query Time | 200ms-15s | < 50ms | > 100ms |
| Error Rate | Unknown | < 0.1% | > 1% |
| Cache Hit Rate | 0% | > 95% | < 80% |
| Memory Usage | 150-300MB | < 150MB | > 250MB |
| CPU Usage | 60-90% | < 50% | > 70% |

## Monitoring Code Snippets

### Client-Side Performance Tracking
```typescript
// Performance observer for web vitals
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log('[Perf]', entry.name, entry.startTime, entry.duration);
    // Send to monitoring service
  }
});
observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
```

### Server-Side Performance Tracking
```typescript
// Middleware for API timing with bottleneck detection
import { OptimizationLogger } from '@/Optimising_Doc/Templates/logging-utility';

export async function performanceMiddleware(req: Request) {
  const logger = new OptimizationLogger('api-monitoring', 'foundation');
  const start = performance.now();
  const pathname = new URL(req.url).pathname;
  
  logger.startOperation(`api-${pathname}`);
  
  try {
    const response = await processRequest(req);
    const duration = performance.now() - start;
    
    // Flag slow endpoints
    if (duration > 1000) {
      logger.logIssue('HIGH', `Slow API endpoint detected: ${pathname}`, {
        duration,
        threshold: 1000
      });
    }
    
    logger.log('INFO', '[API Performance]', {
      path: pathname,
      method: req.method,
      duration,
      timestamp: new Date().toISOString()
    });
    
    logger.endOperation(`api-${pathname}`, true, { duration });
    return response;
  } catch (error) {
    const duration = performance.now() - start;
    logger.log('ERROR', '[API Error]', { path: pathname, duration, error });
    logger.endOperation(`api-${pathname}`, false, { error });
    throw error;
  }
}
```

### Database Performance Monitoring
```typescript
// Track database abstraction overhead
import { OptimizationLogger } from '@/Optimising_Doc/Templates/logging-utility';

export function monitorDatabasePerformance() {
  const logger = new OptimizationLogger('db-monitoring', 'foundation');
  
  // Intercept Prisma queries
  db.$use(async (params, next) => {
    const start = performance.now();
    logger.checkpoint(`db-query-${params.model}-${params.action}`);
    
    try {
      const result = await next(params);
      const duration = performance.now() - start;
      
      // Track slow queries
      if (duration > 200) {
        logger.logIssue('MEDIUM', 'Slow database query detected', {
          model: params.model,
          action: params.action,
          duration,
          args: params.args
        });
      }
      
      logger.log('DEBUG', 'Database query completed', {
        model: params.model,
        action: params.action,
        duration
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.log('ERROR', 'Database query failed', {
        model: params.model,
        action: params.action,
        duration,
        error
      });
      throw error;
    }
  });
}
```

### Authentication Flow Monitoring
```typescript
// Track auth bottleneck
export async function monitorAuthPerformance(request: Request) {
  const logger = new OptimizationLogger('auth-monitoring', 'foundation');
  const metrics = {
    supabaseCheck: 0,
    dbLookup: 0,
    permissionCheck: 0,
    total: 0
  };
  
  const totalStart = performance.now();
  
  try {
    // Step 1: Supabase auth check
    const step1Start = performance.now();
    const supabaseAuth = await checkSupabaseAuth(request);
    metrics.supabaseCheck = performance.now() - step1Start;
    
    // Step 2: Database user lookup
    const step2Start = performance.now();
    const dbUser = await fetchUserFromDB(supabaseAuth.email);
    metrics.dbLookup = performance.now() - step2Start;
    
    // Step 3: Permission verification
    const step3Start = performance.now();
    const permissions = await verifyPermissions(dbUser);
    metrics.permissionCheck = performance.now() - step3Start;
    
    metrics.total = performance.now() - totalStart;
    
    // Log performance breakdown
    logger.log('INFO', 'Auth flow performance breakdown', metrics);
    
    // Alert on slow auth
    if (metrics.total > 2000) {
      logger.logIssue('HIGH', 'Slow authentication detected', metrics);
    }
    
    return { user: dbUser, permissions };
  } catch (error) {
    logger.log('ERROR', 'Auth flow failed', { error, metrics });
    throw error;
  }
}
```

## Dashboard Requirements
- Real-time performance metrics
- Historical trend analysis
- Comparative analysis (before/after optimization)
- Alert configuration
- Export capabilities for reporting

## Next Steps
1. Implement basic performance logging
2. Create initial performance baseline
3. Set up monitoring dashboard
4. Configure alerting thresholds
5. Document monitoring procedures

---
*Last Updated: 2025-08-01*