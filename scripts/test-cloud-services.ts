import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { Redis } from '@upstash/redis';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testCloudServices() {
  console.log('🌩️  Testing Cloud Services Integration...\n');

  // Test 1: Supabase Database via Prisma
  console.log('1️⃣  Testing Supabase Database (via Prisma)...');
  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to Supabase!');
    
    const userCount = await prisma.user.count();
    const inquiryCount = await prisma.inquiry.count();
    
    console.log(`   📊 Database stats:`);
    console.log(`      - Users: ${userCount}`);
    console.log(`      - Inquiries: ${inquiryCount}`);
    
  } catch (error) {
    console.error('❌ Prisma/Supabase connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }

  // Test 2: Supabase Client SDK
  console.log('\n2️⃣  Testing Supabase Client SDK...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
  } else {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .limit(3);

      if (error) throw error;

      console.log('✅ Supabase SDK connected!');
      console.log(`   📋 Sample customers: ${data?.map(c => c.name).join(', ')}`);
      
    } catch (error) {
      console.error('❌ Supabase SDK failed:', error);
    }
  }

  // Test 3: Upstash Redis
  console.log('\n3️⃣  Testing Upstash Redis...');
  
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.error('❌ Missing Upstash Redis credentials');
  } else {
    const redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });

    try {
      // Test write
      const testKey = 'test:connection';
      const testValue = { 
        message: 'Redis is working!', 
        timestamp: new Date().toISOString() 
      };
      
      await redis.set(testKey, JSON.stringify(testValue), { ex: 60 }); // Expire in 60 seconds
      console.log('✅ Redis write successful!');
      
      // Test read
      const retrieved = await redis.get(testKey);
      const parsed = retrieved ? JSON.parse(retrieved as string) : null;
      console.log(`   📤 Stored: ${testValue.message}`);
      console.log(`   📥 Retrieved: ${parsed?.message}`);
      
      // Test cache operations
      await redis.setex('cache:test', 300, 'cached-value');
      const cached = await redis.get('cache:test');
      console.log(`   💾 Cache test: ${cached}`);
      
    } catch (error) {
      console.error('❌ Upstash Redis failed:', error);
    }
  }

  // Test 4: Integration test
  console.log('\n4️⃣  Testing Cloud Services Integration...');
  
  try {
    // Store user count in Redis
    const userCount = await prisma.user.count();
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    
    await redis.setex('stats:users', 3600, userCount);
    const cachedCount = await redis.get('stats:users');
    
    console.log('✅ Integration test passed!');
    console.log(`   🔄 Stored user count (${userCount}) in Redis`);
    console.log(`   ✨ Retrieved from cache: ${cachedCount}`);
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }

  console.log('\n📋 Environment Summary:');
  console.log(`   🗄️  Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`   🔴 Redis URL: ${process.env.UPSTASH_REDIS_REST_URL}`);
  console.log(`   🌐 App URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
  console.log(`   🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  console.log('\n✨ Cloud services test complete!');
}

// Run the tests
testCloudServices().catch(console.error);