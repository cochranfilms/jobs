// ==================== JOB MANAGER MODULE ====================
// Handles job assignments, status tracking, and job-related operations

export class JobManager {
    constructor(config = {}) {
        this.apiBase = config.apiBase || '';
        this.onError = config.onError || (() => {});
        this.jobs = new Map();
        this.jobStatuses = ['upcoming', 'active', 'completed', 'cancelled', 'on-hold'];
    }

    // ==================== JOB DATA MANAGEMENT ====================

    async getUserJobs(userEmail) {
        try {
            console.log('🔄 Fetching jobs for user:', userEmail);
            
            // Check cache first
            if (this.jobs.has(userEmail)) {
                console.log('✅ Using cached jobs');
                return this.jobs.get(userEmail);
            }
            
            // Fetch from API
            const jobs = await this.fetchJobsFromAPI(userEmail);
            
            // Cache the jobs
            this.jobs.set(userEmail, jobs);
            console.log(`✅ Cached ${jobs.length} jobs for user`);
            
            return jobs;
            
        } catch (error) {
            console.error('❌ Failed to get user jobs:', error);
            this.onError(error, 'Job Loading Failed');
            return [];
        }
    }

    async fetchJobsFromAPI(userEmail) {
        try {
            // Firestore lookup by profile.email
            if (window.FirebaseConfig && window.FirebaseConfig.isInitialized) {
                const db = window.FirebaseConfig.getFirestore();
                const snap = await db.collection('users')
                    .where('profile.email', '==', userEmail)
                    .limit(1)
                    .get();
                if (!snap.empty) {
                    const doc = snap.docs[0];
                    const user = doc.data() || {};
                    return this.extractJobsFromUser(doc.id, user);
                }
            }
            return [];
        } catch (error) {
            console.error('❌ API fetch failed:', error);
            throw error;
        }
    }

    extractJobsFromUser(name, user) {
        try {
            const jobs = [];
            
            // Extract jobs from user object
            if (user.jobs && Object.keys(user.jobs).length > 0) {
                for (const [jobId, jobData] of Object.entries(user.jobs)) {
                    const job = {
                        id: jobId,
                        title: jobData.title || jobData.role || 'Untitled Job',
                        role: jobData.role || jobData.title || 'Unknown Role',
                        location: jobData.location || 'Location not specified',
                        projectStart: jobData.projectStart || jobData.startDate || 'TBD',
                        projectEnd: jobData.projectEnd || jobData.endDate || 'TBD',
                        rate: jobData.rate || 'Rate not specified',
                        status: jobData.status || 'upcoming',
                        projectType: jobData.projectType || 'General',
                        description: jobData.description || `${jobData.role || 'Professional'} position`,
                        requirements: jobData.requirements || [],
                        deliverables: jobData.deliverables || [],
                        client: jobData.client || 'Cochran Films',
                        priority: jobData.priority || 'normal',
                        estimatedHours: jobData.estimatedHours || null,
                        actualHours: jobData.actualHours || null,
                        earnings: jobData.earnings || null,
                        notes: jobData.notes || '',
                        createdAt: jobData.createdAt || new Date().toISOString(),
                        updatedAt: jobData.updatedAt || new Date().toISOString()
                    };
                    
                    jobs.push(job);
                }
            } else {
                // Create legacy job from profile data
                const legacyJob = {
                    id: 'legacy-job',
                    title: `${user.profile?.role || 'Professional'} Position`,
                    role: user.profile?.role || 'Creator',
                    location: user.profile?.location || 'Location not specified',
                    projectStart: user.profile?.projectStart || user.application?.eventDate || 'TBD',
                    projectEnd: 'TBD',
                    rate: user.profile?.rate || 'Rate not specified',
                    status: 'upcoming',
                    projectType: 'Legacy Job',
                    description: `${user.profile?.role || 'Professional'} position`,
                    requirements: [],
                    deliverables: [],
                    client: 'Cochran Films',
                    priority: 'normal',
                    estimatedHours: null,
                    actualHours: null,
                    earnings: null,
                    notes: 'Legacy job created from profile data',
                    createdAt: user.approvedDate || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                jobs.push(legacyJob);
            }
            
            return jobs;
            
        } catch (error) {
            console.error('❌ Failed to extract jobs from user:', error);
            return [];
        }
    }

    // ==================== JOB STATUS MANAGEMENT ====================

    async updateJobStatus(jobId, status, userEmail) {
        try {
            console.log(`🔄 Updating job ${jobId} status to: ${status}`);
            
            // Validate status
            if (!this.jobStatuses.includes(status)) {
                throw new Error(`Invalid job status: ${status}`);
            }
            
            // Update in cache
            const userJobs = this.jobs.get(userEmail) || [];
            const jobIndex = userJobs.findIndex(job => job.id === jobId);
            
            if (jobIndex !== -1) {
                userJobs[jobIndex].status = status;
                userJobs[jobIndex].updatedAt = new Date().toISOString();
                
                // Update cache
                this.jobs.set(userEmail, userJobs);
                
                console.log(`✅ Job status updated: ${jobId} -> ${status}`);
                return true;
            }
            
            throw new Error('Job not found');
            
        } catch (error) {
            console.error('❌ Failed to update job status:', error);
            this.onError(error, 'Job Status Update Failed');
            return false;
        }
    }

    async updateJobProgress(jobId, progress, userEmail) {
        try {
            console.log(`🔄 Updating job ${jobId} progress to: ${progress}%`);
            
            // Validate progress
            if (progress < 0 || progress > 100) {
                throw new Error('Progress must be between 0 and 100');
            }
            
            // Update in cache
            const userJobs = this.jobs.get(userEmail) || [];
            const jobIndex = userJobs.findIndex(job => job.id === jobId);
            
            if (jobIndex !== -1) {
                userJobs[jobIndex].progress = progress;
                userJobs[jobIndex].updatedAt = new Date().toISOString();
                
                // Auto-update status based on progress
                if (progress === 100) {
                    userJobs[jobIndex].status = 'completed';
                } else if (progress > 0) {
                    userJobs[jobIndex].status = 'active';
                }
                
                // Update cache
                this.jobs.set(userEmail, userJobs);
                
                console.log(`✅ Job progress updated: ${jobId} -> ${progress}%`);
                return true;
            }
            
            throw new Error('Job not found');
            
        } catch (error) {
            console.error('❌ Failed to update job progress:', error);
            this.onError(error, 'Job Progress Update Failed');
            return false;
        }
    }

    // ==================== JOB FILTERING AND SEARCH ====================

    async getJobsByStatus(userEmail, status) {
        try {
            const allJobs = await this.getUserJobs(userEmail);
            return allJobs.filter(job => job.status === status);
        } catch (error) {
            console.error('❌ Failed to get jobs by status:', error);
            return [];
        }
    }

    async getJobsByType(userEmail, projectType) {
        try {
            const allJobs = await this.getUserJobs(userEmail);
            return allJobs.filter(job => job.projectType === projectType);
        } catch (error) {
            console.error('❌ Failed to get jobs by type:', error);
            return [];
        }
    }

    async searchJobs(userEmail, query) {
        try {
            const allJobs = await this.getUserJobs(userEmail);
            const searchText = query.toLowerCase();
            
            return allJobs.filter(job => 
                job.title.toLowerCase().includes(searchText) ||
                job.role.toLowerCase().includes(searchText) ||
                job.description.toLowerCase().includes(searchText) ||
                job.location.toLowerCase().includes(searchText)
            );
        } catch (error) {
            console.error('❌ Failed to search jobs:', error);
            return [];
        }
    }

    // ==================== JOB STATISTICS ====================

    async getJobStats(userEmail) {
        try {
            const allJobs = await this.getUserJobs(userEmail);
            
            const stats = {
                totalJobs: allJobs.length,
                upcomingJobs: allJobs.filter(job => job.status === 'upcoming').length,
                activeJobs: allJobs.filter(job => job.status === 'active').length,
                completedJobs: allJobs.filter(job => job.status === 'completed').length,
                cancelledJobs: allJobs.filter(job => job.status === 'cancelled').length,
                onHoldJobs: allJobs.filter(job => job.status === 'on-hold').length,
                totalEarnings: this.calculateTotalEarnings(allJobs),
                averageRate: this.calculateAverageRate(allJobs),
                totalHours: this.calculateTotalHours(allJobs),
                projectTypes: this.getProjectTypeBreakdown(allJobs),
                statusBreakdown: this.getStatusBreakdown(allJobs)
            };
            
            return stats;
            
        } catch (error) {
            console.error('❌ Failed to get job stats:', error);
            this.onError(error, 'Job Statistics Failed');
            return null;
        }
    }

    calculateTotalEarnings(jobs) {
        try {
            return jobs
                .filter(job => job.earnings)
                .reduce((sum, job) => sum + (parseFloat(job.earnings) || 0), 0);
        } catch (error) {
            console.warn('⚠️ Failed to calculate total earnings:', error);
            return 0;
        }
    }

    calculateAverageRate(jobs) {
        try {
            const rates = jobs
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

    calculateTotalHours(jobs) {
        try {
            return jobs
                .filter(job => job.actualHours)
                .reduce((sum, job) => sum + (parseFloat(job.actualHours) || 0), 0);
        } catch (error) {
            console.warn('⚠️ Failed to calculate total hours:', error);
            return 0;
        }
    }

    getProjectTypeBreakdown(jobs) {
        try {
            const breakdown = {};
            jobs.forEach(job => {
                const type = job.projectType || 'Unknown';
                breakdown[type] = (breakdown[type] || 0) + 1;
            });
            return breakdown;
        } catch (error) {
            console.warn('⚠️ Failed to get project type breakdown:', error);
            return {};
        }
    }

    getStatusBreakdown(jobs) {
        try {
            const breakdown = {};
            this.jobStatuses.forEach(status => {
                breakdown[status] = jobs.filter(job => job.status === status).length;
            });
            return breakdown;
        } catch (error) {
            console.warn('⚠️ Failed to get status breakdown:', error);
            return {};
        }
    }

    // ==================== JOB VALIDATION ====================

    validateJob(jobData) {
        try {
            const required = ['title', 'role', 'status'];
            const missing = required.filter(field => !jobData[field]);
            
            if (missing.length > 0) {
                throw new Error(`Missing required job fields: ${missing.join(', ')}`);
            }
            
            // Validate status
            if (!this.jobStatuses.includes(jobData.status)) {
                throw new Error(`Invalid job status: ${jobData.status}`);
            }
            
            // Validate progress if provided
            if (jobData.progress !== undefined) {
                if (jobData.progress < 0 || jobData.progress > 100) {
                    throw new Error('Job progress must be between 0 and 100');
                }
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Job validation failed:', error);
            throw error;
        }
    }

    // ==================== PUBLIC API ====================

    getJob(userEmail, jobId) {
        try {
            const userJobs = this.jobs.get(userEmail) || [];
            return userJobs.find(job => job.id === jobId);
        } catch (error) {
            console.warn('⚠️ Failed to get job:', error);
            return null;
        }
    }

    getJobCount(userEmail) {
        try {
            const userJobs = this.jobs.get(userEmail) || [];
            return userJobs.length;
        } catch (error) {
            console.warn('⚠️ Failed to get job count:', error);
            return 0;
        }
    }

    getAvailableStatuses() {
        return [...this.jobStatuses];
    }

    clearCache() {
        try {
            this.jobs.clear();
            console.log('✅ Job cache cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear job cache:', error);
        }
    }

    // ==================== STATIC UTILITIES ====================

    static formatJobStatus(status) {
        try {
            if (!status) return 'Unknown';
            
            const statusMap = {
                'upcoming': 'Upcoming',
                'active': 'Active',
                'completed': 'Completed',
                'cancelled': 'Cancelled',
                'on-hold': 'On Hold'
            };
            
            return statusMap[status] || status;
            
        } catch (error) {
            return 'Unknown';
        }
    }

    static formatJobPriority(priority) {
        try {
            if (!priority) return 'Normal';
            
            const priorityMap = {
                'low': 'Low',
                'normal': 'Normal',
                'high': 'High',
                'urgent': 'Urgent'
            };
            
            return priorityMap[priority] || priority;
            
        } catch (error) {
            return 'Normal';
        }
    }

    static formatJobDate(dateString) {
        try {
            if (!dateString) return 'Not specified';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            return date.toLocaleDateString();
            
        } catch (error) {
            return 'Invalid date';
        }
    }

    static calculateJobDuration(startDate, endDate) {
        try {
            if (!startDate || !endDate) return 'Duration not specified';
            
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return 'Invalid dates';
            }
            
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return '1 day';
            if (diffDays < 7) return `${diffDays} days`;
            if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
            if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
            
            return `${Math.ceil(diffDays / 365)} years`;
            
        } catch (error) {
            return 'Duration calculation failed';
        }
    }
}

// ==================== DEFAULT EXPORT ====================

export default JobManager;
