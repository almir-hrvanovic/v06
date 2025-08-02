#!/usr/bin/env node
import puppeteer from 'puppeteer'

const testCredentials = {
  email: 'almir.hrvanovic@icloud.com',
  password: 'QG\'"^Ukj:_9~%9F'
}

async function testAPIsWithBrowser() {
  console.log('🔐 Testing Fixed API Endpoints with Browser...\n')
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for CI/CD
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    // Enable request interception to log API calls
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        console.log('📡 API Request:', request.method(), request.url())
      }
      request.continue()
    })
    
    page.on('response', (response) => {
      if (response.url().includes('/api/')) {
        console.log('📨 API Response:', response.status(), response.url())
      }
    })
    
    // 1. Navigate to the app
    console.log('1️⃣ Navigating to app...')
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' })
    
    // 2. Click Sign In button
    console.log('2️⃣ Clicking Sign In...')
    await page.waitForSelector('button:has-text("Sign In")', { timeout: 5000 })
    await page.click('button:has-text("Sign In")')
    
    // 3. Fill in login form
    console.log('3️⃣ Filling login form...')
    await page.waitForSelector('input[type="email"]', { timeout: 5000 })
    await page.type('input[type="email"]', testCredentials.email)
    await page.type('input[type="password"]', testCredentials.password)
    
    // 4. Submit login
    console.log('4️⃣ Submitting login...')
    await page.click('button[type="submit"]')
    
    // Wait for login to complete
    await page.waitForFunction(
      () => document.querySelector('button:has-text("Sign In")') === null,
      { timeout: 10000 }
    )
    
    console.log('✅ Login successful!')
    
    // 5. Test API endpoints directly
    console.log('\n5️⃣ Testing API endpoints...')
    
    // Get cookies for API requests
    const cookies = await page.cookies()
    const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ')
    
    // Test /api/users/me
    console.log('\n📍 Testing /api/users/me...')
    const meResponse = await page.evaluate(async () => {
      const response = await fetch('/api/users/me')
      const data = await response.json()
      return { status: response.status, data }
    })
    console.log('   Status:', meResponse.status)
    console.log('   Data:', JSON.stringify(meResponse.data, null, 2))
    
    // Test /api/system-settings
    console.log('\n📍 Testing /api/system-settings...')
    const settingsResponse = await page.evaluate(async () => {
      const response = await fetch('/api/system-settings')
      const data = await response.json()
      return { status: response.status, data }
    })
    console.log('   Status:', settingsResponse.status)
    console.log('   Data:', JSON.stringify(settingsResponse.data, null, 2))
    
    // Test /api/notifications
    console.log('\n📍 Testing /api/notifications...')
    const notifResponse = await page.evaluate(async () => {
      const response = await fetch('/api/notifications')
      const data = await response.json()
      return { status: response.status, data }
    })
    console.log('   Status:', notifResponse.status)
    console.log('   Data:', JSON.stringify(notifResponse.data, null, 2))
    
    // 6. Navigate to dashboard to see if it loads without issues
    console.log('\n6️⃣ Navigating to dashboard...')
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' })
    
    // Check if dashboard loaded successfully
    const dashboardTitle = await page.title()
    console.log('   Dashboard title:', dashboardTitle)
    
    // Wait a bit to see the dashboard
    await page.waitForTimeout(3000)
    
    console.log('\n✅ All tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await browser.close()
  }
}

// Check if puppeteer is installed
try {
  require.resolve('puppeteer')
} catch (e) {
  console.log('📦 Installing puppeteer...')
  require('child_process').execSync('npm install puppeteer', { stdio: 'inherit' })
}

// Run the tests
console.log('🚀 Starting browser-based API tests...')
console.log('   Make sure the dev server is running on http://localhost:3000\n')

testAPIsWithBrowser().then(() => {
  console.log('\n✨ Test completed!')
  process.exit(0)
}).catch((error) => {
  console.error('\n❌ Test error:', error)
  process.exit(1)
})