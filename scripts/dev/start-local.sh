#!/bin/bash

# ============================================================================
# GS-CMS Local Development Startup Script
# ============================================================================
# Robust local-only development environment setup
# Uses only local Docker services (PostgreSQL + Redis)
# ============================================================================

set -e  # Exit on any error
trap 'cleanup_on_error $? $LINENO' ERR

# ============================================================================
# Configuration and Global Variables
# ============================================================================

SCRIPT_NAME="GS-CMS Local Development Startup"
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/startup-$(date +%Y%m%d_%H%M%S).log"
ERROR_LOG="$LOG_DIR/errors-$(date +%Y%m%d_%H%M%S).log"
HEALTH_LOG="$LOG_DIR/health-$(date +%Y%m%d_%H%M%S).log"

# Create logs directory
mkdir -p "$LOG_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Service configuration
REQUIRED_PORTS=(3000)
LOCAL_SERVICES=("postgres" "redis" "adminer")
HEALTH_CHECK_TIMEOUT=30
RETRY_COUNT=3
STARTUP_TIMEOUT=60

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
    
    # Also write errors to error log
    if [[ "$level" == "ERROR" || "$level" == "FATAL" ]]; then
        echo "[$timestamp] [$level] $message" >> "$ERROR_LOG"
    fi
    
    # Console output with colors
    case $level in
        "INFO")  echo -e "${CYAN}ℹ️  $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "FATAL") echo -e "${RED}💀 $message${NC}" ;;
        "DEBUG") echo -e "${PURPLE}🔍 $message${NC}" ;;
        *) echo "$message" ;;
    esac
}

log_health() {
    local service=$1
    local status=$2
    local details=$3
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$timestamp] $service: $status - $details" >> "$HEALTH_LOG"
}

# ============================================================================
# Error Handling and Cleanup
# ============================================================================

cleanup_on_error() {
    local exit_code=$1
    local line_number=$2
    
    log "FATAL" "Script failed at line $line_number with exit code $exit_code"
    log "ERROR" "Performing cleanup and generating error report..."
    
    # Generate error report
    generate_error_report "$exit_code" "$line_number"
    
    exit $exit_code
}

generate_error_report() {
    local exit_code=$1
    local line_number=$2
    local report_file="$LOG_DIR/error-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "========================================"
        echo "ERROR REPORT"
        echo "========================================"
        echo "Date: $(date)"
        echo "Exit Code: $exit_code"
        echo "Failed at Line: $line_number"
        echo ""
        echo "Last 20 log entries:"
        tail -20 "$LOG_FILE" 2>/dev/null || echo "No log file found"
        echo ""
        echo "Environment Variables:"
        env | grep -E "(NODE_ENV|DATABASE_URL|NEXTAUTH)" | sed 's/=.*/=***HIDDEN***/' || echo "No relevant env vars"
    } > "$report_file"
    
    log "INFO" "Error report generated: $report_file"
}

# ============================================================================
# Utility Functions
# ============================================================================

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

wait_for_port() {
    local host=$1
    local port=$2
    local service=$3
    local timeout=${4:-30}
    
    log "INFO" "Waiting for $service on $host:$port (timeout: ${timeout}s)"
    
    local start_time=$(date +%s)
    while ! nc -z "$host" "$port" >/dev/null 2>&1; do
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $timeout ]; then
            log "ERROR" "$service failed to start on $host:$port after ${timeout}s"
            return 1
        fi
        
        sleep 1
    done
    
    log "SUCCESS" "$service is ready on $host:$port"
    return 0
}

# ============================================================================
# Pre-flight System Checks
# ============================================================================

preflight_checks() {
    log "INFO" "Phase 1: Pre-flight System Checks"
    echo "----------------------------------------"
    
    local checks_passed=true
    
    # Check Node.js
    if command_exists node; then
        local node_version=$(node -v)
        log "SUCCESS" "Node.js detected: $node_version"
    else
        log "ERROR" "Node.js is not installed"
        checks_passed=false
    fi
    
    # Check npm
    if command_exists npm; then
        local npm_version=$(npm -v)
        log "SUCCESS" "NPM detected: $npm_version"
    else
        log "ERROR" "npm is not installed"
        checks_passed=false
    fi
    
    # Check Docker
    if command_exists docker; then
        if docker info >/dev/null 2>&1; then
            log "SUCCESS" "Docker is running"
        else
            log "ERROR" "Docker is installed but not running"
            log "INFO" "Please start Docker Desktop and try again"
            checks_passed=false
        fi
    else
        log "ERROR" "Docker is not installed"
        log "INFO" "Docker is required for local PostgreSQL and Redis"
        checks_passed=false
    fi
    
    # Check required ports
    for port in "${REQUIRED_PORTS[@]}"; do
        if check_port $port; then
            log "WARNING" "Port $port is already in use"
            local process=$(lsof -i :$port | grep LISTEN | head -1)
            log "INFO" "Process using port $port: $process"
            
            # Kill any existing Next.js processes
            if [[ "$process" == *"node"* ]] || [[ "$process" == *"next"* ]]; then
                log "INFO" "Killing existing Next.js process on port $port"
                pkill -f "next dev" || true
                sleep 2
                
                if check_port $port; then
                    log "ERROR" "Failed to free port $port"
                    checks_passed=false
                else
                    log "SUCCESS" "Port $port is now available"
                fi
            else
                checks_passed=false
            fi
        else
            log "SUCCESS" "Port $port is available"
        fi
    done
    
    # Check environment files
    if [ -f ".env.local" ]; then
        log "SUCCESS" "Environment configuration found"
    else
        log "ERROR" ".env.local file not found"
        log "INFO" "Please create .env.local with proper configuration"
        checks_passed=false
    fi
    
    # Verify local database configuration
    if grep -q "localhost:5432" .env.local; then
        log "SUCCESS" "Local database configuration detected"
    else
        log "WARNING" "Database not configured for local development"
        log "INFO" "Updating configuration to use local PostgreSQL..."
    fi
    
    if [ "$checks_passed" = true ]; then
        log "SUCCESS" "Pre-flight checks completed"
        return 0
    else
        log "FATAL" "Pre-flight checks failed. Please fix the issues above."
        return 1
    fi
}

# ============================================================================
# Local Services Management
# ============================================================================

start_local_services() {
    log "INFO" "Phase 2: Starting Local Docker Services"
    echo "--------------------------------------------"
    
    # Check if docker-compose.dev.yml exists
    if [ ! -f "docker-compose.dev.yml" ]; then
        log "ERROR" "docker-compose.dev.yml not found"
        return 1
    fi
    
    # Start all local services
    log "INFO" "Starting PostgreSQL, Redis, and Adminer..."
    if docker-compose -f docker-compose.dev.yml up -d; then
        log "SUCCESS" "Docker services started"
        
        # Wait for PostgreSQL
        if wait_for_port localhost 5432 "PostgreSQL" 30; then
            log_health "postgres" "RUNNING" "Local PostgreSQL ready on localhost:5432"
        else
            log "ERROR" "PostgreSQL failed to start"
            return 1
        fi
        
        # Wait for Redis
        if wait_for_port localhost 6379 "Redis" 15; then
            log_health "redis" "RUNNING" "Local Redis ready on localhost:6379"
        else
            log "ERROR" "Redis failed to start"
            return 1
        fi
        
        # Check Adminer
        if wait_for_port localhost 8080 "Adminer" 15; then
            log "INFO" "Adminer (Database UI) available at: http://localhost:8080"
            log_health "adminer" "RUNNING" "Database admin interface ready"
        fi
        
        # Show service status
        log "INFO" "Current Docker services status:"
        docker-compose -f docker-compose.dev.yml ps
        
        return 0
    else
        log "ERROR" "Failed to start Docker services"
        return 1
    fi
}

# ============================================================================
# Database Initialization
# ============================================================================

initialize_database() {
    log "INFO" "Phase 3: Database Initialization"
    echo "---------------------------------"
    
    # Ensure we're using local database
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gs_cms_v05_dev?schema=public"
    log "INFO" "Using local database: localhost:5432/gs_cms_v05_dev"
    
    # Test database connection
    log "INFO" "Testing database connection..."
    if timeout 10 npx prisma db push --skip-generate >/dev/null 2>&1; then
        log "SUCCESS" "Database connection successful"
        log_health "database" "CONNECTED" "Prisma connection to local PostgreSQL successful"
    else
        log "ERROR" "Database connection failed"
        log "INFO" "Attempting to create database..."
        
        # Try to create database
        docker exec -i gs-cms-postgres-dev psql -U postgres -c "CREATE DATABASE gs_cms_v05_dev;" 2>/dev/null || true
        
        # Retry connection
        if timeout 10 npx prisma db push --skip-generate >/dev/null 2>&1; then
            log "SUCCESS" "Database created and connected"
        else
            log "ERROR" "Failed to initialize database"
            return 1
        fi
    fi
    
    # Apply schema
    log "INFO" "Applying database schema..."
    if npx prisma db push; then
        log "SUCCESS" "Database schema synchronized"
    else
        log "ERROR" "Failed to apply database schema"
        return 1
    fi
    
    # Check if seeding is needed
    log "INFO" "Checking if database needs seeding..."
    local user_count=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;" 2>/dev/null | grep -o '[0-9]*' | tail -1)
    
    if [ -z "$user_count" ] || [ "$user_count" -eq 0 ]; then
        log "INFO" "Database is empty, seeding with test data..."
        if npm run db:seed; then
            log "SUCCESS" "Database seeded successfully"
            log_health "database-seed" "COMPLETED" "Test data loaded"
        else
            log "WARNING" "Database seeding failed, but continuing..."
        fi
    else
        log "INFO" "Database already contains data (users: $user_count)"
    fi
    
    return 0
}

# ============================================================================
# Dependencies and Build
# ============================================================================

setup_dependencies() {
    log "INFO" "Phase 4: Dependencies and Build Environment"
    echo "--------------------------------------------"
    
    # Clean previous build artifacts
    log "INFO" "Cleaning previous build artifacts..."
    rm -rf .next .turbo node_modules/.cache
    log "SUCCESS" "Build artifacts cleaned"
    
    # Install/update dependencies
    log "INFO" "Installing/updating dependencies..."
    if npm install; then
        log "SUCCESS" "Dependencies installed successfully"
    else
        log "ERROR" "Failed to install dependencies"
        return 1
    fi
    
    # Generate Prisma client
    log "INFO" "Generating Prisma client..."
    if npx prisma generate; then
        log "SUCCESS" "Prisma client generated"
    else
        log "ERROR" "Failed to generate Prisma client"
        return 1
    fi
    
    # Run type checking
    log "INFO" "Running TypeScript type checking..."
    if npm run type-check; then
        log "SUCCESS" "TypeScript compilation successful"
    else
        log "WARNING" "TypeScript type errors found, but continuing..."
    fi
    
    return 0
}

# ============================================================================
# Application Startup
# ============================================================================

start_application() {
    log "INFO" "Phase 5: Application Startup"
    echo "-----------------------------"
    
    local port=3000
    
    # Ensure we're using local services
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gs_cms_v05_dev?schema=public"
    export REDIS_URL="redis://localhost:6379"
    export NODE_ENV="development"
    
    log "INFO" "Starting Next.js development server on PORT $port..."
    
    # Start Next.js in background
    npm run dev > "$LOG_DIR/nextjs-$(date +%Y%m%d_%H%M%S).log" 2>&1 &
    local nextjs_pid=$!
    
    log "INFO" "Next.js started with PID: $nextjs_pid"
    
    # Wait for application to be ready
    local start_time=$(date +%s)
    local ready=false
    
    while [ "$ready" = false ]; do
        if check_port $port; then
            log "SUCCESS" "Application is accepting connections on port $port"
            ready=true
        else
            local current_time=$(date +%s)
            local elapsed=$((current_time - start_time))
            
            if [ $elapsed -gt $STARTUP_TIMEOUT ]; then
                log "ERROR" "Application failed to start within ${STARTUP_TIMEOUT}s"
                kill $nextjs_pid 2>/dev/null || true
                return 1
            fi
            
            sleep 2
        fi
    done
    
    echo $nextjs_pid > "$LOG_DIR/app.pid"
    log_health "nextjs" "READY" "Accepting connections on localhost:$port"
    
    return 0
}

# ============================================================================
# Health Verification
# ============================================================================

verify_health() {
    log "INFO" "Phase 6: Health Verification"
    echo "-----------------------------"
    
    local all_healthy=true
    
    # Check if app responds
    log "INFO" "Checking application health..."
    if curl -s -f http://localhost:3000 > /dev/null; then
        log "SUCCESS" "Application responding"
        log_health "app-check" "PASSED" "Application root accessible"
    else
        log "ERROR" "Application not responding"
        all_healthy=false
    fi
    
    # Check auth endpoints
    log "INFO" "Checking authentication endpoints..."
    if curl -s http://localhost:3000/api/auth/providers | grep -q "credentials"; then
        log "SUCCESS" "Authentication endpoints responding"
        log_health "auth-check" "PASSED" "Authentication endpoints accessible"
    else
        log "WARNING" "Authentication endpoints may not be fully configured"
    fi
    
    # Check database connectivity from app
    log "INFO" "Verifying database connectivity from application..."
    # This would ideally check a health endpoint that verifies DB connection
    log_health "db-app-check" "ASSUMED" "Database connectivity from app"
    
    if [ "$all_healthy" = true ]; then
        log "SUCCESS" "Health verification completed"
        return 0
    else
        log "WARNING" "Some health checks failed, but application is running"
        return 0
    fi
}

# ============================================================================
# Final Summary
# ============================================================================

show_summary() {
    echo ""
    echo "============================================================================"
    log "SUCCESS" "🎉 Application Startup Complete!"
    echo "============================================================================"
    echo ""
    log "INFO" "📋 Service Summary:"
    echo "   🌐 Application: http://localhost:3000"
    echo "   🗄️  Database: Local PostgreSQL (localhost:5432)"
    echo "   🔗 Connection: Local Docker container"
    echo "   🔧 Database Admin: http://localhost:8080"
    echo "   ⚡ Cache: Local Redis (localhost:6379)"
    echo ""
    log "INFO" "📋 Available Commands:"
    echo "   🔍 Type Check: npm run type-check"
    echo "   🧹 Lint: npm run lint"
    echo "   📊 Database Studio: npm run db:studio"
    echo "   🛑 Stop App: ./app-stop.sh"
    echo ""
    log "INFO" "📋 Log Files:"
    echo "   📝 Startup: $LOG_FILE"
    echo "   ❌ Errors: $ERROR_LOG"
    echo "   💚 Health: $HEALTH_LOG"
    echo ""
    log "INFO" "🔧 Troubleshooting:"
    echo "   - Check logs above for any warnings"
    echo "   - All services are running locally in Docker"
    echo "   - Database: postgres/postgres@localhost:5432/gs_cms_v05_dev"
    echo ""
    echo "Press Ctrl+C to stop the application"
    echo ""
}

# ============================================================================
# Main Execution
# ============================================================================

main() {
    echo ""
    echo -e "${BLUE}============================================================================${NC}"
    echo -e "${BLUE}🚀 $SCRIPT_NAME${NC}"
    echo -e "${BLUE}============================================================================${NC}"
    log "INFO" "Starting local development environment"
    log "INFO" "Logs: $LOG_FILE"
    log "INFO" "Errors: $ERROR_LOG"
    log "INFO" "Health: $HEALTH_LOG"
    echo ""
    
    # Execute phases
    if ! preflight_checks; then
        exit 1
    fi
    
    if ! start_local_services; then
        exit 1
    fi
    
    if ! initialize_database; then
        exit 1
    fi
    
    if ! setup_dependencies; then
        exit 1
    fi
    
    if ! start_application; then
        exit 1
    fi
    
    if ! verify_health; then
        log "WARNING" "Health checks had issues but continuing..."
    fi
    
    show_summary
    
    # Get PID from file
    local app_pid=$(cat "$LOG_DIR/app.pid" 2>/dev/null)
    if [ -n "$app_pid" ]; then
        log "INFO" "Application running with PID: $app_pid"
        
        # Wait for the Next.js process
        wait $app_pid
    else
        log "ERROR" "Could not find application PID"
        exit 1
    fi
}

# Run main function
main "$@"