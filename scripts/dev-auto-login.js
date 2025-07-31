#!/usr/bin/env node

/**
 * Development Auto-Login Script
 * 
 * This script helps maintain a persistent dev session.
 * It provides instructions for setting up auto-login.
 * 
 * SECURITY WARNING: For development use only!
 */

require('dotenv').config({ path: '.env.local' })

const devEmail = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL
const isEnabled = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === 'true'

console.log('🔐 Development Auto-Login Setup')
console.log('================================')

if (!isEnabled) {
  console.log('❌ Dev auto-login is DISABLED')
  console.log('   To enable, set NEXT_PUBLIC_DEV_AUTO_LOGIN=true in .env.local')
  process.exit(0)
}

if (!devEmail) {
  console.log('❌ No dev email configured')
  console.log('   Set NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL in .env.local')
  process.exit(1)
}

console.log('✅ Dev auto-login is ENABLED')
console.log(`📧 Dev email: ${devEmail}`)
console.log('')

// Check if we have a password stored
const devPassword = process.env.DEV_AUTO_LOGIN_PASSWORD
if (devPassword) {
  console.log('🔑 Dev password is configured ✅')
  console.log('   Auto-login will happen automatically when you start the app!')
  console.log('   No manual login required.')
  console.log('')
  console.log('🚀 Just start the dev server and you\'re good to go!')
} else {
  console.log('💡 Tip: Add DEV_AUTO_LOGIN_PASSWORD to .env.local for automatic login')
  console.log('   Without it, you\'ll need to login manually the first time')
}