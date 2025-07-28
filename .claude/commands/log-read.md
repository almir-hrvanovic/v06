# Stop Monitoring and Read Browser Console Logs

Stop the console monitoring session and display all captured console output.

## Instructions:

1. Check if a monitoring session is active
2. Stop the monitoring session
3. Read and display all captured console logs
4. Provide a summary of errors and warnings if any

## Implementation:

```bash
# Check if monitoring is active
if [ ! -f "logs/console/.monitoring-session" ]; then
  echo "⚠️  No active monitoring session found."
  exit 1
fi

# Stop monitoring
rm -f logs/console/.monitoring-session
echo "⏹️  Console monitoring stopped."

# Read the console logs
echo ""
echo "📋 === CAPTURED CONSOLE OUTPUT ==="
echo ""

# Check if summary exists
if [ -f "logs/console/latest-console-summary.txt" ]; then
  cat logs/console/latest-console-summary.txt
else
  echo "No console output captured during this session."
fi

# Count errors and warnings
if [ -f "logs/console/latest-console-summary.txt" ]; then
  ERROR_COUNT=$(grep -c "ERROR:" logs/console/latest-console-summary.txt || true)
  WARN_COUNT=$(grep -c "WARN:" logs/console/latest-console-summary.txt || true)
  
  echo ""
  echo "📊 === SUMMARY ==="
  echo "Errors: $ERROR_COUNT"
  echo "Warnings: $WARN_COUNT"
fi

# List all log files
echo ""
echo "📁 === LOG FILES ==="
ls -la logs/console/console-log-*.json 2>/dev/null || echo "No JSON log files found."
```