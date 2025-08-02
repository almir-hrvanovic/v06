#!/bin/bash

echo "🔐 Testing Fixed API Endpoints..."
echo ""
echo "This script will test the 3 fixed API endpoints:"
echo "1. /api/users/me"
echo "2. /api/system-settings"
echo "3. /api/notifications"
echo ""
echo "Prerequisites:"
echo "- Dev server running on http://localhost:3000"
echo "- You must be logged in via the browser first"
echo ""
echo "Press Enter to continue..."
read

# Base URL
BASE_URL="http://localhost:3000"

echo "📍 Testing /api/users/me..."
curl -s -X GET "$BASE_URL/api/users/me" \
  -H "Accept: application/json" \
  -b cookies.txt \
  | jq '.' || echo "Failed to parse JSON"

echo ""
echo "📍 Testing /api/system-settings..."
curl -s -X GET "$BASE_URL/api/system-settings" \
  -H "Accept: application/json" \
  -b cookies.txt \
  | jq '.' || echo "Failed to parse JSON"

echo ""
echo "📍 Testing /api/notifications..."
curl -s -X GET "$BASE_URL/api/notifications" \
  -H "Accept: application/json" \
  -b cookies.txt \
  | jq '.' || echo "Failed to parse JSON"

echo ""
echo "✨ Test completed!"
echo ""
echo "Note: If you see authentication errors, make sure you:"
echo "1. Are logged in via the browser"
echo "2. Have exported your browser cookies to cookies.txt"