#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

console.log(`${colors.bright}${colors.cyan}🚀 Starting development environment...${colors.reset}`);

// Start Next.js dev server
const nextDev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Wait a bit for Next.js to start, then launch Prisma Studio
setTimeout(() => {
  console.log(`${colors.bright}${colors.green}\n📊 Starting Prisma Studio...${colors.reset}`);
  
  const prismaStudio = spawn('npx', ['prisma', 'studio', '--port', '5555'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      BROWSER: 'none' // Prevent auto-opening browser for Prisma Studio
    }
  });

  // Handle Prisma Studio events
  prismaStudio.on('error', (err) => {
    console.error(`${colors.red}Failed to start Prisma Studio:${colors.reset}`, err);
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Shutting down development environment...${colors.reset}`);
    nextDev.kill();
    prismaStudio.kill();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    nextDev.kill();
    prismaStudio.kill();
    process.exit(0);
  });

}, 3000); // Wait 3 seconds for Next.js to initialize

// Handle Next.js process events
nextDev.on('error', (err) => {
  console.error(`${colors.red}Failed to start Next.js dev server:${colors.reset}`, err);
  process.exit(1);
});

nextDev.on('close', (code) => {
  if (code !== 0) {
    console.log(`${colors.red}Next.js dev server exited with code ${code}${colors.reset}`);
  }
  process.exit(code);
});

// Display helpful information
setTimeout(() => {
  console.log(`\n${colors.bright}${colors.blue}Development environment is running:${colors.reset}`);
  console.log(`${colors.green}  ✓ Next.js app: ${colors.cyan}http://localhost:3000${colors.reset}`);
  console.log(`${colors.green}  ✓ Prisma Studio: ${colors.cyan}http://localhost:5555${colors.reset}`);
  console.log(`\n${colors.yellow}Press Ctrl+C to stop both servers${colors.reset}\n`);
}, 5000);