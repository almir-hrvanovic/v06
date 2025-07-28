#!/bin/bash

# Autofix Environment Startup Script
# This script starts the complete autofix environment with MCP integration

echo "🚀 Starting Autofix Environment for GS-CMS"
echo "=========================================="

# Ensure logs directory exists
mkdir -p logs

# Check if required dependencies are installed
echo "📦 Checking dependencies..."

if ! command -v browser-tools-mcp &> /dev/null; then
    echo "❌ Browser Tools MCP not found. Installing..."
    npm install -g @agentdeskai/browser-tools-mcp
fi

if ! command -v ts-node &> /dev/null; then
    echo "❌ ts-node not found. Installing..."
    npm install -g ts-node
fi

echo "✅ Dependencies ready"

# Create session log
SESSION_LOG="logs/autofix-session-$(date +%Y%m%d_%H%M%S).log"
echo "📝 Session log: $SESSION_LOG"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🔄 Shutting down autofix environment..."
    kill $AUTOFIX_PID 2>/dev/null
    kill $PROCESSOR_PID 2>/dev/null
    kill $MCP_PID 2>/dev/null
    echo "✅ Cleanup complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🌐 Starting Browser Tools MCP server..."
browser-tools-mcp > logs/mcp-browser-tools.log 2>&1 &
MCP_PID=$!

# Wait a moment for MCP server to start
sleep 2

echo "🔧 Starting Autofix Environment..."
ts-node scripts/autofix-environment.ts > $SESSION_LOG 2>&1 &
AUTOFIX_PID=$!

echo "🤖 Starting Claude Autofix Processor..."
ts-node scripts/claude-autofix-processor.ts >> $SESSION_LOG 2>&1 &
PROCESSOR_PID=$!

echo ""
echo "✅ Autofix Environment Started Successfully!"
echo ""
echo "📊 Dashboard: http://localhost:3001/autofix-dashboard"
echo "📱 Dev Server: http://localhost:3000"
echo "📝 Session Log: $SESSION_LOG"
echo ""
echo "🎯 Features Active:"
echo "   • Real-time error monitoring"
echo "   • Browser console capture"
echo "   • Dev server log analysis"
echo "   • Automated fix suggestions"
echo "   • Claude Code integration"
echo "   • MCP browser tools"
echo ""
echo "💡 The system will:"
echo "   1. Monitor your dev server and browser for errors"
echo "   2. Automatically detect recurring issues"
echo "   3. Generate fix suggestions using Claude Code"
echo "   4. Apply safe automated fixes when possible"
echo "   5. Run tests to verify fixes work"
echo ""
echo "Press Ctrl+C to stop the autofix environment"
echo ""

# Wait for processes to complete or be interrupted
wait $AUTOFIX_PID
wait $PROCESSOR_PID
wait $MCP_PID