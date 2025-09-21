#!/bin/bash

# 🚀 Deploy to Vercel Script
# This script helps deploy your API server to Vercel

echo "🚀 Starting Vercel Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
else
    echo "✅ Vercel CLI found"
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔑 Please log in to Vercel..."
    vercel login
else
    echo "✅ Already logged in to Vercel"
fi

# Check environment variables
echo "🔍 Checking environment variables..."
if [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  GITHUB_TOKEN not set. Please set it before deploying:"
    echo "   export GITHUB_TOKEN=your_github_token_here"
    exit 1
fi

if [ -z "$GITHUB_OWNER" ]; then
    echo "⚠️  GITHUB_OWNER not set. Setting to default: cochranfilms"
    export GITHUB_OWNER=cochranfilms
fi

if [ -z "$GITHUB_REPO" ]; then
    echo "⚠️  GITHUB_REPO not set. Setting to default: cochran-job-listings"
    export GITHUB_REPO=cochran-job-listings
fi

if [ -z "$GITHUB_BRANCH" ]; then
    echo "⚠️  GITHUB_BRANCH not set. Setting to default: main"
    export GITHUB_BRANCH=main
fi

echo "✅ Environment variables configured:"
echo "   GITHUB_TOKEN: ${GITHUB_TOKEN:0:10}..."
echo "   GITHUB_OWNER: $GITHUB_OWNER"
echo "   GITHUB_REPO: $GITHUB_REPO"
echo "   GITHUB_BRANCH: $GITHUB_BRANCH"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "   This will create a new project if it doesn't exist"
echo "   Follow the prompts to configure your project"
echo ""

vercel

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the Vercel URL (e.g., https://your-project.vercel.app)"
echo "2. Update the API_BASE in admin-dashboard.html with your Vercel URL"
echo "3. Set environment variables in Vercel dashboard:"
echo "   - GITHUB_TOKEN: $GITHUB_TOKEN"
echo "   - GITHUB_OWNER: $GITHUB_OWNER"
echo "   - GITHUB_REPO: $GITHUB_REPO"
echo "   - GITHUB_BRANCH: $GITHUB_BRANCH"
echo ""
echo "🔗 To set environment variables:"
echo "   - Go to your Vercel project dashboard"
echo "   - Project Settings → Environment Variables"
echo "   - Add each variable with the @ prefix"
echo ""
echo "🧪 Test your APIs:"
echo "   curl https://your-project.vercel.app/api/health"
echo "   curl https://your-project.vercel.app/api/users"
echo "   curl https://your-project.vercel.app/api/jobs-data"
