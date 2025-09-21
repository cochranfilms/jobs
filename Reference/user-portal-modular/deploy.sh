#!/bin/bash

# ==================== COCHRAN FILMS USER PORTAL MODULAR SYSTEM ====================
# Deployment Script for Vercel
# ====================

set -e

echo "🚀 Deploying Cochran Films User Portal Modular System to Vercel..."

# ==================== PRE-DEPLOYMENT CHECKS ====================

echo "🔍 Running pre-deployment checks..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "user-portal-production.html" ]; then
    echo "❌ Not in the correct directory. Please run this from user-portal-modular/"
    exit 1
fi

# Check if all required files exist
required_files=(
    "user-portal-production.html"
    "js/app.js"
    "js/auth/auth-manager.js"
    "js/utils/error-handler.js"
    "js/utils/notification-manager.js"
    "js/utils/loading-manager.js"
    "js/users/user-manager.js"
    "js/users/performance-manager.js"
    "js/users/payment-manager.js"
    "js/contracts/contract-manager.js"
    "js/jobs/job-manager.js"
    "css/main.css"
    "css/components.css"
    "vercel.json"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

echo "✅ All required files found"

# ==================== BUILD VERIFICATION ====================

echo "🔧 Verifying build integrity..."

# Check if CSS files are valid
if ! grep -q "user-portal" css/main.css; then
    echo "⚠️ Warning: CSS files may not contain expected content"
fi

# Check if JS files are valid
if ! grep -q "export" js/app.js; then
    echo "❌ Error: JS files may not be properly formatted"
    exit 1
fi

echo "✅ Build integrity verified"

# ==================== DEPLOYMENT ====================

echo "🚀 Starting deployment..."

# Deploy to Vercel
if vercel --prod --yes; then
    echo "✅ Deployment successful!"
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(vercel ls | grep "cochran-films-user-portal-modular" | head -1 | awk '{print $2}')
    
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        echo "🌐 Your portal is now live at: $DEPLOYMENT_URL"
        echo "🔗 Production URL: $DEPLOYMENT_URL"
        echo "🧪 Test URL: $DEPLOYMENT_URL/test"
        
        # Save deployment info
        echo "DEPLOYMENT_URL=$DEPLOYMENT_URL" > .deployment-info
        echo "DEPLOYMENT_DATE=$(date)" >> .deployment-info
        
        echo ""
        echo "📋 Next Steps:"
        echo "1. Test the production portal: $DEPLOYMENT_URL"
        echo "2. Test the test suite: $DEPLOYMENT_URL/test"
        echo "3. Update your main system to use the new portal"
        echo "4. Monitor for any issues"
        
    else
        echo "⚠️ Could not retrieve deployment URL"
    fi
    
else
    echo "❌ Deployment failed!"
    exit 1
fi

# ==================== POST-DEPLOYMENT VERIFICATION ====================

echo "🔍 Running post-deployment verification..."

if [ ! -z "$DEPLOYMENT_URL" ]; then
    # Test if the portal is accessible
    if curl -s -f "$DEPLOYMENT_URL" > /dev/null; then
        echo "✅ Portal is accessible"
    else
        echo "❌ Portal is not accessible"
    fi
    
    # Test if the test suite is accessible
    if curl -s -f "$DEPLOYMENT_URL/test" > /dev/null; then
        echo "✅ Test suite is accessible"
    else
        echo "❌ Test suite is not accessible"
    fi
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "📁 Files deployed:"
ls -la | grep -E "\.(html|js|css|json)$"

echo ""
echo "🔗 Remember to update your main system configuration to use the new modular portal!"
