#!/bin/bash

# Load environment variables from .env.local
set -a
source .env.local
set +a

echo "🚀 Initializing Supabase Database..."
echo ""

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Push schema to database
echo ""
echo "🔄 Pushing schema to Supabase..."
npx prisma db push

# Seed the database with initial data
echo ""
echo "🌱 Seeding database with initial data..."
npx tsx prisma/seed.ts

echo ""
echo "✅ Database initialization complete!"