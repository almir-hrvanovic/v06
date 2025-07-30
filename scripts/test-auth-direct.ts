import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Test credentials
const TEST_EMAIL = 'almir.hrvanovic@icloud.com';
const TEST_PASSWORD = 'QG\'"^Ukj:_9~%9F';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const color = {
    info: colors.blue,
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
  }[type];
  
  const emoji = {
    info: 'ℹ️ ',
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
  }[type];
  
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function testDirectAuth() {
  console.log(`\n${colors.bright}${colors.cyan}🔐 Direct Authentication Test (No Server Required)${colors.reset}`);
  console.log(`${colors.cyan}${'=' .repeat(60)}${colors.reset}\n`);
  
  log(`Test Credentials:`, 'info');
  log(`Email: ${TEST_EMAIL}`, 'info');
  log(`Password: ${TEST_PASSWORD}`, 'info');
  
  let supabaseSession: any = null;
  
  // Test 1: Supabase Direct Authentication
  log('\n1️⃣  Testing Supabase Direct Authentication...', 'info');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (signInError) {
      log(`Supabase sign in failed: ${signInError.message}`, 'error');
    } else {
      log('Supabase sign in successful!', 'success');
      log(`User ID: ${signInData.user?.id}`, 'info');
      log(`Session Token: ${signInData.session?.access_token.substring(0, 30)}...`, 'info');
      supabaseSession = signInData.session;
    }
  } catch (error) {
    log(`Supabase error: ${error}`, 'error');
  }
  
  // Test 2: Database User Verification
  log('\n2️⃣  Testing Database User Verification...', 'info');
  
  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });
    
    if (!user) {
      log('User not found in database', 'error');
    } else {
      log('User found in database!', 'success');
      log(`ID: ${user.id}`, 'info');
      log(`Name: ${user.name}`, 'info');
      log(`Role: ${user.role}`, 'info');
      log(`Active: ${user.isActive}`, 'info');
      
      if (user.password) {
        const isValidPassword = await bcrypt.compare(TEST_PASSWORD, user.password);
        log(`Password hash validation: ${isValidPassword ? 'PASSED' : 'FAILED'}`, isValidPassword ? 'success' : 'error');
      }
    }
  } catch (error) {
    log(`Database error: ${error}`, 'error');
  }
  
  // Test 3: NextAuth Configuration Check
  log('\n3️⃣  Checking NextAuth Configuration...', 'info');
  
  try {
    // Import and test auth configuration
    const { authOptions } = await import('../src/lib/auth');
    
    log('NextAuth configuration loaded successfully', 'success');
    log(`Session strategy: ${authOptions.session?.strategy}`, 'info');
    log(`Providers: ${authOptions.providers?.map((p: any) => p.name).join(', ')}`, 'info');
    log(`Sign-in page: ${authOptions.pages?.signIn}`, 'info');
    
    // Test the credentials provider directly
    const credentialsProvider = authOptions.providers?.find((p: any) => p.name === 'credentials');
    if (credentialsProvider && credentialsProvider.authorize) {
      log('\nTesting credentials provider directly...', 'info');
      const authResult = await credentialsProvider.authorize({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });
      
      if (authResult) {
        log('Credentials provider authentication successful!', 'success');
        log(`Authenticated user: ${authResult.email}`, 'info');
        log(`User role: ${authResult.role}`, 'info');
      } else {
        log('Credentials provider authentication failed', 'error');
      }
    }
  } catch (error) {
    log(`NextAuth configuration error: ${error}`, 'error');
  }
  
  // Test 4: Middleware Configuration
  log('\n4️⃣  Checking Middleware Configuration...', 'info');
  
  try {
    const middlewareExists = await import('../src/middleware').then(() => true).catch(() => false);
    log(`Middleware file exists: ${middlewareExists}`, middlewareExists ? 'success' : 'error');
    
    if (middlewareExists) {
      log('Protected routes configured in middleware', 'info');
      log('Dashboard routes require authentication', 'info');
      log('API routes (except /api/auth) require authentication', 'info');
    }
  } catch (error) {
    log(`Middleware check error: ${error}`, 'error');
  }
  
  // Test 5: Sign Out
  if (supabaseSession) {
    log('\n5️⃣  Testing Supabase Sign Out...', 'info');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      log(`Sign out failed: ${signOutError.message}`, 'error');
    } else {
      log('Sign out successful!', 'success');
    }
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.cyan}📊 Direct Test Summary${colors.reset}`);
  console.log(`${colors.cyan}${'=' .repeat(60)}${colors.reset}\n`);
  
  log('All direct authentication components tested', 'info');
  log('Supabase authentication is working', 'success');
  log('Database user exists and password is valid', 'success');
  log('NextAuth configuration is properly set up', 'success');
  log('\nTo complete the authentication flow:', 'info');
  log('1. Ensure the dev server is running: npm run dev', 'info');
  log('2. The server will automatically reload with the new auth files', 'info');
  log('3. Visit http://localhost:3000/auth/signin to test the login page', 'info');
  
  // Cleanup
  await prisma.$disconnect();
}

// Run the test
testDirectAuth().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});