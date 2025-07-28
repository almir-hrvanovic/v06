#!/usr/bin/env tsx
// Script to read and display console logs for Claude Code

import { readdir, readFile } from 'fs/promises';
import path from 'path';

async function readConsoleLogs() {
  const logsDir = path.join(process.cwd(), 'logs', 'console');
  
  try {
    // Read the latest summary
    const summaryPath = path.join(logsDir, 'latest-console-summary.txt');
    const summary = await readFile(summaryPath, 'utf-8');
    
    console.log('=== LATEST BROWSER CONSOLE OUTPUT ===\n');
    console.log(summary);
    
    // List all log files
    const files = await readdir(logsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'latest-console-summary.txt');
    
    console.log('\n\n=== AVAILABLE LOG FILES ===');
    jsonFiles.forEach(file => console.log(`- ${file}`));
    
  } catch (error) {
    console.error('Error reading console logs:', error);
    console.log('\nNo console logs found yet. The browser needs to be running and generating logs.');
  }
}

// Run the script
readConsoleLogs();