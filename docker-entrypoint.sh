#!/bin/sh

echo "Starting GS-CMS application..."

# Wait for database to be ready
echo "Waiting for database..."
until nc -z -v -w30 postgres 5432
do
  echo "Waiting for database connection..."
  sleep 5
done
echo "Database is ready!"

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy || npx prisma db push

# Seed database if it's empty (optional)
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  npx prisma db seed
fi

# Start the application
echo "Starting Next.js server..."
exec node server.js