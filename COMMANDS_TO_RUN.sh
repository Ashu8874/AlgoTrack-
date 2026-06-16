#!/bin/bash

# CSS Fix - Run these commands in order

echo "🔧 CSS FIX - Running commands..."

# Step 1: Stop dev server if running
echo "Step 1: Make sure to press Ctrl+C to stop the current dev server"
sleep 2

# Step 2: Clear caches
echo "Step 2: Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo
echo "✅ Caches cleared"

# Step 3: Start dev server
echo "Step 3: Starting dev server..."
npm run dev

# Step 4: Instructions for user
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ READY!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. Wait for 'Ready in' message"
echo "2. Open http://localhost:3000/auth/register"
echo "3. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)"
echo "4. You should see styled form now!"
echo ""
echo "════════════════════════════════════════════════════════════"
