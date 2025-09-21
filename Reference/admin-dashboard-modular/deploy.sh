#!/bin/bash

# ==================== COCHRAN FILMS ADMIN DASHBOARD MODULAR SYSTEM ====================
# Deployment Script for Vercel
# ====================

set -e

echo "🚀 Deploying Cochran Films Admin Dashboard Modular System to Vercel..."

# ==================== PRE-DEPLOYMENT CHECKS ====================

echo "🔍 Running pre-deployment checks..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Not in the correct directory. Please run this from admin-dashboard-modular/"
    exit 1
fi

# Check if all required files exist
required_files=(
    "index.html"
    "js/app.js"
    "js/auth/auth-manager.js"
    "js/auth/login-component.js"
    "js/utils/error-handler.js"
    "js/utils/notification-manager.js"
    "js/utils/loading-manager.js"
    "js/users/user-manager.js"
    "js/users/user-form.js"
    "js/users/user-list.js"
    "js/jobs/job-manager.js"
    "js/jobs/job-form.js"
    "js/jobs/job-list.js"
    "js/contracts/contract-manager.js"
    "js/contracts/contract-generator.js"
    "js/dashboard/dashboard-manager.js"
    "js/dropdowns/dropdown-manager.js"
    "js/components/index.js"
    "js/components/ui/Button.js"
    "js/components/ui/Form.js"
    "js/components/ui/Modal.js"
    "js/components/ui/Notification.js"
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
if ! grep -q "admin-dashboard" css/main.css; then
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
    DEPLOYMENT_URL=$(vercel ls | grep "cochran-films-admin-dashboard-modular" | head -1 | awk '{print $2}')
    
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        echo "🌐 Your admin dashboard is now live at: $DEPLOYMENT_URL"
        echo "🔗 Production URL: $DEPLOYMENT_URL"
        echo "🧪 Test URL: $DEPLOYMENT_URL/test"
        echo "🎨 Component Library: $DEPLOYMENT_URL/components"
        echo "🔧 Module Tests: $DEPLOYMENT_URL/modules"
        
        # Save deployment info
        echo "DEPLOYMENT_URL=$DEPLOYMENT_URL" > .deployment-info
        echo "DEPLOYMENT_DATE=$(date)" >> .deployment-info
        
        echo ""
        echo "📋 Next Steps:"
        echo "1. Test the production dashboard: $DEPLOYMENT_URL"
        echo "2. Test the test suite: $DEPLOYMENT_URL/test"
        echo "3. Test component library: $DEPLOYMENT_URL/components"
        echo "4. Update your main system to use the new dashboard"
        echo "5. Monitor for any issues"
        
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
    # Test if the dashboard is accessible
    if curl -s -f "$DEPLOYMENT_URL" > /dev/null; then
        echo "✅ Dashboard is accessible"
    else
        echo "❌ Dashboard is not accessible"
    fi
    
    # Test if the test suite is accessible
    if curl -s -f "$DEPLOYMENT_URL/test" > /dev/null; then
        echo "✅ Test suite is accessible"
    else
        echo "❌ Test suite is not accessible"
    fi
    
    # Test if the component library is accessible
    if curl -s -f "$DEPLOYMENT_URL/components" > /dev/null; then
        echo "✅ Component library is accessible"
    else
        echo "❌ Component library is not accessible"
    fi
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo "📁 Files deployed:"
ls -la | grep -E "\.(html|js|css|json)$"

echo ""
echo "🔗 Remember to update your main system configuration to use the new modular dashboard!"
