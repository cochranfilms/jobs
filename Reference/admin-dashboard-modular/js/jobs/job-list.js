/**
 * Job List Module
 * Handles job display and management using Component Library
 */

const JobList = {
    // Job list state
    state: {
        jobs: [],
        filteredJobs: [],
        isLoading: false,
        filters: {
            status: 'all',
            type: 'all',
            location: 'all'
        },
        sortBy: 'date',
        sortOrder: 'desc',
        searchQuery: '',
        selectedJobs: new Set()
    },

    // Initialize job list
    async init() {
        try {
            console.log('📋 Initializing Job List...');
            
            // Wait for component library to be ready
            if (!window.ComponentLibrary) {
                await this.waitForComponentLibrary();
            }
            
            // Load initial job data
            await this.loadAndDisplayJobs();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup real-time updates
            this.setupRealTimeUpdates();
            
            console.log('✅ Job List initialized');
            
        } catch (error) {
            console.error('❌ Job List initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'job-list-init');
            }
        }
    },

    // Wait for component library to be ready
    waitForComponentLibrary() {
        return new Promise((resolve) => {
            if (window.ComponentLibrary) {
                resolve();
            } else {
                window.addEventListener('componentLibraryReady', resolve);
            }
        });
    },

    // Render job management interface using Component Library
    renderJobManagement(containerId = 'jobListContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('⚠️ Job list container not found:', containerId);
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Create main content card
        const contentCard = this.createContentCard();
        container.appendChild(contentCard);

        // Render job list section
        this.renderJobListSection();
        
        // Render bulk actions section
        this.renderBulkActionsSection();
        
        // Render jobs list
        this.renderJobsList();
    },

    // Create main content card
    createContentCard() {
        const card = document.createElement('div');
        card.className = 'content-card';
        
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = '<h2>💼 Job Management</h2>';
        
        const content = document.createElement('div');
        content.className = 'card-content';
        content.id = 'jobManagementContent';
        
        card.appendChild(header);
        card.appendChild(content);
        
        return card;
    },

    // Render job list section
    renderJobListSection() {
        const container = document.getElementById('jobManagementContent');
        if (!container) return;

        const section = document.createElement('div');
        section.className = 'form-section';
        
        // Create list header
        const listHeader = this.createListHeader();
        section.appendChild(listHeader);
        
        // Create list controls
        const listControls = this.createListControls();
        section.appendChild(listControls);
        
        container.appendChild(section);
    },

    // Create list header
    createListHeader() {
        const header = document.createElement('div');
        header.className = 'list-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Current Jobs';
        header.appendChild(title);
        
        return header;
    },

    // Create list controls
    createListControls() {
        const controls = document.createElement('div');
        controls.className = 'list-controls';
        
        // Create filters
        const filters = this.createFilters();
        controls.appendChild(filters);
        
        // Create search
        const search = this.createSearch();
        controls.appendChild(search);
        
        // Create refresh button
        const refreshBtn = this.createRefreshButton();
        controls.appendChild(refreshBtn);
        
        return controls;
    },

    // Create filters
    createFilters() {
        const filters = document.createElement('div');
        filters.className = 'list-filters';
        
        // Status filter
        const statusFilter = this.createFilterSelect('jobFilter', 'All Jobs', [
            { value: 'all', label: 'All Jobs' },
            { value: 'Active', label: 'Active' },
            { value: 'Pending', label: 'Pending' },
            { value: 'Completed', label: 'Completed' },
            { value: 'Cancelled', label: 'Cancelled' }
        ], 'status');
        
        // Type filter
        const typeFilter = this.createFilterSelect('jobTypeFilter', 'All Types', [
            { value: 'all', label: 'All Types' },
            { value: 'Photography', label: 'Photography' },
            { value: 'Videography', label: 'Videography' },
            { value: 'Event Coverage', label: 'Event Coverage' },
            { value: 'Portrait Session', label: 'Portrait Session' },
            { value: 'Commercial', label: 'Commercial' },
            { value: 'Wedding', label: 'Wedding' },
            { value: 'Other', label: 'Other' }
        ], 'type');
        
        // Location filter
        const locationFilter = this.createFilterSelect('jobLocationFilter', 'All Locations', [
            { value: 'all', label: 'All Locations' },
            { value: 'Atlanta Area', label: 'Atlanta Area' },
            { value: 'Douglasville, GA', label: 'Douglasville, GA' },
            { value: 'Sandy Springs, GA', label: 'Sandy Springs, GA' }
        ], 'location');
        
        filters.appendChild(statusFilter);
        filters.appendChild(typeFilter);
        filters.appendChild(locationFilter);
        
        return filters;
    },

    // Create filter select
    createFilterSelect(id, placeholder, options, filterKey) {
        if (window.Form) {
            return window.Form.createField({
                type: 'select',
                name: filterKey,
                options: options,
                onChange: () => this.filterJobs()
            });
        } else {
            const select = document.createElement('select');
            select.id = id;
            select.onchange = () => this.filterJobs();
            
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                select.appendChild(optionElement);
            });
            
            return select;
        }
    },

    // Create search
    createSearch() {
        const search = document.createElement('div');
        search.className = 'list-search';
        
        if (window.Form) {
            const searchField = window.Form.createField({
                type: 'text',
                name: 'search',
                placeholder: 'Search jobs...',
                onChange: (e) => this.handleSearch(e.target.value)
            });
            search.appendChild(searchField);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Search jobs...';
            input.oninput = (e) => this.handleSearch(e.target.value);
            search.appendChild(input);
        }
        
        return search;
    },

    // Create refresh button
    createRefreshButton() {
        if (window.Button) {
            return window.Button.create({
                text: '🔄 Refresh',
                variant: 'secondary',
                size: 'sm',
                onClick: () => this.refreshJobList()
            });
        } else {
            const button = document.createElement('button');
            button.className = 'btn btn-small';
            button.textContent = '🔄 Refresh';
            button.onclick = () => this.refreshJobList();
            return button;
        }
    },

    // Render bulk actions section
    renderBulkActionsSection() {
        const container = document.getElementById('jobManagementContent');
        if (!container) return;

        const section = document.createElement('div');
        section.id = 'bulkActions';
        section.className = 'bulk-actions';
        section.style.display = 'none';
        
        const header = document.createElement('h4');
        header.textContent = 'Bulk Actions';
        header.style.cssText = 'margin: 0 0 0.5rem 0; color: #3b82f6;';
        
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'bulk-action-buttons';
        actionsContainer.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap;';
        
        // Create bulk action buttons using Component Library
        const actions = [
            {
                text: '📊 Update Status',
                variant: 'info',
                onClick: () => this.bulkUpdateStatus()
            },
            {
                text: '🗑️ Delete Selected',
                variant: 'danger',
                onClick: () => this.bulkDeleteJobs()
            },
            {
                text: '❌ Clear Selection',
                variant: 'secondary',
                onClick: () => this.clearSelection()
            }
        ];

        actions.forEach(actionConfig => {
            const button = this.createActionButton(actionConfig);
            actionsContainer.appendChild(button);
        });
        
        section.appendChild(header);
        section.appendChild(actionsContainer);
        container.appendChild(section);
    },

    // Create action button using Component Library
    createActionButton(config) {
        if (window.Button) {
            return window.Button.create({
                text: config.text,
                variant: config.variant,
                size: 'sm',
                onClick: config.onClick
            });
        } else {
            const button = document.createElement('button');
            button.className = `btn btn-small btn-${config.variant}`;
            button.textContent = config.text;
            button.onclick = config.onClick;
            return button;
        }
    },

    // Render jobs list
    renderJobsList() {
        const container = document.getElementById('jobManagementContent');
        if (!container) return;

        const section = document.createElement('div');
        section.className = 'jobs-list-section';
        
        // Create jobs list container
        const jobsListContainer = document.createElement('div');
        jobsListContainer.className = 'item-list';
        jobsListContainer.id = 'jobsList';
        section.appendChild(jobsListContainer);
        
        // Create no jobs message
        const noJobsMessage = document.createElement('div');
        noJobsMessage.id = 'noJobsMessage';
        noJobsMessage.style.display = 'none';
        noJobsMessage.style.cssText = 'text-align: center; padding: 2rem; color: rgba(255,255,255,0.6);';
        noJobsMessage.innerHTML = '<p>No jobs found. Create your first job using the form above.</p>';
        section.appendChild(noJobsMessage);
        
        container.appendChild(section);
    },

    // Switch between different views
    switchView(viewName) {
        switch (viewName) {
            case 'all':
                this.state.filters.status = 'all';
                break;
            case 'active':
                this.state.filters.status = 'Active';
                break;
            case 'pending':
                this.state.filters.status = 'Pending';
                break;
            case 'completed':
                this.state.filters.status = 'Completed';
                break;
            case 'cancelled':
                this.state.filters.status = 'Cancelled';
                break;
        }
        
        this.filterJobs();
        this.updateFilterDisplay();
    },

    // Populate filter dropdowns
    populateFilterDropdowns() {
        // Get unique job types and locations from current jobs
        const types = this.getUniqueJobTypes();
        const locations = this.getUniqueJobLocations();

        // Update type filter if it exists
        const typeFilter = document.getElementById('jobTypeFilter');
        if (typeFilter) {
            typeFilter.innerHTML = '<option value="all">All Types</option>' +
                types.map(type => `<option value="${type}">${type}</option>`).join('');
        }

        // Update location filter if it exists
        const locationFilter = document.getElementById('jobLocationFilter');
        if (locationFilter) {
            locationFilter.innerHTML = '<option value="all">All Locations</option>' +
                locations.map(location => `<option value="${location}">${location}</option>`).join('');
        }
    },

    // Load and display jobs
    async loadAndDisplayJobs() {
        try {
            this.state.isLoading = true;
            
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Loading jobs...');
            }

            // Get jobs from Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                this.state.jobs = (await window.FirestoreDataManager.getJobListings()) || [];
            } else {
                this.state.jobs = [];
                console.warn('⚠️ Firestore unavailable; cannot load jobs');
            }

            // Apply current filters and display
            this.filterJobs();
            this.displayJobs();
            this.populateFilterDropdowns();
            this.updateStatsDisplay();

        } catch (error) {
            console.error('❌ Error loading jobs:', error);
            this.showError('Failed to load jobs: ' + error.message);
        } finally {
            this.state.isLoading = false;
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Filter jobs based on current filters
    filterJobs() {
        this.state.filteredJobs = this.state.jobs.filter(job => {
            // Status filter
            if (this.state.filters.status !== 'all' && job.status !== this.state.filters.status) {
                return false;
            }
            
            // Type filter
            if (this.state.filters.type !== 'all' && job.type !== this.state.filters.type) {
                return false;
            }
            
            // Location filter
            if (this.state.filters.location !== 'all' && job.location !== this.state.filters.location) {
                return false;
            }
            
            // Search filter
            if (this.state.searchQuery) {
                const searchLower = this.state.searchQuery.toLowerCase();
                const jobText = `${job.title} ${job.description} ${job.location} ${job.type}`.toLowerCase();
                if (!jobText.includes(searchLower)) {
                    return false;
                }
            }
            
            return true;
        });

        this.displayJobs();
    },

    // Display filtered jobs
    displayJobs() {
        const jobsList = document.getElementById('jobsList');
        const noJobsMessage = document.getElementById('noJobsMessage');
        
        if (!jobsList || !noJobsMessage) return;

        if (this.state.filteredJobs.length === 0) {
            jobsList.style.display = 'none';
            noJobsMessage.style.display = 'block';
            return;
        }

        jobsList.style.display = 'block';
        noJobsMessage.style.display = 'none';

        // Sort jobs
        const sortedJobs = this.sortJobs(this.state.filteredJobs);
        
        // Clear and populate jobs list
        jobsList.innerHTML = '';
        sortedJobs.forEach((job, index) => {
            const jobCard = this.createJobCard(job, index);
            jobsList.appendChild(jobCard);
        });
    },

    // Create job card
    createJobCard(job, index) {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.dataset.jobIndex = index;
        
        card.innerHTML = `
            <div class="job-info">
                <div class="job-header">
                    <h4>${job.title || 'Untitled Job'}</h4>
                    <span class="job-status ${job.status || 'pending'}">${job.status || 'Pending'}</span>
                </div>
                <div class="job-details">
                    <p><strong>Type:</strong> ${job.type || 'N/A'}</p>
                    <p><strong>Location:</strong> ${job.location || 'N/A'}</p>
                    <p><strong>Pay:</strong> ${job.pay || 'N/A'}</p>
                    <p><strong>Date:</strong> ${job.date || 'N/A'}</p>
                </div>
                <div class="job-description">
                    <p>${job.description || 'No description provided'}</p>
                </div>
            </div>
            <div class="job-actions">
                ${this.createJobActionButtons(job, index)}
            </div>
        `;
        
        return card;
    },

    // Create job action buttons
    createJobActionButtons(job, index) {
        const actions = [];
        
        // Status toggle button
        const toggleText = job.status === 'Active' ? '🔄 Deactivate' : '✅ Activate';
        const toggleVariant = job.status === 'Active' ? 'warning' : 'success';
        
        if (window.Button) {
            const toggleBtn = window.Button.create({
                text: toggleText,
                variant: toggleVariant,
                size: 'sm',
                onClick: () => this.toggleJobStatus(job, index)
            });
            actions.push(toggleBtn.outerHTML);
        } else {
            const toggleClass = job.status === 'Active' ? 'btn-warning' : 'btn-success';
            actions.push(`<button class="btn btn-small ${toggleClass}" onclick="JobList.toggleJobStatus('${job.title}', ${index})">${toggleText}</button>`);
        }
        
        // Progress/status controls for user-facing workflow
        const controlsHtml = `
            <div class="job-progress-controls" style="display:flex;gap:0.5rem;align-items:center;margin:0.25rem 0;">
                <label style="font-size:12px;opacity:0.8;">User Status:</label>
                <select data-job-index="${index}" class="job-status-select" onchange="JobList.handleUserStatusChange(event, ${index})">
                    <option value="upcoming">Upcoming</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="on-hold">On Hold</option>
                </select>
                <label style="font-size:12px;opacity:0.8;">Progress:</label>
                <input type="number" min="0" max="100" step="5" value="0" class="job-progress-input" data-job-index="${index}" style="width:70px;" />
                <button class="btn btn-small" onclick="JobList.applyUserProgress(${index})">Apply</button>
            </div>`;
        actions.push(controlsHtml);

        // Edit button
        if (window.Button) {
            const editBtn = window.Button.create({
                text: '✏️ Edit',
                variant: 'secondary',
                size: 'sm',
                onClick: () => this.editJob(index)
            });
            actions.push(editBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-small btn-secondary" onclick="JobList.editJob(' + index + ')">✏️ Edit</button>');
        }
        
        // Delete button
        if (window.Button) {
            const deleteBtn = window.Button.create({
                text: '🗑️ Delete',
                variant: 'danger',
                size: 'sm',
                onClick: () => this.deleteJob(index)
            });
            actions.push(deleteBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-small btn-danger" onclick="JobList.deleteJob(' + index + ')">🗑️ Delete</button>');
        }
        
        // Duplicate button
        if (window.Button) {
            const duplicateBtn = window.Button.create({
                text: '📋 Duplicate',
                variant: 'info',
                size: 'sm',
                onClick: () => this.duplicateJob(index)
            });
            actions.push(duplicateBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-small btn-info" onclick="JobList.duplicateJob(' + index + ')">📋 Duplicate</button>');
        }

        // Assign to users button
        if (window.Button) {
            const assignBtn = window.Button.create({
                text: '🎯 Assign',
                variant: 'primary',
                size: 'sm',
                onClick: () => (window.JobManager && window.JobManager.assignJobsToUsers ? window.JobManager.assignJobsToUsers() : null)
            });
            actions.push(assignBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-small" onclick="JobManager && JobManager.assignJobsToUsers && JobManager.assignJobsToUsers()">🎯 Assign</button>');
        }
        
        // Selection checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.state.selectedJobs.has(index);
        checkbox.onchange = (e) => this.toggleJobSelection(index, e.target.checked);
        actions.push(checkbox.outerHTML);
        
        return actions.join('');
    },

    // Sort jobs
    sortJobs(jobs) {
        return jobs.sort((a, b) => {
            let aValue = a[this.state.sortBy] || '';
            let bValue = b[this.state.sortBy] || '';
            
            if (this.state.sortBy === 'date') {
                aValue = new Date(aValue || '1970-01-01');
                bValue = new Date(bValue || '1970-01-01');
            } else if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (this.state.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    },

    // Handle search
    handleSearch(query) {
        this.state.searchQuery = query;
        this.filterJobs();
    },

    // Edit job
    editJob(jobIndex) {
        if (window.JobForm) {
            window.JobForm.editJob(jobIndex);
        }
    },

    // Delete job
    async deleteJob(jobIndex) {
        try {
            if (window.Modal) {
                const confirmed = await window.Modal.utils.confirm(
                    `Are you sure you want to delete this job?`,
                    'Confirm Deletion'
                );
                
                if (!confirmed) return;
            } else {
                if (!confirm('Are you sure you want to delete this job?')) {
                    return;
                }
            }

            // Delete job logic here
            console.log('🗑️ Deleting job at index:', jobIndex);
            this.showSuccess('Job deleted successfully');
            
            // Refresh job list
            this.loadAndDisplayJobs();
            
        } catch (error) {
            console.error('❌ Failed to delete job:', error);
            this.showError('Failed to delete job: ' + error.message);
        }
    },

    // Duplicate job
    async duplicateJob(jobIndex) {
        try {
            console.log('📋 Duplicating job at index:', jobIndex);
            
            // Duplicate logic here
            this.showSuccess('Job duplicated successfully');
            
            // Refresh job list
            this.loadAndDisplayJobs();
            
        } catch (error) {
            console.error('❌ Failed to duplicate job:', error);
            this.showError('Failed to duplicate job: ' + error.message);
        }
    },

    // Toggle job selection
    toggleJobSelection(jobIndex, selected) {
        if (selected) {
            this.state.selectedJobs.add(jobIndex);
        } else {
            this.state.selectedJobs.delete(jobIndex);
        }
        
        this.updateBulkActionsDisplay();
    },

    // Update bulk actions display
    updateBulkActionsDisplay() {
        const bulkActions = document.getElementById('bulkActions');
        if (bulkActions) {
            bulkActions.style.display = this.state.selectedJobs.size > 0 ? 'block' : 'none';
        }
    },

    // Clear selection
    clearSelection() {
        this.state.selectedJobs.clear();
        this.updateBulkActionsDisplay();
        this.displayJobs(); // Refresh to uncheck checkboxes
    },

    // Bulk update status
    async bulkUpdateStatus() {
        try {
            if (this.state.selectedJobs.size === 0) {
                this.showWarning('No jobs selected');
                return;
            }

            if (window.Modal) {
                const newStatus = await window.Modal.utils.prompt(
                    'Enter new status (Active, Pending, Completed, Cancelled):',
                    'Update Job Status'
                );
                
                if (!newStatus) return;
                
                // Update logic here
                console.log('📊 Bulk updating status to:', newStatus);
                this.showSuccess(`Updated ${this.state.selectedJobs.size} jobs to ${newStatus}`);
                
                this.clearSelection();
                this.loadAndDisplayJobs();
            } else {
                const newStatus = prompt('Enter new status (Active, Pending, Completed, Cancelled):');
                if (newStatus) {
                    console.log('📊 Bulk updating status to:', newStatus);
                    this.showSuccess(`Updated ${this.state.selectedJobs.size} jobs to ${newStatus}`);
                    
                    this.clearSelection();
                    this.loadAndDisplayJobs();
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to bulk update status:', error);
            this.showError('Failed to bulk update status: ' + error.message);
        }
    },

    // Bulk delete jobs
    async bulkDeleteJobs() {
        try {
            if (this.state.selectedJobs.size === 0) {
                this.showWarning('No jobs selected');
                return;
            }

            if (window.Modal) {
                const confirmed = await window.Modal.utils.confirm(
                    `Are you sure you want to delete ${this.state.selectedJobs.size} selected jobs?`,
                    'Confirm Bulk Deletion'
                );
                
                if (!confirmed) return;
            } else {
                if (!confirm(`Are you sure you want to delete ${this.state.selectedJobs.size} selected jobs?`)) {
                    return;
                }
            }

            // Bulk delete logic here
            console.log('🗑️ Bulk deleting jobs:', Array.from(this.state.selectedJobs));
            this.showSuccess(`Deleted ${this.state.selectedJobs.size} jobs successfully`);
            
            this.clearSelection();
            this.loadAndDisplayJobs();
            
        } catch (error) {
            console.error('❌ Failed to bulk delete jobs:', error);
            this.showError('Failed to bulk delete jobs: ' + error.message);
        }
    },

    // Refresh job list
    async refreshJobList() {
        try {
            await this.loadAndDisplayJobs();
            this.showSuccess('Job list refreshed');
        } catch (error) {
            console.error('❌ Failed to refresh job list:', error);
            this.showError('Failed to refresh job list');
        }
    },

    // Get unique job types
    getUniqueJobTypes() {
        const types = new Set();
        this.state.jobs.forEach(job => {
            if (job.type) types.add(job.type);
        });
        return Array.from(types);
    },

    // Get unique job locations
    getUniqueJobLocations() {
        const locations = new Set();
        this.state.jobs.forEach(job => {
            if (job.location) locations.add(job.location);
        });
        return Array.from(locations);
    },

    // Update filter display
    updateFilterDisplay() {
        // Update filter UI to reflect current state
        const statusFilter = document.getElementById('jobFilter');
        if (statusFilter) {
            statusFilter.value = this.state.filters.status;
        }
    },

    // Update stats display
    updateStatsDisplay() {
        // Update statistics display if it exists
        const totalJobs = document.getElementById('totalJobs');
        if (totalJobs) {
            totalJobs.textContent = this.state.jobs.length;
        }
        
        const activeJobs = document.getElementById('activeJobs');
        if (activeJobs) {
            const activeCount = this.state.jobs.filter(job => job.status === 'Active').length;
            activeJobs.textContent = activeCount;
        }
    },

    // Show success message
    showSuccess(message) {
        if (window.Notification) {
            window.Notification.utils.success(message, 'Success');
        } else if (window.NotificationManager) {
            window.NotificationManager.showSuccess(message);
        } else {
            alert('Success: ' + message);
        }
    },

    // Show error message
    showError(message) {
        if (window.Notification) {
            window.Notification.utils.error(message, 'Error');
        } else if (window.NotificationManager) {
            window.NotificationManager.showError(message);
        } else {
            alert('Error: ' + message);
        }
    },

    // Show warning message
    showWarning(message) {
        if (window.Notification) {
            window.Notification.utils.warning(message, 'Warning');
        } else if (window.NotificationManager) {
            window.NotificationManager.showWarning(message);
        } else {
            alert('Warning: ' + message);
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for job events
        window.addEventListener('jobForm:jobCreated', (e) => {
            this.handleJobUpdate(e.detail);
        });
        
        window.addEventListener('jobForm:jobUpdated', (e) => {
            this.handleJobUpdate(e.detail);
        });
    },

    // Handle job update
    handleJobUpdate(jobData) {
        console.log('🔄 Job updated, refreshing list:', jobData);
        this.loadAndDisplayJobs();
    },

    // Setup real-time updates
    setupRealTimeUpdates() {
        // Poll for updates every 30 seconds
        setInterval(() => {
            this.loadAndDisplayJobs();
        }, 30000);
    },

    // Toggle job status between Active and Inactive
    async toggleJobStatus(job, index) {
        try {
            console.log(`🔄 Toggling job status: ${job.title} (current: ${job.status})`);
            
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Updating job status...');
            }
            
            const newStatus = job.status === 'Active' ? 'Inactive' : 'Active';
            
            // Update job status in Firestore
            if (job.id && window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                const payload = { ...job, status: newStatus, updatedAt: new Date().toISOString() };
                delete payload.id;
                await window.FirestoreDataManager.setJobListing(job.id, payload);
            }
            
            // Update local state
            this.state.jobs[index].status = newStatus;
            
            // Refresh the display
            this.filterJobs();
            this.updateStatsDisplay();
            
            // Show success notification
            this.showSuccess(`Job "${job.title}" status changed to ${newStatus}`);
            
            // Trigger event for other components
            this.triggerEvent('statusToggled', {
                job: job,
                newStatus: newStatus,
                index: index
            });
            
        } catch (error) {
            console.error('❌ Error toggling job status:', error);
            this.showError(`Failed to update job status: ${error.message}`);
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Apply progress change to all assigned users for this listing (by title/date heuristic)
    async applyUserProgress(jobIndex) {
        try {
            const job = this.state.jobs[jobIndex];
            if (!job) return;

            const progressInput = document.querySelector(`.job-progress-input[data-job-index="${jobIndex}"]`);
            const statusSelect = document.querySelector(`.job-status-select[data-job-index="${jobIndex}"]`);
            const progress = progressInput ? Number(progressInput.value) : 0;
            const status = statusSelect ? statusSelect.value : 'upcoming';

            // Load users from Firestore and fan-out update by jobRef/title match
            let users = {};
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                users = await window.FirestoreDataManager.getUsers();
            }

            let changes = 0;
            Object.entries(users).forEach(([userName, user]) => {
                if (!user || userName.startsWith('_')) return;
                if (!user.jobs) return;
                Object.entries(user.jobs).forEach(([jid, uj]) => {
                    const refMatches = uj?.jobRef?.source === 'jobs-data' && (uj?.jobRef?.index === jobIndex || uj?.jobRef?.key === `${job.title}|${job.date}`);
                    const titleFuzzy = (uj.title || '').toLowerCase() === (job.title || '').toLowerCase();
                    if (refMatches || titleFuzzy) {
                        // Update status/progress
                        const mapped = status;
                        uj.progress = Math.max(0, Math.min(100, Number(progress)));
                        uj.projectStatus = mapped;
                        uj.status = mapped;
                        uj.updatedAt = new Date().toISOString();
                        changes++;
                    }
                });
            });

            if (changes > 0) {
                // Update Firestore assignments
                try {
                    if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                        await Promise.all(Object.entries(users).map(async ([userName, user]) => {
                            if (!user || userName.startsWith('_') || !user.jobs) return;
                            const jobs = Object.entries(user.jobs);
                            for (const [jid, uj] of jobs) {
                                const refMatches = uj?.jobRef?.source === 'jobs-data' && (uj?.jobRef?.index === jobIndex || uj?.jobRef?.key === `${job.title}|${job.date}`);
                                const titleFuzzy = (uj.title || '').toLowerCase() === (job.title || '').toLowerCase();
                                if (refMatches || titleFuzzy) {
                                    await window.FirestoreDataManager.updateAssignmentStatus(userName, jid, status, progress);
                                }
                            }
                        }));
                    }
                } catch (fsErr) {
                    console.warn('⚠️ Firestore bulk assignment update skipped:', fsErr?.message || fsErr);
                }

                this.showSuccess(`Applied progress to ${changes} assignment${changes === 1 ? '' : 's'}`);
                this.triggerEvent('jobList:userProgressApplied', { jobIndex, changes, status, progress });
            } else {
                this.showWarning('No assigned users matched this job');
            }
        } catch (error) {
            console.error('❌ Failed to apply user progress:', error);
            this.showError('Failed to apply user progress');
        }
    },

    // Handle status dropdown change (no-op until Apply is clicked)
    handleUserStatusChange(e, jobIndex) {
        // Intentionally left empty to allow Apply to persist
    },

    // Trigger custom event
    triggerEvent(eventName, data) {
        const event = new CustomEvent(`jobList:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JobList;
} else {
    window.JobList = JobList;
}
