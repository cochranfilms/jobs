#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Cochran Films Landing Setup');
console.log('===============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
    console.log('✅ .env file found');
} else {
    console.log('⚠️  No .env file found, creating one...');
    
    const envTemplate = `# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_OWNER=cochranfilms
GITHUB_REPO=cochran-job-listings
GITHUB_BRANCH=main

# Server Configuration
PORT=3000
`;
    
    fs.writeFileSync(envPath, envTemplate);
    console.log('✅ .env file created');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
const nodeModulesExists = fs.existsSync(nodeModulesPath);

if (nodeModulesExists) {
    console.log('✅ node_modules found');
} else {
    console.log('⚠️  Installing dependencies...');
    const { execSync } = require('child_process');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed');
    } catch (error) {
        console.error('❌ Failed to install dependencies:', error.message);
        process.exit(1);
    }
}

console.log('\n📋 Setup Instructions:');
console.log('=====================');
console.log('1. Edit the .env file and set your GitHub token:');
console.log('   GITHUB_TOKEN=ghp_your_actual_token_here');
console.log('');
console.log('2. Start the server:');
console.log('   npm start');
console.log('');
console.log('3. Access your application:');
console.log('   Contract page: http://localhost:3000/');
console.log('   Admin dashboard: http://localhost:3000/admin');
console.log('');
console.log('🔐 Security Notes:');
console.log('- The GitHub token is stored in environment variables');
console.log('- The token is never exposed to the client');
console.log('- All GitHub API calls go through the server');
console.log('');
console.log('✅ Setup complete!'); 