# Load Balancing Implementation

## Overview
Implement load balancing to distribute traffic across multiple application instances, achieving 99.9% uptime and handling 10x traffic spikes.

## Current Architecture Limitations
- Single point of failure
- No horizontal scaling
- Limited to single server capacity
- No redundancy
- Poor geographic distribution

## Load Balancing Architecture

### 1. Application Load Balancer Setup

#### Nginx Load Balancer Configuration
```nginx
# /etc/nginx/nginx.conf
http {
    upstream app_backend {
        # Round-robin load balancing with health checks
        server app1.internal:3000 max_fails=3 fail_timeout=30s;
        server app2.internal:3000 max_fails=3 fail_timeout=30s;
        server app3.internal:3000 max_fails=3 fail_timeout=30s;
        
        # Backup server
        server app4.internal:3000 backup;
        
        # Session persistence
        ip_hash;
        
        # Keep alive connections
        keepalive 32;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;
    
    server {
        listen 80;
        server_name api.example.com;
        
        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name api.example.com;
        
        # SSL configuration
        ssl_certificate /etc/ssl/certs/example.com.crt;
        ssl_certificate_key /etc/ssl/private/example.com.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
        }
        
        # API endpoints with rate limiting
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }
        
        # Auth endpoints with stricter rate limiting
        location /api/auth/ {
            limit_req zone=auth_limit burst=5 nodelay;
            
            proxy_pass http://app_backend;
            # ... same proxy settings
        }
        
        # Static assets with caching
        location /static/ {
            proxy_pass http://app_backend;
            proxy_cache static_cache;
            proxy_cache_valid 200 1d;
            proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
            add_header X-Cache-Status $upstream_cache_status;
        }
    }
    
    # Cache configuration
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=static_cache:10m max_size=1g inactive=60m use_temp_path=off;
}
```

### 2. HAProxy Advanced Configuration

```conf
# /etc/haproxy/haproxy.cfg
global
    maxconn 4096
    log /dev/log local0
    chroot /var/lib/haproxy
    stats socket /run/haproxy/admin.sock mode 660 level admin
    stats timeout 30s
    daemon
    
    # Performance tuning
    tune.ssl.default-dh-param 2048
    tune.h2.max-concurrent-streams 100

defaults
    mode http
    log global
    option httplog
    option dontlognull
    option http-server-close
    option forwardfor except 127.0.0.0/8
    option redispatch
    retries 3
    timeout connect 5000
    timeout client 50000
    timeout server 50000
    
    # Enable compression
    compression algo gzip
    compression type text/html text/plain text/css application/json

# Statistics dashboard
listen stats
    bind *:8404
    stats enable
    stats uri /stats
    stats refresh 30s
    stats admin if TRUE

# Frontend configuration
frontend web_frontend
    bind *:80
    bind *:443 ssl crt /etc/ssl/certs/example.com.pem
    
    # HSTS
    http-response set-header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    
    # ACLs for routing
    acl is_api path_beg /api
    acl is_websocket hdr(Upgrade) -i WebSocket
    acl is_health path /health
    
    # Rate limiting
    stick-table type ip size 100k expire 30s store http_req_rate(10s)
    http-request track-sc0 src
    http-request deny if { sc_http_req_rate(0) gt 100 }
    
    # Routing rules
    use_backend health_backend if is_health
    use_backend websocket_backend if is_websocket
    use_backend api_backend if is_api
    default_backend web_backend

# Backend configurations
backend web_backend
    balance roundrobin
    option httpchk GET /health
    
    # Servers with health checks
    server web1 10.0.1.10:3000 check inter 2000 rise 2 fall 3 weight 100
    server web2 10.0.1.11:3000 check inter 2000 rise 2 fall 3 weight 100
    server web3 10.0.1.12:3000 check inter 2000 rise 2 fall 3 weight 100
    
    # Backup server
    server web_backup 10.0.2.10:3000 backup

backend api_backend
    balance leastconn
    option httpchk GET /api/health
    
    # API servers
    server api1 10.0.1.20:3001 check maxconn 100
    server api2 10.0.1.21:3001 check maxconn 100
    server api3 10.0.1.22:3001 check maxconn 100

backend websocket_backend
    balance source
    option http-server-close
    option forceclose
    
    server ws1 10.0.1.30:3002 check
    server ws2 10.0.1.31:3002 check

backend health_backend
    server local 127.0.0.1:8080
```

### 3. Application-Level Load Balancing

#### Node.js Cluster Mode
```typescript
// src/server/cluster.ts
import cluster from 'cluster';
import os from 'os';
import { createServer } from './app';

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);
  
  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  // Handle worker failures
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log('Starting a new worker');
    cluster.fork();
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    for (const id in cluster.workers) {
      cluster.workers[id]?.process.kill();
    }
  });
} else {
  // Worker process
  const server = createServer();
  const port = process.env.PORT || 3000;
  
  server.listen(port, () => {
    console.log(`Worker ${process.pid} started on port ${port}`);
  });
  
  // Graceful shutdown for worker
  process.on('SIGTERM', () => {
    console.log(`Worker ${process.pid} shutting down`);
    server.close(() => {
      process.exit(0);
    });
  });
}
```

#### PM2 Load Balancing
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'app',
    script: './dist/server.js',
    instances: 'max', // Use all CPU cores
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    
    // Auto restart on failure
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    
    // Graceful reload
    listen_timeout: 3000,
    kill_timeout: 5000,
  }]
};
```

### 4. Database Load Balancing

#### Read Replica Configuration
```typescript
// src/lib/db/replicas.ts
import { PrismaClient } from '@prisma/client';

class DatabaseRouter {
  private writeDb: PrismaClient;
  private readDbs: PrismaClient[];
  private currentReadIndex = 0;
  
  constructor() {
    // Write master
    this.writeDb = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL_MASTER }
      }
    });
    
    // Read replicas
    const replicaUrls = [
      process.env.DATABASE_URL_REPLICA_1,
      process.env.DATABASE_URL_REPLICA_2,
      process.env.DATABASE_URL_REPLICA_3,
    ].filter(Boolean);
    
    this.readDbs = replicaUrls.map(url => 
      new PrismaClient({
        datasources: { db: { url } }
      })
    );
  }
  
  // Round-robin read distribution
  getReadDb(): PrismaClient {
    const db = this.readDbs[this.currentReadIndex];
    this.currentReadIndex = (this.currentReadIndex + 1) % this.readDbs.length;
    return db;
  }
  
  getWriteDb(): PrismaClient {
    return this.writeDb;
  }
  
  // Smart routing based on query type
  async query(operation: string, args: any) {
    const isWrite = ['create', 'update', 'delete', 'upsert'].some(op => 
      operation.toLowerCase().includes(op)
    );
    
    const db = isWrite ? this.getWriteDb() : this.getReadDb();
    return db[operation](args);
  }
}

export const dbRouter = new DatabaseRouter();
```

### 5. Geographic Load Balancing

#### CDN Integration
```typescript
// src/lib/cdn/cloudflare.ts
export class GeographicLoadBalancer {
  private regions = {
    'us-east': 'https://us-east.api.example.com',
    'us-west': 'https://us-west.api.example.com',
    'eu-west': 'https://eu-west.api.example.com',
    'asia-pacific': 'https://asia.api.example.com',
  };
  
  getClosestEndpoint(clientIp: string): string {
    // Use Cloudflare's CF-IPCountry header
    const country = this.getCountryFromIp(clientIp);
    
    const regionMap = {
      'US': 'us-east',
      'CA': 'us-east',
      'MX': 'us-west',
      'GB': 'eu-west',
      'DE': 'eu-west',
      'FR': 'eu-west',
      'JP': 'asia-pacific',
      'AU': 'asia-pacific',
    };
    
    const region = regionMap[country] || 'us-east';
    return this.regions[region];
  }
  
  private getCountryFromIp(ip: string): string {
    // Implementation using GeoIP database
    // or Cloudflare headers
    return 'US'; // Placeholder
  }
}
```

### 6. Health Monitoring

#### Health Check Service
```typescript
// src/services/health-check.ts
export class HealthCheckService {
  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs(),
      this.checkDiskSpace(),
      this.checkMemory(),
    ]);
    
    const status = {
      healthy: checks.every(c => c.status === 'fulfilled'),
      timestamp: new Date().toISOString(),
      checks: {
        database: this.getCheckResult(checks[0]),
        redis: this.getCheckResult(checks[1]),
        external: this.getCheckResult(checks[2]),
        disk: this.getCheckResult(checks[3]),
        memory: this.getCheckResult(checks[4]),
      },
    };
    
    return status;
  }
  
  private async checkDatabase(): Promise<void> {
    await db.$queryRaw`SELECT 1`;
  }
  
  private async checkRedis(): Promise<void> {
    await redis.ping();
  }
  
  private async checkDiskSpace(): Promise<void> {
    const usage = await checkDiskUsage('/');
    if (usage.available < 1024 * 1024 * 1024) { // 1GB
      throw new Error('Low disk space');
    }
  }
  
  private async checkMemory(): Promise<void> {
    const usage = process.memoryUsage();
    if (usage.heapUsed > 1024 * 1024 * 1024) { // 1GB
      throw new Error('High memory usage');
    }
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = await healthCheckService.checkHealth();
  const statusCode = health.healthy ? 200 : 503;
  res.status(statusCode).json(health);
});
```

## Deployment Strategy

### Blue-Green Deployment
```bash
#!/bin/bash
# deploy.sh - Blue-green deployment script

BLUE_PORT=3000
GREEN_PORT=3001
CURRENT_COLOR=$(curl -s http://localhost/health | jq -r '.color')
NEW_COLOR=$([[ "$CURRENT_COLOR" == "blue" ]] && echo "green" || echo "blue")
NEW_PORT=$([[ "$NEW_COLOR" == "blue" ]] && echo $BLUE_PORT || echo $GREEN_PORT)

echo "Current deployment: $CURRENT_COLOR"
echo "Deploying to: $NEW_COLOR on port $NEW_PORT"

# Deploy new version
pm2 start ecosystem.config.js --name "app-$NEW_COLOR" --env PORT=$NEW_PORT

# Health check
sleep 10
for i in {1..30}; do
  if curl -f http://localhost:$NEW_PORT/health; then
    echo "Health check passed"
    break
  fi
  sleep 2
done

# Switch load balancer
sed -i "s/server app.internal:$([[ "$CURRENT_COLOR" == "blue" ]] && echo $BLUE_PORT || echo $GREEN_PORT)/server app.internal:$NEW_PORT/g" /etc/nginx/nginx.conf
nginx -s reload

# Stop old version
sleep 30
pm2 stop "app-$CURRENT_COLOR"
```

## Success Metrics
- [ ] Zero-downtime deployments achieved
- [ ] Handle 10,000+ concurrent connections
- [ ] 99.9% uptime SLA met
- [ ] Response time < 100ms at P95
- [ ] Automatic failover working
- [ ] Geographic distribution active

---
*Priority: CRITICAL for scalability*