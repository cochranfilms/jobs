// Test script for authentication fix
console.log('🧪 Testing Authentication Fix...');

// Test 1: Check if FirebaseConfig is available
console.log('📋 Test 1: Firebase Configuration');
if (window.FirebaseConfig) {
    console.log('✅ FirebaseConfig available');
    console.log('✅ Firebase auth:', typeof window.FirebaseConfig.auth);
    console.log('✅ isAdminUser function:', typeof window.FirebaseConfig.isAdminUser);
} else {
    console.log('❌ FirebaseConfig not available');
}

// Test 2: Check if ADMIN_PASSWORD is available
console.log('\n📋 Test 2: Fallback Authentication');
if (window.ADMIN_PASSWORD) {
    console.log('✅ ADMIN_PASSWORD configured:', window.ADMIN_PASSWORD);
} else {
    console.log('❌ ADMIN_PASSWORD not configured');
}

// Test 3: Check if AuthManager is available
console.log('\n📋 Test 3: Authentication Manager');
if (window.AuthManager) {
    console.log('✅ AuthManager available');
    console.log('✅ Auth state:', window.AuthManager.getAuthState());
} else {
    console.log('❌ AuthManager not available');
}

// Test 4: Test fallback authentication
console.log('\n📋 Test 4: Testing Fallback Authentication');
if (window.AuthManager && window.ADMIN_PASSWORD) {
    console.log('🔄 Testing sign in with fallback password...');
    
    // Test the sign in method
    window.AuthManager.signIn('admin@cochranfilms.com', window.ADMIN_PASSWORD)
        .then(result => {
            if (result.success) {
                console.log('✅ Fallback authentication successful!');
                console.log('✅ User:', result.user);
                console.log('✅ Admin privileges:', window.AuthManager.hasAdminPrivileges());
            } else {
                console.log('❌ Fallback authentication failed:', result.error);
            }
        })
        .catch(error => {
            console.error('❌ Authentication test error:', error);
        });
} else {
    console.log('⚠️ Cannot test authentication - missing components');
}

// Test 5: Check if dashboard is accessible
console.log('\n📋 Test 5: Dashboard Access');
const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');

if (loginScreen) {
    console.log('✅ Login screen found, display:', loginScreen.style.display);
} else {
    console.log('❌ Login screen not found');
}

if (dashboard) {
    console.log('✅ Dashboard found, display:', dashboard.style.display);
} else {
    console.log('❌ Dashboard not found');
}

console.log('\n🧪 Authentication Fix Test Complete!');
console.log('💡 Check console for detailed results');
