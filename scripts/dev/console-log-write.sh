#!/bin/bash

# Create logs directory if it doesn't exist
mkdir -p logs/console

# Create a session marker
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > logs/console/.monitoring-session

# Clear previous logs
rm -f logs/console/latest-console-summary.txt
rm -f logs/console/console-log-*.json

echo "🔴 Console monitoring started. All browser console output is being captured."
echo "Use /log-read to stop and view logs, or /log-stop to stop without viewing."
echo ""
echo "NOTE: Refresh your browser for the monitoring to take effect."