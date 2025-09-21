#!/usr/bin/env node

/**
 * Simple Login Test
 * Tests login functionality on user portal
 */

const puppeteer = require('puppeteer');

async function testLogin() {
    console.log('🔍 Testing Login Functionality...\n');
    
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
        
        // Check if login form exists
        console.log('🔍 Checking login form elements...');
        const formElements = await page.evaluate(() => {
            const emailInput = document.querySelector('input[type="email"]');
            const passwordInput = document.querySelector('input[type="password"]');
            const loginButton = document.querySelector('button[onclick*="login"]') || 
                              document.querySelector('input[type="submit"]') ||
                              Array.from(document.querySelectorAll('button')).find(btn => 
                                  btn.textContent.includes('LOGIN') || 
                                  btn.textContent.includes('Login')
                              );
            
            return {
                emailInput: !!emailInput,
                passwordInput: !!passwordInput,
                loginButton: !!loginButton,
                emailInputId: emailInput ? emailInput.id : null,
                passwordInputId: passwordInput ? passwordInput.id : null
            };
        });
        
        console.log('📝 Form elements found:');
        console.log(`   - Email Input: ${formElements.emailInput ? '✅' : '❌'}`);
        console.log(`   - Password Input: ${formElements.passwordInput ? '✅' : '❌'}`);
        console.log(`   - Login Button: ${formElements.loginButton ? '✅' : '❌'}`);
        
        if (formElements.emailInputId) {
            console.log(`   - Email Input ID: ${formElements.emailInputId}`);
        }
        if (formElements.passwordInputId) {
            console.log(`   - Password Input ID: ${formElements.passwordInputId}`);
        }
        
        // Fill in credentials
        console.log('\n🔑 Filling in test credentials...');
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
        console.log('\n🔑 Attempting login...');
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
        const finalUserName = await page.evaluate(() => {
            const userNameElement = document.getElementById('userName');
            return userNameElement ? userNameElement.textContent : null;
        });
        
        console.log(`👤 Final user name: "${finalUserName}"`);
        
        if (finalUserName && finalUserName !== 'User' && finalUserName !== initialUserName) {
            console.log('✅ Login appears to be successful!');
        } else {
            console.log('❌ Login may have failed - user name unchanged');
            
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
        
        console.log('\n✅ Login test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testLogin().catch(console.error); 