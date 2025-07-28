#!/bin/bash
# 🚀 GS-CMS Automation Deployment Script
# Deploys the automated fix-test system to production

set -e

echo "🎭 Deploying GS-CMS Automation System..."
echo "========================================"

# Configuration
PROJECT_DIR="${1:-$(pwd)}"
TARGET_ENV="${2:-production}"

echo "📁 Project Directory: $PROJECT_DIR"
echo "🎯 Target Environment: $TARGET_ENV"

cd "$PROJECT_DIR"

# Validate project structure
echo "🔍 Validating project structure..."
required_files=(
    "package.json"
    "playwright.config.ts"
    "prisma/schema.prisma"
    "src/lib/auth.ts"
    "AUTOMATED_FIX_TEST_SYSTEM.md"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

echo "✅ Project structure validated"

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --production=false

# Install Playwright
echo "🌐 Installing Playwright..."
npx playwright install

# Run database migrations
echo "🗃️ Running database setup..."
if [ "$TARGET_ENV" = "production" ]; then
    npm run db:migrate
else
    npm run db:push
fi

# Seed database if not production
if [ "$TARGET_ENV" != "production" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed
fi

# Build application
echo "🏗️ Building application..."
npm run build

# Run comprehensive tests
echo "🧪 Running comprehensive tests..."
npm run test || {
    echo "⚠️ Tests failed - running automated fixes..."
    npm run critical-fix
    echo "🔄 Re-running tests after fixes..."
    npm run test
}

# Generate test reports
echo "📊 Generating test reports..."
npm run test:report || true

# Create deployment package
echo "📦 Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="gs-cms-automation-$TIMESTAMP.tar.gz"

tar -czf "$PACKAGE_NAME" \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=test-results \
    --exclude=playwright-report \
    --exclude=.git \
    .

echo "📦 Deployment package created: $PACKAGE_NAME"

# Deployment summary
echo ""
echo "✅ Deployment completed successfully!"
echo "======================================"
echo "Package: $PACKAGE_NAME"
echo "Environment: $TARGET_ENV"
echo "Features:"
echo "  ✅ Automated fix-test loops"
echo "  ✅ Comprehensive logging"
echo "  ✅ User workflow testing"
echo "  ✅ Server monitoring"
echo "  ✅ Critical issue resolution"
echo ""
echo "🚀 To deploy:"
echo "  1. Extract package on target server"
echo "  2. Run: npm ci"
echo "  3. Setup environment variables"
echo "  4. Run: npm run start"
echo ""
echo "🔧 Maintenance commands:"
echo "  npm run critical-fix    - Fix critical issues"
echo "  npm run health-check    - System health check"
echo "  npm run test:report     - Generate test reports"