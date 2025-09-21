// Test script to verify login form input fields are working
console.log('🧪 Testing login form input fields...');

// Wait for page to load
setTimeout(() => {
    // Check if login screen is visible
    const loginScreen = document.getElementById('loginScreen');
    if (loginScreen) {
        console.log('✅ Login screen found');
        
        // Check input fields
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput && passwordInput) {
            console.log('✅ Input fields found');
            
            // Check input field properties
            console.log('📧 Email input:', {
                type: emailInput.type,
                display: window.getComputedStyle(emailInput).display,
                visibility: window.getComputedStyle(emailInput).visibility,
                opacity: window.getComputedStyle(emailInput).opacity,
                height: window.getComputedStyle(emailInput).height,
                width: window.getComputedStyle(emailInput).width,
                background: window.getComputedStyle(emailInput).background,
                color: window.getComputedStyle(emailInput).color
            });
            
            console.log('🔒 Password input:', {
                type: passwordInput.type,
                display: window.getComputedStyle(passwordInput).display,
                visibility: window.getComputedStyle(passwordInput).visibility,
                opacity: window.getComputedStyle(passwordInput).opacity,
                height: window.getComputedStyle(passwordInput).height,
                width: window.getComputedStyle(passwordInput).width,
                background: window.getComputedStyle(passwordInput).background,
                color: window.getComputedStyle(passwordInput).color
            });
            
            // Test input functionality
            emailInput.value = 'test@example.com';
            passwordInput.value = 'testpassword';
            
            console.log('✅ Input values set successfully');
            console.log('📧 Email value:', emailInput.value);
            console.log('🔒 Password value:', passwordInput.value);
            
            // Check if inputs are visible
            const emailRect = emailInput.getBoundingClientRect();
            const passwordRect = passwordInput.getBoundingClientRect();
            
            console.log('📏 Email input dimensions:', {
                width: emailRect.width,
                height: emailRect.height,
                top: emailRect.top,
                left: emailRect.left
            });
            
            console.log('📏 Password input dimensions:', {
                width: passwordRect.width,
                height: passwordRect.height,
                top: passwordRect.top,
                left: passwordRect.left
            });
            
            if (emailRect.width > 0 && emailRect.height > 0 && 
                passwordRect.width > 0 && passwordRect.height > 0) {
                console.log('✅ Input fields are properly sized and visible');
            } else {
                console.log('❌ Input fields have zero dimensions');
            }
            
        } else {
            console.log('❌ Input fields not found');
        }
        
        // Check form container
        const formContainer = document.querySelector('.login-form-container');
        if (formContainer) {
            console.log('✅ Form container found');
            const containerRect = formContainer.getBoundingClientRect();
            console.log('📏 Form container dimensions:', {
                width: containerRect.width,
                height: containerRect.height
            });
        }
        
    } else {
        console.log('❌ Login screen not found');
    }
}, 1000);

console.log('🧪 Test script loaded. Check console for results.');
