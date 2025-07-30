import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testConnections() {
  console.log('🔍 Testing Database Connections...\n');

  // Test Prisma connection
  console.log('1️⃣  Testing Prisma Connection to Supabase...');
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

  try {
    await prisma.$connect();
    console.log('✅ Prisma connected successfully!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`   Found ${userCount} users in database`);
    
  } catch (error) {
    console.error('❌ Prisma connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n2️⃣  Testing Supabase Client Connection...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test connection by fetching tables
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase query failed:', error);
    } else {
      console.log('✅ Supabase client connected successfully!');
      console.log(`   Query test passed`);
    }
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
  }

  console.log('\n3️⃣  Environment Configuration:');
  console.log(`   Database URL: ${process.env.DATABASE_URL?.substring(0, 50)}...`);
  console.log(`   Direct URL: ${process.env.DIRECT_URL?.substring(0, 50)}...`);
  console.log(`   Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`   Node Environment: ${process.env.NODE_ENV || 'development'}`);
  
  console.log('\n✨ Connection test complete!');
}

// Run the tests
testConnections().catch(console.error);