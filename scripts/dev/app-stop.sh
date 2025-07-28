#!/bin/bash

# ============================================================================
# GS-CMS Application Stop Script
# ============================================================================
# Robust script to stop the GS-CMS application and related services
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/stop-$(date +%Y%m%d_%H%M%S).log"
REQUIRED_PORTS=(3000)

# Create logs directory
mkdir -p "$LOG_DIR"

# ============================================================================
# Logging Functions
# ============================================================================

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Write to log file
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
    
    # Console output with colors
    case $level in
        "INFO")  echo -e "${CYAN}ℹ️  $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        *) echo "$message" ;;
    esac
}

# ============================================================================
# Utility Functions
# ============================================================================

check_port() {
    local port=$1
    lsof -ti:$port 2>/dev/null || true
}

kill_process_on_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(check_port $port)
    if [[ -n "$pid" ]]; then
        local process_info=$(ps -p "$pid" -o command= 2>/dev/null || echo "Unknown process")
        log "INFO" "Found $service_name on port $port (PID: $pid)"
        log "INFO" "Process: $process_info"
        
        # Graceful termination first
        log "INFO" "Sending TERM signal to PID $pid..."
        kill -TERM "$pid" 2>/dev/null || true
        
        # Wait a bit for graceful shutdown
        sleep 3
        
        # Check if still running
        pid=$(check_port $port)
        if [[ -n "$pid" ]]; then
            log "WARNING" "Process still running, sending KILL signal..."
            kill -KILL "$pid" 2>/dev/null || true
            sleep 2
            
            # Final check
            pid=$(check_port $port)
            if [[ -n "$pid" ]]; then
                log "ERROR" "Failed to kill process on port $port"
                return 1
            fi
        fi
        
        log "SUCCESS" "$service_name stopped successfully"
        return 0
    else
        log "INFO" "$service_name not running on port $port"
        return 0
    fi
}

stop_related_processes() {
    log "INFO" "Searching for related Node.js/Next.js processes..."
    
    # Find all node processes related to this project
    local node_processes=$(ps aux | grep -E "(next|npm.*dev|gs-cms)" | grep -v grep | awk '{print $2}' || true)
    
    if [[ -n "$node_processes" ]]; then
        log "INFO" "Found related processes:"
        ps aux | grep -E "(next|npm.*dev|gs-cms)" | grep -v grep || true
        
        echo ""
        read -p "Stop these processes? (y/n): " -n 1 -r
        echo ""
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Stopping related processes..."
            echo "$node_processes" | while read -r pid; do
                if [[ -n "$pid" ]]; then
                    log "INFO" "Stopping PID: $pid"
                    kill -TERM "$pid" 2>/dev/null || true
                fi
            done
            
            sleep 3
            
            # Force kill any remaining
            node_processes=$(ps aux | grep -E "(next|npm.*dev|gs-cms)" | grep -v grep | awk '{print $2}' || true)
            if [[ -n "$node_processes" ]]; then
                log "WARNING" "Force killing remaining processes..."
                echo "$node_processes" | while read -r pid; do
                    if [[ -n "$pid" ]]; then
                        kill -KILL "$pid" 2>/dev/null || true
                    fi
                done
            fi
            
            log "SUCCESS" "Related processes stopped"
        else
            log "INFO" "Skipping related processes"
        fi
    else
        log "SUCCESS" "No related processes found"
    fi
}

# ============================================================================
# Main Stop Function
# ============================================================================

main() {
    echo ""
    echo "============================================================================"
    echo -e "${BLUE}🛑 GS-CMS Application Stop Script${NC}"
    echo "============================================================================"
    log "INFO" "Starting application shutdown process"
    log "INFO" "Log file: $LOG_FILE"
    echo ""
    
    # Stop main application on port 3000
    log "INFO" "Phase 1: Stopping main application"
    echo "-------------------------------------"
    
    local stopped_any=false
    for port in "${REQUIRED_PORTS[@]}"; do
        if kill_process_on_port $port "GS-CMS Application"; then
            stopped_any=true
        fi
    done
    
    # Stop related processes
    echo ""
    log "INFO" "Phase 2: Checking for related processes"
    echo "----------------------------------------"
    stop_related_processes
    
    # Clean up resources
    echo ""
    log "INFO" "Phase 3: Cleanup"
    echo "-----------------"
    
    log "INFO" "Cleaning up lock files and cache..."
    
    # Remove Next.js cache and lock files
    if [[ -d ".next" ]]; then
        rm -rf .next/cache 2>/dev/null || true
        log "SUCCESS" "Next.js cache cleared"
    fi
    
    # Remove node_modules cache
    if [[ -d "node_modules/.cache" ]]; then
        rm -rf node_modules/.cache 2>/dev/null || true
        log "SUCCESS" "Node modules cache cleared"
    fi
    
    # Remove TypeScript build info
    if [[ -f "tsconfig.tsbuildinfo" ]]; then
        rm -f tsconfig.tsbuildinfo 2>/dev/null || true
        log "SUCCESS" "TypeScript build info cleared"
    fi
    
    # Final verification
    echo ""
    log "INFO" "Phase 4: Final Verification"
    echo "----------------------------"
    
    local still_running=false
    for port in "${REQUIRED_PORTS[@]}"; do
        local pid=$(check_port $port)
        if [[ -n "$pid" ]]; then
            log "ERROR" "Port $port is still in use (PID: $pid)"
            still_running=true
        else
            log "SUCCESS" "Port $port is free"
        fi
    done
    
    echo ""
    echo "============================================================================"
    if [[ "$still_running" == "true" ]]; then
        log "WARNING" "⚠️  Some services may still be running"
        echo ""
        log "INFO" "Manual cleanup may be required:"
        echo "   - Check running processes: ps aux | grep next"
        echo "   - Kill specific process: kill <PID>"
        echo "   - Check ports: lsof -ti:3000"
    else
        log "SUCCESS" "🎉 All services stopped successfully!"
        echo ""
        log "INFO" "📋 To restart the application:"
        echo "   🚀 Run: ./start-robust.sh"
        echo "   🚀 Or use: /app-start (Claude Code command)"
    fi
    echo "============================================================================"
    echo ""
}

# ============================================================================
# Script Entry Point
# ============================================================================

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [options]"
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --force, -f    Force stop without prompts"
        exit 0
        ;;
    --force|-f)
        log "INFO" "Force mode enabled - no prompts"
        # You can implement force mode logic here if needed
        ;;
esac

# Start the main execution
main "$@"