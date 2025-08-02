/**
 * OptimizationLogger - Comprehensive logging utility for performance optimization
 * Based on the template from Optimising_Doc/Templates/logging-utility.ts
 */

// Use Date.now() for compatibility as performance.now() may not be available in all Node.js environments
const getTimestamp = () => Date.now();

export interface LogEntry {
  timestamp: Date;
  phase: string;
  issueId: string;
  level: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'DEBUG';
  message: string;
  data?: any;
  duration?: number;
}

export interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  details?: any;
}

export class OptimizationLogger {
  private issueId: string;
  private phase: string;
  private logs: LogEntry[] = [];
  private activeOperations: Map<string, PerformanceMetric> = new Map();
  private performanceMetrics: PerformanceMetric[] = [];

  constructor(issueId: string, phase: string) {
    this.issueId = issueId;
    this.phase = phase;
    this.log('INFO', `Logger initialized for ${phase} phase, tracking issue: ${issueId}`);
  }

  /**
   * Log a general message
   */
  log(level: LogEntry['level'], message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      phase: this.phase,
      issueId: this.issueId,
      level,
      message,
      data
    };

    this.logs.push(entry);
    this.printLog(entry);
  }

  /**
   * Log an issue or problem
   */
  logIssue(severity: 'WARNING' | 'ERROR' | 'CRITICAL', description: string, details?: any): void {
    this.log(severity, `ISSUE: ${description}`, details);
    
    // For critical issues, also write to error tracking
    if (severity === 'CRITICAL') {
      console.error(`[CRITICAL ISSUE] ${this.issueId}: ${description}`, details);
    }
  }

  /**
   * Start tracking an operation
   */
  startOperation(operationName: string): void {
    const metric: PerformanceMetric = {
      operation: operationName,
      startTime: getTimestamp()
    };
    
    this.activeOperations.set(operationName, metric);
    this.log('DEBUG', `Started operation: ${operationName}`);
  }

  /**
   * End tracking an operation
   */
  endOperation(operationName: string, success: boolean, details?: any): void {
    const metric = this.activeOperations.get(operationName);
    
    if (!metric) {
      this.log('WARNING', `Attempted to end untracked operation: ${operationName}`);
      return;
    }

    metric.endTime = getTimestamp();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    metric.details = details;

    this.performanceMetrics.push(metric);
    this.activeOperations.delete(operationName);

    this.log(
      success ? 'INFO' : 'ERROR',
      `Completed operation: ${operationName} in ${metric.duration.toFixed(2)}ms`,
      { duration: metric.duration, success, details }
    );
  }

  /**
   * Measure async operation performance
   */
  async measureAsyncPerformance<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    this.startOperation(operationName);
    
    try {
      const result = await operation();
      this.endOperation(operationName, true, { resultType: typeof result });
      return result;
    } catch (error) {
      this.endOperation(operationName, false, { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
  } {
    const successful = this.performanceMetrics.filter(m => m.success);
    const failed = this.performanceMetrics.filter(m => !m.success);
    
    const averageDuration = this.performanceMetrics.length > 0
      ? this.performanceMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / this.performanceMetrics.length
      : 0;

    const slowest = this.performanceMetrics.reduce((slowest, current) => {
      if (!slowest || (current.duration || 0) > (slowest.duration || 0)) {
        return current;
      }
      return slowest;
    }, null as PerformanceMetric | null);

    return {
      totalOperations: this.performanceMetrics.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      averageDuration,
      slowestOperation: slowest
    };
  }

  /**
   * Export logs for analysis
   */
  exportLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Export performance metrics
   */
  exportMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics];
  }

  /**
   * Clear all logs and metrics
   */
  clear(): void {
    this.logs = [];
    this.performanceMetrics = [];
    this.activeOperations.clear();
  }

  /**
   * Print log entry to console
   */
  private printLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const prefix = `[${timestamp}] [${entry.phase}] [${entry.issueId}] [${entry.level}]`;
    
    switch (entry.level) {
      case 'ERROR':
      case 'CRITICAL':
        console.error(prefix, entry.message, entry.data || '');
        break;
      case 'WARNING':
        console.warn(prefix, entry.message, entry.data || '');
        break;
      case 'DEBUG':
        if (process.env.NODE_ENV === 'development') {
          console.debug(prefix, entry.message, entry.data || '');
        }
        break;
      default:
        console.log(prefix, entry.message, entry.data || '');
    }
  }

  // Convenience methods for optimized auth
  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  error(message: string, error?: any): void {
    this.log('ERROR', message, error);
  }

  performance(operation: string, duration: number, cached: boolean = false): void {
    this.log('INFO', `${operation}: ${duration}ms${cached ? ' (CACHED)' : ' (COMPUTED)'}`, { duration, cached });
  }

  /**
   * Generate detailed performance report
   */
  generateReport(): string {
    const summary = this.getPerformanceSummary();
    const criticalLogs = this.logs.filter(log => log.level === 'CRITICAL' || log.level === 'ERROR');

    return `
Performance Optimization Report
==============================
Issue ID: ${this.issueId}
Phase: ${this.phase}
Generated: ${new Date().toISOString()}

Performance Summary:
- Total Operations: ${summary.totalOperations}
- Successful: ${summary.successfulOperations}
- Failed: ${summary.failedOperations}
- Average Duration: ${summary.averageDuration.toFixed(2)}ms
${summary.slowestOperation ? `- Slowest Operation: ${summary.slowestOperation.operation} (${summary.slowestOperation.duration?.toFixed(2)}ms)` : ''}

Critical Issues (${criticalLogs.length}):
${criticalLogs.map(log => `- [${log.level}] ${log.message}`).join('\n') || 'None'}

Top 5 Slowest Operations:
${this.performanceMetrics
  .sort((a, b) => (b.duration || 0) - (a.duration || 0))
  .slice(0, 5)
  .map((m, i) => `${i + 1}. ${m.operation}: ${m.duration?.toFixed(2)}ms`)
  .join('\n')}
`;
  }
}

// Export a singleton factory for common use cases
export function createOptimizationLogger(issueId: string, phase: string): OptimizationLogger {
  return new OptimizationLogger(issueId, phase);
}