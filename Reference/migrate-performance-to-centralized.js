const fs = require('fs');
const path = require('path');

class PerformanceMigration {
    constructor() {
        this.centralizedData = null;
    }

    async migratePerformanceData() {
        console.log('🔄 Starting performance data migration to centralized structure...');
        
        try {
            // Step 1: Load current centralized data
            await this.loadCentralizedData();
            
            // Step 2: Load performance data
            await this.loadPerformanceData();
            
            // Step 3: Migrate performance reviews to users
            await this.migratePerformanceReviews();
            
            // Step 4: Update system totals
            this.updateSystemTotals();
            
            // Step 5: Save centralized data
            await this.saveCentralizedData();
            
            console.log('✅ Performance migration completed successfully!');
            console.log(`📊 Summary: ${this.centralizedData.system.totalReviews} performance reviews migrated`);
            
        } catch (error) {
            console.error('❌ Performance migration failed:', error);
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

    async loadPerformanceData() {
        console.log('📊 Loading performance.json...');
        
        try {
            const performancePath = path.join(__dirname, 'performance.json');
            const performanceData = JSON.parse(fs.readFileSync(performancePath, 'utf8'));
            this.performanceData = performanceData;
            
            console.log(`✅ Loaded performance data with ${Object.keys(this.performanceData.performanceReviews).length} reviews`);
        } catch (error) {
            console.error('❌ Error loading performance data:', error);
            throw error;
        }
    }

    async migratePerformanceReviews() {
        console.log('🔄 Migrating performance reviews to users...');
        
        const reviews = this.performanceData.performanceReviews || {};
        let migratedCount = 0;
        
        for (const [userEmail, review] of Object.entries(reviews)) {
            // Skip undefined user reviews
            if (userEmail === 'undefined') {
                console.warn('⚠️ Skipping review for undefined user');
                continue;
            }
            
            // Find user by email
            const userName = this.findUserByEmail(userEmail);
            
            if (userName && this.centralizedData.users[userName]) {
                // Migrate performance review to user
                this.centralizedData.users[userName].performance = {
                    reviewDate: review.reviewDate,
                    overallRating: review.overallRating,
                    categories: review.categories,
                    comments: review.comments,
                    adminNotes: review.adminNotes,
                    reviewedBy: review.reviewedBy,
                    lastUpdated: review.lastUpdated
                };
                
                console.log(`✅ Migrated performance review for: ${userName} (${userEmail})`);
                migratedCount++;
            } else {
                console.warn(`⚠️ Could not find user for performance review: ${userEmail}`);
            }
        }
        
        console.log(`📊 Migrated ${migratedCount} performance reviews`);
    }

    findUserByEmail(email) {
        for (const [userName, user] of Object.entries(this.centralizedData.users)) {
            if (user.profile && user.profile.email === email) {
                return userName;
            }
        }
        return null;
    }

    updateSystemTotals() {
        console.log('📊 Updating system totals...');
        
        let totalReviews = 0;
        
        // Count performance reviews in users
        for (const user of Object.values(this.centralizedData.users)) {
            if (user.performance) {
                totalReviews++;
            }
        }
        
        // Update the structure based on current format
        if (this.centralizedData.system) {
            this.centralizedData.system.totalReviews = totalReviews;
            this.centralizedData.system.lastUpdated = new Date().toISOString().split('T')[0];
        } else {
            // If no system object, add it
            this.centralizedData.system = {
                totalReviews: totalReviews,
                lastUpdated: new Date().toISOString().split('T')[0]
            };
        }
        
        console.log(`✅ Updated system totals: ${totalReviews} performance reviews`);
    }

    async saveCentralizedData() {
        console.log('💾 Saving centralized data...');
        
        // Create backup of current users.json
        if (fs.existsSync('users.json')) {
            const backupName = `users-backup-performance-${Date.now()}.json`;
            fs.copyFileSync('users.json', backupName);
            console.log(`📦 Created backup: ${backupName}`);
        }
        
        // Save updated centralized data
        fs.writeFileSync('users.json', JSON.stringify(this.centralizedData, null, 2));
        console.log('✅ Centralized data saved to users.json');
    }

    async createPerformanceBackup() {
        console.log('📦 Creating performance.json backup...');
        
        if (fs.existsSync('performance.json')) {
            const backupName = `performance-backup-${Date.now()}.json`;
            fs.copyFileSync('performance.json', backupName);
            console.log(`📦 Created performance backup: ${backupName}`);
        }
    }
}

// Run migration if this script is executed directly
if (require.main === module) {
    const migration = new PerformanceMigration();
    migration.migratePerformanceData()
        .then(() => {
            console.log('🎉 Performance migration completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Performance migration failed:', error);
            process.exit(1);
        });
}

module.exports = PerformanceMigration; 