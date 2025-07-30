import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function setupSupabaseAuth() {
  console.log('🔐 Setting up Supabase Authentication...\n');

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const email = 'almir.hrvanovic@icloud.com';
  const password = 'QG\'"^Ukj:_9~%9F';

  try {
    // First, try to sign up the user
    console.log(`📧 Creating Supabase auth user for: ${email}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'Almir Hrvanovic',
          role: 'SUPERUSER'
        }
      }
    });

    if (signUpError) {
      // If user already exists, try to sign in
      if (signUpError.message.includes('already registered')) {
        console.log('⚠️  User already exists in Supabase Auth, trying to sign in...');
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.error('❌ Sign in failed:', signInError.message);
          
          // Try to update the password if sign in fails
          console.log('🔄 Attempting to update password...');
          // Note: This requires admin privileges or user to be signed in
          console.log('⚠️  Password update requires admin privileges. Please update manually in Supabase dashboard.');
        } else {
          console.log('✅ Successfully signed in existing user!');
          console.log(`   User ID: ${signInData.user?.id}`);
          console.log(`   Email: ${signInData.user?.email}`);
        }
      } else {
        throw signUpError;
      }
    } else {
      console.log('✅ Successfully created Supabase auth user!');
      console.log(`   User ID: ${signUpData.user?.id}`);
      console.log(`   Email: ${signUpData.user?.email}`);
      console.log('   ⚠️  Note: User may need to confirm email if email confirmations are enabled');
    }

    // Test the authentication
    console.log('\n🧪 Testing authentication...');
    const { data: testSignIn, error: testError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (testError) {
      console.error('❌ Test sign-in failed:', testError.message);
    } else {
      console.log('✅ Test sign-in successful!');
      
      // Sign out after test
      await supabase.auth.signOut();
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }

  console.log('\n📝 Next steps:');
  console.log('1. If email confirmations are enabled, check your email');
  console.log('2. Go to http://localhost:3000/auth/signin');
  console.log('3. Sign in with:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log('\n✨ Supabase Auth setup complete!');
}

// Run the setup
setupSupabaseAuth().catch(console.error);