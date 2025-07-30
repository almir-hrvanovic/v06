#!/bin/bash

echo "🚀 Starting development server with auto-login..."

# Start Next.js dev server in background
npm run dev &
SERVER_PID=$!

# Wait a bit for server to start
echo "⏳ Waiting for server to initialize..."
sleep 5

# Run auto-login script
echo "🔐 Running auto-login..."
node scripts/auto-login.js

echo "✅ Server is running with auto-login complete!"
echo "🌐 Open http://localhost:3000/dashboard in your browser"
echo ""
echo "Press Ctrl+C to stop the server"

# Wait for the server process
wait $SERVER_PID