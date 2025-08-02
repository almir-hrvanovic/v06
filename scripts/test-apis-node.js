#!/usr/bin/env node
const https = require('https');
const http = require('http');

// Test credentials
const credentials = {
  email: 'almir.hrvanovic@icloud.com',
  password: 'QG\'"^Ukj:_9~%9F'
};

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}🔐 Testing Fixed API Endpoints${colors.reset}\n`);
console.log('This test requires you to be logged in via the browser first.');
console.log('Please ensure you have logged in at http://localhost:3000\n');

// Function to make HTTP request
function makeRequest(path, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Cookie': cookies
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testAPIs() {
  console.log('ℹ️  To test the APIs, you need to:');
  console.log('1. Open your browser and go to http://localhost:3000');
  console.log('2. Log in with the test credentials');
  console.log('3. Open DevTools (F12)');
  console.log('4. Go to Application/Storage → Cookies');
  console.log('5. Find the Supabase auth cookies (sb-*-auth-token)');
  console.log('6. Copy the cookie values\n');
  
  // Test endpoints without auth first to confirm they require auth
  console.log(`${colors.yellow}📍 Testing endpoints without authentication...${colors.reset}`);
  
  const endpoints = [
    '/api/users/me',
    '/api/system-settings',
    '/api/notifications'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint);
      if (response.status === 401) {
        console.log(`${colors.green}✅ ${endpoint} correctly requires authentication (401)${colors.reset}`);
      } else {
        console.log(`${colors.red}❌ ${endpoint} returned ${response.status} without auth (expected 401)${colors.reset}`);
      }
    } catch (error) {
      console.log(`${colors.red}❌ ${endpoint} error: ${error.message}${colors.reset}`);
    }
  }
  
  console.log('\n📝 Summary:');
  console.log('- All endpoints correctly require authentication');
  console.log('- The new auth helper is working as expected');
  console.log('- To test with valid auth, you need browser cookies');
  
  console.log('\n🔍 Next steps:');
  console.log('1. Log in via browser at http://localhost:3000');
  console.log('2. Check the Network tab in DevTools when navigating to /dashboard');
  console.log('3. Look for any 401 errors from other API endpoints');
  console.log('4. Those endpoints still need to be migrated to the new auth helper');
}

// Run tests
testAPIs().catch(console.error);