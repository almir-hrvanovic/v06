#!/bin/bash

# GS-CMS Application Stop Script
# Gracefully stops the Next.js application and cleans up resources

set -e

echo "🛑 Stopping GS-CMS Application..."

# Function to check if a process exists
process_exists() {
    ps -p "$1" > /dev/null 2>&1
}

# Function to gracefully stop processes
stop_processes() {
    local pattern="$1"
    local description="$2"
    
    echo "Stopping $description..."
    
    # Get PIDs
    local pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    
    if [ -z "$pids" ]; then
        echo "✅ No $description processes found"
        return 0
    fi
    
    # Send TERM signal first
    for pid in $pids; do
        if process_exists "$pid"; then
            echo "🔄 Sending TERM signal to $description (PID: $pid)"
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done
    
    # Wait up to 10 seconds for graceful shutdown
    local count=0
    while [ $count -lt 10 ]; do
        local remaining_pids=""
        for pid in $pids; do
            if process_exists "$pid"; then
                remaining_pids="$remaining_pids $pid"
            fi
        done
        
        if [ -z "$remaining_pids" ]; then
            echo "✅ $description stopped gracefully"
            return 0
        fi
        
        sleep 1
        count=$((count + 1))
    done
    
    # Force kill if still running
    for pid in $pids; do
        if process_exists "$pid"; then
            echo "⚠️  Force killing $description (PID: $pid)"
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
    
    echo "✅ $description stopped (force killed)"
}

# Function to kill processes on specific port
kill_port_processes() {
    local port="$1"
    echo "Checking port $port..."
    
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -z "$pids" ]; then
        echo "✅ Port $port is free"
        return 0
    fi
    
    echo "🔄 Killing processes on port $port"
    for pid in $pids; do
        if process_exists "$pid"; then
            kill -9 "$pid" 2>/dev/null || true
            echo "🗑️  Killed process $pid on port $port"
        fi
    done
    
    echo "✅ Port $port is now free"
}

# Function to clean up files
cleanup_files() {
    echo "🧹 Cleaning up cache and build artifacts..."
    
    # Next.js cache
    if [ -d ".next/cache" ]; then
        rm -rf .next/cache
        echo "🗑️  Removed .next/cache"
    fi
    
    if [ -d ".next/server" ]; then
        rm -rf .next/server
        echo "🗑️  Removed .next/server"
    fi
    
    if [ -d ".next/static" ]; then
        rm -rf .next/static
        echo "🗑️  Removed .next/static"
    fi
    
    # Node modules cache
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        echo "🗑️  Removed node_modules/.cache"
    fi
    
    # Package lock
    if [ -f "package-lock.json" ]; then
        rm -f package-lock.json
        echo "🗑️  Removed package-lock.json"
    fi
    
    # Temp files
    if [ -d "temp" ]; then
        rm -rf temp
        echo "🗑️  Removed temp directory"
    fi
    
    echo "✅ Cleanup completed"
}

# Function to final verification
final_verification() {
    echo "🔍 Final verification..."
    
    # Check port 3000
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo "⚠️  Port 3000 is still occupied"
        lsof -i:3000
        return 1
    else
        echo "✅ Port 3000 is free"
    fi
    
    # Check for remaining Next.js processes
    local remaining=$(pgrep -f "next" 2>/dev/null || true)
    if [ -n "$remaining" ]; then
        echo "⚠️  Some Next.js processes are still running:"
        ps -p $remaining -o pid,ppid,cmd --no-headers
        return 1
    else
        echo "✅ No Next.js processes running"
    fi
    
    return 0
}

# Main execution
main() {
    echo "🏁 Starting GS-CMS application shutdown sequence..."
    
    # Stop Next.js development servers
    stop_processes "next dev" "Next.js development servers"
    
    # Stop Next.js server processes
    stop_processes "next-server" "Next.js server processes"
    
    # Kill any processes on port 3000
    kill_port_processes "3000"
    
    # Clean up files
    cleanup_files
    
    # Final verification
    if final_verification; then
        echo ""
        echo "🎉 GS-CMS Application stopped successfully!"
        echo "📊 Summary:"
        echo "   ✅ Next.js development servers stopped"
        echo "   ✅ Next.js server processes stopped"
        echo "   ✅ Port 3000 is free"
        echo "   ✅ Cache and build artifacts cleaned"
        echo "   ✅ All processes verified stopped"
        exit 0
    else
        echo ""
        echo "⚠️  Application stopped with warnings"
        echo "📋 Manual cleanup may be required for remaining processes"
        exit 1
    fi
}

# Execute main function
main "$@"