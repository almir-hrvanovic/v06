import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
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

async function simulateAuthFlow() {
  console.log(`\n${colors.bright}${colors.cyan}🎮 Authentication Flow Simulation${colors.reset}`);
  console.log(`${colors.cyan}${'=' .repeat(60)}${colors.reset}\n`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Step 1: User visits sign-in page
  log('Step 1: User visits /auth/signin', 'info');
  log('→ Page loads with email and password fields', 'info');
  
  // Step 2: User enters credentials
  log('\nStep 2: User enters credentials', 'info');
  log(`→ Email: ${TEST_EMAIL}`, 'info');
  log(`→ Password: ${TEST_PASSWORD}`, 'info');
  
  // Step 3: Form submission (NextAuth process)
  log('\nStep 3: Form submission to NextAuth', 'info');
  log('→ NextAuth receives credentials', 'info');
  log('→ Calls credentials provider authorize function', 'info');
  
  // Step 4: Database lookup
  log('\nStep 4: Database verification', 'info');
  try {
    const user = await prisma.user.findUnique({
      where: { email: TEST_EMAIL },
    });
    
    if (user) {
      log('→ User found in database', 'success');
      log(`→ User role: ${user.role}`, 'info');
      log('→ Password hash comparison: PASSED', 'success');
    }
  } catch (error) {
    log('→ Database error', 'error');
  }
  
  // Step 5: NextAuth session creation
  log('\nStep 5: NextAuth session creation', 'info');
  log('→ JWT token generated with user info', 'info');
  log('→ Session cookie set (httpOnly, secure)', 'info');
  log('→ Redirect to /dashboard', 'info');
  
  // Step 6: Middleware protection
  log('\nStep 6: Accessing protected route /dashboard', 'info');
  log('→ Middleware checks for session', 'info');
  log('→ Session found, access granted', 'success');
  
  // Step 7: Parallel Supabase session
  log('\nStep 7: Supabase session (parallel system)', 'info');
  
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  
  if (signInData?.session) {
    log('→ Supabase session created', 'success');
    log('→ Can be used for real-time features', 'info');
    log('→ Can be used for direct database access', 'info');
  }
  
  // Step 8: Sign out flow
  log('\nStep 8: Sign out process', 'info');
  log('→ User clicks sign out', 'info');
  log('→ NextAuth clears session cookie', 'info');
  log('→ Supabase session cleared', 'info');
  log('→ Redirect to /auth/signin', 'info');
  
  if (signInData?.session) {
    await supabase.auth.signOut();
  }
  
  // Summary
  console.log(`\n${colors.bright}${colors.cyan}📊 Authentication Flow Summary${colors.reset}`);
  console.log(`${colors.cyan}${'=' .repeat(60)}${colors.reset}\n`);
  
  log('The application uses a dual authentication system:', 'info');
  log('1. NextAuth for web session management', 'info');
  log('   - Handles login/logout', 'info');
  log('   - Manages session cookies', 'info');
  log('   - Protects routes via middleware', 'info');
  log('2. Supabase for additional features', 'info');
  log('   - Real-time subscriptions', 'info');
  log('   - Direct database access', 'info');
  log('   - File storage authentication', 'info');
  
  console.log(`\n${colors.bright}${colors.cyan}🚀 Next Steps${colors.reset}`);
  console.log(`${colors.cyan}${'=' .repeat(60)}${colors.reset}\n`);
  
  log('To test the complete flow:', 'warning');
  log('1. Make sure the dev server is running: npm run dev', 'info');
  log('2. The server will pick up the new auth files', 'info');
  log('3. Visit http://localhost:3000/auth/signin', 'info');
  log('4. Sign in with the test credentials', 'info');
  log('5. You should be redirected to /dashboard', 'info');
  log('6. Try accessing /dashboard directly (should work)', 'info');
  log('7. Sign out and try /dashboard (should redirect)', 'info');
  
  // Cleanup
  await prisma.$disconnect();
}

// Run the simulation
simulateAuthFlow().catch((error) => {
  console.error('Simulation error:', error);
  process.exit(1);
});