/**
 * Firebase Configuration for Cochran Films
 * Handles Firebase initialization, authentication, and Firestore setup
 */

console.log('🔥 Firebase config file starting to load...');

// Set ADMIN_PASSWORD immediately to avoid timing issues
window.ADMIN_PASSWORD = 'Cochranfilms2@';
console.log('✅ window.ADMIN_PASSWORD set immediately:', window.ADMIN_PASSWORD);

const FirebaseConfig = {
    // Firebase configuration
    config: {
        apiKey: 'AIzaSyCkL31Phi7FxYCeB5zgHeYTb2iY2sTJJdw',
        authDomain: 'cochran-films.firebaseapp.com',
        projectId: 'cochran-films',
        storageBucket: 'cochran-films.appspot.com',
        messagingSenderId: '566448458094',
        appId: '1:566448458094:web:default'
    },

    // Firebase instances
    app: null,
    auth: null,
    firestore: null,
    isInitialized: false,
    initPromise: null,
    // Bucket URL override for Storage (gs:// or https URL)
    bucketURL: 'gs://cochran-films.appspot.com',

    // Admin users (emails that have admin access)
    adminUsers: [
        'info@cochranfilms.com', // primary admin (canonical)
        'cody@cochranfilms.com',
        'admin@cochranfilms.com'
        // Add more admin emails as needed
    ],

    // Initialize Firebase with Firestore
    // Optional appName allows multiple independent auth sessions per origin
    async init(appName) {
        // If already initialized, return the existing promise
        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise(async (resolve, reject) => {
            try {
                console.log('🔥 Initializing Firebase for Cochran Films...');
                console.log('🔍 Checking Firebase SDK availability...');
                
                // Check if Firebase is available
                if (typeof firebase === 'undefined') {
                    console.error('❌ Firebase SDK is undefined');
                    throw new Error('Firebase SDK not loaded');
                }

                console.log('✅ Firebase SDK found:', typeof firebase);
                console.log('🔍 Firebase SDK properties:', Object.keys(firebase));
                
                // Check if firebase.initializeApp exists
                if (typeof firebase.initializeApp !== 'function') {
                    console.error('❌ firebase.initializeApp is not a function');
                    throw new Error('Firebase initializeApp method not available');
                }

                console.log('✅ firebase.initializeApp method found');
                
                // Initialize Firebase app (support multiple named apps)
                console.log('🔧 Creating Firebase app...');
                const name = appName ? String(appName) : undefined;
                if (name) {
                    if (firebase.apps && firebase.apps.some(a => a && a.name === name)) {
                        this.app = firebase.app(name);
                    } else {
                        this.app = firebase.initializeApp(this.config, name);
                    }
                } else {
                    if (firebase.apps && firebase.apps.length > 0) {
                        this.app = firebase.app();
                    } else {
                        this.app = firebase.initializeApp(this.config);
                    }
                }
                console.log('✅ Firebase app created:', this.app);
                
                // Initialize Firebase Auth
                console.log('🔧 Initializing Firebase Auth...');
                if (typeof firebase.auth !== 'function') {
                    console.error('❌ firebase.auth is not a function');
                    throw new Error('Firebase auth method not available');
                }
                
                this.auth = this.app.auth();
                console.log('✅ Firebase Auth initialized:', this.auth);
                
                // Initialize Firestore
                console.log('🔧 Initializing Firestore...');
                if (typeof firebase.firestore !== 'function') {
                    console.error('❌ firebase.firestore is not a function');
                    throw new Error('Firestore method not available');
                }
                
                this.firestore = this.app.firestore();
                console.log('✅ Firestore initialized:', this.firestore);
                
                // Set persistence to LOCAL for better offline support
                console.log('🔧 Setting Firebase persistence...');
                await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                console.log('✅ Firebase persistence set to LOCAL');

                this.isInitialized = true;
                try { window.FIREBASE_BUCKET_URL = this.bucketURL; } catch(_) {}
                console.log('✅ Firebase with Firestore initialized successfully');
                
                // Trigger custom events to notify other components
                window.dispatchEvent(new CustomEvent('firebase:initialized'));
                window.dispatchEvent(new CustomEvent('firestore:initialized'));
                
                resolve(true);
                
            } catch (error) {
                console.error('❌ Firebase initialization failed:', error);
                console.error('❌ Error details:', {
                    message: error.message,
                    stack: error.stack,
                    firebaseType: typeof firebase,
                    firebaseKeys: firebase ? Object.keys(firebase) : 'firebase is null'
                });
                reject(error);
            }
        });

        return this.initPromise;
    },

    // Get Firestore instance
    getFirestore() {
        if (!this.isInitialized || !this.firestore) {
            throw new Error('Firestore not initialized. Call init() first.');
        }
        return this.firestore;
    },

    // Get current user
    getCurrentUser() {
        if (!this.auth) return null;
        return this.auth.currentUser;
    },

    // Wait for Firebase to be initialized
    async waitForInit() {
        console.log('⏳ waitForInit called, checking initialization status...');
        console.log('🔍 Current state:', {
            isInitialized: this.isInitialized,
            hasInitPromise: !!this.initPromise,
            hasApp: !!this.app,
            hasAuth: !!this.auth
        });
        
        if (this.isInitialized) {
            console.log('✅ Firebase already initialized, returning immediately');
            return true;
        }
        
        if (this.initPromise) {
            console.log('⏳ Firebase initialization in progress, waiting for promise...');
            return this.initPromise;
        }
        
        console.log('🚀 Starting Firebase initialization...');
        // If not started, start initialization
        return this.init();
    },

    // Check if user has admin privileges
    isAdminUser(email) {
        if (!email) return false;
        return this.adminUsers.includes(email.toLowerCase());
    },

    // Sign out user
    async signOut() {
        if (this.auth) {
            await this.auth.signOut();
            console.log('✅ User signed out successfully');
        }
    },

    // Get admin users list
    getAdminUsers() {
        return [...this.adminUsers];
    },

    // Add admin user
    addAdminUser(email) {
        if (email && !this.adminUsers.includes(email.toLowerCase())) {
            this.adminUsers.push(email.toLowerCase());
            console.log(`✅ Added admin user: ${email}`);
            return true;
        }
        return false;
    },

    // Remove admin user
    removeAdminUser(email) {
        const index = this.adminUsers.indexOf(email.toLowerCase());
        if (index > -1) {
            this.adminUsers.splice(index, 1);
            console.log(`✅ Removed admin user: ${email}`);
            return true;
        }
        return false;
    }
};

// Auto-initialize when DOM is ready
function initializeFirebase() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            FirebaseConfig.init().catch(error => {
                console.error('❌ Firebase auto-initialization failed:', error);
            });
        });
    } else {
        // DOM is already ready, but wait a bit for other elements
        setTimeout(() => {
            FirebaseConfig.init().catch(error => {
                console.error('❌ Firebase auto-initialization failed:', error);
            });
        }, 100);
    }
}

// Start initialization
initializeFirebase();

// Export for use in other modules
window.FirebaseConfig = FirebaseConfig; 