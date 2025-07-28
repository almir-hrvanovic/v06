#!/bin/bash

# ============================================================================
# GS-CMS Local Development Startup Script
# ============================================================================
# Local-only development environment with comprehensive logging
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
OPTIONAL_SERVICES=("docker" "redis" "postgres")
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
    
    # Attempt graceful cleanup
    cleanup_services
    
    exit $exit_code
}

generate_error_report() {
    local exit_code=$1
    local line_number=$2
    local report_file="$LOG_DIR/error-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "==============================================="
        echo "GS-CMS Startup Error Report"
        echo "==============================================="
        echo "Timestamp: $(date)"
        echo "Exit Code: $exit_code"
        echo "Failed Line: $line_number"
        echo "Script: $0"
        echo ""
        echo "System Information:"
        echo "- OS: $(uname -a)"
        echo "- Node.js: $(node -v 2>/dev/null || echo 'Not installed')"
        echo "- NPM: $(npm -v 2>/dev/null || echo 'Not installed')"
        echo "- Docker: $(docker -v 2>/dev/null || echo 'Not installed')"
        echo ""
        echo "Process Information:"
        ps aux | grep -E "(node|npm|next|docker)" | grep -v grep || echo "No relevant processes found"
        echo ""
        echo "Port Usage:"
        netstat -tlnp 2>/dev/null | grep -E ":(3000|3001|5432|6379)" || echo "No ports in use"
        echo ""
        echo "Last 20 log entries:"
        tail -20 "$LOG_FILE" 2>/dev/null || echo "No log file found"
        echo ""
        echo "Environment Variables:"
        env | grep -E "(NODE_ENV|DATABASE_URL|NEXTAUTH)" | sed 's/=.*/=***HIDDEN***/' || echo "No relevant env vars"
    } > "$report_file"
    
    log "INFO" "Error report generated: $report_file"
}

cleanup_services() {
    log "INFO" "Attempting to cleanup running services..."
    
    # Kill processes on required ports
    for port in "${REQUIRED_PORTS[@]}"; do
        local pid=$(lsof -ti:$port 2>/dev/null || true)
        if [[ -n "$pid" ]]; then
            log "INFO" "Killing process on port $port (PID: $pid)"
            kill -TERM "$pid" 2>/dev/null || true
            sleep 2
        fi
    done
}

# ============================================================================
# Utility Functions
# ============================================================================

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

check_port() {
    local port=$1
    lsof -ti:$port 2>/dev/null || true
}

wait_for_port() {
    local host=$1
    local port=$2
    local service_name=$3
    local timeout=${4:-30}
    
    log "INFO" "Waiting for $service_name on $host:$port (timeout: ${timeout}s)"
    
    for ((i=1; i<=timeout; i++)); do
        if nc -z "$host" "$port" 2>/dev/null; then
            log "SUCCESS" "$service_name is ready on $host:$port"
            log_health "$service_name" "READY" "Connected to $host:$port"
            return 0
        fi
        
        if ((i % 5 == 0)); then
            log "DEBUG" "Still waiting for $service_name... ($i/${timeout}s)"
        fi
        sleep 1
    done
    
    log "WARNING" "$service_name not ready after ${timeout}s timeout"
    log_health "$service_name" "TIMEOUT" "Failed to connect to $host:$port after ${timeout}s"
    return 1
}

ensure_local_database() {
    log "INFO" "Ensuring local database configuration..."
    
    # Force local database configuration
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gs_cms_v05_dev?schema=public"
    export REDIS_URL="redis://localhost:6379"
    
    log "SUCCESS" "Local database configuration set"
    log_health "database-config" "LOCAL" "Using local Docker PostgreSQL"
    return 0
}

start_local_services() {
    log "INFO" "Starting local Docker services..."
    
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
        
        return 0
    else
        log "ERROR" "Failed to start Docker services"
        return 1
    fi
}

initialize_database() {
    log "INFO" "Initializing local database..."
    
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

test_database_connection() {
    log "INFO" "Testing database connection..."
    
    if npm run type-check >/dev/null 2>&1; then
        log "SUCCESS" "TypeScript compilation successful"
    else
        log "WARNING" "TypeScript compilation has issues (may be non-critical)"
    fi
    
    # Test Prisma connection
    if npx prisma db push --skip-generate --accept-data-loss >/dev/null 2>&1; then
        log "SUCCESS" "Database connection and schema are valid"
        log_health "database" "CONNECTED" "Prisma connection successful"
        return 0
    else
        log "ERROR" "Database connection or schema issues detected"
        log_health "database" "FAILED" "Prisma connection failed"
        return 1
    fi
}

# ============================================================================
# Startup Phases
# ============================================================================

phase_init() {
    echo ""
    echo "============================================================================"
    echo -e "${BLUE}🚀 $SCRIPT_NAME${NC}"
    echo "============================================================================"
    log "INFO" "Starting robust application startup process"
    log "INFO" "Logs: $LOG_FILE"
    log "INFO" "Errors: $ERROR_LOG"
    log "INFO" "Health: $HEALTH_LOG"
    echo ""
}

phase_preflight() {
    log "INFO" "Phase 1: Pre-flight System Checks"
    echo "----------------------------------------"
    
    # Check if running from project root
    if [[ ! -f "package.json" ]]; then
        log "FATAL" "package.json not found. Please run from project root directory"
        exit 1
    fi
    
    # Check Node.js
    if ! command_exists node; then
        log "FATAL" "Node.js is not installed"
        exit 1
    fi
    local node_version=$(node -v)
    log "SUCCESS" "Node.js detected: $node_version"
    
    # Check NPM
    if ! command_exists npm; then
        log "FATAL" "NPM is not installed"
        exit 1
    fi
    local npm_version=$(npm -v)
    log "SUCCESS" "NPM detected: $npm_version"
    
    # Check port availability - ROBUST approach for port 3000 ONLY
    for port in "${REQUIRED_PORTS[@]}"; do
        local pid=$(check_port $port)
        if [[ -n "$pid" ]]; then
            log "WARNING" "Port $port is already in use (PID: $pid)"
            
            # Check if it's already our application
            local process_info=$(ps -p "$pid" -o command= 2>/dev/null || echo "")
            if [[ "$process_info" == *"next dev"* ]] || [[ "$process_info" == *"gs-cms"* ]]; then
                log "INFO" "Detected existing GS-CMS application running on port $port"
                echo ""
                echo "🔍 Found existing application:"
                echo "   PID: $pid"
                echo "   Process: $process_info"
                echo ""
                echo "Choose an action:"
                echo "   1) Stop existing app and start fresh"
                echo "   2) Keep existing app running (exit)"
                echo "   3) Force kill and restart"
                echo ""
                read -p "Enter choice (1-3): " -n 1 -r choice
                echo ""
                
                case $choice in
                    1)
                        log "INFO" "Stopping existing application gracefully..."
                        if [[ -f "./scripts/app-down.sh" ]]; then
                            bash ./scripts/app-down.sh
                            sleep 3
                        else
                            kill -TERM "$pid" 2>/dev/null || true
                            sleep 3
                        fi
                        
                        # Verify it stopped
                        pid=$(check_port $port)
                        if [[ -n "$pid" ]]; then
                            log "WARNING" "Graceful stop failed, force killing..."
                            kill -KILL "$pid" 2>/dev/null || true
                            sleep 2
                        fi
                        log "SUCCESS" "Previous application stopped"
                        ;;
                    2)
                        log "INFO" "Keeping existing application running"
                        echo ""
                        echo "✅ Application already running at: http://localhost:$port"
                        echo "🛑 Use './scripts/app-down.sh' to stop it"
                        echo ""
                        exit 0
                        ;;
                    3)
                        log "WARNING" "Force killing existing application..."
                        kill -KILL "$pid" 2>/dev/null || true
                        sleep 2
                        log "SUCCESS" "Previous application force killed"
                        ;;
                    *)
                        log "ERROR" "Invalid choice. Exiting..."
                        exit 1
                        ;;
                esac
            else
                log "WARNING" "Port $port is used by non-GS-CMS process: $process_info"
                echo ""
                echo "⚠️  Port $port is occupied by: $process_info"
                echo ""
                echo "Choose an action:"
                echo "   1) Try to stop the process"
                echo "   2) Exit (fix manually)"
                echo ""
                read -p "Enter choice (1-2): " -n 1 -r choice
                echo ""
                
                case $choice in
                    1)
                        log "WARNING" "Attempting to stop process on port $port..."
                        kill -TERM "$pid" 2>/dev/null || true
                        sleep 3
                        
                        # Check if still running
                        pid=$(check_port $port)
                        if [[ -n "$pid" ]]; then
                            log "ERROR" "Could not stop process on port $port"
                            log "ERROR" "Please manually stop the process: kill $pid"
                            return 1
                        fi
                        log "SUCCESS" "Process stopped, port $port is now available"
                        ;;
                    2)
                        log "ERROR" "Cannot proceed with port $port occupied"
                        log "INFO" "Please stop the process manually: kill $pid"
                        return 1
                        ;;
                    *)
                        log "ERROR" "Invalid choice. Exiting..."
                        exit 1
                        ;;
                esac
            fi
            
            # Final verification that port is free
            pid=$(check_port $port)
            if [[ -n "$pid" ]]; then
                log "ERROR" "Port $port is still in use after cleanup attempt"
                return 1
            else
                log "SUCCESS" "Port $port is now available"
            fi
        else
            log "SUCCESS" "Port $port is available"
        fi
    done
    
    # Check environment files
    if [[ ! -f ".env.local" && ! -f ".env" ]]; then
        log "FATAL" "No environment configuration found (.env or .env.local)"
        exit 1
    fi
    log "SUCCESS" "Environment configuration found"
    
    log "SUCCESS" "Pre-flight checks completed"
    echo ""
}

phase_dependencies() {
    log "INFO" "Phase 2: Dependencies and Build Environment"
    echo "--------------------------------------------"
    
    # Clean previous build artifacts
    log "INFO" "Cleaning previous build artifacts..."
    rm -rf .next 2>/dev/null || true
    rm -rf node_modules/.cache 2>/dev/null || true
    rm -f tsconfig.tsbuildinfo 2>/dev/null || true
    log "SUCCESS" "Build artifacts cleaned"
    
    # Check and install dependencies
    if [[ ! -d "node_modules" || "package.json" -nt "node_modules" ]]; then
        log "INFO" "Installing/updating dependencies..."
        if npm install; then
            log "SUCCESS" "Dependencies installed successfully"
        else
            log "ERROR" "Failed to install dependencies"
            return 1
        fi
    else
        log "SUCCESS" "Dependencies are up to date"
    fi
    
    # Generate Prisma client
    log "INFO" "Generating Prisma client..."
    if npx prisma generate >/dev/null; then
        log "SUCCESS" "Prisma client generated"
    else
        log "ERROR" "Failed to generate Prisma client"
        return 1
    fi
    
    log "SUCCESS" "Dependencies phase completed"
    echo ""
}

phase_services() {
    log "INFO" "Phase 3: Local Services Setup"
    echo "------------------------------"
    
    # Ensure local configuration
    ensure_local_database
    
    # Check Docker availability
    if ! command_exists docker; then
        log "FATAL" "Docker is not installed or not running"
        log "INFO" "Docker is required for local PostgreSQL and Redis"
        return 1
    fi
    
    if ! docker info >/dev/null 2>&1; then
        log "FATAL" "Docker is installed but not running"
        log "INFO" "Please start Docker Desktop and try again"
        return 1
    fi
    
    # Start local services
    if ! start_local_services; then
        log "ERROR" "Failed to start local services"
        return 1
    fi
    
    # Show current Docker status
    echo ""
    log "INFO" "Current Docker services status:"
    docker-compose -f docker-compose.dev.yml ps
    
    log "SUCCESS" "Local services setup completed"
    echo ""
}

phase_database() {
    log "INFO" "Phase 4: Database Initialization"
    echo "---------------------------------"
    
    # Initialize database
    if ! initialize_database; then
        log "ERROR" "Database initialization failed"
        return 1
    fi
    
    log "SUCCESS" "Database initialization completed"
    echo ""
}

phase_application() {
    log "INFO" "Phase 5: Application Startup"
    echo "-----------------------------"
    
    # Ensure we're using local services
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gs_cms_v05_dev?schema=public"
    export REDIS_URL="redis://localhost:6379"
    export NODE_ENV="development"
    
    log "INFO" "Starting Next.js development server on PORT 3000..."
    
    # Start application in background
    npm run dev > "$LOG_DIR/nextjs-$(date +%Y%m%d_%H%M%S).log" 2>&1 &
    local app_pid=$!
    
    log "INFO" "Next.js started with PID: $app_pid"
    
    # Wait for application to be ready
    local ready=false
    local attempts=0
    local max_attempts=$((STARTUP_TIMEOUT / 2))
    
    while (( attempts < max_attempts )) && [[ "$ready" == "false" ]]; do
        sleep 2
        ((attempts++))
        
        # Check if process is still running
        if ! kill -0 "$app_pid" 2>/dev/null; then
            log "ERROR" "Next.js process died during startup"
            return 1
        fi
        
        # Check if port 3000 is accepting connections (ONLY port 3000)
        if nc -z localhost 3000 2>/dev/null; then
            log "SUCCESS" "Application is accepting connections on port 3000"
            log_health "nextjs" "READY" "Accepting connections on localhost:3000"
            ready=true
        fi
        
        if (( attempts % 5 == 0 )); then
            log "DEBUG" "Waiting for application startup... (${attempts}/${max_attempts})"
        fi
    done
    
    if [[ "$ready" == "false" ]]; then
        log "ERROR" "Application failed to start within ${STARTUP_TIMEOUT}s timeout"
        kill -TERM "$app_pid" 2>/dev/null || true
        return 1
    fi
    
    log "SUCCESS" "Application startup completed"
    echo ""
    
    return 0
}

phase_verification() {
    log "INFO" "Phase 6: Health Verification"
    echo "-----------------------------"
    
    # Test basic health endpoints - ONLY port 3000
    local base_url="http://localhost:3000"
    
    # Verify application is running on port 3000 ONLY
    if ! nc -z localhost 3000 2>/dev/null; then
        log "ERROR" "Application is not responding on port 3000"
        log_health "port-check" "FAILED" "Port 3000 not accessible"
        return 1
    fi
    
    # Test health endpoint
    if curl -s "$base_url/api/health" >/dev/null 2>&1; then
        log "SUCCESS" "Health endpoint responding"
        log_health "health-check" "PASSED" "API health endpoint accessible"
    else
        log "WARNING" "Health endpoint not accessible (may not be implemented)"
        log_health "health-check" "FAILED" "API health endpoint not accessible"
    fi
    
    # Test authentication endpoints
    if curl -s "$base_url/api/auth/signin" >/dev/null 2>&1; then
        log "SUCCESS" "Authentication endpoints responding"
        log_health "auth-check" "PASSED" "Authentication endpoints accessible"
    else
        log "WARNING" "Authentication endpoints not accessible"
        log_health "auth-check" "FAILED" "Authentication endpoints not accessible"
    fi
    
    log "SUCCESS" "Health verification completed"
    echo ""
}

phase_summary() {
    echo ""
    echo "============================================================================"
    log "SUCCESS" "🎉 Application Startup Complete!"
    echo "============================================================================"
    
    # Application runs ONLY on port 3000
    local active_port="3000"
    
    echo ""
    log "INFO" "📋 Service Summary:"
    echo "   🌐 Application: http://localhost:$active_port"
    echo "   🗄️  Database: Local PostgreSQL (localhost:5432)"
    echo "   🔗 Connection: Local Docker container"
    echo "   🔧 Database Admin: http://localhost:8080"
    echo "   ⚡ Cache: Local Redis (localhost:6379)"
    
    echo ""
    log "INFO" "📋 Available Commands:"
    echo "   🔍 Type Check: npm run type-check"
    echo "   🧹 Lint: npm run lint"
    echo "   📊 Database Studio: npm run db:studio"
    echo "   🛑 Stop App: ./scripts/app-down.sh"
    
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
    # Initialize
    phase_init
    
    # Execute startup phases
    phase_preflight || exit 1
    phase_dependencies || exit 1
    phase_services || exit 1
    phase_database || exit 1
    phase_application || exit 1
    phase_verification || exit 1
    
    # Show summary
    phase_summary
    
    # Wait for the application (it's running in background)
    local app_pid=$(pgrep -f "next dev" | head -n1)
    if [[ -n "$app_pid" ]]; then
        log "INFO" "Application running with PID: $app_pid"
        wait $app_pid
    else
        log "WARNING" "Could not find application PID, monitoring ports instead"
        while nc -z localhost 3000 2>/dev/null; do
            sleep 5
        done
        log "INFO" "Application has stopped"
    fi
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
        echo "  --verbose, -v  Enable verbose logging"
        echo "  --no-color     Disable colored output"
        exit 0
        ;;
    --verbose|-v)
        set -x
        ;;
    --no-color)
        RED=''
        GREEN=''
        YELLOW=''
        BLUE=''
        CYAN=''
        PURPLE=''
        NC=''
        ;;
esac

# Start the main execution
main "$@"