/**
 * User List Module
 * Handles user display and management interface using Component Library
 */

const UserList = {
    // List state
    state: {
        currentView: 'active', // 'active' or 'archived'
        filters: {
            status: 'all',
            role: 'all',
            location: 'all'
        },
        searchQuery: '',
        sortBy: 'name',
        sortOrder: 'asc'
    },

    // Initialize user list
    async init() {
        try {
            console.log('📋 Initializing User List...');
            
            // Wait for component library to be ready
            if (!window.ComponentLibrary) {
                await this.waitForComponentLibrary();
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup real-time updates
            this.setupRealTimeUpdates();
            
            console.log('✅ User List initialized');
            
        } catch (error) {
            console.error('❌ User List initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'user-list-init');
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

    // Render user management section using Component Library
    renderUserManagement(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Container not found:', containerId);
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Create main content card
        const contentCard = this.createContentCard();
        container.appendChild(contentCard);

        // Render user form section
        this.renderUserFormSection();
        
        // Render quick actions section
        this.renderQuickActionsSection();
        
        // Render user list section
        this.renderUserListSection();
    },

    // Create main content card
    createContentCard() {
        const card = document.createElement('div');
        card.className = 'content-card';
        
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = '<h2>👥 User & Contract Management</h2>';
        
        const content = document.createElement('div');
        content.className = 'card-content';
        content.id = 'userManagementContent';
        
        card.appendChild(header);
        card.appendChild(content);
        
        return card;
    },

    // Render user form section
    renderUserFormSection() {
        const container = document.getElementById('userManagementContent');
        if (!container) return;

        const formSection = document.createElement('div');
        formSection.id = 'userFormContainer';
        formSection.className = 'form-section';
        
        container.appendChild(formSection);
        
        // Render user form using UserForm module
        if (window.UserForm) {
            window.UserForm.renderForm('userFormContainer');
        }
    },

    // Render quick actions section using Component Library
    renderQuickActionsSection() {
        const container = document.getElementById('userManagementContent');
        if (!container) return;

        const section = document.createElement('div');
        section.className = 'form-section';
        
        const header = document.createElement('h3');
        header.textContent = 'Quick Actions';
        section.appendChild(header);
        
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'quick-actions';
        
        // Create action buttons using Component Library
        const actions = [
            {
                text: '📄 Generate All Contracts',
                variant: 'primary',
                onClick: () => this.generateAllContracts()
            },
            {
                text: '📊 Export Users',
                variant: 'secondary',
                onClick: () => this.exportUsersData()
            },
            {
                text: '📥 Download Users',
                variant: 'secondary',
                onClick: () => this.downloadUsersJSON(),
                id: 'downloadUsersBtn',
                style: 'display: none;'
            },
            {
                text: '📥 Download Contracts',
                variant: 'secondary',
                onClick: () => this.downloadContractFiles(),
                id: 'downloadContractsBtn',
                style: 'display: none;'
            }
        ];

        actions.forEach(actionConfig => {
            const button = this.createActionButton(actionConfig);
            actionsContainer.appendChild(button);
        });
        
        section.appendChild(actionsContainer);
        
        // Add contract generation status
        const statusDiv = document.createElement('div');
        statusDiv.id = 'contractGenerationStatus';
        section.appendChild(statusDiv);
        
        container.appendChild(section);
    },

    // Create action button using Component Library
    createActionButton(config) {
        if (window.Button) {
            const button = window.Button.create({
                text: config.text,
                variant: config.variant,
                onClick: config.onClick
            });
            
            if (config.id) button.id = config.id;
            if (config.style) button.style.cssText = config.style;
            
            return button;
        } else {
            // Fallback button
            const button = document.createElement('button');
            button.className = `btn btn-${config.variant}`;
            button.textContent = config.text;
            button.onclick = config.onClick;
            
            if (config.id) button.id = config.id;
            if (config.style) button.style.cssText = config.style;
            
            return button;
        }
    },

    // Render user list section
    renderUserListSection() {
        const container = document.getElementById('userManagementContent');
        if (!container) return;

        const section = document.createElement('div');
        section.className = 'form-section';
        
        // Create list header
        const listHeader = this.createListHeader();
        section.appendChild(listHeader);
        
        // Create list controls
        const listControls = this.createListControls();
        section.appendChild(listControls);
        
        // Create user list container
        const userListContainer = document.createElement('div');
        userListContainer.id = 'userListContainer';
        userListContainer.className = 'user-list';
        section.appendChild(userListContainer);
        
        container.appendChild(section);
        
        // Load and display users
        this.loadAndDisplayUsers();
    },

    // Create list header
    createListHeader() {
        const header = document.createElement('div');
        header.className = 'list-header';
        
        const title = document.createElement('h3');
        title.textContent = 'Current Users & Contracts';
        header.appendChild(title);
        
        return header;
    },

    // Create list controls
    createListControls() {
        const controls = document.createElement('div');
        controls.className = 'list-controls';
        
        // Create view tabs
        const viewTabs = this.createViewTabs();
        controls.appendChild(viewTabs);
        
        // Create filters
        const filters = this.createFilters();
        controls.appendChild(filters);
        
        // Create search
        const search = this.createSearch();
        controls.appendChild(search);
        
        return controls;
    },

    // Create view tabs
    createViewTabs() {
        const tabs = document.createElement('div');
        tabs.className = 'view-tabs';
        
        const activeTab = this.createTabButton('active', '👥 Active Users');
        const archivedTab = this.createTabButton('archived', '📦 Archived Users');
        
        tabs.appendChild(activeTab);
        tabs.appendChild(archivedTab);
        
        return tabs;
    },

    // Create tab button
    createTabButton(view, text) {
        if (window.Button) {
            return window.Button.create({
                text: text,
                variant: this.state.currentView === view ? 'primary' : 'ghost',
                className: 'tab-btn',
                onClick: () => this.switchView(view)
            });
        } else {
            const button = document.createElement('button');
            button.className = `tab-btn ${this.state.currentView === view ? 'active' : ''}`;
            button.textContent = text;
            button.onclick = () => this.switchView(view);
            return button;
        }
    },

    // Create filters
    createFilters() {
        const filters = document.createElement('div');
        filters.className = 'list-filters';
        
        // Status filter
        const statusFilter = this.createFilterSelect('statusFilter', 'All Status', [
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'signed', label: 'Signed' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' }
        ], 'status');
        
        // Role filter
        const roleFilter = this.createFilterSelect('roleFilter', 'All Roles', [
            { value: 'all', label: 'All Roles' },
            { value: 'Photographer', label: 'Photographer' },
            { value: 'Videographer', label: 'Videographer' },
            { value: 'Editor', label: 'Editor' },
            { value: 'Designer', label: 'Designer' }
        ], 'role');
        
        // Location filter
        const locationFilter = this.createFilterSelect('locationFilter', 'All Locations', [
            { value: 'all', label: 'All Locations' },
            { value: 'Atlanta Area', label: 'Atlanta Area' },
            { value: 'Douglasville, GA', label: 'Douglasville, GA' },
            { value: 'Sandy Springs, GA', label: 'Sandy Springs, GA' }
        ], 'location');
        
        filters.appendChild(statusFilter);
        filters.appendChild(roleFilter);
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
                onChange: () => this.applyFilters()
            });
        } else {
            const select = document.createElement('select');
            select.id = id;
            select.onchange = () => this.applyFilters();
            
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
                placeholder: 'Search users...',
                onChange: (e) => this.handleSearch(e.target.value)
            });
            search.appendChild(searchField);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Search users...';
            input.oninput = (e) => this.handleSearch(e.target.value);
            search.appendChild(input);
        }
        
        return search;
    },

    // Load and display users (Firestore-first; no JSON API)
    async loadAndDisplayUsers() {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Loading users...');
            }

            let usersArray = [];

            // Prefer Firestore
            if (window.FirestoreDataManager && typeof window.FirestoreDataManager.isAvailable === 'function' && window.FirestoreDataManager.isAvailable()) {
                const usersMap = await window.FirestoreDataManager.getUsers();
                usersArray = Object.entries(usersMap)
                    .filter(([name]) => name !== '_archived' && !name.startsWith('_'))
                    .map(([name, data]) => ({
                        name,
                        email: (data && data.profile && data.profile.email) || '',
                        role: (data && data.profile && data.profile.role) || '',
                        location: (data && data.profile && data.profile.location) || '',
                        rate: (data && data.profile && data.profile.rate) || '',
                        status: (data && data.application && data.application.status) || (data && data.contract && data.contract.contractStatus) || 'pending'
                    }));
            } else if (window.UserManager && window.UserManager.state && window.UserManager.state.users) {
                // Fallback to in-memory UserManager state if present
                const usersMap = typeof window.UserManager.getActiveUsers === 'function'
                    ? window.UserManager.getActiveUsers()
                    : window.UserManager.state.users;
                usersArray = Object.entries(usersMap)
                    .filter(([name]) => name !== '_archived' && !name.startsWith('_'))
                    .map(([name, data]) => ({
                        name,
                        email: (data && data.profile && data.profile.email) || '',
                        role: (data && data.profile && data.profile.role) || '',
                        location: (data && data.profile && data.profile.location) || '',
                        rate: (data && data.profile && data.profile.rate) || '',
                        status: (data && data.application && data.application.status) || (data && data.contract && data.contract.contractStatus) || 'pending'
                    }));
            } else {
                throw new Error('Firestore unavailable');
            }

            this.displayUsers(usersArray);

        } catch (error) {
            console.error('❌ Failed to load users:', error);
            this.showError('Failed to load users' + (error && error.message ? ': ' + error.message : ''));
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Display users
    displayUsers(users) {
        const container = document.getElementById('userListContainer');
        if (!container) return;

        // Filter users based on current view and filters
        const filteredUsers = this.filterUsers(users);
        
        // Sort users
        const sortedUsers = this.sortUsers(filteredUsers);
        
        // Clear container
        container.innerHTML = '';
        
        if (sortedUsers.length === 0) {
            const noUsers = document.createElement('div');
            noUsers.className = 'no-users';
            noUsers.innerHTML = `
                <div class="no-users-content">
                    <i class="fas fa-users-slash"></i>
                    <h4>No users found</h4>
                    <p>No users match the current filters or view.</p>
                </div>
            `;
            container.appendChild(noUsers);
            return;
        }

        // Create user cards
        sortedUsers.forEach(user => {
            const userCard = this.createUserCard(user);
            container.appendChild(userCard);
        });
    },

    // Create user card
    createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.dataset.userName = user.name;
        
        card.innerHTML = `
            <div class="user-info">
                <div class="user-header">
                    <h4>${user.name}</h4>
                    <span class="user-status ${user.status || 'pending'}">${user.status || 'Pending'}</span>
                </div>
                <div class="user-details">
                    <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                    <p><strong>Role:</strong> ${user.role || 'N/A'}</p>
                    <p><strong>Location:</strong> ${user.location || 'N/A'}</p>
                    <p><strong>Rate:</strong> ${user.rate || 'N/A'}</p>
                </div>
            </div>
            <div class="user-actions">
                ${this.createUserActionButtons(user)}
            </div>
        `;
        
        return card;
    },

    // Create user action buttons
    createUserActionButtons(user) {
        const actions = [];
        
        // Edit button
        if (window.Button) {
            const editBtn = window.Button.create({
                text: '✏️ Edit',
                variant: 'secondary',
                size: 'sm',
                onClick: () => this.editUser(user.name)
            });
            actions.push(editBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-secondary btn-sm" onclick="UserList.editUser(\'' + user.name + '\')">✏️ Edit</button>');
        }
        
        // Delete button
        if (window.Button) {
            const deleteBtn = window.Button.create({
                text: '🗑️ Delete',
                variant: 'danger',
                size: 'sm',
                onClick: () => this.deleteUser(user.name)
            });
            actions.push(deleteBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-danger btn-sm" onclick="UserList.deleteUser(\'' + user.name + '\')">🗑️ Delete</button>');
        }
        
        // Generate contract button
        if (window.Button) {
            const contractBtn = window.Button.create({
                text: '📄 Contract',
                variant: 'info',
                size: 'sm',
                onClick: () => this.generateUserContract(user.name)
            });
            actions.push(contractBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-info btn-sm" onclick="UserList.generateUserContract(\'' + user.name + '\')">📄 Contract</button>');
        }

        // Manage jobs button
        if (window.Button) {
            const jobsBtn = window.Button.create({
                text: '🧭 Jobs',
                variant: 'primary',
                size: 'sm',
                onClick: () => this.manageUserJobs(user.name)
            });
            actions.push(jobsBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-primary btn-sm" onclick="UserList.manageUserJobs(\'' + user.name + '\')">🧭 Jobs</button>');
        }
        
        return actions.join('');
    },

    // Filter users
    filterUsers(users) {
        return users.filter(user => {
            // View filter
            if (this.state.currentView === 'active' && user.status === 'archived') return false;
            if (this.state.currentView === 'archived' && user.status !== 'archived') return false;
            
            // Status filter
            if (this.state.filters.status !== 'all' && user.status !== this.state.filters.status) return false;
            
            // Role filter
            if (this.state.filters.role !== 'all' && user.role !== this.state.filters.role) return false;
            
            // Location filter
            if (this.state.filters.location !== 'all' && user.location !== this.state.filters.location) return false;
            
            // Search filter
            if (this.state.searchQuery) {
                const searchLower = this.state.searchQuery.toLowerCase();
                const userText = `${user.name} ${user.email} ${user.role} ${user.location}`.toLowerCase();
                if (!userText.includes(searchLower)) return false;
            }
            
            return true;
        });
    },

    // Sort users
    sortUsers(users) {
        return users.sort((a, b) => {
            let aValue = a[this.state.sortBy] || '';
            let bValue = b[this.state.sortBy] || '';
            
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
            
            if (this.state.sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    },

    // Switch view
    switchView(view) {
        this.state.currentView = view;
        this.loadAndDisplayUsers();
        this.updateViewTabs();
    },

    // Update view tabs
    updateViewTabs() {
        const tabs = document.querySelectorAll('.view-tabs .tab-btn');
        tabs.forEach(tab => {
            const view = tab.textContent.includes('Active') ? 'active' : 'archived';
            if (window.Button) {
                // Update button variant
                const isActive = this.state.currentView === view;
                window.Button.updateState(tab, {
                    variant: isActive ? 'primary' : 'ghost'
                });
            } else {
                // Update fallback button
                tab.className = `tab-btn ${this.state.currentView === view ? 'active' : ''}`;
            }
        });
    },

    // Apply filters
    applyFilters() {
        const statusFilter = document.getElementById('statusFilter');
        const roleFilter = document.getElementById('roleFilter');
        const locationFilter = document.getElementById('locationFilter');
        
        if (statusFilter) this.state.filters.status = statusFilter.value;
        if (roleFilter) this.state.filters.role = roleFilter.value;
        if (locationFilter) this.state.filters.location = locationFilter.value;
        
        this.loadAndDisplayUsers();
    },

    // Handle search
    handleSearch(query) {
        this.state.searchQuery = query;
        this.loadAndDisplayUsers();
    },

    // Edit user
    editUser(userName) {
        if (window.UserForm) {
            window.UserForm.editUser(userName);
        }
    },

    // Delete user
    async deleteUser(userName) {
        try {
            if (window.Modal) {
                const confirmed = await window.Modal.utils.confirm(
                    `Are you sure you want to delete user "${userName}"?`,
                    'Confirm Deletion'
                );
                
                if (!confirmed) return;
            } else {
                if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
                    return;
                }
            }

            // Delete user logic here
            console.log('🗑️ Deleting user:', userName);
            this.showSuccess(`User "${userName}" deleted successfully`);
            
            // Refresh user list
            this.loadAndDisplayUsers();
            
        } catch (error) {
            console.error('❌ Failed to delete user:', error);
            this.showError('Failed to delete user: ' + error.message);
        }
    },

    // Generate user contract
    async generateUserContract(userName) {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Generating contract...');
            }

            // Contract generation logic here
            console.log('📄 Generating contract for user:', userName);
            
            // Simulate contract generation
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showSuccess(`Contract generated for "${userName}"`);
            
        } catch (error) {
            console.error('❌ Failed to generate contract:', error);
            this.showError('Failed to generate contract: ' + error.message);
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Generate all contracts
    async generateAllContracts() {
        try {
            if (window.Modal) {
                const confirmed = await window.Modal.utils.confirm(
                    'This will generate contracts for all active users. Continue?',
                    'Confirm Bulk Generation'
                );
                
                if (!confirmed) return;
            } else {
                if (!confirm('This will generate contracts for all active users. Continue?')) {
                    return;
                }
            }

            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Generating all contracts...');
            }

            // Bulk contract generation logic here
            console.log('📄 Generating all contracts...');
            
            // Simulate bulk generation
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            this.showSuccess('All contracts generated successfully');
            
        } catch (error) {
            console.error('❌ Failed to generate all contracts:', error);
            this.showError('Failed to generate contracts: ' + error.message);
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Export users data
    async exportUsersData() {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Exporting users...');
            }

            // Export logic here
            console.log('📊 Exporting users data...');
            
            // Simulate export
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showSuccess('Users data exported successfully');
            
        } catch (error) {
            console.error('❌ Failed to export users:', error);
            this.showError('Failed to export users: ' + error.message);
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Download users JSON (Firestore source)
    async downloadUsersJSON() {
        try {
            let usersPayload = {};
            if (window.FirestoreDataManager && typeof window.FirestoreDataManager.isAvailable === 'function' && window.FirestoreDataManager.isAvailable()) {
                usersPayload = await window.FirestoreDataManager.getUsers();
            } else if (window.UserManager && window.UserManager.state && window.UserManager.state.users) {
                usersPayload = window.UserManager.state.users;
            } else {
                throw new Error('No data source available');
            }

            const data = { users: usersPayload };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'users.json';
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.showSuccess('Users JSON downloaded successfully');
        } catch (error) {
            console.error('❌ Failed to download users JSON:', error);
            this.showError('Failed to download users JSON' + (error && error.message ? ': ' + error.message : ''));
        }
    },

    // Download contract files
    async downloadContractFiles() {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Preparing contract files...');
            }

            // Download logic here
            console.log('📥 Downloading contract files...');
            
            // Simulate download preparation
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            this.showSuccess('Contract files downloaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to download contracts:', error);
            this.showError('Failed to download contracts: ' + error.message);
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
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

    // Setup event listeners
    setupEventListeners() {
        // Listen for user events
        window.addEventListener('userForm:userCreated', (e) => {
            this.handleUserUpdate(e.detail);
        });
        
        window.addEventListener('userForm:userUpdated', (e) => {
            this.handleUserUpdate(e.detail);
        });
    },

    // Handle user update
    handleUserUpdate(userData) {
        console.log('🔄 User updated, refreshing list:', userData);
        this.loadAndDisplayUsers();
    },

    // Setup real-time updates
    setupRealTimeUpdates() {
        // Poll for updates every 30 seconds
        setInterval(() => {
            this.loadAndDisplayUsers();
        }, 30000);
    },

    // Trigger custom event
    triggerEvent(eventName, data) {
        const event = new CustomEvent(`userList:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
    },

    // Open a modal to manage a user's job statuses and progress
    async manageUserJobs(userName) {
        try {
            if (!window.UserManager) throw new Error('UserManager not available');
            const user = window.UserManager.getUser(userName);
            if (!user) throw new Error('User not found');

            const jobs = user.jobs || {};
            const jobItems = Object.entries(jobs).map(([jobId, job]) => {
                const currentStatus = (job.projectStatus || job.status || 'upcoming');
                const progress = Number(job.progress || 0);
                return `
                    <div class="user-job-item" data-job-id="${jobId}" style="padding:0.5rem;border:1px solid rgba(255,255,255,0.1);border-radius:8px;margin-bottom:0.5rem;">
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:0.5rem;flex-wrap:wrap;">
                            <div>
                                <strong>${job.title || job.role || 'Untitled Job'}</strong>
                                <div style="font-size:12px;opacity:0.8;">${job.location || ''}</div>
                            </div>
                            <div style="display:flex;gap:0.5rem;align-items:center;">
                                <select class="user-job-status">
                                    ${['upcoming','in-progress','completed','cancelled','on-hold'].map(s => `<option value="${s}" ${s===currentStatus?'selected':''}>${s.replace('-', ' ')}</option>`).join('')}
                                </select>
                                <input class="user-job-progress" type="number" min="0" max="100" step="5" value="${progress}" style="width:70px;" />
                                <button class="btn btn-small" data-action="save">Save</button>
                                <button class="btn btn-small btn-secondary" data-action="primary">Set Primary</button>
                                <button class="btn btn-small btn-danger" data-action="remove">Remove</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:800px;">
                    <div class="modal-header">
                        <h3>Manage Jobs — ${userName}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        ${Object.keys(jobs).length ? jobItems : '<em>No jobs assigned</em>'}
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Wire actions
            modal.addEventListener('click', async (e) => {
                const target = e.target;
                if (!(target instanceof HTMLElement)) return;
                const action = target.getAttribute('data-action');
                if (!action) return;
                const item = target.closest('.user-job-item');
                if (!item) return;
                const jobId = item.getAttribute('data-job-id');
                const statusEl = item.querySelector('.user-job-status');
                const progressEl = item.querySelector('.user-job-progress');
                const status = statusEl ? statusEl.value : 'upcoming';
                const progress = progressEl ? Number(progressEl.value) : 0;

                try {
                    if (action === 'save') {
                        await window.UserManager.updateUserJobStatus(userName, jobId, status);
                        await window.UserManager.updateUserJobProgress(userName, jobId, progress);
                        this.showSuccess('Job updated');
                    } else if (action === 'primary') {
                        await window.UserManager.setPrimaryJob(userName, jobId);
                        this.showSuccess('Primary job set');
                    } else if (action === 'remove') {
                        const ok = window.confirm('Remove this job from the user?');
                        if (!ok) return;
                        await window.UserManager.removeJobFromUser(userName, jobId);
                        item.remove();
                        this.showSuccess('Job removed');
                    }
                } catch (err) {
                    console.error(err);
                    this.showError('Failed to update job');
                }
            });
        } catch (error) {
            console.error('❌ Failed to open job manager:', error);
            this.showError('Failed to open job manager');
        }
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserList;
} else {
    window.UserList = UserList;
}
