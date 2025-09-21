// ==================== AUTHENTICATION MANAGER MODULE ====================
// Handles Firebase authentication and user session management

export class AuthManager {
    constructor(config = {}) {
        this.apiBase = config.apiBase || '';
        this.onAuthStateChanged = config.onAuthStateChanged || (() => {});
        this.onError = config.onError || (() => {});
        this.currentUser = null;
        this.auth = null;
        this.init();
    }

    async init() {
        try {
            // Initialize Firebase if available
            if (typeof firebase !== 'undefined') {
                // Reuse existing app if already initialized (avoid duplicate init)
                if (firebase.apps && firebase.apps.length > 0) {
                    this.auth = firebase.auth();
                } else {
                    const firebaseConfig = {
                        apiKey: 'AIzaSyCkL31Phi7FxYCeB5zgHeYTb2iY2sTJJdw',
                        authDomain: 'cochran-films.firebaseapp.com',
                        projectId: 'cochran-films',
                        storageBucket: 'cochran-films.appspot.com',
                        messagingSenderId: '566448458094',
                        appId: '1:566448458094:web:default'
                    };
                    firebase.initializeApp(firebaseConfig);
                    this.auth = firebase.auth();
                }
                
                // Set persistence
                await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
                
                // Set up auth state observer
                this.auth.onAuthStateChanged(this.handleAuthStateChanged.bind(this));
                
                console.log('✅ Firebase Auth initialized');
            } else {
                console.warn('⚠️ Firebase not available, using fallback auth');
            }
        } catch (error) {
            console.error('❌ Auth initialization failed:', error);
            this.onError(error, 'Authentication Initialization Failed');
        }
    }

    async handleAuthStateChanged(firebaseUser) {
        try {
            if (firebaseUser && firebaseUser.email) {
                // User is signed in
                const user = await this.validateUserInSystem(firebaseUser.email);
                if (user) {
                    this.currentUser = user;
                    this.onAuthStateChanged(user);
                } else {
                    // User not found in system
                    await this.signOut();
                    this.onError(new Error('User not found in system'), 'Authentication Failed');
                }
            } else {
                // User is signed out
                this.currentUser = null;
                this.onAuthStateChanged(null);
            }
        } catch (error) {
            console.error('❌ Auth state change handling failed:', error);
            this.onError(error, 'Authentication State Change Failed');
        }
    }

    async signIn(email, password) {
        try {
            if (this.auth) {
                // Firebase authentication
                const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
                return userCredential.user;
            } else {
                // Fallback authentication
                return await this.fallbackSignIn(email, password);
            }
        } catch (error) {
            console.error('❌ Sign in failed:', error);
            throw this.formatAuthError(error);
        }
    }

    async signOut() {
        try {
            if (this.auth) {
                await this.auth.signOut();
            }
            this.currentUser = null;
            console.log('✅ User signed out');
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            this.onError(error, 'Sign Out Failed');
        }
    }

    async validateUserInSystem(email) {
        try {
            // Prefer Firestore: look up user document by profile.email
            if (window.FirebaseConfig && window.FirebaseConfig.isInitialized) {
                const db = window.FirebaseConfig.getFirestore();
                const snap = await db.collection('users')
                    .where('profile.email', '==', email)
                    .limit(1)
                    .get();
                if (!snap.empty) {
                    const doc = snap.docs[0];
                    const user = doc.data() || {};
                    return {
                        name: doc.id,
                        email: user.profile?.email,
                        approvedDate: user.profile?.approvedDate,
                        role: user.profile?.role,
                        location: user.profile?.location,
                        rate: user.profile?.rate,
                        contractStatus: user.contract?.contractStatus || 'pending',
                        paymentMethod: user.paymentMethod || null,
                        paymentStatus: user.paymentStatus || 'pending'
                    };
                }
            }
            // Fallback: no user found
            return null;
        } catch (error) {
            console.error('❌ User validation failed:', error);
            return null;
        }
    }

    async fallbackSignIn(email, password) {
        try {
            // Simple validation for development/testing
            const users = [
                {
                    name: "Francisco Flores",
                    email: "ciscocinema@gmail.com",
                    password: "Cinema2025",
                    approvedDate: "2024-01-08",
                    role: "Backdrop Photographer",
                    location: "Douglasville, GA",
                    rate: "$400.00 USD (Flat)"
                },
                {
                    name: "Cody Cochran",
                    email: "codylcochran89@gmail.com",
                    password: "TestPassword2025",
                    approvedDate: "2025-08-01",
                    role: "Full Stack Designer",
                    location: "Douglasville, GA",
                    rate: "$900.00 USD (Flat)"
                }
            ];

            const user = users.find(u => 
                u.email.toLowerCase() === email.toLowerCase() && u.password === password
            );

            if (user) {
                return {
                    name: user.name,
                    email: user.email,
                    approvedDate: user.approvedDate,
                    role: user.role,
                    location: user.location,
                    rate: user.rate,
                    contractStatus: 'pending',
                    paymentMethod: null,
                    paymentStatus: 'pending'
                };
            }

            throw new Error('Invalid credentials');
        } catch (error) {
            throw error;
        }
    }

    formatAuthError(error) {
        const errorMap = {
            'auth/user-not-found': 'User not found. Please check your email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Invalid email format.',
            'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
            'Invalid credentials': 'Invalid email or password. Please try again.'
        };

        return new Error(errorMap[error.code || error.message] || 'Authentication failed. Please try again.');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }
}

export default AuthManager;
