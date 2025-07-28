// Browser Console Monitor for Claude Code
// This captures console logs, errors, and other browser data

export interface ConsoleData {
  type: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  stack?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  userAgent?: string;
  extra?: any;
}

export class ConsoleMonitor {
  private buffer: ConsoleData[] = [];
  private maxBufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private intervalId: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor() {
    this.setupConsoleInterceptors();
    this.setupErrorHandlers();
    this.startAutoFlush();
  }

  private setupConsoleInterceptors() {
    // Store original console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;
    const originalDebug = console.debug;

    // Override console methods
    console.log = (...args) => {
      this.capture('log', args);
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      this.capture('error', args);
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      this.capture('warn', args);
      originalWarn.apply(console, args);
    };

    console.info = (...args) => {
      this.capture('info', args);
      originalInfo.apply(console, args);
    };

    console.debug = (...args) => {
      this.capture('debug', args);
      originalDebug.apply(console, args);
    };
  }

  private setupErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(event.error || event.message, event);
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, event);
    });
  }

  private capture(type: ConsoleData['type'], args: any[]) {
    const data: ConsoleData = {
      type,
      message: args.map(arg => this.stringify(arg)).join(' '),
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.addToBuffer(data);
  }

  private captureError(error: any, event?: ErrorEvent | PromiseRejectionEvent) {
    const data: ConsoleData = {
      type: 'error',
      message: error?.message || String(error),
      timestamp: new Date(),
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    if (event && 'lineno' in event) {
      data.lineNumber = event.lineno;
      data.columnNumber = event.colno;
    }

    this.addToBuffer(data);
  }

  private stringify(obj: any): string {
    try {
      if (obj === null) return 'null';
      if (obj === undefined) return 'undefined';
      if (typeof obj === 'string') return obj;
      if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
      if (obj instanceof Error) {
        return `${obj.name}: ${obj.message}${obj.stack ? '\n' + obj.stack : ''}`;
      }
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return '[Unable to stringify object]';
    }
  }

  private addToBuffer(data: ConsoleData) {
    this.buffer.push(data);
    
    // Keep buffer size in check
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    // Flush immediately for errors
    if (data.type === 'error') {
      this.flush();
    }
  }

  private startAutoFlush() {
    this.intervalId = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const dataToSend = [...this.buffer];
    this.buffer = [];

    try {
      // Send to Claude Code via file write
      await this.sendToClaude(dataToSend);
    } catch (error) {
      console.error('Failed to send console data to Claude:', error);
      // Re-add failed data to buffer
      this.buffer.unshift(...dataToSend);
    }
  }

  private async sendToClaude(data: ConsoleData[]) {
    // Write to a file that Claude can read
    const timestamp = new Date().toISOString();
    const filename = `console-log-${timestamp}.json`;
    
    // Send to API endpoint that writes to file
    await fetch('/api/console-monitor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename,
        data,
        timestamp
      })
    });
  }

  public destroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.flush();
  }

  // Manual methods
  public getBuffer(): ConsoleData[] {
    return [...this.buffer];
  }

  public clearBuffer() {
    this.buffer = [];
  }

  public forceFlush() {
    this.flush();
  }
}

// Auto-initialize when imported
let monitor: ConsoleMonitor | null = null;

export async function initializeConsoleMonitor() {
  if (typeof window !== 'undefined' && !monitor) {
    // Check if monitoring is active
    try {
      const response = await fetch('/api/console-monitor/status');
      const data = await response.json();
      
      if (data.active) {
        monitor = new ConsoleMonitor();
        console.log('🔍 Console Monitor active - capturing all output for Claude Code');
      }
    } catch (error) {
      console.error('Failed to check monitoring status:', error);
    }
  }
  return monitor;
}

export function getConsoleMonitor() {
  return monitor;
}