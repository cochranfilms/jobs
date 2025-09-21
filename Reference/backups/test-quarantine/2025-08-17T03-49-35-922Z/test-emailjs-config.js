// EmailJS Configuration Test Script
// Run this in the browser console to test EmailJS setup

console.log('🧪 Testing EmailJS Configuration...');

// Test 1: Check if EmailJS is loaded
if (typeof emailjs !== 'undefined') {
    console.log('✅ EmailJS library is loaded');
} else {
    console.error('❌ EmailJS library is NOT loaded');
    console.log('💡 Make sure the EmailJS script is included in your HTML');
}

// Test 2: Check configuration
const EMAILJS_CONFIG = {
    publicKey: 'p4pF3OWvh-DXtae4c',
    serviceId: 'service_t11yvru',
    jobAcceptanceTemplateId: 'template_job_acceptance',
    jobClosedTemplateId: 'template_jobs_closed'
};

console.log('📋 EmailJS Configuration:', EMAILJS_CONFIG);

// Test 3: Initialize EmailJS
try {
    emailjs.init(EMAILJS_CONFIG.publicKey);
    console.log('✅ EmailJS initialized successfully');
} catch (error) {
    console.error('❌ EmailJS initialization failed:', error);
}

// Test 4: Test email sending with minimal data
async function testEmailJS() {
    try {
        console.log('🔄 Testing EmailJS send...');
        
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
        
        const response = await emailjs.send(
            EMAILJS_CONFIG.serviceId,
            EMAILJS_CONFIG.jobAcceptanceTemplateId,
            testParams
        );
        
        console.log('✅ Test email sent successfully!', response);
        return true;
        
    } catch (error) {
        console.error('❌ Test email failed:', error);
        console.error('❌ Error details:', {
            message: error.message,
            status: error.status,
            response: error.response
        });
        
        // Provide troubleshooting tips
        if (error.status === 403) {
            console.log('🔧 Troubleshooting 403 Error:');
            console.log('1. Check EmailJS Dashboard → Settings → Security → Allowed Domains');
            console.log('2. Add your domain: collaborate.cochranfilms.com');
            console.log('3. Verify service is active and properly configured');
            console.log('4. Check if template is published and linked to service');
        } else if (error.status === 400) {
            console.log('🔧 Troubleshooting 400 Error:');
            console.log('1. Check template variables match exactly');
            console.log('2. Verify service configuration');
            console.log('3. Check template is published');
        } else if (error.status === 401) {
            console.log('🔧 Troubleshooting 401 Error:');
            console.log('1. Check service authentication');
            console.log('2. Verify public key is correct');
            console.log('3. Check service status in EmailJS dashboard');
        }
        
        return false;
    }
}

// Test 5: Check domain restrictions
function checkDomainRestrictions() {
    console.log('🌐 Checking domain restrictions...');
    console.log('Current domain:', window.location.hostname);
    console.log('Full URL:', window.location.href);
    
    // Common EmailJS domain issues
    console.log('🔧 Common domain issues:');
    console.log('- Domain not in EmailJS allowed list');
    console.log('- HTTPS vs HTTP mismatch');
    console.log('- Subdomain restrictions');
    console.log('- Localhost development restrictions');
}

// Run all tests
console.log('\n🚀 Running EmailJS Tests...\n');

// Run domain check
checkDomainRestrictions();

// Run email test (uncomment to actually send test email)
// testEmailJS().then(success => {
//     if (success) {
//         console.log('🎉 All EmailJS tests passed!');
//     } else {
//         console.log('❌ EmailJS tests failed. Check console for details.');
//     }
// });

console.log('\n💡 To run the actual email test, uncomment the testEmailJS() call above');
console.log('💡 Check the console for detailed error information and troubleshooting tips');
