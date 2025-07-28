# Start Browser Console Monitoring

Start capturing all browser console output (logs, errors, warnings) for debugging.

## Instructions:

1. First, ensure the development server is running
2. Initialize the console monitoring system by creating a monitoring session
3. All console output will be captured to files in the logs/console directory
4. The monitoring will continue until you run /log-read or /log-stop

## Implementation:

Create a monitoring session file to track the active state and implement the following:

```bash
# Create a session marker
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > logs/console/.monitoring-session

# Clear previous logs
rm -f logs/console/latest-console-summary.txt
rm -f logs/console/console-log-*.json

# Notify that monitoring has started
echo "🔴 Console monitoring started. All browser console output is being captured."
echo "Use /log-read to stop and view logs, or /log-stop to stop without viewing."
```

The browser console monitor is already integrated into the application and will automatically capture all console output when the app is running.