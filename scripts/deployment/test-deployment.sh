#!/bin/bash

echo "🚀 Testing deployment readiness..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with the following variables:"
    echo "- DATABASE_URL"
    echo "- NEXTAUTH_URL"
    echo "- NEXTAUTH_SECRET"
    echo "- NEXT_PUBLIC_APP_URL"
    echo "- REDIS_URL (optional)"
    echo "- UPLOADTHING_TOKEN"
    echo "- UPLOADTHING_SECRET"
    exit 1
fi

# Test build
echo "📦 Testing build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Check TypeScript
echo "🔍 Checking TypeScript..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript check failed!"
    exit 1
fi

echo "✅ TypeScript check passed!"

# Test database connection
echo "🗄️ Testing database connection..."
npx prisma db push --skip-generate
if [ $? -ne 0 ]; then
    echo "❌ Database connection failed!"
    echo "Please check your DATABASE_URL in .env.local"
    exit 1
fi

echo "✅ Database connection successful!"

echo "🎉 All deployment checks passed!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub"
echo "2. Deploy to Vercel using:"
echo "   - vercel deploy (for preview)"
echo "   - vercel --prod (for production)"
echo ""
echo "Or use the Vercel dashboard to connect your GitHub repository"