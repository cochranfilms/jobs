# 🚀 API Server Deployment Guide

## Overview
This guide will help you deploy your Node.js API server to Vercel so that your admin dashboard works on both local development and your live site at `collaborate.cochranfilms.com`.

## 🎯 What We're Deploying
- **API Server**: Node.js server with all required endpoints
- **Hosting Platform**: Vercel (free tier, supports serverless functions)
- **Result**: All API endpoints working on live site

## 📋 Prerequisites
1. **Vercel Account**: Free account at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code must be in a GitHub repo
3. **Environment Variables**: GitHub token and repo details

## 🔧 Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

## 🔑 Step 2: Set Up Environment Variables
You'll need to set these in Vercel:

### Required Environment Variables:
- `GITHUB_TOKEN`: Your GitHub personal access token
- `GITHUB_OWNER`: Repository owner (cochranfilms)
- `GITHUB_REPO`: Repository name (cochran-job-listings)
- `GITHUB_BRANCH`: Branch name (main)

### How to Set Them:
1. Go to [vercel.com](https://vercel.com)
2. Create new project from GitHub
3. Go to Project Settings → Environment Variables
4. Add each variable with the `@` prefix (e.g., `@github_token`)

## 🚀 Step 3: Deploy to Vercel

### Option A: Deploy from Command Line
```bash
# Login to Vercel
vercel login

# Deploy (this will create a new project)
vercel

# Follow the prompts:
# - Set up and deploy: Yes
# - Which scope: Select your account
# - Link to existing project: No
# - Project name: cochran-films-api (or your preferred name)
# - Directory: ./ (current directory)
# - Override settings: No
```

### Option B: Deploy from Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings
5. Deploy

## 🌐 Step 4: Update Your Live Site

### Option A: Update CNAME (Recommended)
1. After deployment, Vercel will give you a URL like: `https://your-project.vercel.app`
2. Go to your domain provider (where `collaborate.cochranfilms.com` is registered)
3. Update CNAME record to point to the Vercel URL
4. Wait for DNS propagation (can take up to 48 hours)

### Option B: Use Vercel URL Directly
1. Update your admin dashboard to use the Vercel URL
2. Change API calls from `/api/...` to `https://your-project.vercel.app/api/...`

## 🔍 Step 5: Test Your Live APIs

Test these endpoints on your Vercel deployment:
```bash
# Health check
curl https://your-project.vercel.app/api/health

# Users data
curl https://your-project.vercel.app/api/users

# Jobs data
curl https://your-project.vercel.app/api/jobs-data

# Dropdown options
curl https://your-project.vercel.app/api/dropdown-options
```

## 📱 Step 6: Update Admin Dashboard (if needed)

If you're using Option B above, update the admin dashboard to detect the environment:

```javascript
// Auto-detect environment
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? '' : 'https://your-project.vercel.app';

// Use in API calls
const response = await fetch(`${API_BASE}/api/update-users`, {
    method: 'POST',
    // ... rest of the code
});
```

## 🎉 Step 7: Verify Everything Works

1. **Local Development**: `http://localhost:8000` - APIs work via Node.js server
2. **Live Site**: `collaborate.cochranfilms.com` - APIs work via Vercel serverless functions

## 🔧 Troubleshooting

### Common Issues:

#### 1. Environment Variables Not Set
**Error**: "GitHub token not configured"
**Solution**: Set environment variables in Vercel dashboard

#### 2. CORS Issues
**Error**: "CORS policy blocked request"
**Solution**: CORS is already configured in your API files

#### 3. API Timeout
**Error**: "Function execution timeout"
**Solution**: Increase `maxDuration` in vercel.json (currently set to 30 seconds)

#### 4. GitHub Rate Limits
**Error**: "API rate limit exceeded"
**Solution**: Check your GitHub token permissions and rate limits

## 📊 Monitoring

After deployment, you can monitor your API usage in the Vercel dashboard:
- **Function Logs**: See API call logs and errors
- **Performance**: Monitor response times and success rates
- **Usage**: Track function invocations and execution time

## 🔄 Updates

To update your API after making changes:
```bash
# Deploy updates
vercel --prod

# Or use Vercel dashboard to redeploy from GitHub
```

## 🎯 Expected Result

After deployment, your admin dashboard will work perfectly on both:
- ✅ **Local Development**: `localhost:8000` with Node.js server
- ✅ **Live Site**: `collaborate.cochranfilms.com` with Vercel serverless functions

All API endpoints will work, user deletions will persist to GitHub, and you'll have a fully functional admin system!
