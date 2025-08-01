// Templates/logging-utility.ts
import * as fs from 'fs';
import * as path from 'path';

export class OptimizationLogger {
  private issueId: string;
  private logFile: string;
  private phase: string;

  constructor(issueId: string, phase: string) {
    this.issueId = issueId;
    this.phase = phase;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(
      __dirname,
      `../${this.getPhaseFolder()}/detailed-logs/${timestamp}-${issueId}.log`
    );
    this.ensureLogDirectory();
  }

  private getPhaseFolder(): string {
    const phaseMap: Record<string, string> = {
      'foundation': '00-Foundation',
      'quick-wins': '01-Quick-Wins',
      'database': '02-Database-Optimization',
      'frontend': '03-Frontend-Optimization',
      'backend': '04-Backend-Optimization',
      'infrastructure': '05-Infrastructure-Scaling'
    };
    return phaseMap[this.phase] || '00-Foundation';
  }

  private ensureLogDirectory(): void {
    const dir = path.dirname(this.logFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  log(level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR', message: string, data?: any): void {
    const entry = {
      timestamp: new Date().toISOString(),
      issueId: this.issueId,
      phase: this.phase,
      level,
      message,
      data,
      stack: level === 'ERROR' ? new Error().stack : undefined,
      context: {
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    // Write to file
    fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
    
    // Also write to master log
    const masterLog = path.join(__dirname, '../Issues/debug-logs/master.log');
    fs.appendFileSync(masterLog, JSON.stringify(entry) + '\n');
    
    // Console output
    console.log(`[${this.issueId}] ${level}: ${message}`, data || '');
  }

  startOperation(operationName: string): void {
    this.log('INFO', `Starting operation: ${operationName}`, {
      operation: operationName,
      startTime: new Date().toISOString()
    });
  }

  endOperation(operationName: string, success: boolean, details?: any): void {
    this.log(
      success ? 'INFO' : 'ERROR',
      `Operation ${operationName} ${success ? 'completed' : 'failed'}`,
      {
        operation: operationName,
        success,
        endTime: new Date().toISOString(),
        details
      }
    );
  }

  // Performance tracking methods
  measurePerformance<T>(operationName: string, operation: () => T): T {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = operation();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      this.log('INFO', `Performance metrics for ${operationName}`, {
        duration: endTime - startTime,
        memoryDelta: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external
        }
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.log('ERROR', `Performance measurement failed for ${operationName}`, {
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async measureAsyncPerformance<T>(operationName: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      this.log('INFO', `Async performance metrics for ${operationName}`, {
        duration: endTime - startTime,
        memoryDelta: {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external
        }
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.log('ERROR', `Async performance measurement failed for ${operationName}`, {
        duration: endTime - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Issue tracking integration
  logIssue(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', description: string, details?: any): void {
    const issueEntry = {
      id: `${this.phase}-${this.issueId}-${Date.now()}`,
      severity,
      description,
      details,
      timestamp: new Date().toISOString(),
      phase: this.phase
    };

    // Log to issue tracking
    const issueLog = path.join(__dirname, '../Issues/MASTER-ISSUE-LOG.json');
    let issues = [];
    
    try {
      if (fs.existsSync(issueLog)) {
        issues = JSON.parse(fs.readFileSync(issueLog, 'utf8'));
      }
    } catch (error) {
      this.log('ERROR', 'Failed to read issue log', { error });
    }

    issues.push(issueEntry);
    fs.writeFileSync(issueLog, JSON.stringify(issues, null, 2));
    
    this.log('WARN', `Issue logged: ${description}`, issueEntry);
  }

  // Checkpoint system for long operations
  checkpoint(name: string, data?: any): void {
    this.log('INFO', `Checkpoint: ${name}`, {
      checkpoint: name,
      data,
      timestamp: new Date().toISOString()
    });
  }

  // Summary report generation
  generateSummary(): void {
    const summaryPath = path.join(
      __dirname,
      `../${this.getPhaseFolder()}/detailed-logs/${this.issueId}-summary.json`
    );
    
    try {
      const logContent = fs.readFileSync(this.logFile, 'utf8');
      const entries = logContent.split('\n').filter(line => line).map(line => JSON.parse(line));
      
      const summary = {
        issueId: this.issueId,
        phase: this.phase,
        startTime: entries[0]?.timestamp,
        endTime: entries[entries.length - 1]?.timestamp,
        totalEntries: entries.length,
        errorCount: entries.filter(e => e.level === 'ERROR').length,
        warnCount: entries.filter(e => e.level === 'WARN').length,
        operations: entries.filter(e => e.message.includes('operation')).map(e => ({
          name: e.data?.operation,
          success: e.data?.success,
          duration: e.data?.duration
        }))
      };
      
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      this.log('INFO', 'Summary report generated', { path: summaryPath });
    } catch (error) {
      this.log('ERROR', 'Failed to generate summary', { error });
    }
  }
}

// Export helper function for quick logging
export function createLogger(issueId: string, phase: string): OptimizationLogger {
  return new OptimizationLogger(issueId, phase);
}