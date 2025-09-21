const fs = require('fs');
const path = require('path');

class ContractsMigration {
    constructor() {
        this.centralizedData = null;
    }

    async migrateContractsData() {
        console.log('🔄 Starting contracts data migration to centralized structure...');
        
        try {
            // Step 1: Load current centralized data
            await this.loadCentralizedData();
            
            // Step 2: Load uploaded contracts data
            await this.loadUploadedContractsData();
            
            // Step 3: Migrate contract data to users
            await this.migrateContractData();
            
            // Step 4: Update system totals
            this.updateSystemTotals();
            
            // Step 5: Save centralized data
            await this.saveCentralizedData();
            
            console.log('✅ Contracts migration completed successfully!');
            console.log(`📊 Summary: Contract data migrated to centralized structure`);
            
        } catch (error) {
            console.error('❌ Contracts migration failed:', error);
            throw error;
        }
    }

    async loadCentralizedData() {
        console.log('📖 Loading centralized users.json...');
        
        try {
            const usersPath = path.join(__dirname, 'users.json');
            const data = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
            this.centralizedData = data;
            
            console.log(`✅ Loaded centralized data with ${Object.keys(this.centralizedData.users).length} users`);
        } catch (error) {
            console.error('❌ Error loading centralized data:', error);
            throw error;
        }
    }

    async loadUploadedContractsData() {
        console.log('📊 Loading uploaded-contracts.json...');
        
        try {
            const contractsPath = path.join(__dirname, 'uploaded-contracts.json');
            const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
            this.contractsData = contractsData;
            
            console.log(`✅ Loaded contracts data with ${contractsData.uploadedContracts?.length || 0} contracts`);
        } catch (error) {
            console.error('❌ Error loading contracts data:', error);
            throw error;
        }
    }

    async migrateContractData() {
        console.log('🔄 Migrating contract data to users...');
        
        const uploadedContracts = this.contractsData.uploadedContracts || [];
        let migratedCount = 0;
        
        for (const contract of uploadedContracts) {
            // Find user by email or name
            const userName = this.findUserByEmailOrName(contract.freelancerEmail, contract.freelancerName);
            
            if (userName && this.centralizedData.users[userName]) {
                // Update user's contract data with file information
                const user = this.centralizedData.users[userName];
                
                if (!user.contract) {
                    user.contract = {};
                }
                
                // Merge contract data
                user.contract = {
                    ...user.contract,
                    contractId: contract.contractId,
                    fileName: contract.fileName,
                    githubUrl: contract.githubUrl,
                    fileSize: contract.fileSize,
                    uploadDate: contract.uploadDate,
                    status: contract.status,
                    notes: contract.notes,
                    contractDate: contract.contractDate,
                    signedDate: contract.signedDate,
                    freelancerName: contract.freelancerName,
                    freelancerEmail: contract.freelancerEmail,
                    role: contract.role,
                    rate: contract.rate,
                    location: contract.location
                };
                
                console.log(`✅ Migrated contract data for: ${userName} (${contract.fileName})`);
                migratedCount++;
            } else {
                console.warn(`⚠️ Could not find user for contract: ${contract.freelancerName} (${contract.freelancerEmail})`);
            }
        }
        
        console.log(`📊 Migrated ${migratedCount} contract records`);
    }

    findUserByEmailOrName(email, name) {
        // First try to find by email
        for (const [userName, user] of Object.entries(this.centralizedData.users)) {
            if (user.profile && user.profile.email === email) {
                return userName;
            }
        }
        
        // Then try to find by name
        for (const [userName, user] of Object.entries(this.centralizedData.users)) {
            if (userName === name) {
                return userName;
            }
        }
        
        return null;
    }

    updateSystemTotals() {
        console.log('📊 Updating system totals...');
        
        let totalContracts = 0;
        
        // Count contracts in users
        for (const user of Object.values(this.centralizedData.users)) {
            if (user.contract && user.contract.contractId) {
                totalContracts++;
            }
        }
        
        // Update the structure based on current format
        if (this.centralizedData.system) {
            this.centralizedData.system.totalContracts = totalContracts;
            this.centralizedData.system.lastUpdated = new Date().toISOString().split('T')[0];
        } else {
            // If no system object, add it
            this.centralizedData.system = {
                totalContracts: totalContracts,
                lastUpdated: new Date().toISOString().split('T')[0]
            };
        }
        
        console.log(`✅ Updated system totals: ${totalContracts} contracts`);
    }

    async saveCentralizedData() {
        console.log('💾 Saving centralized data...');
        
        // Create backup of current users.json
        if (fs.existsSync('users.json')) {
            const backupName = `users-backup-contracts-${Date.now()}.json`;
            fs.copyFileSync('users.json', backupName);
            console.log(`📦 Created backup: ${backupName}`);
        }
        
        // Save updated centralized data
        fs.writeFileSync('users.json', JSON.stringify(this.centralizedData, null, 2));
        console.log('✅ Centralized data saved to users.json');
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    const migration = new ContractsMigration();
    migration.migrateContractsData()
        .then(() => {
            console.log('🎉 Contracts migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Contracts migration failed:', error);
            process.exit(1);
        });
}

module.exports = ContractsMigration; 