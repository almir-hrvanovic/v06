#!/bin/bash
# 🚀 GS-CMS Quick Setup Script
# This script sets up the complete automated fix-test system

set -e

echo "🎭 Setting up GS-CMS Automated Fix-Test System..."
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in a Node.js project directory"
    echo "Please run this script from the GS-CMS project root"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install

# Setup database
echo "🗃️ Setting up database..."
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with DATABASE_URL and other required variables"
    exit 1
fi

npm run db:push
npm run db:seed

# Start application (in background for testing)
echo "🚀 Starting application..."
npm run dev &
APP_PID=$!

# Wait for app to start
echo "⏳ Waiting for application to start..."
sleep 10

# Run initial health check
echo "🔍 Running health check..."
npx playwright test tests/server-logs.spec.ts --project=chromium || true

# Stop background app
kill $APP_PID 2>/dev/null || true

echo ""
echo "✅ Setup complete! Available commands:"
echo "   npm run dev              - Start development server"
echo "   npm run critical-fix     - Run critical fix loop"
echo "   npm run fix-test-loop    - Run full automated fixes"
echo "   npm run test             - Run all tests"
echo "   npm run test:ui          - Run tests with UI"
echo ""
echo "🎯 To test the user workflow:"
echo "   1. npm run dev"
echo "   2. npm run critical-fix (in another terminal)"
echo "   3. Login with: almir@al-star.im / password123"
echo ""
echo "📚 Documentation: AUTOMATED_FIX_TEST_SYSTEM.md"