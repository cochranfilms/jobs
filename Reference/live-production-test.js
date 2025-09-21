#!/usr/bin/env node

/**
 * Live Production Test Script
 * Tests both user-portal.html and admin-dashboard.html for issues
 * 
 * Usage: node live-production-test.js
 */

const puppeteer = require('puppeteer');

class LiveProductionTester {
    constructor() {
        this.results = {
            userPortal: {},
            adminDashboard: {},
            errors: [],
            warnings: [],
            recommendations: []
        };
    }

    async runTests() {
        console.log('🚀 Starting Live Production Tests...\n');
        
        const browser = await puppeteer.launch({
            headless: false, // Set to true for production
            defaultViewport: { width: 1280, height: 720 }
        });

        try {
            await this.testUserPortal(browser);
            await this.testAdminDashboard(browser);
            this.generateReport();
        } catch (error) {
            console.error('❌ Test execution failed:', error);
        } finally {
            await browser.close();
        }
    }

    async testUserPortal(browser) {
        console.log('🔍 Testing User Portal...');
        const page = await browser.newPage();
        
        try {
            // Navigate to user portal
            await page.goto('http://collaborate.cochranfilms.com/user-portal', { waitUntil: 'networkidle2' });
            
            // Test 1: Check if page loads
            const title = await page.title();
            console.log('✅ User Portal loaded:', title);
            
            // Test 2: Check for console errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            
            // Test 3: Check for JavaScript errors
            const jsErrors = await page.evaluate(() => {
                const errors = [];
                window.addEventListener('error', (e) => {
                    errors.push({
                        message: e.message,
                        filename: e.filename,
                        lineno: e.lineno
                    });
                });
                return errors;
            });
            
            // Test 4: Check if userName element exists and is populated
            const userNameStatus = await page.evaluate(() => {
                const userNameElement = document.getElementById('userName');
                return {
                    exists: !!userNameElement,
                    text: userNameElement ? userNameElement.textContent : null,
                    visible: userNameElement ? userNameElement.offsetParent !== null : false
                };
            });
            
            // Test 5: Check for contract download functionality
            const contractDownloadStatus = await page.evaluate(() => {
                const downloadButtons = document.querySelectorAll('[onclick*="downloadUserContract"]');
                return {
                    buttonsFound: downloadButtons.length,
                    buttonTexts: Array.from(downloadButtons).map(btn => btn.textContent.trim())
                };
            });
            
            // Test 6: Check for users.json data loading
            const dataLoadingStatus = await page.evaluate(async () => {
                try {
                    const response = await fetch('users.json');
                    const data = await response.json();
                    return {
                        success: true,
                        userCount: Object.keys(data.users || {}).length,
                        hasCodyCochran: !!data.users['Cody Cochran'],
                        contractData: data.users['Cody Cochran']?.contract || null
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            });
            
            // Test 7: Check for Firebase authentication
            const firebaseStatus = await page.evaluate(() => {
                return {
                    firebaseLoaded: typeof firebase !== 'undefined',
                    authState: typeof firebase?.auth !== 'undefined'
                };
            });
            
            // Test 8: Check for PDF generation libraries
            const pdfLibrariesStatus = await page.evaluate(() => {
                return {
                    jsPDF: typeof window.jspdf !== 'undefined',
                    html2canvas: typeof html2canvas !== 'undefined'
                };
            });
            
            // Test 9: Check login form elements
            const loginFormStatus = await page.evaluate(() => {
                const emailInput = document.querySelector('input[type="email"]');
                const passwordInput = document.querySelector('input[type="password"]');
                
                // Find login button with multiple strategies
                let loginButton = document.querySelector('button[onclick*="login"]');
                if (!loginButton) {
                    loginButton = document.querySelector('input[type="submit"]');
                }
                if (!loginButton) {
                    // Find button with LOGIN text
                    const allButtons = document.querySelectorAll('button');
                    loginButton = Array.from(allButtons).find(btn => 
                        btn.textContent.includes('LOGIN') || 
                        btn.textContent.includes('Login') ||
                        btn.textContent.includes('login')
                    );
                }
                
                return {
                    emailInputExists: !!emailInput,
                    passwordInputExists: !!passwordInput,
                    loginButtonExists: !!loginButton,
                    emailInputId: emailInput ? emailInput.id : null,
                    passwordInputId: passwordInput ? passwordInput.id : null
                };
            });
            
            // Test 10: Attempt login with test credentials
            const loginTestStatus = await page.evaluate(async () => {
                try {
                    // Find login form elements
                    const emailInput = document.querySelector('input[type="email"]');
                    const passwordInput = document.querySelector('input[type="password"]');
                    
                    // Find login button with multiple strategies
                    let loginButton = document.querySelector('button[onclick*="login"]');
                    if (!loginButton) {
                        loginButton = document.querySelector('input[type="submit"]');
                    }
                    if (!loginButton) {
                        // Find button with LOGIN text
                        const allButtons = document.querySelectorAll('button');
                        loginButton = Array.from(allButtons).find(btn => 
                            btn.textContent.includes('LOGIN') || 
                            btn.textContent.includes('Login') ||
                            btn.textContent.includes('login')
                        );
                    }
                    
                    if (!emailInput || !passwordInput || !loginButton) {
                        return {
                            success: false,
                            error: 'Login form elements not found',
                            elementsFound: {
                                emailInput: !!emailInput,
                                passwordInput: !!passwordInput,
                                loginButton: !!loginButton
                            }
                        };
                    }
                    
                    // Fill in test credentials
                    emailInput.value = 'codylcochran89@gmail.com';
                    passwordInput.value = 'youtube';
                    
                    // Trigger input events
                    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Wait a moment for any validation
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                    // Check for any error messages
                    const errorElements = document.querySelectorAll('.error, .alert, [style*="color: red"], [style*="color: #ff0000"]');
                    const errorMessages = Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
                    
                    // Check if user is already logged in
                    const userNameElement = document.getElementById('userName');
                    const isLoggedIn = userNameElement && userNameElement.textContent !== 'User';
                    
                    return {
                        success: true,
                        credentialsEntered: true,
                        elementsFound: {
                            emailInput: true,
                            passwordInput: true,
                            loginButton: true
                        },
                        errorMessages,
                        isLoggedIn,
                        userNameText: userNameElement ? userNameElement.textContent : null
                    };
                    
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            });
            
            // Test 11: Actually attempt login
            const actualLoginStatus = await page.evaluate(async () => {
                try {
                    // Find login button
                    let loginButton = document.querySelector('button[onclick*="login"]');
                    if (!loginButton) {
                        loginButton = document.querySelector('input[type="submit"]');
                    }
                    if (!loginButton) {
                        const allButtons = document.querySelectorAll('button');
                        loginButton = Array.from(allButtons).find(btn => 
                            btn.textContent.includes('LOGIN') || 
                            btn.textContent.includes('Login') ||
                            btn.textContent.includes('login')
                        );
                    }
                    
                    if (!loginButton) {
                        return {
                            success: false,
                            error: 'Login button not found'
                        };
                    }
                    
                    // Click the login button
                    loginButton.click();
                    
                    // Wait for potential authentication
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    // Check if login was successful
                    const userNameElement = document.getElementById('userName');
                    const isLoggedIn = userNameElement && userNameElement.textContent !== 'User';
                    
                    // Check for error messages
                    const errorElements = document.querySelectorAll('.error, .alert, [style*="color: red"], [style*="color: #ff0000"]');
                    const errorMessages = Array.from(errorElements).map(el => el.textContent.trim()).filter(text => text.length > 0);
                    
                    return {
                        success: true,
                        loginAttempted: true,
                        isLoggedIn,
                        errorMessages,
                        userNameText: userNameElement ? userNameElement.textContent : null
                    };
                    
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            });
            
            // Store results
            this.results.userPortal = {
                title,
                consoleErrors,
                jsErrors,
                userNameStatus,
                contractDownloadStatus,
                dataLoadingStatus,
                firebaseStatus,
                pdfLibrariesStatus,
                loginFormStatus,
                loginTestStatus,
                actualLoginStatus
            };
            
            console.log('✅ User Portal tests completed');
            
        } catch (error) {
            console.error('❌ User Portal test failed:', error);
            this.results.errors.push(`User Portal: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    async testAdminDashboard(browser) {
        console.log('🔍 Testing Admin Dashboard...');
        const page = await browser.newPage();
        
        try {
            // Navigate to admin dashboard
            await page.goto('http://collaborate.cochranfilms.com/admin-dashboard', { waitUntil: 'networkidle2' });
            
            // Test 1: Check if page loads
            const title = await page.title();
            console.log('✅ Admin Dashboard loaded:', title);
            
            // Test 2: Check for console errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            
            // Test 3: Check for JavaScript errors
            const jsErrors = await page.evaluate(() => {
                const errors = [];
                window.addEventListener('error', (e) => {
                    errors.push({
                        message: e.message,
                        filename: e.filename,
                        lineno: e.lineno
                    });
                });
                return errors;
            });
            
            // Test 4: Check for users.json data loading
            const dataLoadingStatus = await page.evaluate(async () => {
                try {
                    const response = await fetch('users.json');
                    const data = await response.json();
                    return {
                        success: true,
                        userCount: Object.keys(data.users || {}).length,
                        hasCodyCochran: !!data.users['Cody Cochran'],
                        contractData: data.users['Cody Cochran']?.contract || null
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message
                    };
                }
            });
            
            // Test 5: Check for contract download functionality
            const contractDownloadStatus = await page.evaluate(() => {
                const downloadButtons = document.querySelectorAll('[onclick*="downloadUserContract"]');
                return {
                    buttonsFound: downloadButtons.length,
                    buttonTexts: Array.from(downloadButtons).map(btn => btn.textContent.trim())
                };
            });
            
            // Test 6: Check for PDF generation libraries
            const pdfLibrariesStatus = await page.evaluate(() => {
                return {
                    jsPDF: typeof window.jspdf !== 'undefined',
                    html2canvas: typeof html2canvas !== 'undefined'
                };
            });
            
            // Test 7: Check for form elements
            const formElementsStatus = await page.evaluate(() => {
                return {
                    hasJobForm: !!document.querySelector('form'),
                    hasUserForm: !!document.querySelector('input[name="fullName"]'),
                    hasDropdowns: document.querySelectorAll('select').length
                };
            });
            
            // Store results
            this.results.adminDashboard = {
                title,
                consoleErrors,
                jsErrors,
                dataLoadingStatus,
                contractDownloadStatus,
                pdfLibrariesStatus,
                formElementsStatus
            };
            
            console.log('✅ Admin Dashboard tests completed');
            
        } catch (error) {
            console.error('❌ Admin Dashboard test failed:', error);
            this.results.errors.push(`Admin Dashboard: ${error.message}`);
        } finally {
            await page.close();
        }
    }

    generateReport() {
        console.log('\n📊 LIVE PRODUCTION TEST REPORT');
        console.log('=' .repeat(50));
        
        // User Portal Analysis
        console.log('\n🔍 USER PORTAL ANALYSIS:');
        console.log('-'.repeat(30));
        
        if (this.results.userPortal.title) {
            console.log(`✅ Page Title: ${this.results.userPortal.title}`);
        }
        
        if (this.results.userPortal.consoleErrors.length > 0) {
            console.log(`❌ Console Errors (${this.results.userPortal.consoleErrors.length}):`);
            this.results.userPortal.consoleErrors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }
        
        if (this.results.userPortal.jsErrors.length > 0) {
            console.log(`❌ JavaScript Errors (${this.results.userPortal.jsErrors.length}):`);
            this.results.userPortal.jsErrors.forEach(error => {
                console.log(`   - ${error.message} at ${error.filename}:${error.lineno}`);
            });
        }
        
        // User Name Element Analysis
        const userNameStatus = this.results.userPortal.userNameStatus;
        if (userNameStatus) {
            console.log(`\n👤 User Name Element:`);
            console.log(`   - Exists: ${userNameStatus.exists ? '✅' : '❌'}`);
            console.log(`   - Text: "${userNameStatus.text}"`);
            console.log(`   - Visible: ${userNameStatus.visible ? '✅' : '❌'}`);
        }
        
        // Data Loading Analysis
        const dataStatus = this.results.userPortal.dataLoadingStatus;
        if (dataStatus) {
            console.log(`\n📊 Users.json Data Loading:`);
            console.log(`   - Success: ${dataStatus.success ? '✅' : '❌'}`);
            if (dataStatus.success) {
                console.log(`   - User Count: ${dataStatus.userCount}`);
                console.log(`   - Has Cody Cochran: ${dataStatus.hasCodyCochran ? '✅' : '❌'}`);
                if (dataStatus.contractData) {
                    console.log(`   - Contract ID: ${dataStatus.contractData.contractId}`);
                    console.log(`   - Contract Status: ${dataStatus.contractData.contractStatus}`);
                }
            } else {
                console.log(`   - Error: ${dataStatus.error}`);
            }
        }
        
        // PDF Libraries Analysis
        const pdfStatus = this.results.userPortal.pdfLibrariesStatus;
        if (pdfStatus) {
            console.log(`\n📄 PDF Generation Libraries:`);
            console.log(`   - jsPDF: ${pdfStatus.jsPDF ? '✅' : '❌'}`);
            console.log(`   - html2canvas: ${pdfStatus.html2canvas ? '✅' : '❌'}`);
        }
        
        // Login Form Analysis
        const loginFormStatus = this.results.userPortal.loginFormStatus;
        if (loginFormStatus) {
            console.log(`\n🔐 Login Form Elements:`);
            console.log(`   - Email Input: ${loginFormStatus.emailInputExists ? '✅' : '❌'}`);
            console.log(`   - Password Input: ${loginFormStatus.passwordInputExists ? '✅' : '❌'}`);
            console.log(`   - Login Button: ${loginFormStatus.loginButtonExists ? '✅' : '❌'}`);
            if (loginFormStatus.emailInputId) {
                console.log(`   - Email Input ID: ${loginFormStatus.emailInputId}`);
            }
            if (loginFormStatus.passwordInputId) {
                console.log(`   - Password Input ID: ${loginFormStatus.passwordInputId}`);
            }
        }
        
        // Login Test Analysis
        const loginTestStatus = this.results.userPortal.loginTestStatus;
        if (loginTestStatus) {
            console.log(`\n🔑 Login Test Results:`);
            console.log(`   - Success: ${loginTestStatus.success ? '✅' : '❌'}`);
            if (loginTestStatus.success) {
                console.log(`   - Credentials Entered: ${loginTestStatus.credentialsEntered ? '✅' : '❌'}`);
            } else {
                console.log(`   - Error: ${loginTestStatus.error}`);
                if (loginTestStatus.elementsFound) {
                    console.log(`   - Elements Found:`);
                    console.log(`     - Email Input: ${loginTestStatus.elementsFound.emailInput ? '✅' : '❌'}`);
                    console.log(`     - Password Input: ${loginTestStatus.elementsFound.passwordInput ? '✅' : '❌'}`);
                    console.log(`     - Login Button: ${loginTestStatus.elementsFound.loginButton ? '✅' : '❌'}`);
                }
            }
        }

        // Actual Login Attempt Analysis
        const actualLoginStatus = this.results.userPortal.actualLoginStatus;
        if (actualLoginStatus) {
            console.log(`\n🔑 Actual Login Attempt:`);
            console.log(`   - Success: ${actualLoginStatus.success ? '✅' : '❌'}`);
            if (actualLoginStatus.success) {
                console.log(`   - Login Attempted: ${actualLoginStatus.loginAttempted ? '✅' : '❌'}`);
                console.log(`   - Is Logged In: ${actualLoginStatus.isLoggedIn ? '✅' : '❌'}`);
                if (actualLoginStatus.userNameText) {
                    console.log(`   - User Name Text: "${actualLoginStatus.userNameText}"`);
                }
                if (actualLoginStatus.errorMessages.length > 0) {
                    console.log(`   - Error Messages: ${actualLoginStatus.errorMessages.join(', ')}`);
                }
            } else {
                console.log(`   - Error: ${actualLoginStatus.error}`);
            }
        }
        
        // Admin Dashboard Analysis
        console.log('\n🔍 ADMIN DASHBOARD ANALYSIS:');
        console.log('-'.repeat(30));
        
        if (this.results.adminDashboard.title) {
            console.log(`✅ Page Title: ${this.results.adminDashboard.title}`);
        }
        
        if (this.results.adminDashboard.consoleErrors.length > 0) {
            console.log(`❌ Console Errors (${this.results.adminDashboard.consoleErrors.length}):`);
            this.results.adminDashboard.consoleErrors.forEach(error => {
                console.log(`   - ${error}`);
            });
        }
        
        // Admin Data Loading Analysis
        const adminDataStatus = this.results.adminDashboard.dataLoadingStatus;
        if (adminDataStatus) {
            console.log(`\n📊 Admin Users.json Data Loading:`);
            console.log(`   - Success: ${adminDataStatus.success ? '✅' : '❌'}`);
            if (adminDataStatus.success) {
                console.log(`   - User Count: ${adminDataStatus.userCount}`);
                console.log(`   - Has Cody Cochran: ${adminDataStatus.hasCodyCochran ? '✅' : '❌'}`);
            } else {
                console.log(`   - Error: ${adminDataStatus.error}`);
            }
        }
        
        // Generate Recommendations
        this.generateRecommendations();
    }

    generateRecommendations() {
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('-'.repeat(30));
        
        // User Portal Recommendations
        if (this.results.userPortal.userNameStatus && !this.results.userPortal.userNameStatus.exists) {
            console.log('❌ User Portal: userName element not found - check HTML structure');
        }
        
        if (this.results.userPortal.dataLoadingStatus && !this.results.userPortal.dataLoadingStatus.success) {
            console.log('❌ User Portal: users.json not loading - check file path and CORS');
        }
        
        if (this.results.userPortal.pdfLibrariesStatus && !this.results.userPortal.pdfLibrariesStatus.jsPDF) {
            console.log('❌ User Portal: jsPDF library not loaded - check script tags');
        }
        
        if (this.results.userPortal.consoleErrors.length > 0) {
            console.log('❌ User Portal: Console errors detected - check JavaScript syntax');
        }
        
        // Admin Dashboard Recommendations
        if (this.results.adminDashboard.dataLoadingStatus && !this.results.adminDashboard.dataLoadingStatus.success) {
            console.log('❌ Admin Dashboard: users.json not loading - check file path and CORS');
        }
        
        if (this.results.adminDashboard.pdfLibrariesStatus && !this.results.adminDashboard.pdfLibrariesStatus.jsPDF) {
            console.log('❌ Admin Dashboard: jsPDF library not loaded - check script tags');
        }
        
        if (this.results.adminDashboard.consoleErrors.length > 0) {
            console.log('❌ Admin Dashboard: Console errors detected - check JavaScript syntax');
        }
        
        // General Recommendations
        console.log('\n🔧 GENERAL FIXES NEEDED:');
        console.log('-'.repeat(30));
        
        if (this.results.userPortal.jsErrors.length > 0 || this.results.adminDashboard.jsErrors.length > 0) {
            console.log('1. Fix JavaScript syntax errors in both portals');
        }
        
        if (!this.results.userPortal.pdfLibrariesStatus?.jsPDF || !this.results.adminDashboard.pdfLibrariesStatus?.jsPDF) {
            console.log('2. Add jsPDF library to both portals for PDF generation');
        }
        
        if (!this.results.userPortal.dataLoadingStatus?.success || !this.results.adminDashboard.dataLoadingStatus?.success) {
            console.log('3. Fix users.json loading - check file path and server configuration');
        }
        
        if (!this.results.userPortal.userNameStatus?.exists) {
            console.log('4. Fix userName element in user portal HTML structure');
        }
        
        if (!this.results.userPortal.loginFormStatus?.emailInputExists || !this.results.userPortal.loginFormStatus?.passwordInputExists) {
            console.log('5. Fix login form elements - email/password inputs not found');
        }
        
        if (!this.results.userPortal.loginFormStatus?.loginButtonExists) {
            console.log('6. Fix login button - login button not found');
        }
        
        if (this.results.userPortal.loginTestStatus && !this.results.userPortal.loginTestStatus.success) {
            console.log('7. Fix login functionality - login test failed');
        }
        
        console.log('\n✅ Test completed! Check the recommendations above for fixes needed.');
    }
}

// Run the tests
async function main() {
    const tester = new LiveProductionTester();
    await tester.runTests();
}

// Check if puppeteer is available
try {
    require('puppeteer');
    main().catch(console.error);
} catch (error) {
    console.log('📦 Installing required dependencies...');
    console.log('Run: npm install puppeteer');
    console.log('Then run: node live-production-test.js');
} 