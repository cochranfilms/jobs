// EmailJS Fix Test Script
// Run this in the browser console to diagnose and fix EmailJS issues

console.log('🔧 EmailJS Fix Test Script Starting...');

// Test 1: Check EmailJS Library
function checkEmailJSLibrary() {
    console.log('\n📚 Test 1: EmailJS Library Check');
    
    if (typeof emailjs !== 'undefined') {
        console.log('✅ EmailJS library is loaded');
        console.log('📦 Version:', emailjs.version || 'Unknown');
        return true;
    } else {
        console.error('❌ EmailJS library is NOT loaded');
        console.log('💡 Check if the script tag is present and loading correctly');
        return false;
    }
}

// Test 2: Check Configuration
function checkConfiguration() {
    console.log('\n⚙️ Test 2: Configuration Check');
    
    const config = {
        publicKey: 'p4pF3OWvh-DXtae4c',
        serviceId: 'service_t11yvru',
        jobAcceptanceTemplateId: 'template_job_acceptance',
        jobClosedTemplateId: 'template_jobs_closed'
    };
    
    console.log('📋 Current configuration:', config);
    
    // Check if config matches what's in the code
    if (window.EMAILJS_CONFIG) {
        console.log('📋 Window config:', window.EMAILJS_CONFIG);
        if (JSON.stringify(config) === JSON.stringify(window.EMAILJS_CONFIG)) {
            console.log('✅ Configuration matches window config');
        } else {
            console.warn('⚠️ Configuration differs from window config');
        }
    }
    
    return config;
}

// Test 3: Initialize EmailJS
function initializeEmailJS(publicKey) {
    console.log('\n🚀 Test 3: EmailJS Initialization');
    
    try {
        emailjs.init(publicKey);
        console.log('✅ EmailJS initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ EmailJS initialization failed:', error);
        return false;
    }
}

// Test 4: Check Service Status
async function checkServiceStatus(serviceId) {
    console.log('\n🔍 Test 4: Service Status Check');
    
    try {
        // Try to get service info (this might not work in all cases)
        console.log('🔍 Checking service:', serviceId);
        console.log('💡 Note: Service status check may not be available in browser');
        return true;
    } catch (error) {
        console.warn('⚠️ Service status check failed:', error.message);
        return false;
    }
}

// Test 5: Test Template Variables
function testTemplateVariables() {
    console.log('\n📝 Test 5: Template Variables Check');
    
    // These are the variables expected by template_job_acceptance
    const expectedVariables = [
        'freelancer_name',
        'role', 
        'location',
        'rate',
        'project_start',
        'job',
        'contract_id'
    ];
    
    console.log('📋 Expected template variables:', expectedVariables);
    
    // Test with minimal valid data
    const testParams = {
        freelancer_name: 'Test User',
        role: 'Test Role',
        location: 'Test Location',
        rate: 'Test Rate',
        project_start: 'Test Date',
        job: 'Test Job',
        contract_id: 'Test Contract ID'
    };
    
    console.log('📧 Test parameters:', testParams);
    
    // Check for any undefined or null values
    const invalidParams = Object.entries(testParams).filter(([key, value]) => 
        value === undefined || value === null || value === ''
    );
    
    if (invalidParams.length > 0) {
        console.warn('⚠️ Invalid parameters found:', invalidParams);
        return false;
    } else {
        console.log('✅ All parameters are valid');
        return true;
    }
}

// Test 6: Send Test Email
async function sendTestEmail(config) {
    console.log('\n📧 Test 6: Send Test Email');
    
    try {
        console.log('🔄 Attempting to send test email...');
        
        const testParams = {
            freelancer_name: 'Test User',
            role: 'Test Role',
            location: 'Test Location',
            rate: 'Test Rate',
            project_start: 'Test Date',
            job: 'Test Job',
            contract_id: 'Test Contract ID'
        };
        
        console.log('📧 Using service:', config.serviceId);
        console.log('📧 Using template:', config.jobAcceptanceTemplateId);
        console.log('📧 Parameters:', testParams);
        
        const response = await emailjs.send(
            config.serviceId,
            config.jobAcceptanceTemplateId,
            testParams
        );
        
        console.log('✅ Test email sent successfully!', response);
        return { success: true, response };
        
    } catch (error) {
        console.error('❌ Test email failed:', error);
        console.error('❌ Error details:', {
            message: error.message,
            status: error.status,
            response: error.response,
            stack: error.stack
        });
        
        // Provide specific troubleshooting based on error status
        if (error.status === 422) {
            console.log('\n🔧 422 Error Troubleshooting:');
            console.log('1. Check template variables match exactly');
            console.log('2. Verify template is published and active');
            console.log('3. Check service configuration');
            console.log('4. Verify template is linked to service');
            console.log('5. Check for any required fields missing');
        } else if (error.status === 403) {
            console.log('\n🔧 403 Error Troubleshooting:');
            console.log('1. Check domain restrictions in EmailJS dashboard');
            console.log('2. Add collaborate.cochranfilms.com to allowed domains');
            console.log('3. Verify service is active');
        } else if (error.status === 400) {
            console.log('\n🔧 400 Error Troubleshooting:');
            console.log('1. Check template variables');
            console.log('2. Verify service configuration');
            console.log('3. Check template is published');
        } else if (error.status === 401) {
            console.log('\n🔧 401 Error Troubleshooting:');
            console.log('1. Check service authentication');
            console.log('2. Verify public key is correct');
            console.log('3. Check service status');
        }
        
        return { success: false, error };
    }
}

// Test 7: Check Domain Restrictions
function checkDomainRestrictions() {
    console.log('\n🌐 Test 7: Domain Restrictions Check');
    
    const currentDomain = window.location.hostname;
    const currentProtocol = window.location.protocol;
    const fullUrl = window.location.href;
    
    console.log('📍 Current domain:', currentDomain);
    console.log('🔒 Protocol:', currentProtocol);
    console.log('🔗 Full URL:', fullUrl);
    
    // Check for common domain issues
    if (currentProtocol !== 'https:') {
        console.warn('⚠️ Not using HTTPS - EmailJS may require HTTPS');
    }
    
    if (currentDomain === 'localhost' || currentDomain === '127.0.0.1') {
        console.warn('⚠️ Local development detected - EmailJS may have domain restrictions');
    }
    
    if (currentDomain.includes('cochranfilms.com')) {
        console.log('✅ Domain appears to be production domain');
    }
    
    console.log('\n🔧 Domain troubleshooting steps:');
    console.log('1. Go to EmailJS Dashboard → Settings → Security');
    console.log('2. Add domain to "Allowed Domains"');
    console.log('3. Include both with and without www');
    console.log('4. Wait a few minutes for changes to take effect');
}

// Test 8: Alternative Template Test
async function testAlternativeTemplate(config) {
    console.log('\n🔄 Test 8: Alternative Template Test');
    
    try {
        console.log('🔄 Testing with jobClosedTemplateId as alternative...');
        
        const testParams = {
            freelancer_name: 'Test User',
            role: 'Test Role',
            location: 'Test Location',
            rate: 'Test Rate',
            project_start: 'Test Date',
            job: 'Test Job',
            contract_id: 'Test Contract ID'
        };
        
        const response = await emailjs.send(
            config.serviceId,
            config.jobClosedTemplateId,
            testParams
        );
        
        console.log('✅ Alternative template worked!', response);
        return { success: true, response };
        
    } catch (error) {
        console.error('❌ Alternative template also failed:', error);
        return { success: false, error };
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting EmailJS Fix Tests...\n');
    
    // Run all tests
    const libraryOk = checkEmailJSLibrary();
    if (!libraryOk) {
        console.error('❌ Cannot continue - EmailJS library not loaded');
        return;
    }
    
    const config = checkConfiguration();
    const initOk = initializeEmailJS(config.publicKey);
    if (!initOk) {
        console.error('❌ Cannot continue - EmailJS initialization failed');
        return;
    }
    
    await checkServiceStatus(config.serviceId);
    const templateOk = testTemplateVariables();
    if (!templateOk) {
        console.warn('⚠️ Template variables have issues');
    }
    
    checkDomainRestrictions();
    
    // Try to send test email
    console.log('\n📧 Attempting to send test email...');
    const emailResult = await sendTestEmail(config);
    
    if (!emailResult.success) {
        console.log('\n🔄 Trying alternative template...');
        await testAlternativeTemplate(config);
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('✅ Library loaded:', libraryOk);
    console.log('✅ Initialized:', initOk);
    console.log('✅ Template variables:', templateOk);
    console.log('✅ Test email:', emailResult.success);
    
    if (emailResult.success) {
        console.log('\n🎉 All tests passed! EmailJS is working correctly.');
    } else {
        console.log('\n❌ Some tests failed. Check the troubleshooting steps above.');
        console.log('\n🔧 Next steps:');
        console.log('1. Check EmailJS dashboard for template and service status');
        console.log('2. Verify domain restrictions');
        console.log('3. Check template variable names match exactly');
        console.log('4. Ensure template is published and linked to service');
    }
}

// Auto-run tests
console.log('🔧 EmailJS Fix Test Script loaded');
console.log('💡 Run runAllTests() to execute all tests');
console.log('💡 Or run individual test functions as needed');

// Auto-run after a short delay to ensure everything is loaded
setTimeout(() => {
    console.log('\n🔄 Auto-running tests in 2 seconds...');
    setTimeout(runAllTests, 2000);
}, 1000);
