# Connection Pooling Optimization

## Overview
Optimize database connection pooling to handle 10x more concurrent requests while reducing connection overhead by 80%.

## Current Connection Issues
- Connection exhaustion under load
- Slow connection establishment
- No connection reuse
- Memory leaks from unclosed connections

## Connection Pool Strategy

### 1. Database Connection Pool Configuration

#### Prisma Connection Pool
```typescript
// src/lib/db/optimized-client.ts
import { PrismaClient } from '@prisma/client';

// Singleton pattern for connection pool
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

// Connection pool settings in DATABASE_URL:
// postgresql://user:password@host:5432/db?connection_limit=25&pool_timeout=10
```

#### PostgreSQL Pool Configuration
```sql
-- postgresql.conf optimizations
max_connections = 200              -- Increased from default 100
shared_buffers = 256MB            -- 25% of RAM
effective_cache_size = 1GB        -- 75% of RAM
work_mem = 4MB                    -- Per operation memory

-- Connection pooling settings
idle_in_transaction_session_timeout = 30000  -- 30 seconds
statement_timeout = 30000                     -- 30 seconds
lock_timeout = 10000                          -- 10 seconds
```

### 2. PgBouncer Implementation

#### PgBouncer Configuration
```ini
# pgbouncer.ini
[databases]
myapp = host=localhost port=5432 dbname=myapp

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool configuration
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
min_pool_size = 10
reserve_pool_size = 5
reserve_pool_timeout = 3

# Timeouts
server_lifetime = 3600
server_idle_timeout = 600
server_connect_timeout = 15
server_login_retry = 15
query_timeout = 60
query_wait_timeout = 120
client_idle_timeout = 0
client_login_timeout = 60

# Logging
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
stats_period = 60
```

#### Application Connection
```typescript
// Update DATABASE_URL to use PgBouncer
// Before: postgresql://user:pass@localhost:5432/myapp
// After:  postgresql://user:pass@localhost:6432/myapp
```

### 3. Redis Connection Pool

#### Redis Pool Configuration
```typescript
// src/lib/redis/pool.ts
import Redis from 'ioredis';

class RedisPool {
  private pool: Redis[];
  private available: Redis[];
  private maxConnections: number;
  
  constructor(maxConnections = 10) {
    this.maxConnections = maxConnections;
    this.pool = [];
    this.available = [];
    this.initializePool();
  }
  
  private initializePool() {
    for (let i = 0; i < this.maxConnections; i++) {
      const client = new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times) => Math.min(times * 50, 2000),
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });
      
      client.on('error', (err) => {
        console.error(`[Redis Pool] Connection ${i} error:`, err);
      });
      
      this.pool.push(client);
      this.available.push(client);
    }
  }
  
  async acquire(): Promise<Redis> {
    if (this.available.length === 0) {
      // Wait for available connection
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.acquire();
    }
    
    const client = this.available.pop()!;
    
    // Ensure connection is healthy
    try {
      await client.ping();
    } catch (error) {
      console.error('[Redis Pool] Unhealthy connection, creating new one');
      const newClient = this.createNewConnection();
      return newClient;
    }
    
    return client;
  }
  
  release(client: Redis) {
    if (this.pool.includes(client)) {
      this.available.push(client);
    }
  }
  
  private createNewConnection(): Redis {
    // Create replacement connection
    const client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
    
    return client;
  }
  
  async shutdown() {
    await Promise.all(this.pool.map(client => client.quit()));
  }
}

export const redisPool = new RedisPool(10);

// Usage wrapper
export async function withRedis<T>(
  operation: (client: Redis) => Promise<T>
): Promise<T> {
  const client = await redisPool.acquire();
  try {
    return await operation(client);
  } finally {
    redisPool.release(client);
  }
}
```

### 4. HTTP Connection Pooling

#### Node.js HTTP Agent Configuration
```typescript
// src/lib/http/agent.ts
import http from 'http';
import https from 'https';

// Global HTTP agents with connection pooling
export const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  scheduling: 'lifo',
});

export const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 1000,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 60000,
  scheduling: 'lifo',
});

// Axios configuration with pooling
import axios from 'axios';

export const apiClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 30000,
  maxRedirects: 5,
  // Connection pool per host
  maxContentLength: 50 * 1024 * 1024, // 50MB
});

// Fetch with connection pooling
export async function fetchWithPool(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    // @ts-ignore - Node.js specific
    agent: url.startsWith('https') ? httpsAgent : httpAgent,
  });
}
```

### 5. Connection Pool Monitoring

#### Pool Metrics Collection
```typescript
// src/lib/monitoring/pool-metrics.ts
export class PoolMetrics {
  private metrics = {
    dbPool: {
      active: 0,
      idle: 0,
      waiting: 0,
      totalConnections: 0,
    },
    redisPool: {
      active: 0,
      idle: 0,
      errors: 0,
    },
    httpPool: {
      requests: 0,
      reusedConnections: 0,
      newConnections: 0,
    },
  };
  
  async collectDatabaseMetrics() {
    const result = await db.$queryRaw`
      SELECT 
        count(*) FILTER (WHERE state = 'active') as active,
        count(*) FILTER (WHERE state = 'idle') as idle,
        count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        count(*) as total
      FROM pg_stat_activity
      WHERE datname = current_database()
    `;
    
    this.metrics.dbPool = result[0];
    return this.metrics.dbPool;
  }
  
  logMetrics() {
    console.log('[Pool Metrics]', JSON.stringify(this.metrics, null, 2));
    
    // Alert on high usage
    if (this.metrics.dbPool.active > 20) {
      console.warn('[Pool Warning] High database connection usage:', this.metrics.dbPool.active);
    }
  }
}

// Monitor every 30 seconds
setInterval(() => {
  const metrics = new PoolMetrics();
  metrics.collectDatabaseMetrics();
  metrics.logMetrics();
}, 30000);
```

#### Health Checks
```typescript
// src/app/api/health/route.ts
export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {},
  };
  
  // Database health
  try {
    await db.$queryRaw`SELECT 1`;
    health.checks.database = { status: 'healthy' };
  } catch (error) {
    health.checks.database = { status: 'unhealthy', error: error.message };
    health.status = 'unhealthy';
  }
  
  // Redis health
  try {
    await withRedis(async (client) => {
      await client.ping();
    });
    health.checks.redis = { status: 'healthy' };
  } catch (error) {
    health.checks.redis = { status: 'unhealthy', error: error.message };
    health.status = 'unhealthy';
  }
  
  // Connection pool stats
  const poolStats = await db.$queryRaw`
    SELECT 
      count(*) as total_connections,
      count(*) FILTER (WHERE state = 'active') as active_connections
    FROM pg_stat_activity
    WHERE datname = current_database()
  `;
  
  health.checks.connectionPool = {
    status: poolStats[0].active_connections < 20 ? 'healthy' : 'warning',
    stats: poolStats[0],
  };
  
  return Response.json(health);
}
```

## Connection Pool Best Practices

### 1. Connection Lifecycle Management
```typescript
// Always use try-finally for cleanup
async function queryWithConnection() {
  const connection = await pool.acquire();
  try {
    return await connection.query('SELECT * FROM users');
  } finally {
    pool.release(connection);
  }
}

// Use middleware for automatic cleanup
export function withConnectionPool(handler: Function) {
  return async (req: Request, res: Response) => {
    const connection = await pool.acquire();
    req.db = connection;
    
    try {
      await handler(req, res);
    } finally {
      pool.release(connection);
    }
  };
}
```

### 2. Transaction Management
```typescript
// Proper transaction handling with pooling
export async function withTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return db.$transaction(async (tx) => {
    try {
      return await callback(tx);
    } catch (error) {
      console.error('[Transaction] Error:', error);
      throw error;
    }
  }, {
    maxWait: 5000,    // Max time to wait for tx
    timeout: 10000,   // Max time for tx to complete
    isolationLevel: 'ReadCommitted',
  });
}
```

## Performance Impact

### Before Optimization
- Max concurrent connections: 10
- Connection establishment: 150ms
- Connection reuse: 0%
- Under load: Connection exhaustion

### After Optimization
- Max concurrent connections: 200
- Connection establishment: 5ms (pooled)
- Connection reuse: 95%+
- Under load: Stable performance

## Success Metrics
- [ ] Connection pool configured for all databases
- [ ] PgBouncer deployed and configured
- [ ] Connection reuse > 90%
- [ ] Zero connection timeouts under normal load
- [ ] Health monitoring active
- [ ] Automatic pool recovery implemented

---
*Priority: CRITICAL for scalability*