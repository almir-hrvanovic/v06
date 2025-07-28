#!/bin/bash

# Check if monitoring is active
if [ ! -f "logs/console/.monitoring-session" ]; then
  echo "⚠️  No active monitoring session found."
  exit 1
fi

# Get session start time
SESSION_START=$(cat logs/console/.monitoring-session)

# Stop monitoring
rm -f logs/console/.monitoring-session

echo "⏹️  Console monitoring stopped."
echo "Session started at: $SESSION_START"
echo ""
echo "Log files preserved in: logs/console/"
echo "Use /log-read to view the captured logs later."