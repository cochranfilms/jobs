/**
 * Authentication Manager Module
 * Handles user authentication and session management
 */

const AuthManager = {
    // Authentication state
    state: {
        isAuthenticated: false,
        currentUser: null,
        isLoading: false
    },

    // Flag to indicate if this manager is handling authentication
    isHandlingAuth: false,

    // Initialize authentication manager
    async init() {
        try {
            console.log('🔐 Initializing Authentication Manager...');
            
            // Setup authentication state observer (async)
            await this.setupAuthStateObserver();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Authentication Manager initialized');
            
        } catch (error) {
            console.error('❌ Authentication Manager initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'auth-manager-init');
            }
        }
    },

    // Setup Firebase auth state observer
    async setupAuthStateObserver() {
        try {
            // Respect main dashboard control: avoid duplicate listeners in modular app
            if (window.MAIN_DASHBOARD_AUTH_OVERRIDE === false) {
                console.log('✅ Main dashboard has auth control; skipping modular auth observer');
                return;
            }
            if (window.FirebaseConfig && window.FirebaseConfig.auth) {
                // Wait for Firebase to be initialized
                await window.FirebaseConfig.waitForInit();
                
                if (window.FirebaseConfig.auth) {
                    // Mark that we're handling authentication
                    this.isHandlingAuth = true;
                    
                    window.FirebaseConfig.auth.onAuthStateChanged((user) => {
                        this.handleAuthStateChange(user);
                    });
                    
                    console.log('✅ Firebase auth state observer setup complete');
                    return;
                }
            }

            // If Firebase is not available, check for stored fallback authentication
            console.log('⚠️ Firebase not available, checking fallback authentication...');
            if (this.checkStoredAuth()) {
                console.log('✅ Using stored fallback authentication');
                this.onSuccessfulAuth(this.state.currentUser);
            }
            
        } catch (error) {
            console.error('❌ Failed to setup Firebase auth state observer:', error);
            
            // Try fallback authentication as last resort
            if (this.checkStoredAuth()) {
                console.log('✅ Using fallback authentication after Firebase error');
                this.onSuccessfulAuth(this.state.currentUser);
            }
        }
    },

    // Handle authentication state changes
    handleAuthStateChange(user) {
        if (user && user.email) {
            console.log('✅ User authenticated:', user.email);
            
            // Check if user has admin privileges
            if (window.FirebaseConfig.isAdminUser(user.email)) {
                this.state.isAuthenticated = true;
                this.state.currentUser = user;
                this.onSuccessfulAuth(user);
            } else {
                console.log('❌ User does not have admin privileges');
                this.onAccessDenied(user);
            }
        } else {
            console.log('❌ User signed out');
            this.state.isAuthenticated = false;
            this.state.currentUser = null;
            this.onSignOut();
        }
    },

    // Handle successful authentication
    onSuccessfulAuth(user) {
        // Store authentication state
        sessionStorage.setItem('adminDashboardAuthenticated', 'true');
        sessionStorage.setItem('adminUser', JSON.stringify(user));
        
        // Show dashboard
        this.showDashboard();
        
        // Show welcome notification
        if (window.NotificationManager) {
            window.NotificationManager.success(
                `Welcome back, ${user.email}!`,
                { title: 'Authentication Successful' }
            );
        }
        
        // Trigger auth success event
        this.triggerEvent('auth:success', { user });
    },

    // Handle access denied
    onAccessDenied(user) {
        if (window.NotificationManager) {
            window.NotificationManager.error(
                'Access denied. Admin privileges required.',
                { title: 'Access Denied', duration: 10000 }
            );
        }
        // Do NOT sign out the global Firebase session here to avoid kicking other tabs/pages
        // Let the main dashboard decide UI state; just emit event
        
        // Trigger access denied event
        this.triggerEvent('auth:access-denied', { user });
    },

    // Handle sign out
    onSignOut() {
        // Clear stored authentication state
        sessionStorage.removeItem('adminDashboardAuthenticated');
        sessionStorage.removeItem('adminUser');
        
        // Show login screen
        this.showLoginScreen();
        
        // Trigger sign out event
        this.triggerEvent('auth:signout');
    },

    // Sign in with email and password
    async signIn(email, password) {
        try {
            this.state.isLoading = true;
            
            // Show loading notification
            if (window.NotificationManager) {
                window.NotificationManager.info('Signing in...', { duration: 2000 });
            }

            // Check if main dashboard authentication should be overridden
            if (window.MAIN_DASHBOARD_AUTH_OVERRIDE === false) {
                console.log('✅ Main dashboard auth override disabled - not interfering');
                throw new Error('Main dashboard authentication is handling this');
            }
            
            // Check if main dashboard login form should be overridden
            if (window.MAIN_DASHBOARD_LOGIN_FORM_OVERRIDE === false) {
                console.log('✅ Main dashboard login form override disabled - not interfering');
                throw new Error('Main dashboard login form is handling this');
            }

            // Try Firebase authentication first
            if (window.FirebaseConfig && window.FirebaseConfig.auth) {
                try {
                    // Check if Firebase is initialized
                    if (window.FirebaseConfig.isInitialized) {
                        const userCredential = await window.FirebaseConfig.auth.signInWithEmailAndPassword(email, password);
                        
                        console.log('✅ Firebase sign in successful:', userCredential.user.email);
                        return { success: true, user: userCredential.user };
                    } else {
                        console.warn('⚠️ Firebase not initialized, trying fallback');
                    }
                    
                } catch (firebaseError) {
                    console.warn('⚠️ Firebase authentication failed, trying fallback:', firebaseError);
                    // Continue to fallback authentication
                }
            }

            // Fallback authentication using ADMIN_PASSWORD
            console.log('🔍 Attempting fallback authentication...');
            console.log('🔍 window.ADMIN_PASSWORD:', window.ADMIN_PASSWORD);
            console.log('🔍 password entered:', password);
            console.log('🔍 password === window.ADMIN_PASSWORD:', password === window.ADMIN_PASSWORD);
            
            if (window.ADMIN_PASSWORD && password === window.ADMIN_PASSWORD) {
                // Check if email is in admin list or use a default admin email
                const adminEmail = email || 'admin@cochranfilms.com';
                
                // Create a mock user object for fallback auth
                const fallbackUser = {
                    email: adminEmail,
                    isAdmin: true,
                    uid: 'fallback-admin-' + Date.now(),
                    displayName: 'Admin User'
                };
                
                console.log('✅ Fallback authentication successful:', adminEmail);
                return { success: true, user: fallbackUser };
            }

            // If neither Firebase nor fallback worked
            throw new Error('Invalid credentials');
            
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            
            let userMessage = 'Sign in failed. Please try again.';
            
            // Handle specific Firebase auth errors
            if (error.code === 'auth/user-not-found') {
                userMessage = 'User not found. Please check your email.';
            } else if (error.code === 'auth/wrong-password') {
                userMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                userMessage = 'Invalid email format.';
            } else if (error.code === 'auth/too-many-requests') {
                userMessage = 'Too many failed attempts. Please try again later.';
            } else if (error.code === 'auth/network-request-failed') {
                userMessage = 'Network error. Please check your connection.';
            } else if (error.message === 'Invalid credentials') {
                userMessage = 'Invalid email or password. Please try again.';
            } else if (error.message === 'Main dashboard authentication is handling this') {
                userMessage = 'Authentication handled by main dashboard';
            }
            
            if (window.NotificationManager) {
                window.NotificationManager.error(userMessage, { title: 'Sign In Failed' });
            }
            
            return { success: false, error: userMessage };
            
        } finally {
            this.state.isLoading = false;
        }
    },

    // Sign out user
    async signOut() {
        try {
            if (window.FirebaseConfig) {
                await window.FirebaseConfig.signOut();
            }
            
            this.state.isAuthenticated = false;
            this.state.currentUser = null;
            
            console.log('✅ Sign out successful');
            
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'auth-signout');
            }
        }
    },

    // Check if user is authenticated
    isAuthenticated() {
        return this.state.isAuthenticated;
    },

    // Get current user
    getCurrentUser() {
        return this.state.currentUser;
    },

    // Check if user has admin privileges
    hasAdminPrivileges() {
        if (!this.state.currentUser || !this.state.currentUser.email) {
            return false;
        }
        
        // Check Firebase admin list if available
        if (window.FirebaseConfig && window.FirebaseConfig.isAdminUser) {
            return window.FirebaseConfig.isAdminUser(this.state.currentUser.email);
        }
        
        // Fallback: check if user has isAdmin flag or is using fallback auth
        return this.state.currentUser.isAdmin === true || 
               this.state.currentUser.uid?.startsWith('fallback-admin-');
    },

    // Show login screen
    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
        
        // Update page title
        document.title = 'Login | Admin Dashboard | Cochran Films';
        
        // Trigger login screen shown event
        this.triggerEvent('auth:login-screen-shown');
    },

    // Show dashboard
    showDashboard() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        // Update page title
        document.title = 'Admin Dashboard | Cochran Films';
        
        // Trigger dashboard shown event
        this.triggerEvent('auth:dashboard-shown');
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for Firebase initialization
        document.addEventListener('firebase:ready', () => {
            this.setupAuthStateObserver();
        });
    },

    // Trigger custom events
    triggerEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    },

    // Get authentication state
    getAuthState() {
        return { ...this.state };
    },

    // Check stored authentication
    checkStoredAuth() {
        const stored = sessionStorage.getItem('adminDashboardAuthenticated');
        const storedUser = sessionStorage.getItem('adminUser');
        
        if (stored === 'true' && storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user && user.email) {
                    this.state.isAuthenticated = true;
                    this.state.currentUser = user;
                    return true;
                }
            } catch (error) {
                console.warn('Failed to parse stored user data:', error);
            }
        }
        
        return false;
    }
};

// Export for global access
window.AuthManager = AuthManager;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    AuthManager.init().catch(error => {
        console.error('❌ AuthManager auto-initialization failed:', error);
    });
});

// Also listen for Firebase initialization event
document.addEventListener('firebase:initialized', () => {
    if (AuthManager.state.isAuthenticated === false) {
        AuthManager.setupAuthStateObserver().catch(error => {
            console.error('❌ Failed to setup auth state observer after Firebase init:', error);
        });
    }
});
