#!/usr/bin/env node

/**
 * Setup script for live production testing
 * Installs puppeteer and runs the test
 */

const { execSync } = require('child_process');

console.log('🚀 Setting up Live Production Test...\n');

try {
    // Check if puppeteer is already installed
    require('puppeteer');
    console.log('✅ Puppeteer already installed');
} catch (error) {
    console.log('📦 Installing puppeteer...');
    try {
        execSync('npm install puppeteer', { stdio: 'inherit' });
        console.log('✅ Puppeteer installed successfully');
    } catch (installError) {
        console.error('❌ Failed to install puppeteer:', installError.message);
        console.log('\n💡 Manual installation:');
        console.log('npm install puppeteer');
        process.exit(1);
    }
}

console.log('\n🔍 Running live production test...');
console.log('This will test both portals and identify all issues.\n');

// Run the test
require('./live-production-test.js'); 