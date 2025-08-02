#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const testCredentials = {
  email: 'almir.hrvanovic@icloud.com',
  password: 'QG\'"^Ukj:_9~%9F'
}

async function testAPIs() {
  console.log('🔐 Testing Fixed API Endpoints...\n')
  
  try {
    // 1. Sign in to get session
    console.log('1️⃣ Signing in...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testCredentials.email,
      password: testCredentials.password
    })
    
    if (authError || !authData.session) {
      console.error('❌ Login failed:', authError?.message)
      return
    }
    
    console.log('✅ Login successful!')
    console.log('   User ID:', authData.user.id)
    console.log('   Email:', authData.user.email)
    
    // Get the access token
    const accessToken = authData.session.access_token
    const baseUrl = 'http://localhost:3000'
    
    // 2. Test /api/users/me
    console.log('\n2️⃣ Testing /api/users/me...')
    try {
      const meResponse = await fetch(`${baseUrl}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cookie': `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${JSON.stringify({
            access_token: accessToken,
            refresh_token: authData.session.refresh_token,
            provider_token: null,
            provider_refresh_token: null,
            user: authData.user
          })}`
        }
      })
      
      if (meResponse.ok) {
        const userData = await meResponse.json()
        console.log('✅ /api/users/me works!')
        console.log('   Response:', JSON.stringify(userData, null, 2))
      } else {
        console.error('❌ /api/users/me failed:', meResponse.status, meResponse.statusText)
        const errorText = await meResponse.text()
        console.error('   Error:', errorText)
      }
    } catch (error) {
      console.error('❌ /api/users/me error:', error)
    }
    
    // 3. Test /api/system-settings
    console.log('\n3️⃣ Testing /api/system-settings...')
    try {
      const settingsResponse = await fetch(`${baseUrl}/api/system-settings`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cookie': `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${JSON.stringify({
            access_token: accessToken,
            refresh_token: authData.session.refresh_token,
            provider_token: null,
            provider_refresh_token: null,
            user: authData.user
          })}`
        }
      })
      
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        console.log('✅ /api/system-settings works!')
        console.log('   Response:', JSON.stringify(settingsData, null, 2))
      } else {
        console.error('❌ /api/system-settings failed:', settingsResponse.status, settingsResponse.statusText)
        const errorText = await settingsResponse.text()
        console.error('   Error:', errorText)
      }
    } catch (error) {
      console.error('❌ /api/system-settings error:', error)
    }
    
    // 4. Test /api/notifications
    console.log('\n4️⃣ Testing /api/notifications...')
    try {
      const notifResponse = await fetch(`${baseUrl}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Cookie': `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token=${JSON.stringify({
            access_token: accessToken,
            refresh_token: authData.session.refresh_token,
            provider_token: null,
            provider_refresh_token: null,
            user: authData.user
          })}`
        }
      })
      
      if (notifResponse.ok) {
        const notifData = await notifResponse.json()
        console.log('✅ /api/notifications works!')
        console.log('   Response:', JSON.stringify(notifData, null, 2))
      } else {
        console.error('❌ /api/notifications failed:', notifResponse.status, notifResponse.statusText)
        const errorText = await notifResponse.text()
        console.error('   Error:', errorText)
      }
    } catch (error) {
      console.error('❌ /api/notifications error:', error)
    }
    
    // 5. Sign out
    console.log('\n5️⃣ Signing out...')
    await supabase.auth.signOut()
    console.log('✅ Signed out successfully')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the tests
console.log('🚀 Starting API tests...')
console.log('   Make sure the dev server is running on http://localhost:3000\n')

testAPIs().then(() => {
  console.log('\n✨ Test completed!')
  process.exit(0)
}).catch((error) => {
  console.error('\n❌ Test error:', error)
  process.exit(1)
})