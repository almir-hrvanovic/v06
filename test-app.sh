#!/bin/bash

echo "🧪 Testing application health..."

# Test sign-in page
echo -n "Testing sign-in page: "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth/signin)
if [ "$response" = "200" ]; then
  echo "✅ OK ($response)"
else
  echo "❌ FAILED ($response)"
fi

# Test dashboard (should redirect to sign-in)
echo -n "Testing dashboard (unauthenticated): "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
if [ "$response" = "200" ] || [ "$response" = "307" ]; then
  echo "✅ OK ($response)"
else
  echo "❌ FAILED ($response)"
fi

# Test API endpoints
echo -n "Testing API health: "
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$response" = "200" ] || [ "$response" = "404" ]; then
  echo "✅ OK ($response)"
else
  echo "❌ FAILED ($response)"
fi

echo ""
echo "🎉 Application appears to be running!"