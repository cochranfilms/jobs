// ==================== USER MANAGER MODULE ====================
// Handles user profile data and user-related operations

export class UserManager {
    constructor(config = {}) {
        this.apiBase = config.apiBase || '';
        this.onError = config.onError || (() => {});
        this.cache = new Map();
        this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
    }

    // ==================== USER DATA MANAGEMENT ====================

    async getUser(email) {
        try {
            console.log('🔄 Fetching user data for:', email);
            
            // Check cache first
            const cached = this.getCachedUser(email);
            if (cached) {
                console.log('✅ Using cached user data');
                return cached;
            }
            
            // Fetch from API
            const userData = await this.fetchUserFromAPI(email);
            if (userData) {
                // Cache the data
                this.cacheUser(email, userData);
                console.log('✅ User data fetched and cached');
                return userData;
            }
            
            throw new Error('User not found');
            
        } catch (error) {
            console.error('❌ Failed to get user:', error);
            this.onError(error, 'User Data Loading Failed');
            throw error;
        }
    }

    async fetchUserFromAPI(email) {
        try {
            // Firestore lookup by profile.email
            if (window.FirebaseConfig && window.FirebaseConfig.isInitialized) {
                const db = window.FirebaseConfig.getFirestore();
                const snap = await db.collection('users')
                    .where('profile.email', '==', email)
                    .limit(1)
                    .get();
                if (!snap.empty) {
                    const doc = snap.docs[0];
                    const user = doc.data() || {};
                    return this.transformUserData(doc.id, user);
                }
            }
            return null;
            
        } catch (error) {
            console.error('❌ API fetch failed:', error);
            throw error;
        }
    }

    transformUserData(name, user) {
        try {
            return {
                name: name,
                email: user.profile?.email,
                approvedDate: user.profile?.approvedDate,
                role: user.profile?.role,
                location: user.profile?.location,
                rate: user.profile?.rate,
                description: user.profile?.description,
                contractStatus: user.contract?.contractStatus || 'pending',
                contractSignedDate: user.contract?.contractSignedDate,
                contractUploadedDate: user.contract?.uploadDate,
                contractId: user.contract?.contractId,
                paymentMethod: user.paymentMethod || null,
                paymentStatus: user.paymentStatus || 'pending',
                jobs: user.jobs || {},
                primaryJob: user.primaryJob || 'legacy-job',
                profile: user.profile || {},
                contract: user.contract || {},
                application: user.application || {}
            };
        } catch (error) {
            console.error('❌ Failed to transform user data:', error);
            throw error;
        }
    }

    // ==================== CACHING SYSTEM ====================

    getCachedUser(email) {
        try {
            const cached = this.cache.get(email);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
            
            // Remove expired cache
            if (cached) {
                this.cache.delete(email);
            }
            
            return null;
            
        } catch (error) {
            console.warn('⚠️ Cache retrieval failed:', error);
            return null;
        }
    }

    cacheUser(email, userData) {
        try {
            this.cache.set(email, {
                data: userData,
                timestamp: Date.now()
            });
            
            // Limit cache size
            if (this.cache.size > 50) {
                const oldestKey = this.cache.keys().next().value;
                this.cache.delete(oldestKey);
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to cache user data:', error);
        }
    }

    clearCache() {
        try {
            this.cache.clear();
            console.log('✅ User cache cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear cache:', error);
        }
    }

    // ==================== USER VALIDATION ====================

    validateUser(userData) {
        try {
            const required = ['name', 'email'];
            const missing = required.filter(field => !userData[field]);
            
            if (missing.length > 0) {
                throw new Error(`Missing required fields: ${missing.join(', ')}`);
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                throw new Error('Invalid email format');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ User validation failed:', error);
            throw error;
        }
    }

    // ==================== USER SEARCH ====================

    async searchUsers(query, filters = {}) {
        try {
            console.log('🔍 Searching users with query:', query);
            
            const response = await fetch(`${this.apiBase}/api/users`);
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const usersData = await response.json();
            const results = [];
            
            for (const [name, user] of Object.entries(usersData.users)) {
                if (this.matchesSearchCriteria(name, user, query, filters)) {
                    results.push(this.transformUserData(name, user));
                }
            }
            
            console.log(`✅ Found ${results.length} matching users`);
            return results;
            
        } catch (error) {
            console.error('❌ User search failed:', error);
            this.onError(error, 'User Search Failed');
            throw error;
        }
    }

    matchesSearchCriteria(name, user, query, filters) {
        try {
            const searchText = query.toLowerCase();
            const nameMatch = name.toLowerCase().includes(searchText);
            const emailMatch = user.profile?.email?.toLowerCase().includes(searchText);
            const roleMatch = user.profile?.role?.toLowerCase().includes(searchText);
            
            // Basic text search
            if (!nameMatch && !emailMatch && !roleMatch) {
                return false;
            }
            
            // Apply filters
            if (filters.role && user.profile?.role !== filters.role) {
                return false;
            }
            
            if (filters.location && user.profile?.location !== filters.location) {
                return false;
            }
            
            if (filters.contractStatus && user.contract?.contractStatus !== filters.contractStatus) {
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.warn('⚠️ Search criteria matching failed:', error);
            return false;
        }
    }

    // ==================== USER STATISTICS ====================

    async getUserStats(email) {
        try {
            const user = await this.getUser(email);
            if (!user) return null;
            
            const stats = {
                totalJobs: Object.keys(user.jobs || {}).length,
                activeJobs: Object.values(user.jobs || {}).filter(job => job.status === 'active').length,
                completedJobs: Object.values(user.jobs || {}).filter(job => job.status === 'completed').length,
                contractStatus: user.contractStatus,
                paymentStatus: user.paymentStatus,
                daysSinceApproval: this.calculateDaysSinceApproval(user.approvedDate),
                averageRate: this.calculateAverageRate(user.jobs),
                totalEarnings: this.calculateTotalEarnings(user.jobs)
            };
            
            return stats;
            
        } catch (error) {
            console.error('❌ Failed to get user stats:', error);
            this.onError(error, 'User Statistics Failed');
            return null;
        }
    }

    calculateDaysSinceApproval(approvedDate) {
        try {
            if (!approvedDate) return null;
            
            const approved = new Date(approvedDate);
            const now = new Date();
            const diffTime = Math.abs(now - approved);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays;
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate days since approval:', error);
            return null;
        }
    }

    calculateAverageRate(jobs) {
        try {
            if (!jobs || Object.keys(jobs).length === 0) return null;
            
            const rates = Object.values(jobs)
                .map(job => this.extractRateValue(job.rate))
                .filter(rate => rate !== null);
            
            if (rates.length === 0) return null;
            
            const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
            return `$${average.toFixed(2)}`;
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate average rate:', error);
            return null;
        }
    }

    extractRateValue(rateString) {
        try {
            if (!rateString) return null;
            
            // Extract numeric value from rate strings like "$400.00 USD (Flat)" or "$125/hour"
            const match = rateString.match(/\$([\d,]+\.?\d*)/);
            if (match) {
                return parseFloat(match[1].replace(',', ''));
            }
            
            return null;
            
        } catch (error) {
            console.warn('⚠️ Failed to extract rate value:', error);
            return null;
        }
    }

    calculateTotalEarnings(jobs) {
        try {
            if (!jobs || Object.keys(jobs).length === 0) return 0;
            
            return Object.values(jobs)
                .map(job => this.extractRateValue(job.rate) || 0)
                .reduce((sum, rate) => sum + rate, 0);
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate total earnings:', error);
            return 0;
        }
    }

    // ==================== USER UPDATES ====================

    async updateUserProfile(email, updates) {
        try {
            console.log('🔄 Updating user profile for:', email);
            
            // Validate updates
            this.validateUserUpdates(updates);
            
            // In a real system, this would make an API call to update the user
            // For now, we'll just update the cache
            const currentUser = this.getCachedUser(email);
            if (currentUser) {
                const updatedUser = { ...currentUser, ...updates };
                this.cacheUser(email, updatedUser);
                console.log('✅ User profile updated in cache');
                return updatedUser;
            }
            
            throw new Error('User not found in cache');
            
        } catch (error) {
            console.error('❌ Failed to update user profile:', error);
            this.onError(error, 'Profile Update Failed');
            throw error;
        }
    }

    validateUserUpdates(updates) {
        try {
            const allowedFields = [
                'role', 'location', 'rate', 'description', 
                'paymentMethod', 'contractStatus'
            ];
            
            const invalidFields = Object.keys(updates).filter(field => 
                !allowedFields.includes(field)
            );
            
            if (invalidFields.length > 0) {
                throw new Error(`Invalid update fields: ${invalidFields.join(', ')}`);
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Update validation failed:', error);
            throw error;
        }
    }

    // ==================== PUBLIC API ====================

    getCacheSize() {
        return this.cache.size;
    }

    getCacheTimeout() {
        return this.cacheTimeout;
    }

    setCacheTimeout(timeout) {
        this.cacheTimeout = Math.max(1000, timeout);
    }

    // ==================== STATIC UTILITIES ====================

    static formatUserDisplayName(user) {
        try {
            if (!user) return 'Unknown User';
            
            if (user.name) return user.name;
            if (user.email) return user.email.split('@')[0];
            
            return 'Unknown User';
            
        } catch (error) {
            return 'Unknown User';
        }
    }

    static formatUserRole(user) {
        try {
            if (!user) return 'Unknown Role';
            
            return user.role || user.profile?.role || 'Unknown Role';
            
        } catch (error) {
            return 'Unknown Role';
        }
    }

    static formatUserLocation(user) {
        try {
            if (!user) return 'Unknown Location';
            
            return user.location || user.profile?.location || 'Unknown Location';
            
        } catch (error) {
            return 'Unknown Location';
        }
    }
}

// ==================== DEFAULT EXPORT ====================

export default UserManager;
