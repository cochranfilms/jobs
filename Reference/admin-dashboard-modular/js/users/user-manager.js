/**
 * User Manager Module
 * Handles user data CRUD operations and management
 */

const UserManager = {
    // User data state
    state: {
        users: {},
        isLoading: false,
        currentUser: null,
        filters: {
            status: 'all',
            role: 'all',
            location: 'all'
        }
    },

    // Initialize user manager
    async init() {
        try {
            console.log('👥 Initializing User Manager...');
            
            // Wait for component library to be ready
            if (window.ComponentLibrary && !window.ComponentLibrary.isReady()) {
                await new Promise(resolve => {
                    window.addEventListener('componentLibraryReady', resolve, { once: true });
                });
            }
            
            // Load initial user data
            await this.loadUsers();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup real-time updates
            this.setupRealTimeUpdates();
            
            console.log('✅ User Manager initialized');
            
        } catch (error) {
            console.error('❌ User Manager initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'user-manager-init');
            }
        }
    },

    // Load users (Firestore only)
    async loadUsers() {
        try {
            this.state.isLoading = true;
            if (window.LoadingManager) {
                window.LoadingManager.show('Loading users...');
            }
            // Firestore only
            if (window.FirestoreDataManager && typeof window.FirestoreDataManager.isAvailable === 'function' && window.FirestoreDataManager.isAvailable()) {
                const users = await window.FirestoreDataManager.getUsers();
                this.state.users = users || {};
                console.log(`✅ Loaded ${Object.keys(this.state.users).length} users (Firestore)`);
            } else {
                this.state.users = {};
                console.warn('⚠️ Firestore unavailable; skipping API fallback');
            }
        } catch (error) {
            console.error('❌ Error loading users:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error('Failed to load users', {
                    title: 'Load Error',
                    details: error.message
                });
            }
            this.state.users = {};
        } finally {
            this.state.isLoading = false;
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Create new user
    async createUser(userData) {
        try {
            console.log('🆕 Creating new user:', userData.name);
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Creating user...');
            }
            
            // Validate user data
            if (!this.validateUserData(userData)) {
                throw new Error('Invalid user data');
            }
            
            // Create user object
            const newUser = {
                profile: {
                    email: userData.email,
                    role: userData.role,
                    location: userData.location,
                    rate: userData.rate,
                    projectType: userData.projectType || '',
                    approvedDate: userData.approvedDate,
                    projectDate: userData.projectDate
                },
                contract: {
                    contractUrl: userData.contractUrl || 'contract.html',
                    contractStatus: 'pending'
                },
                application: {
                    status: 'pending',
                    updatedAt: new Date().toISOString()
                }
            };
            
            // Assign jobs if specified
            if (userData.jobSelection) {
                const assignedJobs = await this.assignJobsToUser(userData.role, userData.location);
                newUser.jobs = assignedJobs.jobs;
                newUser.primaryJob = assignedJobs.primaryJob;
            }
            
            // Persist to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setUser(userData.name, newUser);
            }
            // Update local state
            this.state.users[userData.name] = newUser;

            // Create Firebase account
            await this.createFirebaseAccount(userData.email);
            
            // Send job acceptance email
            await this.sendJobAcceptanceEmail(userData.name, newUser);
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `User "${userData.name}" created successfully!`,
                    { title: 'User Created' }
                );
            }
            
            // Trigger user created event
            this.triggerEvent('user:created', { userName: userData.name, userData: newUser });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error creating user:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to create user: ${error.message}`,
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

    // Update existing user
    async updateUser(userName, updates) {
        try {
            console.log('✏️ Updating user:', userName);
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Updating user...');
            }
            
            if (!this.state.users[userName]) {
                throw new Error('User not found');
            }
            
            // Update user data (local)
            this.state.users[userName] = {
                ...this.state.users[userName],
                ...updates
            };
            
            // Persist to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setUser(userName, this.state.users[userName]);
            }
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `User "${userName}" updated successfully!`,
                    { title: 'User Updated' }
                );
            }
            
            // Trigger user updated event
            this.triggerEvent('user:updated', { userName, updates });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error updating user:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to update user: ${error.message}`,
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

    // Delete user
    async deleteUser(userName, isArchived = false) {
        try {
            if (!confirm(`Are you sure you want to permanently delete ${userName}? This cannot be undone.`)) {
                return false;
            }
            
            console.log('🗑️ Deleting user:', userName);
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Deleting user...');
            }
            
            // Determine if user is archived
            const isArchivedUser = isArchived || !!(this.state.users._archived && this.state.users._archived[userName]);
            const userData = isArchivedUser ? this.state.users._archived[userName] : this.state.users[userName];
            
            if (!userData) {
                throw new Error(`User ${userName} not found`);
            }
            
            // Cleanup PDF files
            await this.cleanupUserFiles(userData);
            
            // Delete Firebase account
            await this.deleteFirebaseAccount(userData.profile?.email);
            
            // Remove from users object
            if (isArchivedUser) {
                if (this.state.users._archived) {
                    delete this.state.users._archived[userName];
                }
            } else {
                delete this.state.users[userName];
            }
            
            // Persist deletion to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.deleteUser(userName);
            }
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `User "${userName}" deleted permanently!`,
                    { title: 'User Deleted' }
                );
            }
            
            // Trigger user deleted event
            this.triggerEvent('user:deleted', { userName, wasArchived: isArchivedUser });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to delete user: ${error.message}`,
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

    // Archive user
    async archiveUser(userName) {
        try {
            console.log('📦 Archiving user:', userName);
            
            if (!this.state.users[userName]) {
                throw new Error('User not found');
            }
            
            // Create archived users section if it doesn't exist
            if (!this.state.users._archived) {
                this.state.users._archived = {};
            }
            
            // Move user to archived section
            const archivedCopy = { ...this.state.users[userName] };
            archivedCopy.application = {
                ...(archivedCopy.application || {}),
                status: 'denied',
                updatedAt: new Date().toISOString()
            };
            
            this.state.users._archived[userName] = archivedCopy;
            delete this.state.users[userName];
            
            // Persist to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setUser(`_archived/${userName}`, archivedCopy);
                await window.FirestoreDataManager.deleteUser(userName);
            }
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `User "${userName}" archived successfully!`,
                    { title: 'User Archived' }
                );
            }
            
            // Trigger user archived event
            this.triggerEvent('user:archived', { userName, userData: archivedCopy });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error archiving user:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to archive user: ${error.message}`,
                    { title: 'Archive Failed' }
                );
            }
            return false;
        }
    },

    // Restore archived user
    async restoreUser(userName) {
        try {
            console.log('↩️ Restoring user:', userName);
            
            if (!this.state.users._archived || !this.state.users._archived[userName]) {
                throw new Error('Archived user not found');
            }
            
            // Restore user to active users
            const archived = this.state.users._archived[userName];
            this.state.users[userName] = archived;
            
            // Reset application status to pending
            this.state.users[userName].application = {
                ...(this.state.users[userName].application || {}),
                status: 'pending',
                updatedAt: new Date().toISOString()
            };
            
            // Remove from archived
            delete this.state.users._archived[userName];
            
            // Persist to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setUser(userName, this.state.users[userName]);
                // Optional: if archived stored under `_archived/<name>` path in Firestore, delete it here.
            }
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `User "${userName}" restored successfully!`,
                    { title: 'User Restored' }
                );
            }
            
            // Trigger user restored event
            this.triggerEvent('user:restored', { userName, userData: this.state.users[userName] });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error restoring user:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to restore user: ${error.message}`,
                    { title: 'Restore Failed' }
                );
            }
            return false;
        }
    },

    // Approve user application
    async approveUser(userName) {
        try {
            console.log('✅ Approving user:', userName);
            
            const userData = this.state.users[userName];
            if (!userData) {
                throw new Error('User not found');
            }
            
            // Update approval date and status
            if (!userData.profile.approvedDate) {
                userData.profile.approvedDate = new Date().toISOString().split('T')[0];
            }
            
            userData.application = {
                ...(userData.application || {}),
                status: 'approved',
                updatedAt: new Date().toISOString()
            };
            
            // Send job acceptance email
            await this.sendJobAcceptanceEmail(userName, userData);
            
            // Persist to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setUser(userName, userData);
            }
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `User "${userName}" approved successfully!`,
                    { title: 'User Approved' }
                );
            }
            
            // Trigger user approved event
            this.triggerEvent('user:approved', { userName, userData });
            
            return true;
            
        } catch (error) {
            console.error('❌ Error approving user:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to approve user: ${error.message}`,
                    { title: 'Approval Failed' }
                );
            }
            return false;
        }
    },

    // Deny user application
    async denyUser(userName) {
        try {
            console.log('⛔ Denying user:', userName);
            
            const userData = this.state.users[userName];
            if (!userData) {
                throw new Error('User not found');
            }
            
            // Send denial email
            await this.sendDenialEmail(userName, userData);
            
            // Archive the user
            await this.archiveUser(userName);
            
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `User "${userName}" denied and archived!`,
                    { title: 'User Denied' }
                );
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error denying user:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(
                    `Failed to deny user: ${error.message}`,
                    { title: 'Denial Failed' }
                );
            }
            return false;
        }
    },

    // Get user by name
    getUser(userName) {
        return this.state.users[userName] || null;
    },

    // Get all active users (excluding archived)
    getActiveUsers() {
        return Object.entries(this.state.users)
            .filter(([name]) => name !== '_archived' && !name.startsWith('_'))
            .reduce((acc, [name, data]) => {
                acc[name] = data;
                return acc;
            }, {});
    },

    // Get archived users
    getArchivedUsers() {
        return this.state.users._archived || {};
    },

    // Filter users by criteria
    filterUsers(criteria = {}) {
        const activeUsers = this.getActiveUsers();
        
        return Object.entries(activeUsers).filter(([name, user]) => {
            // Status filter
            if (criteria.status && criteria.status !== 'all') {
                if (criteria.status === 'pending' && user.application?.status !== 'pending') return false;
                if (criteria.status === 'approved' && user.application?.status !== 'approved') return false;
                if (criteria.status === 'signed' && user.contract?.contractStatus !== 'signed') return false;
            }
            
            // Role filter
            if (criteria.role && criteria.role !== 'all') {
                if (user.profile?.role !== criteria.role) return false;
            }
            
            // Location filter
            if (criteria.location && criteria.location !== 'all') {
                if (user.profile?.location !== criteria.location) return false;
            }
            
            return true;
        });
    },

    // Search users
    searchUsers(query) {
        if (!query || query.trim() === '') {
            return this.getActiveUsers();
        }
        
        const searchTerm = query.toLowerCase().trim();
        const activeUsers = this.getActiveUsers();
        
        return Object.entries(activeUsers).filter(([name, user]) => {
            return name.toLowerCase().includes(searchTerm) ||
                   user.profile?.email?.toLowerCase().includes(searchTerm) ||
                   user.profile?.role?.toLowerCase().includes(searchTerm) ||
                   user.profile?.location?.toLowerCase().includes(searchTerm);
        });
    },

    // Validate user data
    validateUserData(userData) {
        if (!userData.name?.trim()) {
            throw new Error('Name is required');
        }
        if (!userData.email?.trim()) {
            throw new Error('Email is required');
        }
        if (!userData.role?.trim()) {
            throw new Error('Role is required');
        }
        if (!userData.location?.trim()) {
            throw new Error('Location is required');
        }
        if (!userData.rate?.trim()) {
            throw new Error('Rate is required');
        }
        
        return true;
    },

    // Assign jobs to user based on role and location
    async assignJobsToUser(role, location) {
        try {
            // Load jobs data (Firestore first, fallback to JSON API)
            let jobsList = [];
            if (window.FirestoreDataManager && typeof window.FirestoreDataManager.isAvailable === 'function' && window.FirestoreDataManager.isAvailable()) {
                jobsList = await window.FirestoreDataManager.getJobListings();
            } else {
                const jobsResponse = await fetch('/api/jobs-data');
                const jobsData = await jobsResponse.json();
                jobsList = jobsData.jobs || [];
            }
            
            const assignedJobs = {};
            let primaryJob = null;
            
            // Match jobs based on role and location
            jobsList.forEach((job, idx) => {
                if (job.title.toLowerCase().includes(role.toLowerCase()) || 
                    role.toLowerCase().includes(job.title.toLowerCase())) {
                    
                    const jobId = `job-${job.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
                    
                    assignedJobs[jobId] = {
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
                        projectStart: 'TBD',
                        jobRef: { source: 'jobs', index: idx, key: `${job.title}|${job.date}` }
                    };
                    
                    if (!primaryJob) {
                        primaryJob = jobId;
                    }
                }
            });
            
            // Create default job if no matches
            if (Object.keys(assignedJobs).length === 0) {
                const defaultJobId = `job-${role.toLowerCase().replace(/\s+/g, '-')}-default`;
                
                assignedJobs[defaultJobId] = {
                    id: defaultJobId,
                    title: `${role} Position`,
                    date: new Date().toISOString().split('T')[0],
                    location: location,
                    rate: '$200',
                    description: `Professional ${role} position in ${location}. Details to be provided.`,
                    status: 'upcoming',
                    projectStatus: 'upcoming',
                    paymentStatus: 'pending',
                    assignedDate: new Date().toISOString().split('T')[0],
                    projectStart: 'TBD'
                };
                
                primaryJob = defaultJobId;
            }
            
            return { jobs: assignedJobs, primaryJob };
            
        } catch (error) {
            console.error('❌ Error assigning jobs to user:', error);
            
            // Fallback: create a default job
            const defaultJobId = `job-${role.toLowerCase().replace(/\s+/g, '-')}-fallback`;
            const defaultJob = {
                id: defaultJobId,
                title: `${role} Position`,
                date: new Date().toISOString().split('T')[0],
                location: location,
                rate: '$200',
                description: `Professional ${role} position in ${location}. Details to be provided.`,
                status: 'upcoming',
                projectStatus: 'upcoming',
                paymentStatus: 'pending',
                assignedDate: new Date().toISOString().split('T')[0],
                projectStart: 'TBD'
            };
            
            return {
                jobs: { [defaultJobId]: defaultJob },
                primaryJob: defaultJobId
            };
        }
    },

    // Update users.json on GitHub
    async updateUsersOnGitHub(action = 'update', userName = '') {
        try {
            console.log('🔄 Updating users.json on GitHub...');
            
            // Count performance reviews
            let totalReviews = 0;
            for (const user of Object.values(this.state.users)) {
                if (user.performance) {
                    totalReviews++;
                }
            }
            
            const usersData = {
                users: this.state.users,
                statusOptions: {
                    projectStatus: ["upcoming", "in-progress", "completed", "cancelled"],
                    paymentStatus: ["pending", "processing", "paid", "overdue"]
                },
                lastUpdated: new Date().toISOString().split('T')[0],
                totalUsers: Object.keys(this.state.users).length,
                system: {
                    totalReviews: totalReviews,
                    lastUpdated: new Date().toISOString().split('T')[0]
                }
            };
            
            // Get current file SHA
            const getResponse = await fetch('/api/github/file/users.json');
            let sha = null;
            
            if (getResponse.ok) {
                const fileData = await getResponse.json();
                sha = fileData.sha;
            }
            
            const updateBody = {
                content: JSON.stringify(usersData, null, 2),
                message: `Update users.json - ${action} ${userName} - ${new Date().toLocaleString()}`
            };
            
            if (sha) {
                updateBody.sha = sha;
            }
            
            const response = await fetch('/api/github/file/users.json', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateBody)
            });
            
            if (response.ok) {
                console.log('✅ users.json updated on GitHub successfully');
                return true;
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`GitHub API error: ${errorData.error || 'Unknown error'}`);
            }
            
        } catch (error) {
            console.error('❌ Error updating users.json on GitHub:', error);
            throw error;
        }
    },

    // Create Firebase account
    async createFirebaseAccount(email, password = null) {
        try {
            if (!password) {
                password = this.generateTempPassword();
            }
            
            const res = await fetch('/api/firebase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const json = await res.json();
            if (res.ok && json.success) {
                console.log('✅ Firebase account created for:', email);
                return { success: true, uid: json.localId };
            }
            
            return { success: false, error: json.error || 'Failed to create user' };
            
        } catch (error) {
            console.error('❌ Error creating Firebase account:', error);
            return { success: false, error: error.message };
        }
    },

    // Delete Firebase account
    async deleteFirebaseAccount(email) {
        try {
            const response = await fetch('/api/firebase', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            if (response.ok) {
                const result = await response.json();
                return result;
            } else {
                const error = await response.json();
                return { success: false, error: error.message };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // Generate temporary password
    generateTempPassword() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    },

    // Send job acceptance email
    async sendJobAcceptanceEmail(userName, userData, options = {}) {
        try {
            if (!window.EmailJSConfig || !window.EmailJSConfig.isAvailable()) {
                console.warn('⚠️ EmailJS not available, skipping email');
                return;
            }
            
            const preferredJob = (options && options.jobKey && userData?.jobs?.[options.jobKey])
                || (userData?.primaryJob && userData?.jobs?.[userData.primaryJob])
                || (userData?.jobs && Object.values(userData.jobs)[0])
                || null;

            const projectStart = userData?.application?.eventDate 
                || (preferredJob && preferredJob.date)
                || userData?.profile?.projectDate
                || 'TBD';
                
            const jobTitle = (preferredJob && (preferredJob.title || preferredJob.jobTitle))
                || userData?.application?.jobTitle
                || userData?.profile?.role
                || 'Contractor';
                
            let rate = 'Rate to be determined';
            if (preferredJob && preferredJob.rate) { rate = preferredJob.rate; }
            else if (preferredJob && preferredJob.pay) { rate = preferredJob.pay; }
            
            const emailParams = {
                freelancer_name: userName || 'User',
                role: userData.profile.role || jobTitle || 'Contractor',
                location: userData.profile.location || 'Atlanta Area',
                rate: rate,
                project_start: projectStart,
                job: jobTitle,
                contract_id: 'Will be generated when you sign the contract'
            };
            
            await window.EmailJSConfig.sendEmail(
                'template_job_acceptance',
                emailParams
            );
            
            console.log('✅ Job acceptance email sent to:', userData.profile.email);
            
        } catch (error) {
            console.error('❌ Error sending job acceptance email:', error);
        }
    },

    // Send denial email
    async sendDenialEmail(userName, userData) {
        try {
            if (!window.EmailJSConfig || !window.EmailJSConfig.isAvailable()) {
                console.warn('⚠️ EmailJS not available, skipping email');
                return;
            }
            
            const primaryJobId = userData.primaryJob;
            const job = primaryJobId && userData.jobs ? userData.jobs[primaryJobId] : null;
            const jobTitle = userData?.application?.jobTitle || job?.title || 'a Cochran Films role';
            const projectStart = job?.date || userData?.profile?.projectDate || 'TBD';
            
            const params = {
                to_email: userData.profile.email,
                freelancer_name: userName,
                job: jobTitle,
                project_start: projectStart,
                to_name: userName,
                reply_to: 'info@cochranfilms.com',
                from_name: 'Cochran Films Admin'
            };
            
            await window.EmailJSConfig.sendEmail(
                'template_jobs_closed',
                params
            );
            
            console.log('✅ Denial email sent to:', userData.profile.email);
            
        } catch (error) {
            console.error('❌ Error sending denial email:', error);
        }
    },

    // Cleanup user files
    async cleanupUserFiles(userData) {
        try {
            const contract = userData.contract || {};
            if (contract.fileName || contract.contractId) {
                const fileName = contract.fileName;
                const method = fileName ? 'DELETE' : 'POST';
                const body = fileName ? { filename: fileName } : { contractId: contract.contractId };
                
                const deletePdfResponse = await fetch('/api/delete-pdf', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });
                
                if (deletePdfResponse.ok) {
                    console.log('✅ PDF file cleaned up successfully');
                } else {
                    console.warn('⚠️ PDF cleanup failed:', deletePdfResponse.status);
                }
            }
        } catch (error) {
            console.warn('⚠️ PDF cleanup error:', error.message);
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for user-related events from other modules
        document.addEventListener('user:create', (e) => {
            this.createUser(e.detail);
        });
        
        document.addEventListener('user:update', (e) => {
            this.updateUser(e.detail.userName, e.detail.updates);
        });
        
        document.addEventListener('user:delete', (e) => {
            this.deleteUser(e.detail.userName, e.detail.isArchived);
        });
        
        document.addEventListener('user:approve', (e) => {
            this.approveUser(e.detail.userName);
        });
        
        document.addEventListener('user:deny', (e) => {
            this.denyUser(e.detail.userName);
        });
    },

    // Setup real-time updates
    setupRealTimeUpdates() {
        // Poll for updates every 30 seconds
        setInterval(async () => {
            try {
                await this.loadUsers();
                // Trigger update event for UI refresh
                this.triggerEvent('users:updated', { users: this.state.users });
            } catch (error) {
                console.warn('⚠️ Failed to refresh users:', error);
            }
        }, 30000);
    },

    // Trigger custom events
    triggerEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    },

    // Get user statistics
    getUserStats() {
        const activeUsers = this.getActiveUsers();
        const archivedUsers = this.getArchivedUsers();
        
        return {
            total: Object.keys(activeUsers).length,
            pending: Object.values(activeUsers).filter(u => u.application?.status === 'pending').length,
            approved: Object.values(activeUsers).filter(u => u.application?.status === 'approved').length,
            signed: Object.values(activeUsers).filter(u => u.contract?.contractStatus === 'signed').length,
            archived: Object.keys(archivedUsers).length
        };
    },

    // Export users data
    exportUsersData() {
        const data = {
            users: this.state.users,
            lastUpdated: new Date().toISOString().split('T')[0],
            totalUsers: Object.keys(this.state.users).length
        };
        
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // ==================== USER JOB MANAGEMENT (Admin) ====================
    
    // Update a user's job status (projectStatus + status)
    async updateUserJobStatus(userName, jobId, newStatus) {
        try {
            if (!userName || !jobId || !newStatus) {
                throw new Error('Missing userName, jobId, or newStatus');
            }
            const user = this.state.users[userName];
            if (!user) throw new Error(`User ${userName} not found`);
            if (!user.jobs || !user.jobs[jobId]) throw new Error(`Job ${jobId} not found for ${userName}`);

            // Normalize statuses between user portal and admin
            const normalized = String(newStatus).toLowerCase();
            const statusMap = {
                'upcoming': 'upcoming',
                'in-progress': 'in-progress',
                'in progress': 'in-progress',
                'active': 'in-progress',
                'completed': 'completed',
                'done': 'completed',
                'cancelled': 'cancelled',
                'canceled': 'cancelled',
                'on-hold': 'on-hold',
                'on hold': 'on-hold'
            };
            const mappedStatus = statusMap[normalized] || 'upcoming';

            user.jobs[jobId].projectStatus = mappedStatus;
            user.jobs[jobId].status = mappedStatus; // keep fields aligned
            user.jobs[jobId].updatedAt = new Date().toISOString();

            // Persist to Firestore
            try {
                if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                    await window.FirestoreDataManager.updateAssignmentStatus(userName, jobId, mappedStatus);
                }
            } catch (fsErr) {
                console.warn('⚠️ Firestore assignment update skipped:', fsErr?.message || fsErr);
            }

            // Notify
            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `Updated ${userName}'s job to ${mappedStatus}`,
                    { title: 'Job Status Updated' }
                );
            }
            this.triggerEvent('user:job-status-updated', { userName, jobId, status: mappedStatus });
            return true;
        } catch (error) {
            console.error('❌ Error updating user job status:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(`Failed to update job status: ${error.message}`, { title: 'Update Failed' });
            }
            return false;
        }
    },

    // Update a user's job progress (0-100). Auto-adjusts status
    async updateUserJobProgress(userName, jobId, progress) {
        try {
            if (!userName || !jobId || progress === undefined || progress === null) {
                throw new Error('Missing userName, jobId, or progress');
            }
            const pct = Math.max(0, Math.min(100, Number(progress)));
            const user = this.state.users[userName];
            if (!user) throw new Error(`User ${userName} not found`);
            if (!user.jobs || !user.jobs[jobId]) throw new Error(`Job ${jobId} not found for ${userName}`);

            user.jobs[jobId].progress = pct;
            if (pct === 100) {
                user.jobs[jobId].projectStatus = 'completed';
                user.jobs[jobId].status = 'completed';
            } else if (pct > 0) {
                user.jobs[jobId].projectStatus = 'in-progress';
                user.jobs[jobId].status = 'in-progress';
            } else {
                user.jobs[jobId].projectStatus = 'upcoming';
                user.jobs[jobId].status = 'upcoming';
            }
            user.jobs[jobId].updatedAt = new Date().toISOString();

            // Persist to Firestore
            try {
                if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                    await window.FirestoreDataManager.updateAssignmentStatus(userName, jobId, user.jobs[jobId].status, pct);
                }
            } catch (fsErr) {
                console.warn('⚠️ Firestore assignment progress update skipped:', fsErr?.message || fsErr);
            }

            if (window.NotificationManager) {
                window.NotificationManager.success(
                    `Set ${userName}'s job progress to ${pct}%`,
                    { title: 'Job Progress Updated' }
                );
            }
            this.triggerEvent('user:job-progress-updated', { userName, jobId, progress: pct });
            return true;
        } catch (error) {
            console.error('❌ Error updating user job progress:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(`Failed to update job progress: ${error.message}`, { title: 'Update Failed' });
            }
            return false;
        }
    },

    // Add a job to a user
    async addJobToUser(userName, jobData) {
        try {
            const user = this.state.users[userName];
            if (!user) throw new Error(`User ${userName} not found`);
            if (!user.jobs) user.jobs = {};

            const jobId = jobData?.id || `job-${(jobData?.title || 'role').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
            user.jobs[jobId] = {
                id: jobId,
                title: jobData.title || 'Untitled Job',
                role: jobData.role || jobData.title || 'Role',
                location: jobData.location || user.profile?.location || 'Atlanta Area',
                rate: jobData.rate || user.profile?.rate || '',
                description: jobData.description || '',
                date: jobData.date || jobData.projectStart || '',
                projectStart: jobData.projectStart || jobData.date || '',
                projectEnd: jobData.projectEnd || '',
                listingStatus: jobData.listingStatus || 'Active',
                status: jobData.status || 'upcoming',
                projectStatus: jobData.projectStatus || 'upcoming',
                paymentStatus: jobData.paymentStatus || 'pending',
                progress: jobData.progress || 0,
                assignedDate: new Date().toISOString().split('T')[0],
                updatedAt: new Date().toISOString()
            };

            if (!user.primaryJob) user.primaryJob = jobId;

            // Firestore assignment create
            try {
                if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                    const assignmentPayload = {
                        title: user.jobs[jobId].title,
                        role: user.jobs[jobId].role,
                        location: user.jobs[jobId].location,
                        rate: user.jobs[jobId].rate,
                        description: user.jobs[jobId].description,
                        status: user.jobs[jobId].status,
                        projectStatus: user.jobs[jobId].projectStatus,
                        paymentStatus: user.jobs[jobId].paymentStatus,
                        progress: user.jobs[jobId].progress || 0,
                        assignedDate: user.jobs[jobId].assignedDate,
                        listingSnapshot: {
                            date: user.jobs[jobId].date || user.jobs[jobId].projectStart || '',
                            type: jobData.type || user.profile?.projectType || '',
                            listingStatus: user.jobs[jobId].listingStatus || 'Active'
                        }
                    };
                    await window.FirestoreDataManager.setAssignment(userName, jobId, assignmentPayload);
                }
            } catch (fsErr) {
                console.warn('⚠️ Firestore assignment create skipped:', fsErr?.message || fsErr);
            }
            this.triggerEvent('user:job-added', { userName, jobId, job: user.jobs[jobId] });
            return jobId;
        } catch (error) {
            console.error('❌ Error adding job to user:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(`Failed to add job: ${error.message}`, { title: 'Add Job Failed' });
            }
            return null;
        }
    },

    // Remove a job from a user
    async removeJobFromUser(userName, jobId) {
        try {
            const user = this.state.users[userName];
            if (!user || !user.jobs || !user.jobs[jobId]) throw new Error('User/job not found');

            const wasPrimary = user.primaryJob === jobId;
            delete user.jobs[jobId];
            if (wasPrimary) {
                user.primaryJob = Object.keys(user.jobs)[0] || null;
            }

            // Firestore assignment delete
            try {
                if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                    await window.FirestoreDataManager.deleteAssignment(userName, jobId);
                }
            } catch (fsErr) {
                console.warn('⚠️ Firestore assignment delete skipped:', fsErr?.message || fsErr);
            }
            this.triggerEvent('user:job-removed', { userName, jobId });
            return true;
        } catch (error) {
            console.error('❌ Error removing job from user:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(`Failed to remove job: ${error.message}`, { title: 'Remove Job Failed' });
            }
            return false;
        }
    },

    // Set a user's primary job
    async setPrimaryJob(userName, jobId) {
        try {
            const user = this.state.users[userName];
            if (!user || !user.jobs || !user.jobs[jobId]) throw new Error('User/job not found');
            user.primaryJob = jobId;
            // Persist primaryJob to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setUser(userName, { primaryJob: user.primaryJob });
            }
            this.triggerEvent('user:primary-job-set', { userName, jobId });
            return true;
        } catch (error) {
            console.error('❌ Error setting primary job:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error(`Failed to set primary job: ${error.message}`, { title: 'Update Failed' });
            }
            return false;
        }
    }
};

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserManager;
} else {
    window.UserManager = UserManager;
}
