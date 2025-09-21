/**
 * Job Manager Module
 * Handles job data CRUD operations and management
 */

const JobManager = {
    // Job data state
    state: {
        jobs: [],
        isLoading: false,
        filters: {
            status: 'all',
            type: 'all',
            location: 'all'
        },
        sortBy: 'date',
        sortOrder: 'desc'
    },

    // Initialize job manager
    async init() {
        try {
            console.log('📋 Initializing Job Manager...');
            
            // Wait for component library to be ready
            if (window.ComponentLibrary && !window.ComponentLibrary.isReady()) {
                await new Promise(resolve => {
                    window.addEventListener('componentLibraryReady', resolve, { once: true });
                });
            }
            
            // Load initial job data
            await this.loadJobs();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup real-time updates
            this.setupRealTimeUpdates();
            
            console.log('✅ Job Manager initialized');
            
        } catch (error) {
            console.error('❌ Job Manager initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'job-manager-init');
            }
        }
    },

    // Load jobs (Firestore only)
    async loadJobs() {
        try {
            this.state.isLoading = true;
            if (window.LoadingManager) {
                window.LoadingManager.show('Loading jobs...');
            }
            if (window.FirestoreDataManager && typeof window.FirestoreDataManager.isAvailable === 'function' && window.FirestoreDataManager.isAvailable()) {
                const listings = await window.FirestoreDataManager.getJobListings();
                this.state.jobs = Array.isArray(listings) ? listings : [];
                console.log(`✅ Loaded ${this.state.jobs.length} jobs (Firestore)`);
            } else {
                this.state.jobs = [];
                console.warn('⚠️ Firestore unavailable; skipping API fallback');
            }
        } catch (error) {
            console.error('❌ Error loading jobs:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error('Failed to load jobs', {
                    title: 'Load Error',
                    details: error.message
                });
            }
            this.state.jobs = [];
        } finally {
            this.state.isLoading = false;
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Create new job
    async createJob(jobData) {
        try {
            console.log('🆕 Creating new job:', jobData.title);
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Creating job...');
            }
            
            // Validate job data
            if (!this.validateJobData(jobData)) {
                return false;
            }
            
            // Create job object
            const newJob = {
                title: jobData.title,
                date: jobData.date,
                location: jobData.location,
                pay: jobData.pay,
                type: jobData.type,
                description: jobData.description,
                status: jobData.status || 'Active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Persist to Firestore
            let jobId = jobData.id || `job-${(jobData.title || 'job').toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setJobListing(jobId, newJob);
            }
            // Add to jobs array with id
            this.state.jobs.push({ id: jobId, ...newJob });
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `Job "${newJob.title}" created successfully!`,
                    { title: 'Job Created' }
                );
            }
            
            // Trigger job created event
            this.triggerEvent('job:created', { job: newJob });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error creating job:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to create job: ${error.message}`,
                    { title: 'Creation Failed' }
                );
            }
            return false;
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Update existing job
    async updateJob(jobIndex, updates) {
        try {
            console.log('✏️ Updating job:', this.state.jobs[jobIndex]?.title);
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Updating job...');
            }
            
            if (jobIndex < 0 || jobIndex >= this.state.jobs.length) {
                throw new Error('Job index out of range');
            }
            
            // Update job data (local)
            this.state.jobs[jobIndex] = {
                ...this.state.jobs[jobIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            // Persist to Firestore
            const jobId = this.state.jobs[jobIndex].id;
            if (jobId && window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                const { id, ...payload } = this.state.jobs[jobIndex];
                await window.FirestoreDataManager.setJobListing(jobId, payload);
            }
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `Job "${this.state.jobs[jobIndex].title}" updated successfully!`,
                    { title: 'Job Updated' }
                );
            }
            
            // Trigger job updated event
            this.triggerEvent('job:updated', { 
                jobIndex, 
                job: this.state.jobs[jobIndex] 
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error updating job:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to update job: ${error.message}`,
                    { title: 'Update Failed' }
                );
            }
            return false;
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Delete job
    async deleteJob(jobIndex) {
        try {
            if (!confirm('Are you sure you want to delete this job?')) {
                return false;
            }
            
            console.log('🗑️ Deleting job:', this.state.jobs[jobIndex]?.title);
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Deleting job...');
            }
            
            if (jobIndex < 0 || jobIndex >= this.state.jobs.length) {
                throw new Error('Job index out of range');
            }
            
            const removedJob = this.state.jobs[jobIndex];
            
            // Persist to Firestore
            const jobId = removedJob && removedJob.id;
            if (jobId && window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.deleteJobListing(jobId);
            }
            // Remove from jobs array
            this.state.jobs.splice(jobIndex, 1);
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `Job "${removedJob.title}" deleted successfully!`,
                    { title: 'Job Deleted' }
                );
            }
            
            // Trigger job deleted event
            this.triggerEvent('job:deleted', { job: removedJob, jobIndex });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting job:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to delete job: ${error.message}`,
                    { title: 'Deletion Failed' }
                );
            }
            return false;
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Duplicate job
    async duplicateJob(jobIndex) {
        try {
            console.log('📋 Duplicating job:', this.state.jobs[jobIndex]?.title);
            
            if (jobIndex < 0 || jobIndex >= this.state.jobs.length) {
                throw new Error('Job index out of range');
            }
            
            const originalJob = this.state.jobs[jobIndex];
            const newJob = {
                ...originalJob,
                title: `${originalJob.title} (Copy)`,
                status: 'Active',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Persist to Firestore
            const jobId = `job-${(newJob.title || 'job').toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                const { id, ...payload } = newJob;
                await window.FirestoreDataManager.setJobListing(jobId, payload);
            }
            // Add to jobs array with id
            this.state.jobs.push({ id: jobId, ...newJob });
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `Job "${newJob.title}" duplicated successfully!`,
                    { title: 'Job Duplicated' }
                );
            }
            
            // Trigger job created event
            this.triggerEvent('job:created', { job: newJob });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error duplicating job:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to duplicate job: ${error.message}`,
                    { title: 'Duplication Failed' }
                );
            }
            return false;
        }
    },

    // Get job by index
    getJob(jobIndex) {
        if (jobIndex >= 0 && jobIndex < this.state.jobs.length) {
            return this.state.jobs[jobIndex];
        }
        return null;
    },

    // Get all jobs
    getAllJobs() {
        return [...this.state.jobs];
    },

    // Get active jobs
    getActiveJobs() {
        return this.state.jobs.filter(job => job.status === 'Active');
    },

    // Get jobs by status
    getJobsByStatus(status) {
        return this.state.jobs.filter(job => job.status === status);
    },

    // Get jobs by type
    getJobsByType(type) {
        return this.state.jobs.filter(job => job.type === type);
    },

    // Get jobs by location
    getJobsByLocation(location) {
        return this.state.jobs.filter(job => job.location === location);
    },

    // Filter jobs by criteria
    filterJobs(criteria = {}) {
        return this.state.jobs.filter(job => {
            // Status filter
            if (criteria.status && criteria.status !== 'all') {
                if (job.status !== criteria.status) return false;
            }
            
            // Type filter
            if (criteria.type && criteria.type !== 'all') {
                if (job.type !== criteria.type) return false;
            }
            
            // Location filter
            if (criteria.location && criteria.location !== 'all') {
                if (job.location !== criteria.location) return false;
            }
            
            // Date range filter
            if (criteria.startDate && criteria.endDate) {
                const jobDate = new Date(job.date);
                const startDate = new Date(criteria.startDate);
                const endDate = new Date(criteria.endDate);
                if (jobDate < startDate || jobDate > endDate) return false;
            }
            
            // Search query
            if (criteria.searchQuery) {
                const query = criteria.searchQuery.toLowerCase();
                const matches = job.title.toLowerCase().includes(query) ||
                              job.description.toLowerCase().includes(query) ||
                              job.location.toLowerCase().includes(query) ||
                              job.type.toLowerCase().includes(query);
                if (!matches) return false;
            }
            
            return true;
        });
    },

    // Search jobs
    searchJobs(query) {
        if (!query || query.trim() === '') {
            return this.state.jobs;
        }
        
        const searchTerm = query.toLowerCase().trim();
        
        return this.state.jobs.filter(job => {
            return job.title.toLowerCase().includes(searchTerm) ||
                   job.description.toLowerCase().includes(searchTerm) ||
                   job.location.toLowerCase().includes(searchTerm) ||
                   job.type.toLowerCase().includes(searchTerm) ||
                   job.pay.toLowerCase().includes(searchTerm);
        });
    },

    // Sort jobs
    sortJobs(jobs = null, sortBy = null, sortOrder = null) {
        const jobsToSort = jobs || this.state.jobs;
        const sortField = sortBy || this.state.sortBy;
        const order = sortOrder || this.state.sortOrder;
        
        return [...jobsToSort].sort((a, b) => {
            let aValue, bValue;
            
            switch (sortField) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'date':
                    aValue = new Date(a.date || '1970-01-01');
                    bValue = new Date(b.date || '1970-01-01');
                    break;
                case 'location':
                    aValue = a.location.toLowerCase();
                    bValue = b.location.toLowerCase();
                    break;
                case 'type':
                    aValue = a.type.toLowerCase();
                    bValue = b.type.toLowerCase();
                    break;
                case 'status':
                    aValue = a.status.toLowerCase();
                    bValue = b.status.toLowerCase();
                    break;
                case 'pay':
                    aValue = parseFloat(a.pay.replace(/[^0-9.]/g, '')) || 0;
                    bValue = parseFloat(b.pay.replace(/[^0-9.]/g, '')) || 0;
                    break;
                default:
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
            }
            
            if (order === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    },

    // Validate job data
    validateJobData(jobData) {
        const errors = [];
        
        if (!jobData.title?.trim()) {
            errors.push('Job title is required');
        }
        if (!jobData.location?.trim()) {
            errors.push('Location is required');
        }
        if (!jobData.type?.trim()) {
            errors.push('Job type is required');
        }
        
        if (errors.length > 0) {
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Please fix the following errors:\n${errors.join('\n')}`,
                    { title: 'Validation Error', duration: 8000 }
                );
            }
            return false;
        }
        
        return true;
    },

    // Assign jobs to users
    async assignJobsToUsers() {
        try {
            if (!window.UserManager) {
                throw new Error('User Manager not available');
            }
            
            if (this.state.jobs.length === 0) {
                throw new Error('No jobs available to assign');
            }
            
            const users = window.UserManager.getActiveUsers();
            if (Object.keys(users).length === 0) {
                throw new Error('No users available to assign jobs to');
            }
            
            // Create modal for job assignment
            this.showJobAssignmentModal();
            
        } catch (error) {
            console.error('❌ Error setting up job assignment:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to setup job assignment: ${error.message}`,
                    { title: 'Assignment Error' }
                );
            }
        }
    },

    // Show job assignment modal
    showJobAssignmentModal() {
        const modal = document.createElement('div');
        modal.id = 'jobAssignmentModal';
        modal.className = 'modal-overlay';
        
        const jobsHTML = this.state.jobs.map((job, index) => `
            <div class="job-assignment-item">
                <h4>${job.title}</h4>
                <div class="job-details">
                    <div>📅 ${job.date || 'No date'}</div>
                    <div>📍 ${job.location || 'No location'}</div>
                    <div>💰 ${job.pay || 'No pay rate'}</div>
                </div>
                <select id="job-${index}-user" class="user-select">
                    <option value="">Select a user...</option>
                    ${Object.keys(window.UserManager.getActiveUsers()).map(userName => 
                        `<option value="${userName}">${userName}</option>`
                    ).join('')}
                </select>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎯 Assign Jobs to Users</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="modal-body">
                    <p>Select users for each job below. Users will be assigned to jobs based on their roles and availability.</p>
                    <div class="job-assignments">
                        ${jobsHTML}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="JobManager.processJobAssignments()">
                        ✅ Assign Jobs
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    },

    // Process job assignments
    async processJobAssignments() {
        try {
            const assignments = [];
            let assignedCount = 0;
            
            this.state.jobs.forEach((job, index) => {
                const selectElement = document.getElementById(`job-${index}-user`);
                const selectedUser = selectElement.value;
                
                if (selectedUser) {
                    assignments.push({ job, jobIndex: index, user: selectedUser });
                    assignedCount++;
                }
            });
            
            if (assignedCount === 0) {
                if (window.NotificationManager) {
                    window.NotificationManager.warning(
                        'Please select at least one user for job assignment',
                        { title: 'No Assignments' }
                    );
                }
                return;
            }
            
            // Process assignments
            for (const assignment of assignments) {
                const userName = assignment.user;
                const job = assignment.job;
                const jobIndex = assignment.jobIndex;
                
                if (window.UserManager) {
                    const user = window.UserManager.getUser(userName);
                    if (user) {
                        // Initialize jobs object if it doesn't exist
                        if (!user.jobs) {
                            user.jobs = {};
                        }
                        
                        const jobId = `job-${job.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
                        user.jobs[jobId] = {
                            id: jobId,
                            title: job.title,
                            date: job.date,
                            location: job.location,
                            rate: job.pay,
                            description: job.description,
                            listingStatus: job.status,
                            status: 'upcoming',
                            projectStatus: 'upcoming',
                            paymentStatus: 'pending',
                            assignedDate: new Date().toISOString().split('T')[0],
                            jobRef: { source: 'jobs-data', index: jobIndex, key: `${job.title}|${job.date}` }
                        };
                        
                        // Set as primary job if user doesn't have one
                        if (!user.primaryJob) {
                            user.primaryJob = jobId;
                        }
                    }
                }
            }
            
            // Update users on GitHub
            if (window.UserManager) {
                await window.UserManager.updateUsersOnGitHub('job-assignment', 'multiple');
            }
            
            // Close modal
            const modal = document.getElementById('jobAssignmentModal');
            if (modal) {
                modal.remove();
            }
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `Successfully assigned ${assignedCount} job(s) to users`,
                    { title: 'Assignments Complete' }
                );
            }
            
            // Trigger job assignment event
            this.triggerEvent('jobs:assigned', { assignments });
            
        } catch (error) {
            console.error('❌ Error processing job assignments:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to process job assignments: ${error.message}`,
                    { title: 'Assignment Failed' }
                );
            }
        }
    },

    // Update jobs-data.json on GitHub
    async updateJobsOnGitHub(action = 'update', jobTitle = '') {
        try {
            console.log('🔄 Updating jobs-data.json on GitHub...');
            
            const jobsPayload = {
                jobs: this.state.jobs,
                lastUpdated: new Date().toISOString().split('T')[0],
                totalJobs: this.state.jobs.length
            };
            
            // Get current SHA if exists
            let sha = null;
            try {
                const getRes = await fetch('/api/github/file/jobs-data.json');
                if (getRes.ok) {
                    const j = await getRes.json();
                    sha = j.sha || null;
                }
            } catch (_) {}
            
            const body = { 
                content: JSON.stringify(jobsPayload, null, 2), 
                message: `Update jobs-data.json - ${action} ${jobTitle} - ${new Date().toLocaleString()}` 
            };
            if (sha) body.sha = sha;
            
            const res = await fetch('/api/github/file/jobs-data.json', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (res.ok) {
                console.log('✅ jobs-data.json updated on GitHub');
                return true;
            }
            
            const err = await res.json().catch(() => ({}));
            console.warn('❌ Failed to update jobs-data.json', err);
            return false;
            
        } catch (e) {
            console.error('❌ Error updating jobs-data.json:', e);
            return false;
        }
    },

    // Get job statistics
    getJobStats() {
        const stats = {
            total: this.state.jobs.length,
            active: this.state.jobs.filter(job => job.status === 'Active').length,
            pending: this.state.jobs.filter(job => job.status === 'Pending').length,
            completed: this.state.jobs.filter(job => job.status === 'Completed').length,
            cancelled: this.state.jobs.filter(job => job.status === 'Cancelled').length
        };
        
        // Type breakdown
        const typeBreakdown = {};
        this.state.jobs.forEach(job => {
            const type = job.type || 'Other';
            typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
        });
        stats.typeBreakdown = typeBreakdown;
        
        // Location breakdown
        const locationBreakdown = {};
        this.state.jobs.forEach(job => {
            const location = job.location || 'Unknown';
            locationBreakdown[location] = (locationBreakdown[location] || 0) + 1;
        });
        stats.locationBreakdown = locationBreakdown;
        
        return stats;
    },

    // Export job data
    exportJobData() {
        const data = {
            jobs: this.state.jobs,
            lastUpdated: new Date().toISOString().split('T')[0],
            totalJobs: this.state.jobs.length
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jobs-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        if (window.NotificationManager) {
            window.NotificationManager.success(
                'Job data exported successfully',
                { title: 'Export Complete' }
            );
        }
    },

    // Bulk update job status
    async bulkUpdateStatus(newStatus, jobIndices) {
        try {
            if (jobIndices.length === 0) {
                if (window.NotificationManager) {
                    window.NotificationManager.warning(
                        'Please select jobs to update',
                        { title: 'No Jobs Selected' }
                    );
                }
                return false;
            }
            
            let updatedCount = 0;
            
            for (const index of jobIndices) {
                if (index >= 0 && index < this.state.jobs.length) {
                    this.state.jobs[index].status = newStatus;
                    this.state.jobs[index].updatedAt = new Date().toISOString();
                    updatedCount++;
                }
            }
            
            if (updatedCount > 0) {
                // Persist to Firestore
                if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                    for (const index of jobIndices) {
                        const job = this.state.jobs[index];
                        if (job && job.id) {
                            const { id, ...payload } = job;
                            await window.FirestoreDataManager.setJobListing(job.id, payload);
                        }
                    }
                }
                
                if (window.NotificationManager) {
                    window.NotificationManager.success(
                        `${updatedCount} jobs updated to ${newStatus}`,
                        { title: 'Bulk Update Complete' }
                    );
                }
                
                // Trigger jobs updated event
                this.triggerEvent('jobs:bulk-updated', { 
                    count: updatedCount, 
                    newStatus 
                });
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error bulk updating jobs:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to bulk update jobs: ${error.message}`,
                    { title: 'Bulk Update Failed' }
                );
            }
            return false;
        }
    },

    // Bulk delete jobs
    async bulkDeleteJobs(jobIndices) {
        try {
            if (jobIndices.length === 0) {
                if (window.NotificationManager) {
                    window.NotificationManager.warning(
                        'Please select jobs to delete',
                        { title: 'No Jobs Selected' }
                    );
                }
                return false;
            }
            
            if (!confirm(`Are you sure you want to delete ${jobIndices.length} jobs?`)) {
                return false;
            }
            
            // Sort indices in descending order to avoid shifting issues
            const sortedIndices = [...jobIndices].sort((a, b) => b - a);
            const deletedJobs = [];
            
            for (const index of sortedIndices) {
                if (index >= 0 && index < this.state.jobs.length) {
                    deletedJobs.push(this.state.jobs[index]);
                    this.state.jobs.splice(index, 1);
                }
            }
            
            if (deletedJobs.length > 0) {
                // Persist to Firestore
                if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                    for (const job of deletedJobs) {
                        if (job && job.id) {
                            await window.FirestoreDataManager.deleteJobListing(job.id);
                        }
                    }
                }
                
                if (window.NotificationManager) {
                    window.NotificationManager.success(
                        `${deletedJobs.length} jobs deleted successfully`,
                        { title: 'Bulk Delete Complete' }
                    );
                }
                
                // Trigger jobs deleted event
                this.triggerEvent('jobs:bulk-deleted', { 
                    count: deletedJobs.length, 
                    jobs: deletedJobs 
                });
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('❌ Error bulk deleting jobs:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to bulk delete jobs: ${error.message}`,
                    { title: 'Bulk Delete Failed' }
                );
            }
            return false;
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for job-related events
        document.addEventListener('job:create', (e) => {
            this.createJob(e.detail);
        });
        
        document.addEventListener('job:update', (e) => {
            this.updateJob(e.detail.jobIndex, e.detail.updates);
        });
        
        document.addEventListener('job:delete', (e) => {
            this.deleteJob(e.detail.jobIndex);
        });
        
        document.addEventListener('job:duplicate', (e) => {
            this.duplicateJob(e.detail.jobIndex);
        });
    },

    // Setup real-time updates
    setupRealTimeUpdates() {
        // Poll for updates every 30 seconds
        setInterval(async () => {
            try {
                await this.loadJobs();
                // Trigger update event for UI refresh
                this.triggerEvent('jobs:updated', { jobs: this.state.jobs });
            } catch (error) {
                console.warn('⚠️ Failed to refresh jobs:', error);
            }
        }, 30000);
    },

    // Trigger custom events
    triggerEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    },

    // Refresh jobs data
    async refreshJobs() {
        try {
            await this.loadJobs();
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    'Jobs data refreshed successfully',
                    { title: 'Refresh Complete' }
                );
            }
            
            // Trigger refresh event
            this.triggerEvent('jobs:refreshed', { jobs: this.state.jobs });
            
        } catch (error) {
            console.error('❌ Error refreshing jobs:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    'Failed to refresh jobs data',
                    { title: 'Refresh Error', details: error.message }
                );
            }
        }
    },

    // Get unique job types
    getUniqueJobTypes() {
        const types = new Set();
        this.state.jobs.forEach(job => {
            if (job.type) {
                types.add(job.type);
            }
        });
        return Array.from(types).sort();
    },

    // Get unique job locations
    getUniqueJobLocations() {
        const locations = new Set();
        this.state.jobs.forEach(job => {
            if (job.location) {
                locations.add(job.location);
            }
        });
        return Array.from(locations).sort();
    },

    // Get jobs by date range
    getJobsByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return this.state.jobs.filter(job => {
            if (!job.date) return false;
            const jobDate = new Date(job.date);
            return jobDate >= start && jobDate <= end;
        });
    },

    // Get upcoming jobs
    getUpcomingJobs(days = 30) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        
        return this.state.jobs.filter(job => {
            if (!job.date) return false;
            const jobDate = new Date(job.date);
            return jobDate >= today && jobDate <= futureDate;
        });
    },

    // Get overdue jobs
    getOverdueJobs() {
        const today = new Date();
        
        return this.state.jobs.filter(job => {
            if (!job.date) return false;
            const jobDate = new Date(job.date);
            return jobDate < today && job.status === 'Active';
        });
    }
};

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JobManager;
} else {
    window.JobManager = JobManager;
}
