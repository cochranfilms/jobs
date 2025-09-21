#!/usr/bin/env node

/**
 * Comprehensive Login Test
 * Tests both user portal and admin dashboard with correct credentials
 */

const puppeteer = require('puppeteer');

async function testUserPortal() {
    console.log('🔍 Testing User Portal Login...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 }
    });

    try {
        const page = await browser.newPage();
        
        // Navigate to user portal
        console.log('📱 Loading user portal...');
        await page.goto('http://collaborate.cochranfilms.com/user-portal', { waitUntil: 'networkidle2' });
        
        // Check initial state
        console.log('🔍 Checking initial page state...');
        const initialUserName = await page.evaluate(() => {
            const userNameElement = document.getElementById('userName');
            return userNameElement ? userNameElement.textContent : null;
        });
        console.log(`👤 Initial user name: "${initialUserName}"`);
        
        // Fill in user credentials
        console.log('\n🔑 Filling in USER credentials...');
        await page.type('input[type="email"]', 'codylcochran89@gmail.com');
        await page.type('input[type="password"]', 'youtube');
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for any validation errors
        console.log('🔍 Checking for validation errors...');
        const validationErrors = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.error, .alert, [style*="color: red"]');
            return Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
        });
        
        if (validationErrors.length > 0) {
            console.log('❌ Validation errors found:');
            validationErrors.forEach(error => console.log(`   - ${error}`));
        } else {
            console.log('✅ No validation errors found');
        }
        
        // Try to submit the login form
        console.log('\n🔑 Attempting user login...');
        const loginForm = await page.$('form');
        
        if (loginForm) {
            console.log('✅ Login form found, submitting...');
            await loginForm.evaluate(form => form.submit());
        } else {
            console.log('❌ No login form found');
        }
        
        // Wait for potential navigation or error
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if login was successful
        const finalUserName = await page.evaluate(() => {
            const userNameElement = document.getElementById('userName');
            return userNameElement ? userNameElement.textContent : null;
        });
        
        console.log(`👤 Final user name: "${finalUserName}"`);
        
        if (finalUserName && finalUserName !== 'User' && finalUserName !== initialUserName) {
            console.log('✅ User login appears to be successful!');
        } else {
            console.log('❌ User login may have failed - user name unchanged');
            
            // Check for error messages
            const errorMessages = await page.evaluate(() => {
                const errorElements = document.querySelectorAll('.error, .alert, [style*="color: red"]');
                return Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
            });
            
            if (errorMessages.length > 0) {
                console.log('❌ Error messages found:');
                errorMessages.forEach(error => console.log(`   - ${error}`));
            }
        }
        
        console.log('\n✅ User portal test completed!');
        
    } catch (error) {
        console.error('❌ User portal test failed:', error.message);
    } finally {
        await browser.close();
    }
}

async function testAdminDashboard() {
    console.log('🔍 Testing Admin Dashboard Login...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 }
    });

    try {
        const page = await browser.newPage();
        
        // Navigate to admin dashboard
        console.log('📱 Loading admin dashboard...');
        await page.goto('http://collaborate.cochranfilms.com/admin-dashboard', { waitUntil: 'networkidle2' });
        
        // Check initial state
        console.log('🔍 Checking initial page state...');
        const initialTitle = await page.title();
        console.log(`📄 Initial page title: "${initialTitle}"`);
        
        // Fill in admin credentials
        console.log('\n🔑 Filling in ADMIN credentials...');
        await page.type('input[type="email"]', 'info@cochranfilms.com');
        await page.type('input[type="password"]', 'Cochranfilms2@');
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check for any validation errors
        console.log('🔍 Checking for validation errors...');
        const validationErrors = await page.evaluate(() => {
            const errorElements = document.querySelectorAll('.error, .alert, [style*="color: red"]');
            return Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
        });
        
        if (validationErrors.length > 0) {
            console.log('❌ Validation errors found:');
            validationErrors.forEach(error => console.log(`   - ${error}`));
        } else {
            console.log('✅ No validation errors found');
        }
        
        // Try to submit the login form
        console.log('\n🔑 Attempting admin login...');
        const loginForm = await page.$('form');
        
        if (loginForm) {
            console.log('✅ Login form found, submitting...');
            await loginForm.evaluate(form => form.submit());
        } else {
            // Try clicking the login button as fallback
            let loginButton = await page.$('button[onclick*="login"]');
            if (!loginButton) {
                loginButton = await page.$('input[type="submit"]');
            }
            if (!loginButton) {
                // Find button with LOGIN text
                loginButton = await page.evaluateHandle(() => {
                    const allButtons = document.querySelectorAll('button');
                    return Array.from(allButtons).find(btn => 
                        btn.textContent.includes('LOGIN') || 
                        btn.textContent.includes('Login')
                    );
                });
            }
            
            if (loginButton) {
                console.log('✅ Login button found, clicking...');
                await loginButton.click();
            } else {
                console.log('❌ No login form or button found');
            }
        }
        
        // Wait for potential navigation or error
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if login was successful
        const finalTitle = await page.title();
        console.log(`📄 Final page title: "${finalTitle}"`);
        
        // Check for admin dashboard elements
        const adminElements = await page.evaluate(() => {
            const adminTitle = document.querySelector('h1');
            const jobListings = document.querySelector('[onclick*="jobListings"]');
            const userManagement = document.querySelector('[onclick*="userManagement"]');
            
            return {
                adminTitle: adminTitle ? adminTitle.textContent : null,
                hasJobListings: !!jobListings,
                hasUserManagement: !!userManagement
            };
        });
        
        if (adminElements.adminTitle && adminElements.adminTitle.includes('Admin Dashboard')) {
            console.log('✅ Admin login appears to be successful!');
            console.log(`   - Admin Title: ${adminElements.adminTitle}`);
            console.log(`   - Has Job Listings: ${adminElements.hasJobListings ? '✅' : '❌'}`);
            console.log(`   - Has User Management: ${adminElements.hasUserManagement ? '✅' : '❌'}`);
        } else {
            console.log('❌ Admin login may have failed');
            
            // Check for error messages
            const errorMessages = await page.evaluate(() => {
                const errorElements = document.querySelectorAll('.error, .alert, [style*="color: red"]');
                return Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
            });
            
            if (errorMessages.length > 0) {
                console.log('❌ Error messages found:');
                errorMessages.forEach(error => console.log(`   - ${error}`));
            }
        }
        
        console.log('\n✅ Admin dashboard test completed!');
        
    } catch (error) {
        console.error('❌ Admin dashboard test failed:', error.message);
    } finally {
        await browser.close();
    }
}

async function runAllTests() {
    console.log('🚀 Starting Comprehensive Login Tests...\n');
    
    console.log('=' .repeat(50));
    console.log('TESTING USER PORTAL');
    console.log('=' .repeat(50));
    await testUserPortal();
    
    console.log('\n' + '=' .repeat(50));
    console.log('TESTING ADMIN DASHBOARD');
    console.log('=' .repeat(50));
    await testAdminDashboard();
    
    console.log('\n✅ All tests completed!');
}

// Run all tests
runAllTests().catch(console.error); 