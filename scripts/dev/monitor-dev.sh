#!/bin/bash
# monitor-dev.sh

LOG_FILE="dev-monitor.log"
PID_FILE="dev-monitor.pid"

# Function to start monitoring
start_monitoring() {
    echo "Starting dev server monitoring..."
    
    # Monitor dev server output
    npm run dev 2>&1 | while read line; do
        echo "[$(date)] DEV: $line" >> $LOG_FILE
        
        # Check for critical patterns
        if echo "$line" | grep -E "(ERROR|FATAL|failed|crashed)"; then
            echo "[$(date)] ALERT: $line" >> $LOG_FILE
        fi
    done &
    
    echo $! > $PID_FILE
    echo "Monitoring started with PID $(cat $PID_FILE)"
}

# Function to stop monitoring
stop_monitoring() {
    if [ -f $PID_FILE ]; then
        kill $(cat $PID_FILE)
        rm $PID_FILE
        echo "Monitoring stopped"
    fi
}

case "$1" in
    start) start_monitoring ;;
    stop) stop_monitoring ;;
    *) echo "Usage: $0 {start|stop}" ;;
esac