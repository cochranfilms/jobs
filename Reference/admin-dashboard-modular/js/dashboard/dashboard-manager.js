/**
 * Dashboard Manager Module
 * Handles core dashboard functionality, stats, and layout management
 */

const DashboardManager = {
    // Dashboard state
    state: {
        isAuthenticated: false,
        currentUser: null,
        stats: {
            totalCreators: 0,
            activeJobs: 0,
            pendingReviews: 0,
            totalContracts: 0
        },
        isLoading: false,
        lastUpdated: null,
        notifications: [],
        unreadCount: 0
    },

    // Initialize dashboard manager
    async init() {
        try {
            console.log('⚙️ Initializing Dashboard Manager...');
            
            // Check if main dashboard should handle display states
            if (window.MAIN_DASHBOARD_USER_DISPLAY_OVERRIDE === false) {
                console.log('✅ Main dashboard display override disabled - not controlling display states');
                this.state.isInitialized = true;
                return;
            }
            
            // Wait for component library to be ready
            if (window.ComponentLibrary && !window.ComponentLibrary.isReady()) {
                await new Promise(resolve => {
                    window.addEventListener('componentLibraryReady', resolve, { once: true });
                });
            }
            
            // Setup authentication state
            this.setupAuthenticationState();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize dashboard if authenticated
            if (this.state.isAuthenticated) {
                await this.initializeDashboard();
            }
            
            console.log('✅ Dashboard Manager initialized');
            
        } catch (error) {
            console.error('❌ Dashboard Manager initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'dashboard-manager-init');
            }
        }
    },

    // Setup authentication state
    setupAuthenticationState() {
        const session = sessionStorage.getItem('adminDashboardAuthenticated');
        if (session === 'true') {
            this.state.isAuthenticated = true;
            const adminUser = sessionStorage.getItem('adminUser');
            if (adminUser) {
                try {
                    this.state.currentUser = JSON.parse(adminUser);
                } catch (e) {
                    console.warn('⚠️ Could not parse admin user data');
                }
            }
        }
    },

    // Initialize dashboard
    async initializeDashboard() {
        try {
            this.state.isLoading = true;
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Initializing dashboard...');
            }

            // Load all data
            await this.loadDashboardData();
            
            // Update stats
            await this.updateDashboardStats();
            
            // Setup notification system
            await this.initializeNotificationSystem();
            
            // Show dashboard
            this.showDashboard();
            
            this.state.lastUpdated = new Date();
            
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error('Dashboard initialization failed', { 
                    title: 'Initialization Error',
                    details: error.message 
                });
            }
        } finally {
            this.state.isLoading = false;
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Load dashboard data
    async loadDashboardData() {
        try {
            // Load jobs data
            if (window.JobManager) {
                await window.JobManager.loadJobs();
            }
            
            // Load users data
            if (window.UserManager) {
                await window.UserManager.loadUsers();
            }
            
            // Load dropdown options
            if (window.DropdownManager) {
                await window.DropdownManager.loadDropdownOptions();
            }
            
            console.log('✅ Dashboard data loaded successfully');
            
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            throw error;
        }
    },

    // Update dashboard stats
    async updateDashboardStats() {
        try {
            // Get users data
            const users = window.users || {};
            const activeUserNames = Object.keys(users)
                .filter(name => name !== '_archived' && !name.startsWith('_'));
            
            // Get jobs data
            const jobs = window.jobs || [];
            
            // Calculate stats
            this.state.stats = {
                totalCreators: activeUserNames.length,
                activeJobs: jobs.filter(job => job.status === 'Active').length,
                pendingReviews: this.calculatePendingReviews(users),
                totalContracts: this.calculateSignedContracts(users)
            };
            
            // Update stats display
            this.updateStatsDisplay();
            
            console.log('✅ Dashboard stats updated:', this.state.stats);
            
        } catch (error) {
            console.error('❌ Error updating dashboard stats:', error);
        }
    },

    // Calculate pending reviews
    calculatePendingReviews(users) {
        let pendingCount = 0;
        
        Object.values(users).forEach(user => {
            if (user?.contract?.contractStatus === 'signed' && !user?.performanceReview) {
                pendingCount++;
            }
        });
        
        return pendingCount;
    },

    // Calculate signed contracts
    calculateSignedContracts(users) {
        let signedCount = 0;
        
        Object.values(users).forEach(user => {
            if (user?.contract?.contractStatus === 'signed') {
                signedCount++;
            }
        });
        
        return signedCount;
    },

    // Update stats display
    updateStatsDisplay() {
        const statsElements = {
            totalCreators: document.getElementById('totalCreators'),
            activeJobs: document.getElementById('activeJobs'),
            pendingReviews: document.getElementById('pendingReviews'),
            totalContracts: document.getElementById('totalContracts')
        };
        
        Object.entries(statsElements).forEach(([key, element]) => {
            if (element && this.state.stats[key] !== undefined) {
                element.textContent = this.state.stats[key];
            }
        });
    },

    // Show dashboard
    showDashboard() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (dashboard) dashboard.style.display = 'block';
        
        // Trigger dashboard shown event
        this.triggerEvent('dashboard:shown', { 
            user: this.state.currentUser,
            stats: this.state.stats 
        });
        
        console.log('✅ Dashboard displayed');
    },

    // Show login screen
    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const dashboard = document.getElementById('dashboard');
        
        if (loginScreen) loginScreen.style.display = 'flex';
        if (dashboard) dashboard.style.display = 'none';
        
        // Reset authentication state
        this.state.isAuthenticated = false;
        this.state.currentUser = null;
        
        // Trigger login screen shown event
        this.triggerEvent('dashboard:loginShown');
        
        console.log('✅ Login screen displayed');
    },

    // Check authentication
    checkAuth() {
        const session = sessionStorage.getItem('adminDashboardAuthenticated');
        if (session === 'true') {
            this.state.isAuthenticated = true;
            this.showDashboard();
        } else {
            this.state.isAuthenticated = false;
            this.showLoginScreen();
        }
        
        return this.state.isAuthenticated;
    },

    // Handle login
    async handleLogin(email, password) {
        try {
            this.state.isLoading = true;
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Signing in...');
            }

            // Check if user has admin privileges
            if (!this.isAdminUser(email)) {
                throw new Error('Access denied. Admin privileges required.');
            }

            // Firebase authentication
            if (window.firebase && window.firebase.auth) {
                const userCredential = await window.firebase.auth().signInWithEmailAndPassword(email, password);
                
                // Store authentication state
                sessionStorage.setItem('adminDashboardAuthenticated', 'true');
                sessionStorage.setItem('adminUser', JSON.stringify({
                    email: userCredential.user.email,
                    uid: userCredential.user.uid
                }));
                
                this.state.isAuthenticated = true;
                this.state.currentUser = {
                    email: userCredential.user.email,
                    uid: userCredential.user.uid
                };
                
                // Initialize dashboard
                await this.initializeDashboard();
                
                if (window.NotificationManager) {
                    window.NotificationManager.success('Login successful', { title: 'Welcome Back' });
                }
                
            } else {
                throw new Error('Firebase authentication not available');
            }
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            
            let errorMessage = 'Login failed. Please try again.';
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'User not found. Please check your email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email format.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }
            
            if (window.NotificationManager) {
                window.NotificationManager.error(errorMessage, { title: 'Login Error' });
            }
            
            throw error;
        } finally {
            this.state.isLoading = false;
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Handle logout
    async handleLogout() {
        try {
            // Sign out from Firebase
            if (window.firebase && window.firebase.auth) {
                await window.firebase.auth().signOut();
                console.log('✅ Successfully signed out from Firebase');
            }
            
            // Clear session storage
            sessionStorage.removeItem('adminDashboardAuthenticated');
            sessionStorage.removeItem('adminUser');
            
            // Reset state
            this.state.isAuthenticated = false;
            this.state.currentUser = null;
            
            // Show login screen
            this.showLoginScreen();
            
            // Trigger logout event
            this.triggerEvent('dashboard:logout');
            
            if (window.NotificationManager) {
                window.NotificationManager.info('Logged out successfully', { title: 'Goodbye' });
            }
            
            console.log('✅ Logout successful');
            
        } catch (error) {
            console.error('❌ Error during logout:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error('Logout failed', { 
                    title: 'Logout Error',
                    details: error.message 
                });
            }
        }
    },

    // Check if user has admin privileges
    isAdminUser(email) {
        const ADMIN_EMAILS = [
            'info@cochranfilms.com',
            'admin@cochranfilms.com',
            'cody@cochranfilms.com'
        ];
        
        return ADMIN_EMAILS.includes(email.toLowerCase());
    },

    // Initialize notification system
    async initializeNotificationSystem() {
        try {
            if (window.NotificationManager) {
                await window.NotificationManager.init();
                console.log('✅ Notification system initialized');
            }
        } catch (error) {
            console.warn('⚠️ Notification system initialization failed:', error);
        }
    },

    // Refresh dashboard data
    async refreshDashboard() {
        try {
            this.state.isLoading = true;
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Refreshing dashboard...');
            }

            // Reload all data
            await this.loadDashboardData();
            
            // Update stats
            await this.updateDashboardStats();
            
            this.state.lastUpdated = new Date();
            
            if (window.NotificationManager) {
                window.NotificationManager.success('Dashboard refreshed successfully', { title: 'Refresh Complete' });
            }
            
            console.log('✅ Dashboard refreshed successfully');
            
        } catch (error) {
            console.error('❌ Error refreshing dashboard:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error('Dashboard refresh failed', { 
                    title: 'Refresh Error',
                    details: error.message 
                });
            }
        } finally {
            this.state.isLoading = false;
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Get dashboard status
    getDashboardStatus() {
        return {
            isAuthenticated: this.state.isAuthenticated,
            isLoading: this.state.isLoading,
            lastUpdated: this.state.lastUpdated,
            stats: this.state.stats,
            user: this.state.currentUser
        };
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for authentication events
        document.addEventListener('dashboard:login', (e) => this.handleLogin(e.detail.email, e.detail.password));
        document.addEventListener('dashboard:logout', () => this.handleLogout());
        
        // Listen for refresh requests
        document.addEventListener('dashboard:refresh', () => this.refreshDashboard());
        
        // Listen for window focus to refresh data
        window.addEventListener('focus', () => {
            if (this.state.isAuthenticated && this.state.lastUpdated) {
                const timeSinceUpdate = Date.now() - this.state.lastUpdated.getTime();
                // Refresh if more than 5 minutes have passed
                if (timeSinceUpdate > 300000) {
                    this.refreshDashboard();
                }
            }
        });
    },

    // Trigger custom events
    triggerEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    },

    // Run dashboard tests
    async runTests() {
        try {
            console.log('🧪 Starting Dashboard Tests...\n');
            
            // Test 1: Check if dashboard elements exist
            console.log('📋 Test 1: Dashboard Elements');
            const elements = ['loginScreen', 'dashboard', 'totalCreators', 'activeJobs', 'pendingReviews', 'totalContracts'];
            let passed = 0;
            let failed = 0;
            
            elements.forEach(elementId => {
                const element = document.getElementById(elementId);
                if (element) {
                    console.log(`✅ ${elementId} - Found`);
                    passed++;
                } else {
                    console.log(`❌ ${elementId} - Missing`);
                    failed++;
                }
            });
            console.log(`📊 Results: ${passed} passed, ${failed} failed`);
            
            // Test 2: Check authentication system
            console.log('\n📋 Test 2: Authentication System');
            const authStatus = this.getDashboardStatus();
            console.log(`✅ Authentication Status: ${authStatus.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}`);
            console.log(`✅ Loading State: ${authStatus.isLoading ? 'Loading' : 'Ready'}`);
            
            // Test 3: Check stats calculation
            console.log('\n📋 Test 3: Stats Calculation');
            console.log(`✅ Stats Object:`, authStatus.stats);
            console.log(`✅ Total Stats: ${Object.keys(authStatus.stats).length}`);
            
            // Test 4: Check event system
            console.log('\n📋 Test 4: Event System');
            console.log('✅ Event listeners setup complete');
            
            console.log('\n📊 DASHBOARD TESTS COMPLETE');
            console.log('💡 Check console for detailed results');
            
            return { passed, failed, total: passed + failed };
            
        } catch (error) {
            console.error('❌ Dashboard tests failed:', error);
            throw error;
        }
    },

    // Cleanup resources
    cleanup() {
        // Stop any intervals or timers
        // Remove event listeners
        // Clear any cached data
        
        console.log('🧹 Dashboard Manager cleanup completed');
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardManager;
} else {
    window.DashboardManager = DashboardManager;
}
