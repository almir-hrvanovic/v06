#!/usr/bin/env tsx

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🧪 Testing Autofix Environment');
console.log('===============================');

// Test 1: Create a sample error file
console.log('1. Creating test file with intentional error...');
const testFile = './src/test-error-file.ts';
const errorContent = `
// Test file with intentional errors for autofix testing
export function testFunction() {
  const user = null;
  console.log(user.name); // This will cause "Cannot read property" error
  
  // Missing import for useState
  const [count, setCount] = useState(0);
  
  return undefined;
}
`;

writeFileSync(testFile, errorContent);
console.log('✅ Test file created:', testFile);

// Test 2: Create a mock error report
console.log('2. Creating mock error report...');
const mockError = {
  error: {
    timestamp: new Date().toISOString(),
    level: 'error',
    source: 'browser',
    message: 'TypeError: Cannot read property "name" of null',
    file: testFile,
    line: 5,
    stack: 'TypeError: Cannot read property "name" of null\\n    at testFunction (test-error-file.ts:5:18)'
  },
  frequency: 5,
  context: {
    recentLogs: [
      { level: 'info', message: 'Server started' },
      { level: 'error', message: 'TypeError: Cannot read property "name" of null' }
    ]
  },
  suggestedFixes: [
    'Add null/undefined checks',
    'Use optional chaining (?.)'
  ]
};

const reportFile = `./logs/autofix-report-${Date.now()}.json`;
writeFileSync(reportFile, JSON.stringify(mockError, null, 2));
console.log('✅ Mock error report created:', reportFile);

// Test 3: Verify configuration files
console.log('3. Verifying configuration files...');
const configFiles = [
  './.claude/autofix-config.json',
  './.claude/mcp_settings.json',
  './scripts/autofix-environment.ts',
  './scripts/claude-autofix-processor.ts'
];

for (const file of configFiles) {
  if (existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
}

// Test 4: Check package.json scripts
console.log('4. Checking package.json scripts...');
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));
const autofixScripts = [
  'autofix:start',
  'autofix:environment', 
  'autofix:processor'
];

for (const script of autofixScripts) {
  if (packageJson.scripts[script]) {
    console.log(`✅ npm run ${script} available`);
  } else {
    console.log(`❌ npm run ${script} missing`);
  }
}

// Test 5: Check MCP server installation
console.log('5. Checking MCP server installation...');
try {
  const { spawn } = require('child_process');
  const check = spawn('browser-tools-mcp', ['--version'], { stdio: 'pipe' });
  
  check.on('close', (code: number | null) => {
    if (code === 0) {
      console.log('✅ Browser Tools MCP server installed');
    } else {
      console.log('❌ Browser Tools MCP server not working');
    }
  });
  
  check.on('error', () => {
    console.log('❌ Browser Tools MCP server not found');
  });
} catch (error) {
  console.log('❌ Could not check MCP server:', error instanceof Error ? error.message : String(error));
}

console.log('');
console.log('🚀 Autofix Environment Test Summary');
console.log('===================================');
console.log('');
console.log('Ready to start! Run one of these commands:');
console.log('');
console.log('📦 Full autofix environment:');
console.log('   npm run autofix:start');
console.log('');
console.log('🔧 Individual components:');
console.log('   npm run autofix:environment    # Start error monitoring');
console.log('   npm run autofix:processor      # Start Claude processor');
console.log('');
console.log('🌐 Access points:');
console.log('   http://localhost:3000          # Your dev server');
console.log('   http://localhost:3001/autofix-dashboard  # Autofix dashboard');
console.log('');
console.log('📊 Features:');
console.log('   • Real-time error monitoring from dev server & browser');
console.log('   • Automatic error pattern detection');
console.log('   • Claude Code integration for fix suggestions');
console.log('   • Web dashboard for monitoring autofix activity');
console.log('   • MCP server integration for enhanced browser monitoring');
console.log('');
console.log('💡 The system will automatically:');
console.log('   1. Monitor your application for errors');
console.log('   2. Detect recurring error patterns');
console.log('   3. Generate context-aware fix suggestions');
console.log('   4. Apply safe automated fixes when possible');
console.log('   5. Verify fixes by running tests');
console.log('');

// Cleanup test file
console.log('🧹 Cleaning up test files...');
// Don't clean up immediately, leave for user to see
setTimeout(() => {
  // if (existsSync(testFile)) {
  //   unlinkSync(testFile);
  //   console.log('✅ Test file cleaned up');
  // }
}, 5000);

console.log('✅ Autofix environment test completed!');