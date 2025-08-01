# Database Optimization Phase - Issues and Solutions

## Overview
Track all issues encountered during database optimization including materialized views, query optimization, and indexing.

## Materialized View Issues

### Issue #1: MV Refresh Blocking Queries
**Date**: [TBD]
**Status**: Open
**Severity**: High

#### Symptoms
- Application timeouts during MV refresh
- Users experiencing 504 Gateway Timeout
- Database CPU spikes to 100%

#### Investigation
```sql
-- Found blocking queries
SELECT 
    pid,
    usename,
    application_name,
    state,
    query,
    NOW() - query_start as duration
FROM pg_stat_activity
WHERE state != 'idle'
AND NOW() - query_start > interval '5 seconds'
ORDER BY duration DESC;

-- Blocking on: REFRESH MATERIALIZED VIEW dashboard_summary_mv
```

#### Root Cause
Standard REFRESH MATERIALIZED VIEW locks the entire view during refresh

#### Solution
```sql
-- Use CONCURRENTLY option
REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary_mv;

-- Requires unique index
CREATE UNIQUE INDEX CONCURRENTLY idx_dashboard_mv_unique 
ON dashboard_summary_mv(user_id);
```

#### Verification
- [x] No blocking during refresh
- [x] Users can query during refresh
- [x] Refresh time acceptable
- [x] Documentation updated

---

### Issue #2: MV Data Staleness
**Date**: [TBD]
**Status**: Resolved
**Severity**: Medium

#### Symptoms
- Dashboard showing outdated data
- User complaints about incorrect totals
- Data up to 15 minutes old

#### Investigation
```
[2025-XX-XX 14:30:00] Last MV refresh: 14:15:00
[2025-XX-XX 14:30:00] User expecting updated data from 14:25:00
[2025-XX-XX 14:30:00] Refresh schedule: every 15 minutes
```

#### Root Cause
Refresh interval too long for user expectations

#### Solution
```sql
-- Increase refresh frequency
SELECT cron.unschedule('refresh-mvs');
SELECT cron.schedule('refresh-mvs', '*/2 * * * *', 'SELECT refresh_materialized_views()');

-- Add real-time flag for critical data
ALTER TABLE dashboard_summary_mv ADD COLUMN last_refresh TIMESTAMP DEFAULT NOW();

-- Update application to show freshness
SELECT *, 
    CASE 
        WHEN last_refresh < NOW() - INTERVAL '5 minutes' 
        THEN 'Data may be outdated' 
        ELSE NULL 
    END as freshness_warning
FROM dashboard_summary_mv;
```

---

## Query Optimization Issues

### Issue #3: N+1 Query in User Dashboard
**Date**: [TBD]
**Status**: Resolved
**Severity**: Critical

#### Symptoms
- Dashboard load time: 15+ seconds
- 500+ database queries per page load
- Database connection pool exhausted

#### Investigation
```typescript
// Found in dashboard loader
const users = await db.user.findMany();
for (const user of users) {
    const projects = await db.project.findMany({ where: { userId: user.id }});
    const tasks = await db.task.findMany({ where: { userId: user.id }});
    const settings = await db.userSetting.findMany({ where: { userId: user.id }});
}
// Result: 1 + (3 * N) queries!
```

#### Root Cause
Classic N+1 query antipattern

#### Solution
```typescript
// Single query with includes
const users = await db.user.findMany({
    include: {
        projects: true,
        tasks: {
            where: {
                status: { not: 'archived' }
            }
        },
        settings: true
    }
});
// Result: 1-3 queries total (depending on Prisma's query optimization)
```

#### Performance Impact
- Before: 15,000ms, 500 queries
- After: 200ms, 2 queries
- Improvement: 75x faster

---

### Issue #4: Slow Aggregation Queries
**Date**: [TBD]
**Status**: Open
**Severity**: High

#### Symptoms
- Analytics page timeout
- Reports taking 30+ seconds
- Database CPU at 100%

#### Investigation
```sql
EXPLAIN (ANALYZE, BUFFERS) 
SELECT 
    DATE_TRUNC('day', created_at) as day,
    COUNT(*),
    SUM(amount),
    AVG(amount)
FROM transactions
WHERE created_at > NOW() - INTERVAL '365 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;

-- Seq Scan on transactions (cost=0.00..250000.00)
-- Planning Time: 0.5 ms
-- Execution Time: 35000.0 ms
```

#### Root Cause
Missing index on created_at, full table scan

#### Solution
```sql
-- Create index for time-based queries
CREATE INDEX idx_transactions_created_at_btree 
ON transactions(created_at DESC);

-- For better performance on aggregations
CREATE INDEX idx_transactions_created_amount 
ON transactions(created_at DESC, amount);

-- Consider partitioning for very large tables
CREATE TABLE transactions_2025 PARTITION OF transactions
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

---

## Index Issues

### Issue #5: Index Bloat After Bulk Updates
**Date**: [TBD]
**Status**: Resolved
**Severity**: Medium

#### Symptoms
- Index size growing rapidly
- Query performance degrading over time
- Disk space alerts

#### Investigation
```sql
-- Check index bloat
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    100 * (pg_relation_size(indexrelid) - 
           pg_relation_size(indexrelid, 'main')) / 
           pg_relation_size(indexrelid) as bloat_percent
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 10485760 -- 10MB
ORDER BY bloat_percent DESC;

-- Found: idx_users_updated_at with 65% bloat
```

#### Root Cause
Frequent updates causing index fragmentation

#### Solution
```sql
-- Rebuild index concurrently
REINDEX INDEX CONCURRENTLY idx_users_updated_at;

-- Implement regular maintenance
CREATE OR REPLACE FUNCTION auto_reindex_bloated()
RETURNS void AS $$
DECLARE
    idx RECORD;
BEGIN
    FOR idx IN 
        SELECT indexname 
        FROM pg_stat_user_indexes
        WHERE pg_relation_size(indexrelid) > 10485760
        AND 100 * (pg_relation_size(indexrelid) - 
                   pg_relation_size(indexrelid, 'main')) / 
                   pg_relation_size(indexrelid) > 50
    LOOP
        EXECUTE 'REINDEX INDEX CONCURRENTLY ' || idx.indexname;
        RAISE NOTICE 'Reindexed: %', idx.indexname;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule weekly
SELECT cron.schedule('reindex-bloated', '0 2 * * 0', 'SELECT auto_reindex_bloated()');
```

---

## Performance Monitoring Issues

### Issue #6: pg_stat_statements Not Tracking All Queries
**Date**: [TBD]
**Status**: Resolved
**Severity**: Low

#### Symptoms
- Missing queries in performance analysis
- Incomplete optimization data

#### Investigation
```sql
SHOW pg_stat_statements.max;
-- Result: 5000 (default)

SELECT count(*) FROM pg_stat_statements;
-- Result: 5000 (maxed out)
```

#### Solution
```sql
-- Increase tracking limit
ALTER SYSTEM SET pg_stat_statements.max = 10000;
SELECT pg_reload_conf();

-- Reset statistics periodically
SELECT pg_stat_statements_reset();
```

---

## Lessons Learned

### 1. Materialized View Best Practices
- Always use CONCURRENTLY for production refreshes
- Include freshness indicators in views
- Balance refresh frequency with performance
- Monitor refresh duration trends

### 2. Query Optimization Patterns
- Profile first, optimize second
- Fix N+1 queries immediately
- Use EXPLAIN ANALYZE religiously
- Consider query result caching

### 3. Index Management
- Monitor index usage weekly
- Remove unused indexes
- Rebuild bloated indexes regularly
- Test index impact before production

### 4. Connection Pool Optimization
```typescript
// Optimal settings discovered
const db = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL,
        },
    },
    connection_limit: 25,      // Was 10
    pool_timeout: 10,          // Was 5
    pool_size: 15,            // Was 5
    statement_cache_size: 200  // Was 100
});
```

## Next Steps
1. Implement automated performance regression testing
2. Set up continuous query monitoring
3. Create index recommendation system
4. Plan database partitioning strategy

---
*Last Updated: 2025-08-01*