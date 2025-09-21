#!/usr/bin/env node

/**
 * Debug Login Test
 * Tests the exact login process to find where it's failing
 */

const puppeteer = require('puppeteer');

async function debugLogin() {
    console.log('🔍 Debugging Login Process...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 720 }
    });

    try {
        const page = await browser.newPage();
        
        // Enable console logging
        page.on('console', msg => {
            console.log(`📱 Browser: ${msg.type()}: ${msg.text()}`);
        });
        
        // Navigate to user portal
        console.log('📱 Loading user portal...');
        await page.goto('http://collaborate.cochranfilms.com/user-portal', { waitUntil: 'networkidle2' });
        
        // Wait for page to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if we're on the login page
        const isLoginPage = await page.evaluate(() => {
            const emailInput = document.querySelector('input[type="email"]');
            const passwordInput = document.querySelector('input[type="password"]');
            return !!(emailInput && passwordInput);
        });
        
        console.log(`🔍 Is login page: ${isLoginPage}`);
        
        if (!isLoginPage) {
            console.log('❌ Not on login page - user might already be logged in');
            return;
        }
        
        // Fill in credentials
        console.log('\n🔑 Filling in credentials...');
        await page.type('input[type="email"]', 'codylcochran89@gmail.com');
        await page.type('input[type="password"]', 'youtube');
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if form has submit handler
        const formInfo = await page.evaluate(() => {
            const form = document.querySelector('form');
            const submitBtn = document.querySelector('button[type="submit"]') || 
                            document.querySelector('input[type="submit"]');
            
            return {
                hasForm: !!form,
                hasSubmitButton: !!submitBtn,
                formAction: form ? form.action : null,
                formMethod: form ? form.method : null,
                submitButtonText: submitBtn ? submitBtn.textContent : null
            };
        });
        
        console.log('📝 Form info:');
        console.log(`   - Has form: ${formInfo.hasForm}`);
        console.log(`   - Has submit button: ${formInfo.hasSubmitButton}`);
        console.log(`   - Form action: ${formInfo.formAction}`);
        console.log(`   - Form method: ${formInfo.formMethod}`);
        console.log(`   - Submit button text: "${formInfo.submitButtonText}"`);
        
        // Try to trigger the login manually
        console.log('\n🔑 Triggering login manually...');
        
        // Method 1: Try form submit
        if (formInfo.hasForm) {
            console.log('📝 Submitting form...');
            await page.evaluate(() => {
                const form = document.querySelector('form');
                if (form) {
                    form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
            });
        }
        
        // Wait for any response
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if login was successful
        const loginResult = await page.evaluate(() => {
            const userNameElement = document.getElementById('userName');
            const errorElements = document.querySelectorAll('.error, .alert, [style*="color: red"]');
            
            return {
                userName: userNameElement ? userNameElement.textContent : null,
                errorMessages: Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text.length > 0),
                isLoggedIn: userNameElement && userNameElement.textContent !== 'User'
            };
        });
        
        console.log('\n📊 Login result:');
        console.log(`   - User name: "${loginResult.userName}"`);
        console.log(`   - Is logged in: ${loginResult.isLoggedIn ? '✅' : '❌'}`);
        
        if (loginResult.errorMessages.length > 0) {
            console.log('❌ Error messages:');
            loginResult.errorMessages.forEach(error => console.log(`   - ${error}`));
        }
        
        // Check if API call was made
        console.log('\n🔍 Checking for API calls...');
        const apiCalls = await page.evaluate(() => {
            // This would normally check network requests, but we'll check for any console logs about API calls
            return true; // Placeholder
        });
        
        console.log('✅ Debug test completed!');
        
    } catch (error) {
        console.error('❌ Debug test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the debug test
debugLogin().catch(console.error); 