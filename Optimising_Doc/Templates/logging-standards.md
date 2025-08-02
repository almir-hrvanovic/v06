# Logging Standards

## Overview
Standardized logging practices for consistent debugging and monitoring across the performance optimization project.

## Log Levels

### ERROR
**When to use**: System failures requiring immediate attention
**Format**: `[ERROR] [Component] [Timestamp] Message {context}`

```typescript
console.error('[ERROR] [Database] [2025-08-01T10:30:45Z] Connection failed', {
  error: err.message,
  stack: err.stack,
  host: config.database.host,
  attempt: retryCount
});
```

### WARN
**When to use**: Potential issues or degraded performance
**Format**: `[WARN] [Component] [Timestamp] Message {context}`

```typescript
console.warn('[WARN] [Cache] [2025-08-01T10:30:45Z] Cache miss rate high', {
  hitRate: 0.45,
  threshold: 0.80,
  timeWindow: '5m'
});
```

### INFO
**When to use**: Normal operation milestones
**Format**: `[INFO] [Component] [Timestamp] Message {context}`

```typescript
console.info('[INFO] [API] [2025-08-01T10:30:45Z] Request completed', {
  method: 'POST',
  path: '/api/users',
  duration: 125,
  status: 200
});
```

### DEBUG
**When to use**: Detailed execution information for debugging
**Format**: `[DEBUG] [Component] [Timestamp] Message {context}`

```typescript
console.debug('[DEBUG] [Auth] [2025-08-01T10:30:45Z] Token validation', {
  userId: user.id,
  tokenAge: tokenAge,
  permissions: user.permissions
});
```

## Component Identifiers

Use consistent component names for easy filtering:

- `[API]` - REST API endpoints
- `[Database]` - Database operations
- `[Cache]` - Caching layer
- `[Queue]` - Job queue processing
- `[Auth]` - Authentication/Authorization
- `[Worker]` - Background workers
- `[CDN]` - CDN operations
- `[LoadBalancer]` - Load balancing
- `[Performance]` - Performance monitoring

## Structured Logging Format

### Basic Structure
```typescript
interface LogEntry {
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  component: string;
  timestamp: string; // ISO 8601
  message: string;
  context?: Record<string, any>;
  traceId?: string;
  spanId?: string;
  userId?: string;
  requestId?: string;
}
```

### Implementation Example
```typescript
class StructuredLogger {
  private component: string;
  
  constructor(component: string) {
    this.component = component;
  }
  
  private log(level: string, message: string, context?: any) {
    const entry = {
      level,
      component: this.component,
      timestamp: new Date().toISOString(),
      message,
      context,
      traceId: getTraceId(),
      requestId: getRequestId(),
      userId: getCurrentUserId(),
    };
    
    console.log(JSON.stringify(entry));
  }
  
  error(message: string, context?: any) {
    this.log('ERROR', message, context);
  }
  
  warn(message: string, context?: any) {
    this.log('WARN', message, context);
  }
  
  info(message: string, context?: any) {
    this.log('INFO', message, context);
  }
  
  debug(message: string, context?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, context);
    }
  }
}

// Usage
const logger = new StructuredLogger('API');
logger.info('Request received', {
  method: req.method,
  path: req.path,
  ip: req.ip
});
```

## Performance Logging

### Request/Response Logging
```typescript
// Middleware for API logging
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();
  const requestId = generateRequestId();
  
  // Attach to request for use in other logs
  req.requestId = requestId;
  
  // Log request
  logger.info('Request started', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    userAgent: req.headers['user-agent'],
  });
  
  // Log response
  res.on('finish', () => {
    const duration = performance.now() - start;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: Math.round(duration),
      contentLength: res.get('content-length'),
    });
    
    // Alert on slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId,
        duration: Math.round(duration),
        threshold: 1000,
      });
    }
  });
  
  next();
}
```

### Database Query Logging
```typescript
// Prisma middleware for query logging
db.$use(async (params, next) => {
  const start = performance.now();
  
  try {
    const result = await next(params);
    const duration = performance.now() - start;
    
    logger.debug('Database query completed', {
      model: params.model,
      action: params.action,
      duration: Math.round(duration),
      args: process.env.NODE_ENV === 'development' ? params.args : undefined,
    });
    
    if (duration > 100) {
      logger.warn('Slow query detected', {
        model: params.model,
        action: params.action,
        duration: Math.round(duration),
        threshold: 100,
      });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    logger.error('Database query failed', {
      model: params.model,
      action: params.action,
      duration: Math.round(duration),
      error: error.message,
    });
    
    throw error;
  }
});
```

### Cache Operation Logging
```typescript
class CacheLogger {
  async get(key: string): Promise<any> {
    const start = performance.now();
    
    try {
      const value = await redis.get(key);
      const duration = performance.now() - start;
      const hit = value !== null;
      
      logger.debug('Cache operation', {
        operation: 'get',
        key,
        hit,
        duration: Math.round(duration),
      });
      
      return value;
    } catch (error) {
      logger.error('Cache operation failed', {
        operation: 'get',
        key,
        error: error.message,
      });
      throw error;
    }
  }
}
```

## Error Logging Best Practices

### Comprehensive Error Context
```typescript
try {
  await performOperation();
} catch (error) {
  logger.error('Operation failed', {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
      type: error.constructor.name,
    },
    operation: 'performOperation',
    input: sanitizeInput(input),
    user: getCurrentUser(),
    context: {
      retryCount,
      lastSuccess: lastSuccessTime,
      relatedErrors: getRelatedErrors(),
    },
  });
}
```

### Error Sanitization
```typescript
function sanitizeError(error: any): any {
  const sanitized = {
    message: error.message,
    type: error.constructor.name,
    code: error.code,
  };
  
  // Don't log sensitive data
  if (error.stack && process.env.NODE_ENV !== 'production') {
    sanitized.stack = error.stack
      .replace(/password=([^&\s]+)/gi, 'password=***')
      .replace(/token=([^&\s]+)/gi, 'token=***')
      .replace(/key=([^&\s]+)/gi, 'key=***');
  }
  
  return sanitized;
}
```

## Log Aggregation Patterns

### Correlation IDs
```typescript
// Generate correlation ID at entry point
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || generateId();
  res.setHeader('x-correlation-id', req.correlationId);
  
  // Make available to all loggers
  asyncLocalStorage.run({ correlationId: req.correlationId }, next);
});

// Use in logs
logger.info('Processing request', {
  correlationId: asyncLocalStorage.getStore().correlationId,
  step: 'validation',
});
```

### Trace Context
```typescript
interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  flags: number;
}

class TracedLogger {
  private getTraceContext(): TraceContext {
    return asyncLocalStorage.getStore()?.traceContext || {
      traceId: generateTraceId(),
      spanId: generateSpanId(),
      flags: 1,
    };
  }
  
  log(level: string, message: string, context?: any) {
    const trace = this.getTraceContext();
    
    console.log(JSON.stringify({
      level,
      message,
      ...trace,
      context,
      timestamp: new Date().toISOString(),
    }));
  }
}
```

## Log Queries for Common Issues

### Find Slow Requests
```
level="INFO" AND component="API" AND duration > 1000
| stats count by path
| sort count desc
```

### Error Rate by Component
```
level="ERROR"
| stats count by component, _time span=5m
| timechart count by component
```

### Cache Performance
```
component="Cache" AND operation="get"
| stats avg(duration), count by hit
| eval hit_rate = if(hit="true", count, 0) / count * 100
```

### Database Query Performance
```
component="Database" AND duration > 100
| stats count, avg(duration), max(duration) by model, action
| sort avg(duration) desc
```

## Log Retention Policy

| Log Level | Retention Period | Storage Location |
|-----------|-----------------|------------------|
| ERROR | 90 days | Hot storage |
| WARN | 30 days | Hot storage |
| INFO | 7 days | Warm storage |
| DEBUG | 24 hours | Cold storage |

## Security Considerations

### Never Log
- Passwords
- API keys
- Credit card numbers
- Personal identification numbers
- Session tokens
- Private keys

### Always Sanitize
```typescript
function sanitizeLogData(data: any): any {
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'credit_card'];
  
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const sanitized = { ...data };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }
  
  return sanitized;
}
```

## Development vs Production

### Development Logging
```typescript
if (process.env.NODE_ENV === 'development') {
  // More verbose logging
  logger.setLevel('DEBUG');
  
  // Pretty print for readability
  logger.setPrettyPrint(true);
  
  // Include stack traces
  logger.includeStackTraces(true);
}
```

### Production Logging
```typescript
if (process.env.NODE_ENV === 'production') {
  // Only important logs
  logger.setLevel('INFO');
  
  // JSON format for parsing
  logger.setPrettyPrint(false);
  
  // Minimal stack traces
  logger.includeStackTraces(false);
  
  // Send to centralized logging
  logger.addTransport(new CloudWatchTransport());
}
```

---
*Last Updated: 2025-08-01*
*These standards ensure consistent, useful, and secure logging across all optimization efforts.*