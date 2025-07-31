// Load environment variables
require('dotenv').config({ path: '.env.local' })

// Run prisma db push
const { execSync } = require('child_process')

try {
  console.log('Pushing database schema changes...')
  execSync('npx prisma db push', { stdio: 'inherit' })
  console.log('Database schema updated successfully!')
} catch (error) {
  console.error('Failed to push database changes:', error.message)
  process.exit(1)
}