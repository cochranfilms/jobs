/**
 * Firebase Firestore Configuration
 * Real-time database integration for instant updates
 */

// Firebase configuration (already set up in firebase-config.js)
const firestoreConfig = {
    // Firestore settings
    cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
    experimentalForceLongPolling: true, // Better for real-time updates
    useFetchStreams: false
};

// Initialize Firestore
let db = null;

try {
    // Check if Firebase is available
    if (typeof firebase !== 'undefined' && firebase.firestore) {
        db = firebase.firestore();
        
        // Configure Firestore settings
        db.settings(firestoreConfig);
        
        console.log('✅ Firestore initialized successfully');
    } else {
        console.warn('⚠️ Firebase not available, Firestore disabled');
    }
} catch (error) {
    console.error('❌ Error initializing Firestore:', error);
}

// Firestore collections
const COLLECTIONS = {
    USERS: 'users',
    JOBS: 'jobs',
    CONTRACTS: 'contracts',
    PERFORMANCE_REVIEWS: 'performance_reviews',
    NOTIFICATIONS: 'notifications'
};

// Export for use in other modules
window.FirestoreConfig = {
    db,
    COLLECTIONS,
    isAvailable: () => db !== null,
    
    // Helper method to get collection reference
    getCollection: (collectionName) => {
        if (!db) {
            console.warn('⚠️ Firestore not available');
            return null;
        }
        return db.collection(collectionName);
    },
    
    // Helper method to get document reference
    getDocument: (collectionName, docId) => {
        if (!db) {
            console.warn('⚠️ Firestore not available');
            return null;
        }
        return db.collection(collectionName).doc(docId);
    }
};

console.log('🔧 Firestore configuration loaded');
