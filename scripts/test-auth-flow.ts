import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

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

async function testSupabaseAuth() {
  log('Testing Supabase Authentication Flow', 'info');
  log('=' .repeat(50), 'info');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test 1: Sign In
    log('\n1️⃣  Testing Supabase Sign In...', 'info');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (signInError) {
      log(`Sign in failed: ${signInError.message}`, 'error');
      return false;
    }
    
    log('Sign in successful!', 'success');
    log(`User ID: ${signInData.user?.id}`, 'info');
    log(`Email: ${signInData.user?.email}`, 'info');
    log(`Session expires at: ${new Date(signInData.session?.expires_at! * 1000).toLocaleString()}`, 'info');
    
    // Test 2: Session Persistence
    log('\n2️⃣  Testing Session Persistence...', 'info');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      log('Session retrieval failed', 'error');
      return false;
    }
    
    log('Session retrieved successfully!', 'success');
    log(`Session token (first 20 chars): ${sessionData.session.access_token.substring(0, 20)}...`, 'info');
    
    // Test 3: Get User
    log('\n3️⃣  Testing Get User...', 'info');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      log('User retrieval failed', 'error');
      return false;
    }
    
    log('User retrieved successfully!', 'success');
    log(`User metadata: ${JSON.stringify(userData.user.user_metadata, null, 2)}`, 'info');
    
    // Test 4: Sign Out
    log('\n4️⃣  Testing Sign Out...', 'info');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      log(`Sign out failed: ${signOutError.message}`, 'error');
      return false;
    }
    
    log('Sign out successful!', 'success');
    
    // Verify sign out
    const { data: afterSignOut } = await supabase.auth.getSession();
    if (afterSignOut.session) {
      log('Session still exists after sign out!', 'error');
      return false;
    }
    
    log('Session cleared successfully', 'success');
    
    return true;
  } catch (error) {
    log(`Unexpected error: ${error}`, 'error');
    return false;
  }
}

async function testPrismaUser() {
  log('\n🗄️  Testing Prisma User Database...', 'info');
  log('=' .repeat(50), 'info');
  
  try {
    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });
    
    if (!user) {
      log('User not found in database', 'error');
      return false;
    }
    
    log('User found in database!', 'success');
    log(`ID: ${user.id}`, 'info');
    log(`Name: ${user.name}`, 'info');
    log(`Role: ${user.role}`, 'info');
    log(`Active: ${user.isActive}`, 'info');
    
    // Verify password
    if (user.password) {
      const isValidPassword = await bcrypt.compare(TEST_PASSWORD, user.password);
      log(`Password validation: ${isValidPassword ? 'PASSED' : 'FAILED'}`, isValidPassword ? 'success' : 'error');
      return isValidPassword;
    } else {
      log('No password set for user', 'error');
      return false;
    }
  } catch (error) {
    log(`Database error: ${error}`, 'error');
    return false;
  }
}

async function testNextAuthAPI() {
  log('\n🔐 Testing NextAuth API...', 'info');
  log('=' .repeat(50), 'info');
  
  try {
    // Get CSRF token
    log('Getting CSRF token...', 'info');
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();
    log(`CSRF Token obtained: ${csrfToken.substring(0, 20)}...`, 'success');
    
    // Test sign in
    log('\nTesting NextAuth sign in...', 'info');
    const signInResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        csrfToken,
        json: 'true',
      }),
      redirect: 'manual',
    });
    
    log(`Sign in response status: ${signInResponse.status}`, signInResponse.status === 200 ? 'success' : 'error');
    
    if (signInResponse.status === 200) {
      const cookies = signInResponse.headers.get('set-cookie');
      log('Session cookies set successfully', 'success');
      
      // Test session endpoint
      log('\nTesting session endpoint...', 'info');
      const sessionResponse = await fetch(`${baseUrl}/api/auth/session`, {
        headers: {
          'Cookie': cookies || '',
        },
      });
      
      const session = await sessionResponse.json();
      if (session && session.user) {
        log('Session retrieved successfully!', 'success');
        log(`User: ${session.user.email}`, 'info');
        log(`Role: ${session.user.role}`, 'info');
        return true;
      } else {
        log('No session found', 'error');
        return false;
      }
    }
    
    return false;
  } catch (error) {
    log(`API error: ${error}`, 'error');
    return false;
  }
}

async function testProtectedRoutes() {
  log('\n🛡️  Testing Protected Routes...', 'info');
  log('=' .repeat(50), 'info');
  
  try {
    // Test accessing protected route without auth
    log('Testing protected route without authentication...', 'info');
    const protectedResponse = await fetch(`${baseUrl}/dashboard`, {
      redirect: 'manual',
    });
    
    if (protectedResponse.status === 307 || protectedResponse.status === 302) {
      const location = protectedResponse.headers.get('location');
      log(`Correctly redirected to: ${location}`, 'success');
      
      if (location?.includes('/auth/signin')) {
        log('Redirect to sign-in page confirmed', 'success');
        return true;
      }
    } else {
      log(`Unexpected status: ${protectedResponse.status}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Route test error: ${error}`, 'error');
    return false;
  }
}

async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}🧪 Comprehensive Authentication Flow Test${colors.reset}`);
  console.log(`${colors.cyan}${'=' .repeat(60)}${colors.reset}\n`);
  
  log(`Test Credentials:`, 'info');
  log(`Email: ${TEST_EMAIL}`, 'info');
  log(`Password: ${TEST_PASSWORD}`, 'info');
  log(`Base URL: ${baseUrl}`, 'info');
  
  const results = {
    supabase: false,
    prisma: false,
    nextauth: false,
    protectedRoutes: false,
  };
  
  // Run tests
  results.supabase = await testSupabaseAuth();
  results.prisma = await testPrismaUser();
  results.nextauth = await testNextAuthAPI();
  results.protectedRoutes = await testProtectedRoutes();
  
  // Summary
  console.log(`\n${colors.bright}${colors.cyan}📊 Test Summary${colors.reset}`);
  console.log(`${colors.cyan}${'=' .repeat(60)}${colors.reset}\n`);
  
  const testNames = {
    supabase: 'Supabase Authentication',
    prisma: 'Prisma Database User',
    nextauth: 'NextAuth API',
    protectedRoutes: 'Protected Routes',
  };
  
  let allPassed = true;
  
  for (const [key, passed] of Object.entries(results)) {
    const status = passed ? `${colors.green}✅ PASSED${colors.reset}` : `${colors.red}❌ FAILED${colors.reset}`;
    console.log(`${testNames[key as keyof typeof testNames]}: ${status}`);
    if (!passed) allPassed = false;
  }
  
  console.log(`\n${colors.cyan}${'=' .repeat(60)}${colors.reset}`);
  
  if (allPassed) {
    log('\n🎉 All authentication tests passed!', 'success');
  } else {
    log('\n⚠️  Some tests failed. Please check the details above.', 'warning');
  }
  
  // Cleanup
  await prisma.$disconnect();
}

// Run the tests
runAllTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});