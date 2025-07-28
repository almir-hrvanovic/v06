#!/usr/bin/env ts-node

import { spawn, ChildProcess } from 'child_process';
import { WebSocket } from 'ws';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  source: 'server' | 'browser' | 'build';
  message: string;
  stack?: string;
  file?: string;
  line?: number;
}

interface AutofixConfig {
  enabled: boolean;
  devServerPort: number;
  browserPort: number;
  logFile: string;
  fixThreshold: number; // Number of similar errors before attempting autofix
  fixCooldown: number; // Minutes to wait before attempting same fix again
}

class AutofixEnvironment {
  private devServer: ChildProcess | null = null;
  private browserWs: WebSocket | null = null;
  private logs: LogEntry[] = [];
  private config: AutofixConfig;
  private errorCounts: Map<string, number> = new Map();
  private lastFixAttempts: Map<string, number> = new Map();

  constructor() {
    this.config = {
      enabled: true,
      devServerPort: 3000,
      browserPort: 3001,
      logFile: './logs/autofix.log',
      fixThreshold: 3,
      fixCooldown: 10
    };

    this.loadConfig();
    this.setupSignalHandlers();
  }

  private loadConfig() {
    const configPath = './.claude/autofix-config.json';
    if (existsSync(configPath)) {
      try {
        const configData = readFileSync(configPath, 'utf8');
        this.config = { ...this.config, ...JSON.parse(configData) };
      } catch (error) {
        console.warn('Failed to load autofix config, using defaults');
      }
    }
  }

  private setupSignalHandlers() {
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async start() {
    console.log('🚀 Starting Autofix Environment...');
    
    await this.startDevServer();
    await this.connectBrowserMonitoring();
    await this.startLogMonitoring();
    
    console.log('✅ Autofix Environment ready!');
    console.log(`📊 Dashboard: http://localhost:${this.config.browserPort}/autofix-dashboard`);
  }

  private async startDevServer() {
    console.log('🔧 Starting development server...');
    
    this.devServer = spawn('npm', ['run', 'dev'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });

    this.devServer.stdout?.on('data', (data) => {
      this.processServerLog(data.toString(), 'info');
    });

    this.devServer.stderr?.on('data', (data) => {
      this.processServerLog(data.toString(), 'error');
    });

    // Wait for server to be ready
    await new Promise((resolve) => {
      const checkServer = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:${this.config.devServerPort}/api/health`);
          if (response.ok) {
            clearInterval(checkServer);
            resolve(true);
          }
        } catch (error) {
          // Server not ready yet
        }
      }, 1000);
    });
  }

  private async connectBrowserMonitoring() {
    console.log('🌐 Connecting browser monitoring...');
    
    // This would connect to the Browser Tools MCP server
    // For now, we'll simulate browser console monitoring
    this.setupBrowserConsoleCapture();
  }

  private setupBrowserConsoleCapture() {
    // Simulate browser console monitoring
    // In a real implementation, this would use the MCP server
    setInterval(() => {
      // Check for browser console errors via MCP
      this.simulateBrowserConsoleCheck();
    }, 5000);
  }

  private simulateBrowserConsoleCheck() {
    // This is a placeholder - real implementation would use MCP server
    // to capture actual browser console logs
    const browserErrors = [
      'TypeError: Cannot read property of undefined',
      'ReferenceError: variable is not defined',
      'Network request failed: 404',
      'React hydration mismatch'
    ];

    // Randomly simulate errors for testing
    if (Math.random() < 0.1) {
      const error = browserErrors[Math.floor(Math.random() * browserErrors.length)];
      this.logError({
        timestamp: new Date().toISOString(),
        level: 'error',
        source: 'browser',
        message: error,
        file: 'app/page.tsx',
        line: Math.floor(Math.random() * 100) + 1
      });
    }
  }

  private processServerLog(data: string, level: 'info' | 'error') {
    const lines = data.split('\\n').filter(line => line.trim());
    
    for (const line of lines) {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        source: 'server',
        message: line.trim()
      };

      // Parse error details if available
      if (level === 'error') {
        const fileMatch = line.match(/\\s+at\\s+.*\\((.+):(\\d+):(\\d+)\\)/);
        if (fileMatch) {
          logEntry.file = fileMatch[1];
          logEntry.line = parseInt(fileMatch[2]);
        }
      }

      this.logError(logEntry);
    }
  }

  private logError(entry: LogEntry) {
    this.logs.push(entry);
    
    // Write to log file
    const logLine = `${entry.timestamp} [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}\\n`;
    writeFileSync(this.config.logFile, logLine, { flag: 'a' });

    // Console output with color
    const color = entry.level === 'error' ? '\\x1b[31m' : entry.level === 'warn' ? '\\x1b[33m' : '\\x1b[37m';
    console.log(`${color}[${entry.source.toUpperCase()}] ${entry.message}\\x1b[0m`);

    // Check if we should attempt autofix
    if (entry.level === 'error' && this.config.enabled) {
      this.considerAutofix(entry);
    }
  }

  private considerAutofix(entry: LogEntry) {
    const errorKey = this.getErrorKey(entry);
    const currentCount = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, currentCount);

    const lastAttempt = this.lastFixAttempts.get(errorKey) || 0;
    const cooldownExpired = Date.now() - lastAttempt > (this.config.fixCooldown * 60 * 1000);

    if (currentCount >= this.config.fixThreshold && cooldownExpired) {
      this.attemptAutofix(entry, errorKey);
    }
  }

  private getErrorKey(entry: LogEntry): string {
    // Create a unique key for the error type
    const fileInfo = entry.file ? `${entry.file}:${entry.line}` : 'unknown';
    return `${entry.source}:${fileInfo}:${entry.message.substring(0, 50)}`;
  }

  private async attemptAutofix(entry: LogEntry, errorKey: string) {
    console.log(`🔨 Attempting autofix for: ${entry.message}`);
    this.lastFixAttempts.set(errorKey, Date.now());

    // Create a detailed error report for Claude Code
    const errorReport = {
      error: entry,
      frequency: this.errorCounts.get(errorKey),
      context: this.getErrorContext(entry),
      suggestedFixes: this.generateFixSuggestions(entry)
    };

    // Write error report for Claude Code to process
    const reportPath = `./logs/autofix-report-${Date.now()}.json`;
    writeFileSync(reportPath, JSON.stringify(errorReport, null, 2));

    console.log(`📋 Error report generated: ${reportPath}`);
    console.log('💡 Ready for Claude Code to process the fix');
  }

  private getErrorContext(entry: LogEntry): any {
    // Gather context around the error
    return {
      recentLogs: this.logs.slice(-10),
      errorFrequency: this.errorCounts.get(this.getErrorKey(entry)),
      timestamp: entry.timestamp,
      environment: 'development'
    };
  }

  private generateFixSuggestions(entry: LogEntry): string[] {
    const suggestions: string[] = [];

    // Basic fix suggestions based on error patterns
    if (entry.message.includes('Cannot read property')) {
      suggestions.push('Add null/undefined checks');
      suggestions.push('Use optional chaining (?.)');
    }

    if (entry.message.includes('is not defined')) {
      suggestions.push('Check import statements');
      suggestions.push('Verify variable declarations');
    }

    if (entry.message.includes('404')) {
      suggestions.push('Check API endpoint exists');
      suggestions.push('Verify URL routing');
    }

    if (entry.message.includes('hydration')) {
      suggestions.push('Check server/client rendering differences');
      suggestions.push('Use suppressHydrationWarning cautiously');
    }

    return suggestions;
  }

  private async startLogMonitoring() {
    console.log('📊 Starting log monitoring dashboard...');
    
    // Create a simple HTTP server for the autofix dashboard
    const express = require('express');
    const app = express();

    app.get('/autofix-dashboard', (req: any, res: any) => {
      const html = this.generateDashboardHTML();
      res.send(html);
    });

    app.get('/api/logs', (req: any, res: any) => {
      res.json({
        logs: this.logs.slice(-50), // Last 50 logs
        errorCounts: Object.fromEntries(this.errorCounts),
        config: this.config
      });
    });

    app.listen(this.config.browserPort, () => {
      console.log(`📊 Autofix dashboard running on port ${this.config.browserPort}`);
    });
  }

  private generateDashboardHTML(): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Autofix Environment Dashboard</title>
        <style>
            body { font-family: monospace; background: #1a1a1a; color: #e0e0e0; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .stat { background: #2a2a2a; padding: 15px; border-radius: 5px; border-left: 4px solid #00ff00; }
            .logs { background: #2a2a2a; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto; }
            .log-entry { margin: 5px 0; padding: 5px; border-radius: 3px; }
            .error { background: #3a1a1a; border-left: 3px solid #ff4444; }
            .warn { background: #3a3a1a; border-left: 3px solid #ffff44; }
            .info { background: #1a1a3a; border-left: 3px solid #4444ff; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔧 Autofix Environment Dashboard</h1>
            <p>Real-time monitoring of dev server and browser console</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <h3>Total Logs</h3>
                <div>${this.logs.length}</div>
            </div>
            <div class="stat">
                <h3>Error Types</h3>
                <div>${this.errorCounts.size}</div>
            </div>
            <div class="stat">
                <h3>Fix Attempts</h3>
                <div>${this.lastFixAttempts.size}</div>
            </div>
            <div class="stat">
                <h3>Status</h3>
                <div style="color: #00ff00;">Active</div>
            </div>
        </div>

        <div class="logs">
            <h3>Recent Logs</h3>
            <div id="log-container">
                ${this.logs.slice(-10).map(log => `
                    <div class="log-entry ${log.level}">
                        <strong>[${log.source.toUpperCase()}]</strong> 
                        <span style="color: #888;">${new Date(log.timestamp).toLocaleTimeString()}</span>
                        <br>${log.message}
                    </div>
                `).join('')}
            </div>
        </div>

        <script>
            // Auto-refresh every 5 seconds
            setInterval(() => {
                fetch('/api/logs')
                    .then(r => r.json())
                    .then(data => {
                        // Update dashboard with new data
                        location.reload();
                    });
            }, 5000);
        </script>
    </body>
    </html>
    `;
  }

  private shutdown() {
    console.log('🔄 Shutting down autofix environment...');
    
    if (this.devServer) {
      this.devServer.kill();
    }
    
    if (this.browserWs) {
      this.browserWs.close();
    }
    
    console.log('✅ Autofix environment stopped');
    process.exit(0);
  }
}

// Start the autofix environment
if (require.main === module) {
  const autofix = new AutofixEnvironment();
  autofix.start().catch(console.error);
}

export default AutofixEnvironment;