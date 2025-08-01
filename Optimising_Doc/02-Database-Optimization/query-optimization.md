# Query Optimization Guide

## Overview
Systematic approach to identifying and optimizing slow database queries for 10x+ performance improvements.

## Query Analysis Tools

### 1. Enable Query Logging
```sql
-- PostgreSQL slow query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries over 1 second
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
SELECT pg_reload_conf();

-- Check current settings
SHOW log_min_duration_statement;
SHOW shared_preload_libraries;
```

### 2. Query Performance Analysis
```sql
-- Enable query statistics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 slowest queries
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time,
    min_exec_time,
    max_exec_time,
    stddev_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Common Query Optimizations

### 1. N+1 Query Problem

**Before**: Multiple queries in a loop
```typescript
// BAD: N+1 queries
const users = await db.user.findMany();
for (const user of users) {
    const projects = await db.project.findMany({
        where: { userId: user.id }
    });
    user.projects = projects;
}
// Results in: 1 + N queries (where N = number of users)
```

**After**: Single query with joins
```typescript
// GOOD: Single query with include
const users = await db.user.findMany({
    include: {
        projects: true
    }
});
// Results in: 1 query total
```

### 2. Missing Indexes

**Identify missing indexes**:
```sql
-- Find queries without index usage
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND attname NOT IN (
    SELECT column_name
    FROM information_schema.statistics
    WHERE table_schema = 'public'
);

-- Analyze specific query
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users 
WHERE email = 'user@example.com' 
AND status = 'active';
```

**Create strategic indexes**:
```sql
-- Single column index for frequent lookups
CREATE INDEX idx_users_email ON users(email);

-- Composite index for multi-column queries
CREATE INDEX idx_users_email_status ON users(email, status);

-- Partial index for filtered queries
CREATE INDEX idx_active_users ON users(email) 
WHERE status = 'active';

-- Index for JSON queries
CREATE INDEX idx_user_settings ON users USING GIN(settings);
```

### 3. Optimize JOIN Operations

**Before**: Unoptimized joins
```sql
-- Slow: No indexes on foreign keys
SELECT u.*, p.*, t.*
FROM users u
LEFT JOIN projects p ON p.user_id = u.id
LEFT JOIN tasks t ON t.project_id = p.id
WHERE u.created_at > NOW() - INTERVAL '30 days';
```

**After**: Optimized with indexes
```sql
-- Add foreign key indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Rewrite query with better join order
SELECT u.*, p.*, t.*
FROM users u
INNER JOIN projects p ON p.user_id = u.id AND p.is_active = true
LEFT JOIN tasks t ON t.project_id = p.id
WHERE u.created_at > NOW() - INTERVAL '30 days'
ORDER BY u.created_at DESC;
```

### 4. Pagination Optimization

**Before**: OFFSET pagination (slow for large offsets)
```typescript
// Slow for large page numbers
const page = 1000;
const pageSize = 20;
const results = await db.user.findMany({
    skip: page * pageSize,  // OFFSET 20000
    take: pageSize,
    orderBy: { createdAt: 'desc' }
});
```

**After**: Cursor-based pagination
```typescript
// Fast regardless of position
const results = await db.user.findMany({
    take: pageSize,
    skip: 1,
    cursor: {
        id: lastSeenId,
    },
    orderBy: { createdAt: 'desc' }
});
```

### 5. Aggregate Query Optimization

**Before**: Multiple aggregations
```sql
-- Multiple passes over data
SELECT COUNT(*) FROM orders WHERE status = 'completed';
SELECT SUM(amount) FROM orders WHERE status = 'completed';
SELECT AVG(amount) FROM orders WHERE status = 'completed';
```

**After**: Single aggregation query
```sql
-- Single pass with multiple aggregates
SELECT 
    COUNT(*) as total_orders,
    SUM(amount) as total_revenue,
    AVG(amount) as avg_order_value,
    MIN(amount) as min_order,
    MAX(amount) as max_order
FROM orders 
WHERE status = 'completed';
```

## Query Optimization Patterns

### 1. Batch Operations
```typescript
// Instead of individual inserts
for (const item of items) {
    await db.item.create({ data: item });
}

// Use batch insert
await db.item.createMany({
    data: items,
    skipDuplicates: true
});
```

### 2. Selective Field Loading
```typescript
// Don't load unnecessary fields
const users = await db.user.findMany({
    select: {
        id: true,
        name: true,
        email: true,
        // Skip large fields like profile_data
    }
});
```

### 3. Query Result Caching
```typescript
// Cache expensive queries
const cacheKey = `expensive_query:${params}`;
let result = await cache.get(cacheKey);

if (!result) {
    result = await db.$queryRaw`
        -- Expensive query here
    `;
    await cache.set(cacheKey, result, 300); // 5 min TTL
}
```

## Performance Monitoring

### Query Performance Tracking
```typescript
// Middleware to track query performance
export function trackQueryPerformance() {
    return async (params: any, next: any) => {
        const start = performance.now();
        const result = await next(params);
        const duration = performance.now() - start;
        
        if (duration > 100) {
            console.warn('[Slow Query]', {
                model: params.model,
                action: params.action,
                duration: `${duration.toFixed(2)}ms`,
                query: params.args
            });
        }
        
        return result;
    };
}

// Apply to Prisma client
db.$use(trackQueryPerformance());
```

### Database Connection Pool Monitoring
```typescript
// Monitor connection pool health
setInterval(async () => {
    const poolStats = await db.$queryRaw`
        SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active,
            count(*) FILTER (WHERE state = 'idle') as idle,
            count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
        FROM pg_stat_activity
        WHERE datname = current_database();
    `;
    
    console.log('[DB Pool Stats]', poolStats);
}, 60000); // Every minute
```

## Query Optimization Checklist

### For Each Slow Query:
- [ ] Run EXPLAIN ANALYZE
- [ ] Check for missing indexes
- [ ] Review join conditions
- [ ] Eliminate N+1 queries
- [ ] Consider materialized views
- [ ] Add query result caching
- [ ] Optimize data types
- [ ] Review query logic

### Weekly Maintenance:
- [ ] Analyze pg_stat_statements
- [ ] Update table statistics: `ANALYZE;`
- [ ] Check index usage
- [ ] Review slow query log
- [ ] Update query cache strategy

## Common Pitfalls

### 1. Over-indexing
- Too many indexes slow down writes
- Unused indexes waste space
- Monitor with `pg_stat_user_indexes`

### 2. Implicit Type Conversions
```sql
-- Bad: Type conversion prevents index use
SELECT * FROM users WHERE id = '123'; -- id is integer

-- Good: Correct type
SELECT * FROM users WHERE id = 123;
```

### 3. Function Calls on Indexed Columns
```sql
-- Bad: Function prevents index use
SELECT * FROM users WHERE LOWER(email) = 'user@example.com';

-- Good: Use functional index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
```

## Success Metrics
- [ ] Average query time < 50ms
- [ ] No queries > 1 second
- [ ] 95% of queries use indexes
- [ ] Zero N+1 query patterns
- [ ] Connection pool utilization < 80%

---
*Optimization Status: Ready to Implement*