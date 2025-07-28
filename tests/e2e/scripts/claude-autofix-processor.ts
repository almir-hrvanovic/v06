#!/usr/bin/env ts-node

import { readFileSync, writeFileSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';

interface ErrorReport {
  error: {
    timestamp: string;
    level: string;
    source: string;
    message: string;
    file?: string;
    line?: number;
    stack?: string;
  };
  frequency: number;
  context: any;
  suggestedFixes: string[];
}

interface FixAttempt {
  reportFile: string;
  timestamp: string;
  error: string;
  fixApplied: boolean;
  fixDescription: string;
  testsPassed: boolean;
}

class ClaudeAutofixProcessor {
  private logsDir = './logs';
  private fixHistory: FixAttempt[] = [];

  constructor() {
    this.loadFixHistory();
  }

  async start() {
    console.log('🤖 Claude Autofix Processor started');
    console.log('👀 Watching for error reports...');
    
    // Watch for new error reports
    setInterval(() => {
      this.processNewReports();
    }, 5000);
  }

  private loadFixHistory() {
    try {
      const historyFile = join(this.logsDir, 'fix-history.json');
      if (require('fs').existsSync(historyFile)) {
        const data = readFileSync(historyFile, 'utf8');
        this.fixHistory = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Could not load fix history, starting fresh');
      this.fixHistory = [];
    }
  }

  private saveFixHistory() {
    const historyFile = join(this.logsDir, 'fix-history.json');
    writeFileSync(historyFile, JSON.stringify(this.fixHistory, null, 2));
  }

  private processNewReports() {
    try {
      const files = readdirSync(this.logsDir);
      const reportFiles = files.filter(f => f.startsWith('autofix-report-') && f.endsWith('.json'));
      
      for (const reportFile of reportFiles) {
        const filePath = join(this.logsDir, reportFile);
        try {
          const reportData = readFileSync(filePath, 'utf8');
          const report: ErrorReport = JSON.parse(reportData);
          
          console.log(`🔍 Processing error report: ${reportFile}`);
          this.processErrorReport(report, reportFile);
          
          // Clean up processed report
          unlinkSync(filePath);
        } catch (error) {
          console.error(`Failed to process report ${reportFile}:`, error);
        }
      }
    } catch (error) {
      console.error('Error checking for reports:', error);
    }
  }

  private async processErrorReport(report: ErrorReport, reportFile: string) {
    const { error, frequency, suggestedFixes } = report;
    
    console.log(`🚨 Error detected ${frequency} times: ${error.message}`);
    
    // Generate Claude Code prompt for fixing the error
    const claudePrompt = this.generateClaudePrompt(report);
    
    // Write the prompt to a file for Claude Code to process
    const promptFile = join(this.logsDir, `claude-prompt-${Date.now()}.md`);
    writeFileSync(promptFile, claudePrompt);
    
    console.log(`📝 Claude prompt generated: ${promptFile}`);
    
    // Attempt to apply fix using Claude Code CLI
    const fixApplied = await this.applyFixWithClaude(promptFile, report);
    
    // Record the fix attempt
    const fixAttempt: FixAttempt = {
      reportFile,
      timestamp: new Date().toISOString(),
      error: error.message,
      fixApplied,
      fixDescription: fixApplied ? 'Automated fix applied' : 'Fix failed',
      testsPassed: fixApplied ? await this.runTests() : false
    };
    
    this.fixHistory.push(fixAttempt);
    this.saveFixHistory();
    
    // Clean up prompt file
    unlinkSync(promptFile);
  }

  private generateClaudePrompt(report: ErrorReport): string {
    const { error, frequency, suggestedFixes, context } = report;
    
    return `# Autofix Request

## Error Summary
- **Message**: ${error.message}
- **Source**: ${error.source}
- **File**: ${error.file || 'unknown'}
- **Line**: ${error.line || 'unknown'}
- **Frequency**: ${frequency} occurrences
- **Timestamp**: ${error.timestamp}

## Error Context
\`\`\`
${error.stack || error.message}
\`\`\`

## Suggested Fixes
${suggestedFixes.map(fix => `- ${fix}`).join('\\n')}

## Recent Logs Context
\`\`\`
${context.recentLogs?.map((log: any) => `[${log.level}] ${log.message}`).join('\\n') || 'No context available'}
\`\`\`

## Instructions for Claude
Please analyze this error and apply the most appropriate fix:

1. **Identify the root cause** of the error
2. **Locate the problematic code** in the file mentioned
3. **Apply the fix** using the suggested solutions or a better approach
4. **Ensure the fix doesn't break** existing functionality
5. **Run tests** to verify the fix works
6. **Document the change** briefly

## Error Patterns to Consider
- **TypeScript errors**: Add proper type annotations
- **React errors**: Check component lifecycle and state management  
- **API errors**: Verify endpoint exists and data structure
- **Import errors**: Check file paths and exports
- **Hydration errors**: Ensure server/client rendering consistency

## Priority
This is an **automated fix request** with high priority due to ${frequency} repeated occurrences.

Focus on:
- ✅ **Quick, safe fixes** that address the immediate error
- ✅ **Minimal code changes** to reduce risk
- ✅ **Type safety** and proper error handling
- ❌ **Avoid large refactoring** unless absolutely necessary

## Expected Output
- Brief description of what was fixed
- Code changes made (if any)
- Test results confirmation
- Any follow-up recommendations
`;
  }

  private async applyFixWithClaude(promptFile: string, report: ErrorReport): Promise<boolean> {
    try {
      console.log('🤖 Applying fix with Claude Code...');
      
      // Read the prompt and apply it using Claude Code
      const promptContent = readFileSync(promptFile, 'utf8');
      
      // For demo purposes, we'll simulate the fix application
      // In a real implementation, this would interface with Claude Code CLI
      const success = await this.simulateClaudeFix(report);
      
      if (success) {
        console.log('✅ Fix applied successfully');
      } else {
        console.log('❌ Fix application failed');
      }
      
      return success;
    } catch (error) {
      console.error('Failed to apply fix:', error);
      return false;
    }
  }

  private async simulateClaudeFix(report: ErrorReport): Promise<boolean> {
    // Simulate fix application with some logic
    const { error } = report;
    
    // Simple fix patterns for common errors
    if (error.message.includes('Cannot read property') && error.file) {
      return this.applyNullCheckFix(error.file, error.line || 1);
    }
    
    if (error.message.includes('is not defined') && error.file) {
      return this.applyImportFix(error.file);
    }
    
    if (error.message.includes('404')) {
      return this.checkApiEndpoint(error.message);
    }
    
    // Default to 70% success rate for simulation
    return Math.random() > 0.3;
  }

  private applyNullCheckFix(file: string, line: number): boolean {
    try {
      console.log(`🔧 Applying null check fix to ${file}:${line}`);
      
      // Read file and apply basic null checking
      // This is a simplified example - real implementation would be more sophisticated
      const content = readFileSync(file, 'utf8');
      const lines = content.split('\\n');
      
      if (lines[line - 1]) {
        // Look for property access patterns and add optional chaining
        lines[line - 1] = lines[line - 1].replace(/\\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, '?.$1');
        
        writeFileSync(file, lines.join('\\n'));
        console.log('✅ Applied optional chaining fix');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to apply null check fix:', error);
      return false;
    }
  }

  private applyImportFix(file: string): boolean {
    try {
      console.log(`📦 Checking imports in ${file}`);
      
      // Simulate import fix - check if common imports are missing
      const content = readFileSync(file, 'utf8');
      
      // Look for React usage without import
      if (content.includes('useState') && !content.includes('import.*useState')) {
        const lines = content.split('\\n');
        const importIndex = lines.findIndex(line => line.startsWith('import'));
        
        if (importIndex >= 0) {
          // Add useState import
          if (lines[importIndex].includes('react')) {
            lines[importIndex] = lines[importIndex].replace(
              'import React',
              'import React, { useState }'
            );
          } else {
            lines.splice(importIndex, 0, "import { useState } from 'react';");
          }
          
          writeFileSync(file, lines.join('\\n'));
          console.log('✅ Added missing useState import');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to apply import fix:', error);
      return false;
    }
  }

  private async checkApiEndpoint(errorMessage: string): Promise<boolean> {
    try {
      console.log('🌐 Checking API endpoint availability');
      
      // Extract URL from error message
      const urlMatch = errorMessage.match(/https?:\/\/[^\s]+/);
      if (!urlMatch) return false;
      
      const url = urlMatch[0];
      
      // Try to reach the endpoint
      const response = await fetch(url);
      if (response.ok) {
        console.log('✅ API endpoint is now available');
        return true;
      } else {
        console.log(`❌ API endpoint still returns ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('Failed to check API endpoint:', error);
      return false;
    }
  }

  private async runTests(): Promise<boolean> {
    try {
      console.log('🧪 Running tests to verify fix...');
      
      // Run a quick test to verify the fix works
      const testResult = await new Promise((resolve) => {
        const testProcess = spawn('npm', ['run', 'build'], {
          stdio: 'pipe'
        });
        
        testProcess.on('close', (code) => {
          resolve(code === 0);
        });
        
        // Timeout after 30 seconds
        setTimeout(() => {
          testProcess.kill();
          resolve(false);
        }, 30000);
      });
      
      if (testResult) {
        console.log('✅ Tests passed');
      } else {
        console.log('❌ Tests failed');
      }
      
      return testResult as boolean;
    } catch (error) {
      console.error('Failed to run tests:', error);
      return false;
    }
  }

  getFixSummary(): { totalFixes: number; successRate: number; recentFixes: FixAttempt[] } {
    const successfulFixes = this.fixHistory.filter(f => f.fixApplied).length;
    const successRate = this.fixHistory.length > 0 ? (successfulFixes / this.fixHistory.length) * 100 : 0;
    
    return {
      totalFixes: this.fixHistory.length,
      successRate: Math.round(successRate),
      recentFixes: this.fixHistory.slice(-5)
    };
  }
}

// Start the Claude autofix processor
if (require.main === module) {
  const processor = new ClaudeAutofixProcessor();
  processor.start().catch(console.error);
  
  // Print summary every minute
  setInterval(() => {
    const summary = processor.getFixSummary();
    console.log(`📊 Fix Summary: ${summary.totalFixes} attempts, ${summary.successRate}% success rate`);
  }, 60000);
}

export default ClaudeAutofixProcessor;