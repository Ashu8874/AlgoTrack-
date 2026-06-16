#!/bin/bash

# 🚀 Quick Deploy to Vercel Script
# This script helps you deploy your LeetCode Progress Analyzer to Vercel

echo "🚀 LeetCode Progress Analyzer - Vercel Deployment"
echo "=================================================="
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Ready for deployment"
    echo "✅ Git repository initialized"
    echo ""
else
    echo "✅ Git repository already exists"
    echo ""
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Vercel CLI not found. Installing..."
    npm install -g vercel
    echo "✅ Vercel CLI installed"
    echo ""
else
    echo "✅ Vercel CLI already installed"
    echo ""
fi

# Test build locally
echo "🏗️  Testing production build locally..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi
echo "✅ Build successful!"
echo ""

# Login to Vercel
echo "🔐 Please login to Vercel..."
vercel login
echo ""

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel

echo ""
echo "=================================================="
echo "✅ Deployment initiated!"
echo ""
echo "📋 Next Steps:"
echo "1. Add environment variables in Vercel dashboard:"
echo "   - MONGODB_URI"
echo "   - NEXTAUTH_SECRET"
echo "   - NEXTAUTH_URL (use your Vercel URL)"
echo "   - GROQ_API_KEY"
echo "   - NEXT_PUBLIC_APP_URL (use your Vercel URL)"
echo ""
echo "2. Redeploy after adding variables:"
echo "   vercel --prod"
echo ""
echo "3. Visit your app at the provided URL"
echo ""
echo "🎉 Happy deploying!"
