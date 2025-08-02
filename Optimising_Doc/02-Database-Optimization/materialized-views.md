# Materialized Views Implementation

## Overview
Create materialized views for complex queries to dramatically improve dashboard and reporting performance.

## Target Queries for Optimization

### 1. Dashboard Summary View
**Current Performance**: ~5 seconds
**Target Performance**: < 50ms

```sql
-- Current slow query
SELECT 
    u.id,
    u.name,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT t.id) as total_tasks,
    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
    AVG(t.completion_time) as avg_completion_time,
    MAX(t.updated_at) as last_activity
FROM users u
LEFT JOIN projects p ON p.user_id = u.id
LEFT JOIN tasks t ON t.project_id = p.id
WHERE u.id = $1
GROUP BY u.id, u.name;
```

**Materialized View**:
```sql
CREATE MATERIALIZED VIEW dashboard_summary_mv AS
SELECT 
    u.id as user_id,
    u.name,
    COUNT(DISTINCT p.id) as total_projects,
    COUNT(DISTINCT t.id) as total_tasks,
    SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
    AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at))) as avg_completion_seconds,
    MAX(GREATEST(u.updated_at, p.updated_at, t.updated_at)) as last_activity
FROM users u
LEFT JOIN projects p ON p.user_id = u.id
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY u.id, u.name;

-- Create index for fast lookups
CREATE UNIQUE INDEX idx_dashboard_summary_user ON dashboard_summary_mv(user_id);
```

### 2. User Statistics View
**Current Performance**: ~3 seconds
**Target Performance**: < 30ms

```sql
CREATE MATERIALIZED VIEW user_stats_mv AS
SELECT 
    u.id as user_id,
    u.role,
    COUNT(DISTINCT DATE(t.created_at)) as active_days,
    COUNT(DISTINCT t.id) as total_transactions,
    SUM(t.amount) as total_amount,
    AVG(t.amount) as avg_transaction,
    MAX(t.amount) as max_transaction,
    COUNT(DISTINCT t.category) as unique_categories,
    JSONB_BUILD_OBJECT(
        'daily_avg', AVG(daily_stats.daily_total),
        'monthly_avg', AVG(daily_stats.daily_total) * 30
    ) as spending_patterns
FROM users u
LEFT JOIN transactions t ON t.user_id = u.id
LEFT JOIN LATERAL (
    SELECT DATE(created_at) as day, SUM(amount) as daily_total
    FROM transactions
    WHERE user_id = u.id
    GROUP BY DATE(created_at)
) daily_stats ON true
GROUP BY u.id, u.role;

CREATE UNIQUE INDEX idx_user_stats_user ON user_stats_mv(user_id);
CREATE INDEX idx_user_stats_role ON user_stats_mv(role);
```

### 3. System Analytics View
**Current Performance**: ~8 seconds
**Target Performance**: < 100ms

```sql
CREATE MATERIALIZED VIEW system_analytics_mv AS
WITH date_series AS (
    SELECT generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE,
        '1 day'::interval
    )::date as date
)
SELECT 
    d.date,
    COUNT(DISTINCT u.id) as daily_active_users,
    COUNT(DISTINCT t.id) as daily_transactions,
    SUM(t.amount) as daily_volume,
    COUNT(DISTINCT CASE WHEN u.created_at::date = d.date THEN u.id END) as new_users,
    AVG(session_stats.duration) as avg_session_duration
FROM date_series d
LEFT JOIN users u ON u.last_login::date = d.date
LEFT JOIN transactions t ON t.created_at::date = d.date
LEFT JOIN LATERAL (
    SELECT AVG(EXTRACT(EPOCH FROM (ended_at - started_at))) as duration
    FROM user_sessions
    WHERE DATE(started_at) = d.date
) session_stats ON true
GROUP BY d.date
ORDER BY d.date DESC;

CREATE INDEX idx_system_analytics_date ON system_analytics_mv(date DESC);
```

## Refresh Strategy

### 1. Scheduled Refresh
```sql
-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    -- Refresh with concurrency to avoid locks
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary_mv;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats_mv;
    REFRESH MATERIALIZED VIEW CONCURRENTLY system_analytics_mv;
    
    -- Log refresh completion
    INSERT INTO mv_refresh_log (view_name, refreshed_at, duration)
    VALUES 
        ('dashboard_summary_mv', NOW(), EXTRACT(EPOCH FROM (NOW() - statement_timestamp()))),
        ('user_stats_mv', NOW(), EXTRACT(EPOCH FROM (NOW() - statement_timestamp()))),
        ('system_analytics_mv', NOW(), EXTRACT(EPOCH FROM (NOW() - statement_timestamp())));
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 5 minutes
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule('refresh-mvs', '*/5 * * * *', 'SELECT refresh_materialized_views()');
```

### 2. Event-Driven Refresh
```sql
-- Trigger partial refresh on data changes
CREATE OR REPLACE FUNCTION trigger_mv_refresh()
RETURNS trigger AS $$
BEGIN
    -- Mark view for refresh
    INSERT INTO mv_refresh_queue (view_name, trigger_source, created_at)
    VALUES (
        CASE 
            WHEN TG_TABLE_NAME IN ('users', 'projects', 'tasks') THEN 'dashboard_summary_mv'
            WHEN TG_TABLE_NAME = 'transactions' THEN 'user_stats_mv'
            ELSE 'system_analytics_mv'
        END,
        TG_TABLE_NAME,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
CREATE TRIGGER refresh_dashboard_mv AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH STATEMENT EXECUTE FUNCTION trigger_mv_refresh();
```

## Query Optimization with MVs

### Before (Direct Query)
```typescript
// Slow query hitting multiple tables
const stats = await db.$queryRaw`
    SELECT ... FROM users 
    LEFT JOIN projects ...
    LEFT JOIN tasks ...
    WHERE user_id = ${userId}
`;
// Execution time: ~5000ms
```

### After (Using Materialized View)
```typescript
// Fast query using materialized view
const stats = await db.$queryRaw`
    SELECT * FROM dashboard_summary_mv 
    WHERE user_id = ${userId}
`;
// Execution time: ~20ms (250x improvement)
```

## Monitoring & Maintenance

### 1. View Freshness Monitoring
```sql
CREATE TABLE mv_refresh_log (
    id SERIAL PRIMARY KEY,
    view_name VARCHAR(100),
    refreshed_at TIMESTAMP,
    duration FLOAT,
    row_count INTEGER
);

-- Monitor view staleness
CREATE OR REPLACE VIEW mv_freshness AS
SELECT 
    view_name,
    MAX(refreshed_at) as last_refresh,
    EXTRACT(EPOCH FROM (NOW() - MAX(refreshed_at))) as seconds_stale,
    AVG(duration) as avg_refresh_duration
FROM mv_refresh_log
WHERE refreshed_at > NOW() - INTERVAL '24 hours'
GROUP BY view_name;
```

### 2. Performance Tracking
```typescript
// Track MV query performance
export async function queryWithMetrics(viewName: string, query: string, params: any[]) {
    const start = performance.now();
    
    try {
        const result = await db.$queryRawUnsafe(query, ...params);
        const duration = performance.now() - start;
        
        // Log performance
        console.log('[MV Query]', {
            view: viewName,
            duration: `${duration.toFixed(2)}ms`,
            timestamp: new Date().toISOString()
        });
        
        // Alert if slow
        if (duration > 100) {
            console.warn('[MV Performance] Slow query detected:', viewName);
        }
        
        return result;
    } catch (error) {
        console.error('[MV Error]', { view: viewName, error });
        throw error;
    }
}
```

## Rollback Procedure
```sql
-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS dashboard_summary_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS user_stats_mv CASCADE;
DROP MATERIALIZED VIEW IF EXISTS system_analytics_mv CASCADE;

-- Remove refresh jobs
SELECT cron.unschedule('refresh-mvs');

-- Drop support tables
DROP TABLE IF EXISTS mv_refresh_log;
DROP TABLE IF EXISTS mv_refresh_queue;

-- Application will automatically fall back to original queries
```

## Testing Strategy
```typescript
describe('Materialized Views', () => {
    it('should return same results as original query', async () => {
        const originalResult = await runOriginalQuery(userId);
        const mvResult = await runMVQuery(userId);
        
        expect(mvResult).toEqual(originalResult);
    });
    
    it('should be significantly faster', async () => {
        const start1 = performance.now();
        await runOriginalQuery(userId);
        const originalTime = performance.now() - start1;
        
        const start2 = performance.now();
        await runMVQuery(userId);
        const mvTime = performance.now() - start2;
        
        expect(mvTime).toBeLessThan(originalTime * 0.1); // 10x improvement
    });
});
```

## Success Metrics
- [ ] All MVs created and indexed
- [ ] Refresh strategy implemented
- [ ] Query performance improved by 10x+
- [ ] Monitoring dashboard active
- [ ] Zero data inconsistency issues

---
*Implementation Priority: HIGH*