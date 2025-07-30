#!/usr/bin/env node

const https = require('https');
const http = require('http');

const AUTO_LOGIN_CREDENTIALS = {
  email: 'almir@al-star.im',
  password: 'password123'
};

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function waitForServer(maxAttempts = 30, delay = 1000) {
  console.log('⏳ Waiting for server to start...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok || response.status === 401) {
        console.log('✅ Server is ready!');
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    if (attempt < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error('❌ Server did not start within expected time');
  return false;
}

async function performAutoLogin() {
  try {
    // First get CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();
    
    // Get cookies from response
    const cookies = csrfResponse.headers.get('set-cookie') || '';
    
    // Perform login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies
      },
      body: new URLSearchParams({
        email: AUTO_LOGIN_CREDENTIALS.email,
        password: AUTO_LOGIN_CREDENTIALS.password,
        csrfToken: csrfToken,
        callbackUrl: `${BASE_URL}/dashboard`,
        json: 'true'
      }),
      redirect: 'manual'
    });

    if (loginResponse.status === 302 || loginResponse.status === 200) {
      console.log('✅ Auto-login successful!');
      console.log(`🔐 Logged in as: ${AUTO_LOGIN_CREDENTIALS.email}`);
      console.log(`🌐 Navigate to: ${BASE_URL}/dashboard`);
      return true;
    } else {
      const result = await loginResponse.text();
      console.error('❌ Auto-login failed:', loginResponse.status, result);
      return false;
    }
  } catch (error) {
    console.error('❌ Auto-login error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Auto-login script started');
  
  // Only run in development
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Auto-login is disabled in production');
    return;
  }

  // Wait for server to be ready
  const serverReady = await waitForServer();
  if (!serverReady) {
    process.exit(1);
  }

  // Perform auto-login
  await performAutoLogin();
}

// Run the script
main();