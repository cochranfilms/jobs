const fs = require('fs');
const path = require('path');

class DataMigration {
    constructor() {
        this.centralizedData = {
            users: {},
            system: {
                statusOptions: {
                    projectStatus: ["upcoming", "in-progress", "completed", "cancelled"],
                    paymentStatus: ["pending", "processing", "paid", "overdue"]
                },
                lastUpdated: new Date().toISOString().split('T')[0],
                totalUsers: 0,
                totalContracts: 0,
                totalReviews: 0,
                exportDate: new Date().toISOString()
            }
        };
    }

    async migrateAllData() {
        console.log('🔄 Starting data migration to centralized structure...');
        
        try {
            // Step 1: Migrate user data from various JSON files
            await this.migrateUserData();
            
            // Step 2: Migrate contract data
            await this.migrateContractData();
            
            // Step 3: Migrate performance reviews
            await this.migratePerformanceData();
            
            // Step 4: Update system totals
            this.updateSystemTotals();
            
            // Step 5: Save centralized data
            await this.saveCentralizedData();
            
            console.log('✅ Migration completed successfully!');
            console.log(`📊 Summary: ${this.centralizedData.system.totalUsers} users, ${this.centralizedData.system.totalContracts} contracts, ${this.centralizedData.system.totalReviews} reviews`);
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }

    async migrateUserData() {
        console.log('👥 Migrating user data...');
        
        const userFiles = [
            'event-planners.json',
            'healthcare-staff.json',
            'real-estate-agents.json',
            'freelancers.json'
        ];

        for (const file of userFiles) {
            try {
                if (fs.existsSync(file)) {
                    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
                    await this.processUserFile(data, file);
                }
            } catch (error) {
                console.warn(`⚠️ Could not process ${file}:`, error.message);
            }
        }
    }

    async processUserFile(data, filename) {
        const userData = data.approvedFreelancers || data.users || {};
        
        for (const [userName, user] of Object.entries(userData)) {
            const email = user.email || user.profile?.email;
            if (!email) {
                console.warn(`⚠️ Skipping user ${userName} - no email found`);
                continue;
            }

            // Create centralized user structure
            this.centralizedData.users[userName] = {
                profile: {
                    email: email,
                    password: user.password || user.profile?.password,
                    role: user.role || user.profile?.role,
                    location: user.location || user.profile?.location,
                    projectStart: user.projectStart || user.profile?.projectStart,
                    rate: user.rate || user.profile?.rate,
                    approvedDate: user.approvedDate || user.profile?.approvedDate
                },
                contract: {
                    contractId: user.contractId || user.contract?.contractId,
                    fileName: user.contractId ? `${user.contractId}.pdf` : null,
                    status: user.contractStatus || user.contract?.status || 'pending',
                    signedDate: user.contractSignedDate || user.contract?.signedDate,
                    uploadDate: user.contractUploadedDate || user.contract?.uploadDate,
                    githubUrl: user.contractId ? `https://raw.githubusercontent.com/cochranfilms/cochran-job-listings/main/contracts/${user.contractId}.pdf` : null,
                    notes: 'Migrated from legacy data'
                },
                jobs: user.jobs || {},
                performance: null, // Will be populated from performance.json
                payment: {
                    method: user.paymentMethod || null,
                    status: user.paymentStatus || 'pending',
                    lastPayment: null
                },
                notifications: []
            };

            console.log(`✅ Migrated user: ${userName} (${email})`);
        }
    }

    async migrateContractData() {
        console.log('📄 Migrating contract data...');
        
        try {
            if (fs.existsSync('uploaded-contracts.json')) {
                const contractData = JSON.parse(fs.readFileSync('uploaded-contracts.json', 'utf8'));
                const contracts = contractData.uploadedContracts || contractData.contracts || [];
                
                for (const contract of contracts) {
                    // Find user by email or contract ID
                    const userName = this.findUserByContract(contract);
                    
                    if (userName && this.centralizedData.users[userName]) {
                        // Update user's contract data
                        this.centralizedData.users[userName].contract = {
                            contractId: contract.contractId,
                            fileName: contract.fileName || `${contract.contractId}.pdf`,
                            status: contract.status || 'uploaded',
                            signedDate: contract.signedDate || contract.contractDate,
                            uploadDate: contract.uploadDate,
                            githubUrl: contract.githubUrl || `https://raw.githubusercontent.com/cochranfilms/cochran-job-listings/main/contracts/${contract.contractId}.pdf`,
                            notes: contract.notes || 'Migrated from uploaded-contracts.json'
                        };
                        
                        console.log(`✅ Updated contract for user: ${userName} (${contract.contractId})`);
                    } else {
                        console.warn(`⚠️ Could not find user for contract: ${contract.contractId}`);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not migrate contract data:', error.message);
        }
    }

    findUserByContract(contract) {
        // Try to find user by email first
        if (contract.freelancerEmail) {
            for (const [userName, user] of Object.entries(this.centralizedData.users)) {
                if (user.profile.email === contract.freelancerEmail) {
                    return userName;
                }
            }
        }
        
        // Try to find user by contract ID
        if (contract.contractId) {
            for (const [userName, user] of Object.entries(this.centralizedData.users)) {
                if (user.contract.contractId === contract.contractId) {
                    return userName;
                }
            }
        }
        
        return null;
    }

    async migratePerformanceData() {
        console.log('📊 Migrating performance data...');
        
        try {
            if (fs.existsSync('performance.json')) {
                const performanceData = JSON.parse(fs.readFileSync('performance.json', 'utf8'));
                const reviews = performanceData.performanceReviews || {};
                
                for (const [userEmail, review] of Object.entries(reviews)) {
                    // Find user by email
                    const userName = this.findUserByEmail(userEmail);
                    
                    if (userName && this.centralizedData.users[userName]) {
                        this.centralizedData.users[userName].performance = {
                            reviewDate: review.reviewDate,
                            overallRating: review.overallRating,
                            categories: review.categories,
                            comments: review.comments,
                            adminNotes: review.adminNotes,
                            reviewedBy: review.reviewedBy,
                            lastUpdated: review.lastUpdated
                        };
                        
                        console.log(`✅ Migrated performance review for: ${userName}`);
                    } else {
                        console.warn(`⚠️ Could not find user for performance review: ${userEmail}`);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not migrate performance data:', error.message);
        }
    }

    findUserByEmail(email) {
        for (const [userName, user] of Object.entries(this.centralizedData.users)) {
            if (user.profile.email === email) {
                return userName;
            }
        }
        return null;
    }

    updateSystemTotals() {
        let totalUsers = 0;
        let totalContracts = 0;
        let totalReviews = 0;

        for (const user of Object.values(this.centralizedData.users)) {
            totalUsers++;
            
            if (user.contract && user.contract.contractId) {
                totalContracts++;
            }
            
            if (user.performance) {
                totalReviews++;
            }
        }

        this.centralizedData.system.totalUsers = totalUsers;
        this.centralizedData.system.totalContracts = totalContracts;
        this.centralizedData.system.totalReviews = totalReviews;
    }

    async saveCentralizedData() {
        console.log('💾 Saving centralized data...');
        
        // Create backup of current users.json
        if (fs.existsSync('users.json')) {
            const backupName = `users-backup-${Date.now()}.json`;
            fs.copyFileSync('users.json', backupName);
            console.log(`📦 Created backup: ${backupName}`);
        }
        
        // Save new centralized data
        fs.writeFileSync('users.json', JSON.stringify(this.centralizedData, null, 2));
        console.log('✅ Centralized data saved to users.json');
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    const migration = new DataMigration();
    migration.migrateAllData()
        .then(() => {
            console.log('🎉 Migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration failed:', error);
            process.exit(1);
        });
}

module.exports = DataMigration; 