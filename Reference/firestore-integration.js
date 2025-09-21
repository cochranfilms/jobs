/**
 * Shared Firestore Integration for Cochran Films
 * This script provides a unified interface for all pages to interact with Firestore
 */

const FirestoreIntegration = {
    // Initialize Firestore integration
    async init() {
        try {
            console.log('🔥 Initializing Firestore Integration...');
            
            // Wait for Firebase to be ready
            if (!window.FirebaseConfig || !window.FirebaseConfig.isInitialized) {
                await new Promise((resolve) => {
                    window.addEventListener('firebase:initialized', resolve, { once: true });
                });
            }
            
            // Initialize Firestore Data Manager
            if (window.FirestoreDataManager) {
                await window.FirestoreDataManager.init();
                console.log('✅ Firestore Integration initialized');
                return true;
            } else {
                console.warn('⚠️ FirestoreDataManager not available');
                return false;
            }
        } catch (error) {
            console.error('❌ Firestore Integration initialization failed:', error);
            return false;
        }
    },

    // Get data with automatic fallback
    async getData(collectionName, fallbackFunction) {
        try {
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                return await window.FirestoreDataManager.getDataWithFallback(collectionName, fallbackFunction);
            } else {
                // Direct fallback if Firestore not available
                if (typeof fallbackFunction === 'function') {
                    return await fallbackFunction();
                }
                return null;
            }
        } catch (error) {
            console.error(`❌ Error getting ${collectionName} data:`, error);
            if (typeof fallbackFunction === 'function') {
                return await fallbackFunction();
            }
            return null;
        }
    },

    // Save data to Firestore
    async saveData(collectionName, docId, data) {
        try {
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                switch (collectionName) {
                    case 'users':
                        return await window.FirestoreDataManager.setUser(docId, data);
                    case 'jobs':
                        return await window.FirestoreDataManager.setJob(docId, data);
                    case 'dropdownOptions':
                        return await window.FirestoreDataManager.setDropdownOptionCategory(docId, data);
                    default:
                        throw new Error(`Unknown collection: ${collectionName}`);
                }
            } else {
                console.warn('⚠️ Firestore not available, data not saved');
                return false;
            }
        } catch (error) {
            console.error(`❌ Error saving ${collectionName} data:`, error);
            return false;
        }
    },

    // Check if Firestore is available
    isAvailable() {
        return window.FirestoreDataManager && window.FirestoreDataManager.isAvailable();
    },

    // Migrate existing data to Firestore
    async migrateData() {
        try {
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                return await window.FirestoreDataManager.migrateDataToFirestore();
            } else {
                console.warn('⚠️ Firestore not available for migration');
                return false;
            }
        } catch (error) {
            console.error('❌ Error during data migration:', error);
            return false;
        }
    },

    // Set up real-time listeners
    setupListeners(callback) {
        try {
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                // Listen for Firestore data changes
                window.addEventListener('firestore:dataChange', callback);
                console.log('✅ Firestore listeners set up');
                return true;
            } else {
                console.warn('⚠️ Firestore not available for listeners');
                return false;
            }
        } catch (error) {
            console.error('❌ Error setting up listeners:', error);
            return false;
        }
    }
};

// Auto-initialize when DOM is ready
function initializeFirestoreIntegration() {
    if (window && window.PUBLIC_READ_ONLY === true) {
        console.warn('⚠️ Skipping FirestoreIntegration init (public read-only page)');
        return;
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            FirestoreIntegration.init().catch(error => {
                console.error('❌ Firestore Integration auto-initialization failed:', error);
            });
        });
    } else {
        // DOM is already ready
        FirestoreIntegration.init().catch(error => {
            console.error('❌ Firestore Integration auto-initialization failed:', error);
        });
    }
}

// Start initialization
initializeFirestoreIntegration();

// Export for use in other modules
window.FirestoreIntegration = FirestoreIntegration;
