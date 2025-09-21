/**
 * Data Migration Utility
 * Migrates existing JSON data to Firebase Firestore
 * Provides one-click migration with progress tracking
 */

const DataMigration = {
    // State
    state: {
        isMigrating: false,
        migrationProgress: 0,
        totalDocuments: 0,
        migratedDocuments: 0,
        errors: []
    },

    // Initialize migration utility
    init() {
        try {
            console.log('🔧 Initializing Data Migration Utility...');
            
            // Check if Firestore is available
            if (!window.FirestoreConfig || !window.FirestoreConfig.isAvailable()) {
                console.warn('⚠️ Firestore not available, migration disabled');
                return;
            }
            
            // Setup migration UI
            this.setupMigrationUI();
            
            console.log('✅ Data Migration Utility initialized');
            
        } catch (error) {
            console.error('❌ Data Migration Utility initialization failed:', error);
        }
    },

    // Setup migration UI
    setupMigrationUI() {
        // Create migration button if it doesn't exist
        if (!document.getElementById('migrateToFirestoreBtn')) {
            const migrationContainer = document.createElement('div');
            migrationContainer.id = 'migrationContainer';
            migrationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #FFB200;
                border-radius: 12px;
                padding: 1rem;
                z-index: 1000;
                max-width: 300px;
                backdrop-filter: blur(10px);
            `;
            
            migrationContainer.innerHTML = `
                <h4 style="margin: 0 0 1rem 0; color: #FFB200; font-family: 'Cinzel', serif;">
                    🚀 Real-Time Migration
                </h4>
                <div id="migrationStatus" style="margin-bottom: 1rem; font-size: 0.9rem;">
                    <div>📊 Firestore: <span id="firestoreStatus" style="color: #22c55e;">Available</span></div>
                    <div>🔄 Sync Status: <span id="syncStatus">Not Started</span></div>
                </div>
                <button id="migrateToFirestoreBtn" class="btn" style="width: 100%; background: linear-gradient(135deg, #FFB200, #FF9000);">
                    🔄 Migrate to Firestore
                </button>
                <div id="migrationProgress" style="display: none; margin-top: 1rem;">
                    <div style="background: #333; border-radius: 6px; height: 8px; overflow: hidden;">
                        <div id="progressBar" style="background: linear-gradient(90deg, #FFB200, #FF9000); height: 100%; width: 0%; transition: width 0.3s;"></div>
                    </div>
                    <div style="text-align: center; margin-top: 0.5rem; font-size: 0.8rem;">
                        <span id="progressText">0%</span> (<span id="progressCount">0/0</span>)
                    </div>
                </div>
                <button id="closeMigrationBtn" style="position: absolute; top: 0.5rem; right: 0.5rem; background: none; border: none; color: #FFB200; font-size: 1.2rem; cursor: pointer;">×</button>
            `;
            
            document.body.appendChild(migrationContainer);
            
            // Add event listeners
            document.getElementById('migrateToFirestoreBtn').addEventListener('click', () => {
                this.startMigration();
            });
            
            document.getElementById('closeMigrationBtn').addEventListener('click', () => {
                migrationContainer.remove();
            });
            
            // Update status
            this.updateMigrationStatus();
        }
    },

    // Update migration status
    updateMigrationStatus() {
        const firestoreStatus = document.getElementById('firestoreStatus');
        const syncStatus = document.getElementById('syncStatus');
        
        if (firestoreStatus && syncStatus) {
            const isAvailable = window.FirestoreConfig && window.FirestoreConfig.isAvailable();
            firestoreStatus.textContent = isAvailable ? 'Available' : 'Unavailable';
            firestoreStatus.style.color = isAvailable ? '#22c55e' : '#ef4444';
            
            if (window.RealtimeDataManager) {
                const syncInfo = window.RealtimeDataManager.getSyncStatus();
                syncStatus.textContent = syncInfo.lastSync ? 
                    `Last: ${new Date(syncInfo.lastSync).toLocaleTimeString()}` : 
                    'Not Started';
            }
        }
    },

    // Start migration process
    async startMigration() {
        if (this.state.isMigrating) {
            console.log('⚠️ Migration already in progress');
            return;
        }

        try {
            console.log('🚀 Starting data migration to Firestore...');
            this.state.isMigrating = true;
            this.state.errors = [];
            
            // Show progress UI
            this.showMigrationProgress();
            
            // Migrate each collection
            const collections = ['users', 'jobs', 'contracts'];
            let totalDocs = 0;
            
            // Count total documents
            for (const collection of collections) {
                const data = await this.fetchCollectionData(collection);
                if (data) {
                    totalDocs += Object.keys(data).filter(key => 
                        !key.startsWith('_') && key !== 'lastUpdated' && key !== 'totalUsers'
                    ).length;
                }
            }
            
            this.state.totalDocuments = totalDocs;
            this.state.migratedDocuments = 0;
            
            // Migrate each collection
            for (const collection of collections) {
                await this.migrateCollection(collection);
            }
            
            // Final status update
            this.updateProgress(100, this.state.totalDocuments, this.state.totalDocuments);
            
            // Show completion message
            setTimeout(() => {
                this.showMigrationComplete();
            }, 1000);
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            this.state.errors.push(error.message);
            this.showMigrationError();
        } finally {
            this.state.isMigrating = false;
        }
    },

    // Migrate a specific collection
    async migrateCollection(collectionName) {
        try {
            console.log(`🔄 Migrating ${collectionName} collection...`);
            
            const data = await this.fetchCollectionData(collectionName);
            if (!data) {
                console.log(`⚠️ No data found for ${collectionName}`);
                return;
            }
            
            const collectionRef = window.FirestoreConfig.getCollection(collectionName);
            if (!collectionRef) {
                throw new Error(`Failed to get collection reference for ${collectionName}`);
            }
            
            // Filter out metadata fields
            const documents = Object.entries(data).filter(([key, value]) => 
                !key.startsWith('_') && key !== 'lastUpdated' && key !== 'totalUsers'
            );
            
            // Use batch writes for efficiency
            const batch = collectionRef.firestore.batch();
            let batchCount = 0;
            const batchSize = 500; // Firestore batch limit
            
            for (const [docId, docData] of documents) {
                try {
                    const docRef = collectionRef.doc(docId);
                    batch.set(docRef, docData);
                    batchCount++;
                    
                    // Commit batch if it reaches the limit
                    if (batchCount >= batchSize) {
                        await batch.commit();
                        batchCount = 0;
                        console.log(`✅ Committed batch for ${collectionName}`);
                    }
                    
                    // Update progress
                    this.state.migratedDocuments++;
                    const progress = (this.state.migratedDocuments / this.state.totalDocuments) * 100;
                    this.updateProgress(progress, this.state.migratedDocuments, this.state.totalDocuments);
                    
                } catch (error) {
                    console.error(`❌ Error migrating document ${docId}:`, error);
                    this.state.errors.push(`Failed to migrate ${collectionName}/${docId}: ${error.message}`);
                }
            }
            
            // Commit remaining documents
            if (batchCount > 0) {
                await batch.commit();
                console.log(`✅ Committed final batch for ${collectionName}`);
            }
            
            console.log(`✅ Successfully migrated ${collectionName} collection`);
            
        } catch (error) {
            console.error(`❌ Error migrating ${collectionName} collection:`, error);
            this.state.errors.push(`Failed to migrate ${collectionName}: ${error.message}`);
        }
    },

    // Fetch collection data from JSON API
    async fetchCollectionData(collectionName) {
        try {
            const response = await fetch(`/api/${collectionName}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error(`❌ Error fetching ${collectionName} data:`, error);
        }
        return null;
    },

    // Show migration progress
    showMigrationProgress() {
        const progressContainer = document.getElementById('migrationProgress');
        const migrateBtn = document.getElementById('migrateToFirestoreBtn');
        
        if (progressContainer && migrateBtn) {
            progressContainer.style.display = 'block';
            migrateBtn.disabled = true;
            migrateBtn.textContent = '🔄 Migrating...';
        }
    },

    // Update progress bar
    updateProgress(percentage, current, total) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        const progressCount = document.getElementById('progressCount');
        
        if (progressBar && progressText && progressCount) {
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${Math.round(percentage)}%`;
            progressCount.textContent = `${current}/${total}`;
        }
    },

    // Show migration complete
    showMigrationComplete() {
        const migrateBtn = document.getElementById('migrateToFirestoreBtn');
        if (migrateBtn) {
            migrateBtn.disabled = false;
            migrateBtn.textContent = '✅ Migration Complete!';
            migrateBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        }
        
        // Show success notification
        if (typeof showNotification === 'function') {
            showNotification('🎉 Data migration to Firestore completed successfully!', 'success');
        }
        
        // Update status
        this.updateMigrationStatus();
        
        // Reset button after delay
        setTimeout(() => {
            if (migrateBtn) {
                migrateBtn.textContent = '🔄 Migrate to Firestore';
                migrateBtn.style.background = 'linear-gradient(135deg, #FFB200, #FF9000)';
            }
        }, 5000);
    },

    // Show migration error
    showMigrationError() {
        const migrateBtn = document.getElementById('migrateToFirestoreBtn');
        if (migrateBtn) {
            migrateBtn.disabled = false;
            migrateBtn.textContent = '❌ Migration Failed';
            migrateBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
        }
        
        // Show error notification
        if (typeof showNotification === 'function') {
            showNotification('❌ Data migration failed. Check console for details.', 'error');
        }
        
        // Reset button after delay
        setTimeout(() => {
            if (migrateBtn) {
                migrateBtn.textContent = '🔄 Migrate to Firestore';
                migrateBtn.style.background = 'linear-gradient(135deg, #FFB200, #FF9000)';
            }
        }, 5000);
    },

    // Get migration status
    getMigrationStatus() {
        return {
            isMigrating: this.state.isMigrating,
            progress: this.state.migrationProgress,
            totalDocuments: this.state.totalDocuments,
            migratedDocuments: this.state.migratedDocuments,
            errors: this.state.errors
        };
    },

    // Cleanup
    destroy() {
        try {
            const migrationContainer = document.getElementById('migrationContainer');
            if (migrationContainer) {
                migrationContainer.remove();
            }
            
            this.state.isMigrating = false;
            this.state.errors = [];
            
            console.log('✅ Data Migration Utility destroyed');
            
        } catch (error) {
            console.error('❌ Error destroying Data Migration Utility:', error);
        }
    }
};

// Export for global access
window.DataMigration = DataMigration;
