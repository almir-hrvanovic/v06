#!/bin/bash

# GS-CMS Robust Startup Script
# Comprehensive startup with health monitoring and error recovery

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="./logs"
APP_LOG="$LOG_DIR/app-startup.log"
ERROR_LOG="$LOG_DIR/startup-errors.log"
HEALTH_LOG="$LOG_DIR/health-check.log"
PORT=3000
HEALTH_ENDPOINT="http://localhost:$PORT/api/health"
MAX_RETRIES=3
STARTUP_TIMEOUT=60

# Logging functions
log() {
    echo -e "${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC} $1" | tee -a "$APP_LOG"
}

log_warning() {
    echo -e "${YELLOW}$(date '+%Y-%m-%d %H:%M:%S') WARNING:${NC} $1" | tee -a "$APP_LOG"
}

log_error() {
    echo -e "${RED}$(date '+%Y-%m-%d %H:%M:%S') ERROR:${NC} $1" | tee -a "$ERROR_LOG"
}

log_phase() {
    echo -e "${BLUE}$(date '+%Y-%m-%d %H:%M:%S') PHASE:${NC} $1" | tee -a "$APP_LOG"
}

# Error handling
handle_error() {
    local exit_code=$?
    local line_number=$1
    log_error "Script failed at line $line_number with exit code $exit_code"
    log_error "Command: ${BASH_COMMAND}"
    
    # Cleanup on error
    cleanup_on_error
    exit $exit_code
}

cleanup_on_error() {
    log_warning "Performing cleanup due to startup failure..."
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next-server" 2>/dev/null || true
}

# Health check function
health_check() {
    local service_name="$1"
    local endpoint="$2"
    local timeout="${3:-10}"
    
    log "Checking $service_name health..."
    
    if curl -f -s --max-time "$timeout" "$endpoint" > /dev/null 2>&1; then
        log "✅ $service_name is healthy"
        return 0
    else
        log_error "❌ $service_name health check failed"
        return 1
    fi
}

# Wait for service to be ready
wait_for_service() {
    local service_name="$1"
    local port="$2"
    local timeout="${3:-60}"
    local count=0
    
    log "Waiting for $service_name on port $port..."
    
    while [ $count -lt $timeout ]; do
        if lsof -ti:$port > /dev/null 2>&1; then
            log "✅ $service_name is running on port $port"
            return 0
        fi
        
        sleep 1
        count=$((count + 1))
        
        if [ $((count % 10)) -eq 0 ]; then
            log "Still waiting for $service_name... ($count/$timeout seconds)"
        fi
    done
    
    log_error "❌ $service_name failed to start within $timeout seconds"
    return 1
}

# Pre-flight checks
preflight_checks() {
    log_phase "1/6 - Pre-flight Checks"
    
    # Check if port is already in use
    if lsof -ti:$PORT > /dev/null 2>&1; then
        log_warning "Port $PORT is already in use"
        local pid=$(lsof -ti:$PORT)
        log_warning "Process using port $PORT: $(ps -p $pid -o comm= 2>/dev/null || echo 'Unknown')"
        
        read -p "Kill existing process? (y/N): " kill_existing
        if [[ $kill_existing =~ ^[Yy]$ ]]; then
            kill -9 $pid 2>/dev/null || true
            log "Killed process $pid"
            sleep 2
        else
            log_error "Cannot start application while port $PORT is in use"
            exit 1
        fi
    fi
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    local node_version=$(node -v)
    log "Node.js version: $node_version"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        log_error "package.json not found"
        exit 1
    fi
    
    log "✅ Pre-flight checks completed"
}

# Environment setup
setup_environment() {
    log_phase "2/6 - Environment Setup"
    
    # Create logs directory
    mkdir -p "$LOG_DIR"
    
    # Clear previous logs
    > "$APP_LOG"
    > "$ERROR_LOG"
    > "$HEALTH_LOG"
    
    # Check for .env file
    if [ ! -f ".env" ]; then
        log_warning ".env file not found"
        if [ -f ".env.example" ]; then
            log "Creating .env from .env.example"
            cp .env.example .env
        fi
    fi
    
    log "✅ Environment setup completed"
}

# Dependency check
dependency_check() {
    log_phase "3/6 - Dependency Check"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log "node_modules not found, installing dependencies..."
        npm install --silent 2>&1 | tee -a "$APP_LOG"
    else
        log "Dependencies already installed"
        
        # Check if package-lock.json is newer than node_modules
        if [ "package-lock.json" -nt "node_modules" ]; then
            log "package-lock.json is newer, updating dependencies..."
            npm install --silent 2>&1 | tee -a "$APP_LOG"
        fi
    fi
    
    log "✅ Dependency check completed"
}

# Database setup
database_setup() {
    log_phase "4/6 - Database Setup"
    
    # Check if Prisma is configured
    if [ -f "prisma/schema.prisma" ]; then
        log "Setting up database..."
        
        # Generate Prisma client
        npx prisma generate 2>&1 | tee -a "$APP_LOG" || {
            log_error "Failed to generate Prisma client"
            return 1
        }
        
        # Push database schema (if needed)
        npx prisma db push --accept-data-loss 2>&1 | tee -a "$APP_LOG" || {
            log_warning "Database push failed or not needed"
        }
        
        log "✅ Database setup completed"
    else
        log "No Prisma configuration found, skipping database setup"
    fi
}

# Application startup
start_application() {
    log_phase "5/6 - Application Startup"
    
    # Clear any existing processes
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "next-server" 2>/dev/null || true
    sleep 2
    
    log "Starting Next.js development server..."
    
    # Start the application in background
    nohup npm run dev > "$LOG_DIR/next-output.log" 2>&1 &
    local app_pid=$!
    
    echo $app_pid > "$LOG_DIR/app.pid"
    log "Application started with PID: $app_pid"
    
    # Wait for the application to start
    if ! wait_for_service "Next.js Application" "$PORT" "$STARTUP_TIMEOUT"; then
        log_error "Application failed to start"
        
        # Show recent logs
        log_error "Recent application logs:"
        tail -n 20 "$LOG_DIR/next-output.log" | tee -a "$ERROR_LOG"
        
        return 1
    fi
    
    log "✅ Application startup completed"
}

# Health verification
health_verification() {
    log_phase "6/6 - Health Verification"
    
    # Wait a bit for application to fully initialize
    sleep 5
    
    # Test basic connectivity
    log "Testing basic connectivity..."
    if curl -f -s --max-time 10 "http://localhost:$PORT" > /dev/null 2>&1; then
        log "✅ Application is responding"
    else
        log_warning "Application may not be fully ready yet"
    fi
    
    # Test health endpoint if it exists
    if curl -f -s --max-time 10 "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
        log "✅ Health endpoint is responding"
        
        # Get health details
        local health_response=$(curl -s --max-time 10 "$HEALTH_ENDPOINT" 2>/dev/null || echo '{"status":"unknown"}')
        echo "$health_response" | tee -a "$HEALTH_LOG"
    else
        log_warning "Health endpoint not available or not implemented"
    fi
    
    # Check if API routes are accessible
    if curl -f -s --max-time 10 "http://localhost:$PORT/api" > /dev/null 2>&1; then
        log "✅ API routes are accessible"
    else
        log_warning "API routes may not be available"
    fi
    
    log "✅ Health verification completed"
}

# Final status report
final_status_report() {
    echo ""
    echo "🎉 GS-CMS Application Startup Complete!"
    echo "================================================"
    
    # Application URL
    echo "🌐 Application URL: http://localhost:$PORT"
    
    # Health status
    if curl -f -s --max-time 5 "http://localhost:$PORT" > /dev/null 2>&1; then
        echo "✅ Status: RUNNING"
    else
        echo "⚠️  Status: STARTING (may need more time)"
    fi
    
    # Process information
    local app_pid=$(cat "$LOG_DIR/app.pid" 2>/dev/null || echo "unknown")
    echo "🔧 Process ID: $app_pid"
    
    # Log locations
    echo "📋 Logs:"
    echo "   - Application: $APP_LOG"
    echo "   - Errors: $ERROR_LOG"
    echo "   - Health: $HEALTH_LOG"
    echo "   - Next.js: $LOG_DIR/next-output.log"
    
    # Service status
    echo "🔍 Services:"
    if lsof -ti:$PORT > /dev/null 2>&1; then
        echo "   ✅ Web Server (port $PORT)"
    else
        echo "   ❌ Web Server (port $PORT)"
    fi
    
    # Next steps
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Visit http://localhost:$PORT to access the application"
    echo "   2. Check logs in $LOG_DIR/ for any issues"
    echo "   3. Use 'npm run dev' to restart if needed"
    echo "   4. Use './app-stop.sh' to stop the application"
    echo ""
}

# Trap errors
trap 'handle_error $LINENO' ERR

# Main execution
main() {
    echo "🚀 Starting GS-CMS Application with Robust Monitoring..."
    echo "======================================================="
    
    preflight_checks
    setup_environment
    dependency_check
    database_setup
    start_application
    health_verification
    final_status_report
    
    return 0
}

# Execute main function
main "$@" || {
    log_error "Application startup failed"
    echo ""
    echo "❌ Startup Failed!"
    echo "=================="
    echo "Check the following logs for details:"
    echo "- $ERROR_LOG"
    echo "- $LOG_DIR/next-output.log"
    echo ""
    echo "Common solutions:"
    echo "1. Run 'npm install' to update dependencies"
    echo "2. Check if port $PORT is available"
    echo "3. Verify .env configuration"
    echo "4. Check database connection"
    exit 1
}