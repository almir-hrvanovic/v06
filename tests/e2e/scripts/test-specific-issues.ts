#!/usr/bin/env tsx

/**
 * Test specific issues we know exist
 */

import { spawn } from 'child_process';

async function runSpecificTest(): Promise<void> {
  console.log('🎭 Running specific test to detect known issues...');
  
  const testProcess = spawn('npx', [
    'playwright', 'test', 
    'tests/user-workflow.spec.ts', 
    '--project=chromium',
    '--timeout=120000',
    '--reporter=line'
  ], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  testProcess.on('close', (code) => {
    console.log(`\n📊 Test completed with exit code: ${code}`);
    
    if (code === 0) {
      console.log('✅ All tests passed');
    } else {
      console.log('❌ Tests failed - issues detected');
    }
  });
}

runSpecificTest().catch(console.error);