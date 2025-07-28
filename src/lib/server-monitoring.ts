// Server monitoring middleware for capturing logs during tests
import { NextRequest, NextResponse } from 'next/server';

// Global log store for test environments
interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  data?: any;
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
}

class ServerMonitor {
  private logs: LogEntry[] = [];
  private isTestEnvironment: boolean;

  constructor() {
    this.isTestEnvironment = process.env.NODE_ENV === 'test' || 
                             process.env.PLAYWRIGHT_TEST === 'true' ||
                             process.env.CI === 'true';
  }

  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date()
    };
    
    this.logs.push(logEntry);
    
    // In test environment, also log to console for Playwright capture
    if (this.isTestEnvironment) {
      const icon = this.getLogIcon(entry.level, entry.source);
      console.log(`${icon} [SERVER] ${entry.level.toUpperCase()} [${entry.source}]: ${entry.message}`);
      
      if (entry.data) {
        console.log('   📊 Data:', JSON.stringify(entry.data, null, 2));
      }
    }
  }

  private getLogIcon(level: string, source: string): string {
    const sourceIcons: Record<string, string> = {
      api: '🌐',
      middleware: '🔀',
      database: '🗄️',
      redis: '⚡',
      auth: '🔐',
      file: '📁',
      email: '📧'
    };
    
    const levelIcons: Record<string, string> = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🐛'
    };
    
    return `${sourceIcons[source] || '📝'} ${levelIcons[level] || '💬'}`;
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  // API middleware wrapper
  wrapAPIHandler(handler: Function) {
    return async (req: NextRequest, ...args: any[]) => {
      const startTime = Date.now();
      const requestId = req.headers.get('x-request-id') || Math.random().toString(36);
      
      this.log({
        level: 'info',
        source: 'api',
        message: `Incoming ${req.method} ${req.url}`,
        requestId,
        endpoint: req.url,
        method: req.method
      });

      try {
        const response = await handler(req, ...args);
        const duration = Date.now() - startTime;
        
        this.log({
          level: response.status >= 400 ? 'error' : 'info',
          source: 'api',
          message: `${req.method} ${req.url} - ${response.status} (${duration}ms)`,
          requestId,
          endpoint: req.url,
          method: req.method,
          statusCode: response.status,
          duration
        });

        return response;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        
        this.log({
          level: 'error',
          source: 'api',
          message: `${req.method} ${req.url} - Error: ${error.message} (${duration}ms)`,
          requestId,
          endpoint: req.url,
          method: req.method,
          duration,
          data: {
            error: error.message,
            stack: error.stack
          }
        });

        throw error;
      }
    };
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, query?: string, duration?: number, error?: Error): void {
    this.log({
      level: error ? 'error' : 'info',
      source: 'database',
      message: `${operation} on ${table}${duration ? ` (${duration}ms)` : ''}${error ? ` - Error: ${error.message}` : ''}`,
      duration,
      data: {
        operation,
        table,
        query: query?.substring(0, 200), // Truncate long queries
        error: error ? {
          message: error.message,
          stack: error.stack
        } : undefined
      }
    });
  }

  // Redis operation logging
  logRedisOperation(command: string, key: string, duration?: number, error?: Error): void {
    this.log({
      level: error ? 'error' : 'info',
      source: 'redis',
      message: `Redis ${command} ${key}${duration ? ` (${duration}ms)` : ''}${error ? ` - Error: ${error.message}` : ''}`,
      duration,
      data: {
        command,
        key,
        error: error ? error.message : undefined
      }
    });
  }

  // Authentication logging
  logAuthOperation(operation: string, userId?: string, email?: string, error?: Error): void {
    this.log({
      level: error ? 'error' : 'info',
      source: 'auth',
      message: `Auth ${operation}${userId ? ` for user ${userId}` : ''}${email ? ` (${email})` : ''}${error ? ` - Error: ${error.message}` : ''}`,
      userId,
      data: {
        operation,
        userId,
        email,
        error: error ? error.message : undefined
      }
    });
  }

  // File operation logging
  logFileOperation(operation: string, filepath: string, size?: number, error?: Error): void {
    this.log({
      level: error ? 'error' : 'info',
      source: 'file',
      message: `File ${operation}: ${filepath}${size ? ` (${size} bytes)` : ''}${error ? ` - Error: ${error.message}` : ''}`,
      data: {
        operation,
        filepath,
        size,
        error: error ? error.message : undefined
      }
    });
  }

  // Email operation logging
  logEmailOperation(operation: string, to?: string, subject?: string, error?: Error): void {
    this.log({
      level: error ? 'error' : 'info',
      source: 'email',
      message: `Email ${operation}${to ? ` to ${to}` : ''}${subject ? ` - "${subject}"` : ''}${error ? ` - Error: ${error.message}` : ''}`,
      data: {
        operation,
        to,
        subject,
        error: error ? error.message : undefined
      }
    });
  }

  // Generate comprehensive server report
  generateReport(): string {
    if (this.logs.length === 0) {
      return '🖥️ No server activity captured.';
    }

    const apiLogs = this.logs.filter(log => log.source === 'api');
    const dbLogs = this.logs.filter(log => log.source === 'database');
    const redisLogs = this.logs.filter(log => log.source === 'redis');
    const authLogs = this.logs.filter(log => log.source === 'auth');
    const errors = this.logs.filter(log => log.level === 'error');
    const warnings = this.logs.filter(log => log.level === 'warn');

    let report = '🖥️ SERVER ACTIVITY REPORT\n';
    report += '=' + '='.repeat(60) + '\n\n';
    
    report += `📊 SUMMARY:\n`;
    report += `   Total Operations: ${this.logs.length}\n`;
    report += `   API Requests: ${apiLogs.length}\n`;
    report += `   Database Operations: ${dbLogs.length}\n`;
    report += `   Redis Operations: ${redisLogs.length}\n`;
    report += `   Auth Operations: ${authLogs.length}\n`;
    report += `   Errors: ${errors.length}\n`;
    report += `   Warnings: ${warnings.length}\n\n`;

    if (errors.length > 0) {
      report += `❌ ERRORS (${errors.length}):\n`;
      errors.forEach((error, index) => {
        report += `   ${index + 1}. [${error.source}] ${error.message}\n`;
      });
      report += '\n';
    }

    if (apiLogs.length > 0) {
      const statusCodes = new Map<number, number>();
      const methods = new Map<string, number>();
      
      apiLogs.forEach(log => {
        if (log.statusCode) {
          statusCodes.set(log.statusCode, (statusCodes.get(log.statusCode) || 0) + 1);
        }
        if (log.method) {
          methods.set(log.method, (methods.get(log.method) || 0) + 1);
        }
      });

      report += `🌐 API SUMMARY:\n`;
      report += `   Status Codes: `;
      Array.from(statusCodes.entries())
        .sort((a, b) => a[0] - b[0])
        .forEach(([code, count]) => {
          report += `${code}(${count}) `;
        });
      report += '\n';
      
      report += `   Methods: `;
      Array.from(methods.entries())
        .forEach(([method, count]) => {
          report += `${method}(${count}) `;
        });
      report += '\n\n';
    }

    // Performance analysis
    const slowOps = this.logs.filter(log => log.duration && log.duration > 1000);
    if (slowOps.length > 0) {
      report += `🐌 SLOW OPERATIONS (>1s):\n`;
      slowOps.forEach((op, index) => {
        report += `   ${index + 1}. [${op.source}] ${op.message}\n`;
      });
      report += '\n';
    }

    return report;
  }
}

// Global instance
export const serverMonitor = new ServerMonitor();

// Helper function to wrap API handlers
export function withServerMonitoring<T extends Function>(handler: T): T {
  return serverMonitor.wrapAPIHandler(handler) as unknown as T;
}

// Export types
export type { LogEntry };