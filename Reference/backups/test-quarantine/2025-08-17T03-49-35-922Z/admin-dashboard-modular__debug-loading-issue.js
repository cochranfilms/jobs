/**
 * Debug Script for Admin Dashboard Loading Issues
 * This script will help identify what's causing the constant loading state
 */

console.log('🔍 Starting Admin Dashboard Loading Debug...');

// Check module availability
const checkModules = () => {
    console.log('📋 Checking module availability...');
    
    const requiredModules = [
        'ErrorHandler',
        'LoadingManager', 
        'NotificationManager',
        'FirebaseConfig',
        'FirestoreConfig',
        'EmailJSConfig',
        'RealtimeDataManager',
        'DataMigration',
        'AuthManager',
        'LoginComponent',
        'DashboardManager',
        'UserManager',
        'UserForm',
        'UserList',
        'JobManager',
        'JobForm',
        'JobList',
        'ContractManager',
        'ContractGenerator',
        'DropdownManager',
        'ComponentLibrary'
    ];
    
    const availableModules = [];
    const missingModules = [];
    
    requiredModules.forEach(moduleName => {
        if (window[moduleName]) {
            availableModules.push(moduleName);
            console.log(`✅ ${moduleName}: Available`);
        } else {
            missingModules.push(moduleName);
            console.log(`❌ ${moduleName}: Missing`);
        }
    });
    
    console.log(`📊 Summary: ${availableModules.length}/${requiredModules.length} modules available`);
    console.log(`❌ Missing modules: ${missingModules.join(', ')}`);
    
    return { availableModules, missingModules };
};

// Check loading states
const checkLoadingStates = () => {
    console.log('🔄 Checking loading states...');
    
    // Check global loading
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        console.log(`📱 Loading indicator display: ${loadingIndicator.style.display}`);
        console.log(`📱 Loading indicator visible: ${loadingIndicator.offsetParent !== null}`);
    } else {
        console.log('❌ Loading indicator element not found');
    }
    
    // Check app loading state
    if (window.AdminDashboardApp) {
        console.log(`📱 App loading state: ${window.AdminDashboardApp.state.isLoading}`);
    }
    
    // Check loading manager states
    if (window.LoadingManager) {
        console.log(`📱 Loading manager global loading: ${window.LoadingManager.globalLoading}`);
        console.log(`📱 Loading manager active states: ${window.LoadingManager.loadingStates.size}`);
    }
    
    // Check body overflow
    console.log(`📱 Body overflow: ${document.body.style.overflow}`);
};

// Check for errors
const checkErrors = () => {
    console.log('🚨 Checking for errors...');
    
    // Check console errors
    const originalError = console.error;
    const errors = [];
    
    console.error = (...args) => {
        errors.push(args);
        originalError.apply(console, args);
    };
    
    // Check for unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.log('🚨 Unhandled promise rejection:', event.reason);
    });
    
    return errors;
};

// Check authentication state
const checkAuthState = () => {
    console.log('🔐 Checking authentication state...');
    
    if (window.FirebaseConfig) {
        console.log(`📱 Firebase initialized: ${window.FirebaseConfig.isInitialized}`);
        console.log(`📱 Firebase auth available: ${!!window.FirebaseConfig.auth}`);
    }
    
    if (window.AdminDashboardApp) {
        console.log(`📱 App authenticated: ${window.AdminDashboardApp.state.isAuthenticated}`);
        console.log(`📱 Current user:`, window.AdminDashboardApp.state.currentUser);
    }
    
    // Check session storage
    const sessionAuth = sessionStorage.getItem('adminDashboardAuthenticated');
    const adminUser = sessionStorage.getItem('adminUser');
    console.log(`📱 Session auth: ${sessionAuth}`);
    console.log(`📱 Admin user: ${adminUser ? 'Yes' : 'No'}`);
};

// Check for infinite loops or stuck promises
const checkForStuckOperations = () => {
    console.log('🔍 Checking for stuck operations...');
    
    // Check if there are any active promises that might be stuck
    if (window.LoadingManager && window.LoadingManager.loadingStates) {
        window.LoadingManager.loadingStates.forEach((state, operationId) => {
            if (state.active) {
                const duration = Date.now() - state.startTime;
                console.log(`⏱️ Active operation: ${operationId} (${duration}ms)`);
                
                // Flag operations that have been running too long
                if (duration > 10000) {
                    console.warn(`⚠️ Operation ${operationId} has been running for ${duration}ms - possible stuck operation`);
                }
            }
        });
    }
    
    // Check for any stuck timeouts
    if (window.AdminDashboardApp && window.AdminDashboardApp.state.isLoading) {
        console.warn('⚠️ App is still in loading state - possible stuck initialization');
    }
};

// Main debug function
const runDebug = () => {
    console.log('🚀 Running Admin Dashboard Debug...');
    console.log('=' .repeat(50));
    
    // Wait a bit for modules to load
    setTimeout(() => {
        checkModules();
        checkLoadingStates();
        checkAuthState();
        checkForStuckOperations();
        
        console.log('=' .repeat(50));
        console.log('🔍 Debug complete. Check console for issues.');
        
        // Set up periodic checks
        setInterval(() => {
            console.log('🔄 Periodic loading state check...');
            checkLoadingStates();
            checkForStuckOperations();
        }, 5000);
        
    }, 2000);
};

// Run debug when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runDebug);
} else {
    runDebug();
}

// Export for manual use
window.DebugLoading = {
    checkModules,
    checkLoadingStates,
    checkErrors,
    checkAuthState,
    checkForStuckOperations,
    runDebug
};
