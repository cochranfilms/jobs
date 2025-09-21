/**
 * Migration Script for Cochran Films
 * This script helps migrate existing JSON data to Firestore
 */

const FirestoreMigration = {
    // Initialize migration
    async init() {
        try {
            console.log('🚀 Starting Firestore Migration...');
            
            // Wait for Firebase to be ready
            if (!window.FirebaseConfig || !window.FirebaseConfig.isInitialized) {
                await new Promise((resolve) => {
                    window.addEventListener('firebase:initialized', resolve, { once: true });
                });
            }
            
            // Initialize Firestore Data Manager
            if (window.FirestoreDataManager) {
                await window.FirestoreDataManager.init();
                console.log('✅ Firestore Data Manager ready for migration');
                return true;
            } else {
                console.error('❌ FirestoreDataManager not available');
                return false;
            }
        } catch (error) {
            console.error('❌ Migration initialization failed:', error);
            return false;
        }
    },

    // Migrate users data
    async migrateUsers() {
        try {
            console.log('👥 Starting users migration...');
            
            // Load current users from API
            const response = await fetch('/api/users');
            if (!response.ok) {
                throw new Error(`Failed to load users: ${response.status}`);
            }
            
            const usersData = await response.json();
            const users = usersData.users || {};
            
            console.log(`📊 Found ${Object.keys(users).length} users to migrate`);
            
            let migratedCount = 0;
            let errorCount = 0;
            
            for (const [userId, userData] of Object.entries(users)) {
                if (userId !== '_archived' && !userId.startsWith('_')) {
                    try {
                        await window.FirestoreDataManager.setUser(userId, userData);
                        migratedCount++;
                        console.log(`✅ Migrated user: ${userId}`);
                    } catch (error) {
                        errorCount++;
                        console.error(`❌ Failed to migrate user ${userId}:`, error);
                    }
                }
            }
            
            console.log(`🎉 Users migration complete: ${migratedCount} migrated, ${errorCount} errors`);
            return { migratedCount, errorCount };
            
        } catch (error) {
            console.error('❌ Users migration failed:', error);
            throw error;
        }
    },

    // Migrate jobs data
    async migrateJobs() {
        try {
            console.log('📋 Starting jobs migration...');
            
            // Load current jobs from API
            const response = await fetch('/api/jobs-data');
            if (!response.ok) {
                throw new Error(`Failed to load jobs: ${response.status}`);
            }
            
            const jobsData = await response.json();
            const jobs = jobsData.jobs || [];
            
            console.log(`📊 Found ${jobs.length} jobs to migrate`);
            
            let migratedCount = 0;
            let errorCount = 0;
            
            // Since jobs are stored in user documents, we need to create user documents
            // or update existing ones with job data
            for (const job of jobs) {
                try {
                    // Create a user document for this job if it doesn't exist
                    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const userData = {
                        profile: {
                            role: job.type || 'Contractor',
                            location: job.location || 'Atlanta Area',
                            email: 'job@cochranfilms.com' // Placeholder email
                        },
                        jobs: {
                            [job.title]: {
                                ...job,
                                status: job.status || 'Active',
                                assignedDate: new Date().toISOString().split('T')[0]
                            }
                        },
                        primaryJob: job.title,
                        lastUpdated: new Date().toISOString()
                    };
                    
                    await window.FirestoreDataManager.setUser(userId, userData);
                    migratedCount++;
                    console.log(`✅ Migrated job: ${job.title || 'Untitled'}`);
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Failed to migrate job:`, error);
                }
            }
            
            console.log(`🎉 Jobs migration complete: ${migratedCount} migrated, ${errorCount} errors`);
            return { migratedCount, errorCount };
            
        } catch (error) {
            console.error('❌ Jobs migration failed:', error);
            throw error;
        }
    },

    // Migrate dropdown options
    async migrateDropdownOptions() {
        try {
            console.log('📋 Starting dropdown options migration...');
            
            // Load current dropdown options from API
            const response = await fetch('/api/dropdown-options');
            if (!response.ok) {
                throw new Error(`Failed to load dropdown options: ${response.status}`);
            }
            
            const dropdownOptions = await response.json();
            
            console.log(`📊 Found ${Object.keys(dropdownOptions).length} dropdown categories to migrate`);
            
            let migratedCount = 0;
            let errorCount = 0;
            
            // Create a system user document to store dropdown options
            const systemUserId = 'system-dropdown-options';
            const systemUserData = {
                profile: {
                    role: 'System',
                    email: 'system@cochranfilms.com'
                },
                dropdownOptions: dropdownOptions,
                lastUpdated: new Date().toISOString()
            };
            
            try {
                await window.FirestoreDataManager.setUser(systemUserId, systemUserData);
                migratedCount++;
                console.log(`✅ Migrated dropdown options to system user document`);
            } catch (error) {
                errorCount++;
                console.error(`❌ Failed to migrate dropdown options:`, error);
            }
            
            console.log(`🎉 Dropdown options migration complete: ${migratedCount} migrated, ${errorCount} errors`);
            return { migratedCount, errorCount };
            
        } catch (error) {
            console.error('❌ Dropdown options migration failed:', error);
            throw error;
        }
    },

    // Run full migration
    async runFullMigration() {
        try {
            console.log('🚀 Starting full Firestore migration...');
            
            const results = {
                users: null,
                jobs: null,
                dropdownOptions: null
            };
            
            // Migrate users
            results.users = await this.migrateUsers();
            
            // Migrate jobs
            results.jobs = await this.migrateJobs();
            
            // Migrate dropdown options
            results.dropdownOptions = await this.migrateDropdownOptions();
            
            console.log('🎉 Full migration complete!');
            console.log('📊 Migration Summary:', results);
            
            return results;
            
        } catch (error) {
            console.error('❌ Full migration failed:', error);
            throw error;
        }
    },

    // Verify migration
    async verifyMigration() {
        try {
            console.log('🔍 Verifying migration...');
            
            const verification = {
                users: false,
                jobs: false,
                dropdownOptions: false
            };
            
            // Check users
            try {
                const users = await window.FirestoreDataManager.getUsers();
                verification.users = Object.keys(users).length > 0;
                console.log(`👥 Users verification: ${verification.users ? '✅' : '❌'} (${Object.keys(users).length} found)`);
            } catch (error) {
                console.error('❌ Users verification failed:', error);
            }
            
            // Check jobs (extracted from users)
            try {
                const users = await window.FirestoreDataManager.getUsers();
                const jobs = [];
                Object.values(users).forEach(user => {
                    if (user.jobs) {
                        Object.values(user.jobs).forEach(job => {
                            jobs.push(job);
                        });
                    }
                });
                verification.jobs = jobs.length > 0;
                console.log(`📋 Jobs verification: ${verification.jobs ? '✅' : '❌'} (${jobs.length} found)`);
            } catch (error) {
                console.error('❌ Jobs verification failed:', error);
            }
            
            // Check dropdown options (extracted from users)
            try {
                const users = await window.FirestoreDataManager.getUsers();
                const dropdownOptions = {};
                Object.values(users).forEach(user => {
                    if (user.dropdownOptions) {
                        Object.assign(dropdownOptions, user.dropdownOptions);
                    }
                });
                verification.dropdownOptions = Object.keys(dropdownOptions).length > 0;
                console.log(`📋 Dropdown options verification: ${verification.dropdownOptions ? '✅' : '❌'} (${Object.keys(dropdownOptions).length} found)`);
            } catch (error) {
                console.error('❌ Dropdown options verification failed:', error);
            }
            
            const allVerified = Object.values(verification).every(v => v === true);
            console.log(`🔍 Migration verification: ${allVerified ? '✅ ALL PASSED' : '❌ SOME FAILED'}`);
            
            return verification;
            
        } catch (error) {
            console.error('❌ Migration verification failed:', error);
            throw error;
        }
    }
};

// Export for use in other modules
window.FirestoreMigration = FirestoreMigration;

// Auto-initialize when DOM is ready
function initializeFirestoreMigration() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            FirestoreMigration.init().catch(error => {
                console.error('❌ Firestore Migration auto-initialization failed:', error);
            });
        });
    } else {
        // DOM is already ready
        FirestoreMigration.init().catch(error => {
            console.error('❌ Firestore Migration auto-initialization failed:', error);
        });
    }
}

// Start initialization
initializeFirestoreMigration();
