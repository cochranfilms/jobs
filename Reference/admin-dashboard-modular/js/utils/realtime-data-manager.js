/**
 * Real-Time Data Manager
 * Provides instant updates by syncing between JSON and Firestore
 * Falls back to JSON when Firestore is unavailable
 */

const RealtimeDataManager = {
    // State
    state: {
        isInitialized: false,
        isFirestoreAvailable: false,
        realtimeListeners: new Map(),
        dataCache: new Map(),
        lastSync: null
    },

    // Initialize the manager
    init() {
        try {
            console.log('🔧 Initializing Real-Time Data Manager...');
            
            // Check Firestore availability
            this.state.isFirestoreAvailable = window.FirestoreConfig && window.FirestoreConfig.isAvailable();
            console.log(`🔧 Firestore available: ${this.state.isFirestoreAvailable}`);
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize data sync
            this.initializeDataSync();
            
            this.state.isInitialized = true;
            console.log('✅ Real-Time Data Manager initialized');
            
        } catch (error) {
            console.error('❌ Real-Time Data Manager initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'realtime-data-manager-init');
            }
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for data change events
        document.addEventListener('usersDataChanged', this.handleUsersDataChange.bind(this));
        document.addEventListener('jobsDataChanged', this.handleJobsDataChange.bind(this));
        document.addEventListener('contractsDataChanged', this.handleContractsDataChange.bind(this));
    },

    // Initialize data synchronization
    async initializeDataSync() {
        if (this.state.isFirestoreAvailable) {
            try {
                // Start real-time listeners for each collection
                await this.startRealtimeListeners();
                console.log('✅ Real-time listeners started');
            } catch (error) {
                console.warn('⚠️ Failed to start real-time listeners, falling back to JSON:', error);
                this.state.isFirestoreAvailable = false;
            }
        }
    },

    // Start real-time listeners
    async startRealtimeListeners() {
        const collections = ['users', 'jobs', 'contracts'];
        
        for (const collection of collections) {
            await this.startCollectionListener(collection);
        }
    },

    // Start listener for a specific collection
    async startCollectionListener(collectionName) {
        try {
            const collectionRef = window.FirestoreConfig.getCollection(collectionName);
            if (!collectionRef) return;

            // Create real-time listener
            const unsubscribe = collectionRef.onSnapshot(
                (snapshot) => {
                    this.handleRealtimeUpdate(collectionName, snapshot);
                },
                (error) => {
                    console.error(`❌ Error in ${collectionName} listener:`, error);
                }
            );

            // Store unsubscribe function
            this.state.realtimeListeners.set(collectionName, unsubscribe);
            console.log(`✅ Real-time listener started for ${collectionName}`);
            
        } catch (error) {
            console.error(`❌ Failed to start listener for ${collectionName}:`, error);
        }
    },

    // Handle real-time updates
    handleRealtimeUpdate(collectionName, snapshot) {
        try {
            const changes = snapshot.docChanges();
            let hasChanges = false;

            changes.forEach((change) => {
                if (change.type === 'added' || change.type === 'modified') {
                    // Update cache
                    this.state.dataCache.set(`${collectionName}_${change.doc.id}`, {
                        data: change.doc.data(),
                        timestamp: Date.now()
                    });
                    hasChanges = true;
                } else if (change.type === 'removed') {
                    // Remove from cache
                    this.state.dataCache.delete(`${collectionName}_${change.doc.id}`);
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                // Trigger custom event for the collection
                const event = new CustomEvent(`${collectionName}DataChanged`, {
                    detail: { source: 'firestore', timestamp: Date.now() }
                });
                document.dispatchEvent(event);
                
                console.log(`🔄 Real-time update for ${collectionName}: ${changes.length} changes`);
            }
            
        } catch (error) {
            console.error(`❌ Error handling real-time update for ${collectionName}:`, error);
        }
    },

    // Handle users data changes
    handleUsersDataChange(event) {
        try {
            console.log('🔄 Users data changed, updating display...');
            
            // Update the main dashboard if available
            if (window.users && typeof displayUsers === 'function') {
                displayUsers();
                displayArchivedUsers();
                updateStats();
            }
            
        } catch (error) {
            console.error('❌ Error handling users data change:', error);
        }
    },

    // Handle jobs data changes
    handleJobsDataChange(event) {
        try {
            console.log('🔄 Jobs data changed, updating display...');
            
            // Update the main dashboard if available
            if (typeof displayJobs === 'function') {
                displayJobs();
                updateStats();
            }
            
        } catch (error) {
            console.error('❌ Error handling jobs data change:', error);
        }
    },

    // Handle contracts data changes
    handleContractsDataChange(event) {
        try {
            console.log('🔄 Contracts data changed, updating display...');
            
            // Update the main dashboard if available
            if (typeof displayContracts === 'function') {
                displayContracts();
                updateStats();
            }
            
        } catch (error) {
            console.error('❌ Error handling contracts data change:', error);
        }
    },

    // Get data with real-time fallback
    async getData(collectionName, documentId = null) {
        try {
            // Try Firestore first if available
            if (this.state.isFirestoreAvailable && documentId) {
                const docRef = window.FirestoreConfig.getDocument(collectionName, documentId);
                if (docRef) {
                    const doc = await docRef.get();
                    if (doc.exists) {
                        return doc.data();
                    }
                }
            }

            // Fallback to cache
            const cacheKey = documentId ? `${collectionName}_${documentId}` : collectionName;
            const cached = this.state.dataCache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutes
                return cached.data;
            }

            // Final fallback to JSON API (disabled in strict Firestore mode)
            if (window.STRICT_FIRESTORE_MODE === true) {
                console.warn('🚫 STRICT_FIRESTORE_MODE enabled: skipping JSON fallback');
                return null;
            }
            return await this.fetchFromJSON(collectionName, documentId);
            
        } catch (error) {
            console.error(`❌ Error getting data for ${collectionName}:`, error);
            return null;
        }
    },

    // Fetch data from JSON API
    async fetchFromJSON(collectionName, documentId = null) {
        try {
            const response = await fetch(`/api/${collectionName}`);
            if (response.ok) {
                const data = await response.json();
                return documentId ? data[documentId] : data;
            }
        } catch (error) {
            console.error(`❌ Error fetching from JSON API:`, error);
        }
        return null;
    },

    // Update data in real-time
    async updateData(collectionName, documentId, data) {
        try {
            // Update Firestore if available
            if (this.state.isFirestoreAvailable) {
                const docRef = window.FirestoreConfig.getDocument(collectionName, documentId);
                if (docRef) {
                    await docRef.set(data, { merge: true });
                    console.log(`✅ Data updated in Firestore: ${collectionName}/${documentId}`);
                    return true;
                }
            }

            // Fallback to JSON API
            return await this.updateJSONData(collectionName, documentId, data);
            
        } catch (error) {
            console.error(`❌ Error updating data for ${collectionName}/${documentId}:`, error);
            return false;
        }
    },

    // Update JSON data via API
    async updateJSONData(collectionName, documentId, data) {
        try {
            const response = await fetch(`/api/${collectionName}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: documentId, data })
            });
            
            if (response.ok) {
                console.log(`✅ Data updated via JSON API: ${collectionName}/${documentId}`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Error updating JSON data:`, error);
        }
        return false;
    },

    // Sync data from JSON to Firestore
    async syncFromJSON(collectionName) {
        if (!this.state.isFirestoreAvailable) {
            console.log('⚠️ Firestore not available, skipping sync');
            return false;
        }

        try {
            console.log(`🔄 Syncing ${collectionName} from JSON to Firestore...`);
            
            const jsonData = await this.fetchFromJSON(collectionName);
            if (!jsonData) return false;

            const collectionRef = window.FirestoreConfig.getCollection(collectionName);
            if (!collectionRef) return false;

            // Batch write for efficiency
            const batch = collectionRef.firestore.batch();
            let updateCount = 0;

            Object.entries(jsonData).forEach(([id, data]) => {
                if (id !== '_metadata' && id !== 'lastUpdated' && id !== 'totalUsers') {
                    const docRef = collectionRef.doc(id);
                    batch.set(docRef, data);
                    updateCount++;
                }
            });

            await batch.commit();
            console.log(`✅ Synced ${updateCount} documents to Firestore`);
            
            this.state.lastSync = Date.now();
            return true;
            
        } catch (error) {
            console.error(`❌ Error syncing ${collectionName} to Firestore:`, error);
            return false;
        }
    },

    // Get sync status
    getSyncStatus() {
        return {
            isFirestoreAvailable: this.state.isFirestoreAvailable,
            lastSync: this.state.lastSync,
            cacheSize: this.state.dataCache.size,
            activeListeners: this.state.realtimeListeners.size
        };
    },

    // Cleanup
    destroy() {
        try {
            // Unsubscribe from all real-time listeners
            this.state.realtimeListeners.forEach((unsubscribe, collection) => {
                try {
                    unsubscribe();
                    console.log(`✅ Unsubscribed from ${collection}`);
                } catch (error) {
                    console.warn(`⚠️ Error unsubscribing from ${collection}:`, error);
                }
            });

            // Clear state
            this.state.realtimeListeners.clear();
            this.state.dataCache.clear();
            this.state.isInitialized = false;
            
            console.log('✅ Real-Time Data Manager destroyed');
            
        } catch (error) {
            console.error('❌ Error destroying Real-Time Data Manager:', error);
        }
    }
};

// Export for global access
window.RealtimeDataManager = RealtimeDataManager;
