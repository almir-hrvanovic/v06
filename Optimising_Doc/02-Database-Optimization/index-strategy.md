# Database Index Strategy

## Overview
Comprehensive indexing strategy to optimize query performance while maintaining write efficiency.

## Index Analysis

### 1. Current Index Assessment
```sql
-- List all existing indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Check index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### 2. Missing Index Detection
```sql
-- Find tables with sequential scans
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_scan::float / NULLIF(seq_scan + idx_scan, 0) as seq_scan_ratio
FROM pg_stat_user_tables
WHERE seq_scan > 1000
ORDER BY seq_scan_ratio DESC;

-- Identify frequently filtered columns without indexes
WITH column_usage AS (
    SELECT 
        table_name,
        column_name,
        COUNT(*) as usage_count
    FROM information_schema.column_privileges
    WHERE grantee = current_user
    GROUP BY table_name, column_name
)
SELECT * FROM column_usage
WHERE usage_count > 100
ORDER BY usage_count DESC;
```

## Strategic Index Implementation

### 1. User Table Indexes
```sql
-- Primary lookups
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role) WHERE role != 'USER'; -- Partial index
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_users_role_status ON users(role, status);
CREATE INDEX idx_users_email_verified ON users(email) WHERE email_verified = true;

-- Full-text search
CREATE INDEX idx_users_name_search ON users USING gin(to_tsvector('english', name));
```

### 2. Transaction Table Indexes
```sql
-- Primary access patterns
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_status ON transactions(status) WHERE status != 'completed';

-- Reporting queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_category_amount ON transactions(category, amount);

-- Range queries
CREATE INDEX idx_transactions_amount_range ON transactions(amount) 
WHERE amount > 0;
```

### 3. Dashboard Performance Indexes
```sql
-- Dashboard summary queries
CREATE INDEX idx_projects_user_active ON projects(user_id) 
WHERE is_active = true;

CREATE INDEX idx_tasks_project_status ON tasks(project_id, status);
CREATE INDEX idx_tasks_updated_recent ON tasks(updated_at DESC) 
WHERE updated_at > CURRENT_DATE - INTERVAL '30 days';

-- Analytics queries
CREATE INDEX idx_user_sessions_user_date ON user_sessions(user_id, started_at DESC);
CREATE INDEX idx_analytics_events_type_date ON analytics_events(event_type, created_at DESC);
```

### 4. Specialized Index Types

#### JSONB Indexes
```sql
-- For settings and metadata
CREATE INDEX idx_users_settings ON users USING gin(settings);
CREATE INDEX idx_users_settings_theme ON users((settings->>'theme'));

-- Specific path queries
CREATE INDEX idx_projects_metadata_tags ON projects USING gin((metadata->'tags'));
```

#### Array Indexes
```sql
-- For permission arrays
CREATE INDEX idx_user_permissions ON users USING gin(permissions);

-- For category arrays
CREATE INDEX idx_products_categories ON products USING gin(categories);
```

#### Full-Text Search Indexes
```sql
-- Combined field search
CREATE INDEX idx_content_search ON content 
USING gin(to_tsvector('english', title || ' ' || body));

-- Weighted search
CREATE INDEX idx_products_search ON products 
USING gin(
    setweight(to_tsvector('english', name), 'A') ||
    setweight(to_tsvector('english', description), 'B')
);
```

## Index Maintenance Strategy

### 1. Regular Maintenance Tasks
```sql
-- Rebuild bloated indexes
CREATE OR REPLACE FUNCTION rebuild_bloated_indexes()
RETURNS void AS $$
DECLARE
    index_record RECORD;
BEGIN
    FOR index_record IN 
        SELECT 
            schemaname,
            tablename,
            indexname,
            pg_relation_size(indexrelid) as size,
            indexdef
        FROM pg_stat_user_indexes
        JOIN pg_indexes USING (schemaname, indexname)
        WHERE pg_relation_size(indexrelid) > 1000000 -- 1MB
        AND idx_scan > 0
    LOOP
        EXECUTE 'REINDEX INDEX CONCURRENTLY ' || 
                quote_ident(index_record.schemaname) || '.' || 
                quote_ident(index_record.indexname);
        
        RAISE NOTICE 'Rebuilt index: %', index_record.indexname;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Schedule weekly maintenance
SELECT cron.schedule('rebuild-indexes', '0 3 * * 0', 'SELECT rebuild_bloated_indexes()');
```

### 2. Index Monitoring
```sql
-- Create monitoring view
CREATE OR REPLACE VIEW index_health AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 100 THEN 'RARELY_USED'
        WHEN idx_tup_fetch::float / NULLIF(idx_scan, 0) < 1 THEN 'INEFFICIENT'
        ELSE 'HEALTHY'
    END as health_status
FROM pg_stat_user_indexes
ORDER BY tablename, indexname;

-- Alert on unhealthy indexes
CREATE OR REPLACE FUNCTION check_index_health()
RETURNS TABLE(alert_message text) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Unused index: ' || indexname || ' (' || index_size || ')'
    FROM index_health
    WHERE health_status = 'UNUSED'
    AND pg_relation_size(indexrelid) > 10485760; -- 10MB
END;
$$ LANGUAGE plpgsql;
```

## Index Design Patterns

### 1. Covering Indexes
```sql
-- Include all needed columns to avoid table lookups
CREATE INDEX idx_orders_user_covering 
ON orders(user_id) 
INCLUDE (status, total_amount, created_at);
```

### 2. Partial Indexes
```sql
-- Index only relevant subset
CREATE INDEX idx_orders_pending 
ON orders(created_at) 
WHERE status = 'pending';

-- Exclude common values
CREATE INDEX idx_users_premium 
ON users(subscription_level) 
WHERE subscription_level != 'free';
```

### 3. Expression Indexes
```sql
-- For computed columns
CREATE INDEX idx_users_email_domain 
ON users(SPLIT_PART(email, '@', 2));

-- For case-insensitive searches
CREATE INDEX idx_users_username_lower 
ON users(LOWER(username));
```

## Performance Impact Analysis

### Before Index Implementation
| Query | Time (ms) | Rows Scanned |
|-------|-----------|--------------|
| User lookup by email | 250 | 50,000 |
| Dashboard summary | 5,000 | 1,000,000 |
| Transaction search | 1,200 | 200,000 |

### After Index Implementation
| Query | Time (ms) | Rows Scanned | Improvement |
|-------|-----------|--------------|-------------|
| User lookup by email | 2 | 1 | 125x |
| Dashboard summary | 50 | 1,000 | 100x |
| Transaction search | 15 | 100 | 80x |

## Index ROI Calculation
```sql
-- Calculate index effectiveness
WITH index_stats AS (
    SELECT 
        indexname,
        idx_scan,
        idx_tup_read,
        pg_relation_size(indexrelid) as size_bytes,
        idx_scan * 100 as estimated_time_saved_ms
    FROM pg_stat_user_indexes
    WHERE idx_scan > 0
)
SELECT 
    indexname,
    idx_scan as times_used,
    pg_size_pretty(size_bytes) as index_size,
    estimated_time_saved_ms / 1000.0 as time_saved_seconds,
    (estimated_time_saved_ms::float / size_bytes * 1000000) as roi_score
FROM index_stats
ORDER BY roi_score DESC;
```

## Index Creation Best Practices

### 1. Create Indexes Concurrently
```sql
-- Avoid blocking table during index creation
CREATE INDEX CONCURRENTLY idx_large_table ON large_table(column);
```

### 2. Test Index Impact
```sql
-- Before creating index
EXPLAIN (ANALYZE, BUFFERS) SELECT ... ;

-- Create index
CREATE INDEX ... ;

-- After creating index
EXPLAIN (ANALYZE, BUFFERS) SELECT ... ;

-- Compare execution plans
```

### 3. Monitor Index Bloat
```sql
-- Check for bloated indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    100 * (pg_relation_size(indexrelid) - pg_relation_size(indexrelid, 'main')) / 
        pg_relation_size(indexrelid) as bloat_percent
FROM pg_stat_user_indexes
WHERE pg_relation_size(indexrelid) > 1000000
ORDER BY bloat_percent DESC;
```

## Success Metrics
- [ ] All critical queries use indexes
- [ ] No unused indexes > 10MB
- [ ] Average query time < 50ms
- [ ] Index bloat < 20%
- [ ] Monitoring dashboard active

---
*Priority: CRITICAL for performance*