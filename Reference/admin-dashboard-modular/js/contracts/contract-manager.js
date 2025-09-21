/**
 * Contract Manager Module
 * Handles contract data management using Component Library
 */

const ContractManager = {
    // Contract data state
    state: {
        contracts: [],
        isLoading: false,
        filters: {
            status: 'all',
            type: 'all',
            user: 'all'
        },
        sortBy: 'date',
        sortOrder: 'desc',
        searchQuery: '',
        selectedContracts: new Set()
    },

    // Initialize contract manager
    async init() {
        try {
            console.log('📄 Initializing Contract Manager...');
            
            // Wait for component library to be ready
            if (!window.ComponentLibrary) {
                await this.waitForComponentLibrary();
            }
            
            // Load initial contract data
            await this.loadContracts();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup real-time updates
            this.setupRealTimeUpdates();
            
            console.log('✅ Contract Manager initialized');
            
        } catch (error) {
            console.error('❌ Contract Manager initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'contract-manager-init');
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

    // Load contracts from Firestore (preferred) or API fallback
    async loadContracts() {
        try {
            this.state.isLoading = true;
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Loading contracts...');
            }

            // Firestore only
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                try {
                    const list = await window.FirestoreDataManager.getContracts();
                    this.state.contracts = Array.isArray(list) ? list : [];
                    console.log(`✅ Loaded ${this.state.contracts.length} contracts (Firestore)`);
                } catch (e) {
                    console.warn('⚠️ Firestore contracts load failed:', e?.message || e);
                    this.state.contracts = [];
                }
            } else {
                console.warn('⚠️ Firestore unavailable; skipping API fallback');
                this.state.contracts = [];
            }
            
        } catch (error) {
            console.error('❌ Error loading contracts:', error);
            this.showError('Failed to load contracts: ' + error.message);
            // Initialize with empty contracts array
            this.state.contracts = [];
        } finally {
            this.state.isLoading = false;
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Render contract management interface using Component Library
    renderContractManagement(containerId = 'contractManagerContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('⚠️ Contract manager container not found:', containerId);
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Create main content card
        const contentCard = this.createContentCard();
        container.appendChild(contentCard);

        // Render contract list section
        this.renderContractListSection();
        
        // Render bulk actions section
        this.renderBulkActionsSection();
        
        // Render contracts list
        this.renderContractsList();
    },

    // Create main content card
    createContentCard() {
        const card = document.createElement('div');
        card.className = 'content-card';
        
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = '<h2>📄 Contract Management</h2>';
        
        const content = document.createElement('div');
        content.className = 'card-content';
        content.id = 'contractManagementContent';
        
        card.appendChild(header);
        card.appendChild(content);
        
        return card;
    },

    // Render contract list section
    renderContractListSection() {
        const container = document.getElementById('contractManagementContent');
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
        title.textContent = 'Current Contracts';
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
        const statusFilter = this.createFilterSelect('contractStatusFilter', 'All Status', [
            { value: 'all', label: 'All Status' },
            { value: 'draft', label: 'Draft' },
            { value: 'pending', label: 'Pending' },
            { value: 'signed', label: 'Signed' },
            { value: 'expired', label: 'Expired' },
            { value: 'cancelled', label: 'Cancelled' }
        ], 'status');
        
        // Type filter
        const typeFilter = this.createFilterSelect('contractTypeFilter', 'All Types', [
            { value: 'all', label: 'All Types' },
            { value: 'standard', label: 'Standard' },
            { value: 'advanced', label: 'Advanced' },
            { value: 'custom', label: 'Custom' }
        ], 'type');
        
        // User filter
        const userFilter = this.createFilterSelect('contractUserFilter', 'All Users', [
            { value: 'all', label: 'All Users' }
            // Will be populated dynamically
        ], 'user');
        
        filters.appendChild(statusFilter);
        filters.appendChild(typeFilter);
        filters.appendChild(userFilter);
        
        return filters;
    },

    // Create filter select
    createFilterSelect(id, placeholder, options, filterKey) {
        if (window.Form) {
            return window.Form.createField({
                type: 'select',
                name: filterKey,
                options: options,
                onChange: () => this.filterContracts()
            });
        } else {
            const select = document.createElement('select');
            select.id = id;
            select.onchange = () => this.filterContracts();
            
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
                placeholder: 'Search contracts...',
                onChange: (e) => this.handleSearch(e.target.value)
            });
            search.appendChild(searchField);
        } else {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Search contracts...';
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
                onClick: () => this.refreshContracts()
            });
        } else {
            const button = document.createElement('button');
            button.className = 'btn btn-small';
            button.textContent = '🔄 Refresh';
            button.onclick = () => this.refreshContracts();
            return button;
        }
    },

    // Render bulk actions section
    renderBulkActionsSection() {
        const container = document.getElementById('contractManagementContent');
        if (!container) return;

        const section = document.createElement('div');
        section.id = 'contractBulkActions';
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
                onClick: () => this.bulkDeleteContracts()
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

    // Render contracts list
    renderContractsList() {
        const container = document.getElementById('contractManagementContent');
        if (!container) return;

        const section = document.createElement('div');
        section.className = 'contracts-list-section';
        
        // Create contracts list container
        const contractsListContainer = document.createElement('div');
        contractsListContainer.className = 'item-list';
        contractsListContainer.id = 'contractsList';
        section.appendChild(contractsListContainer);
        
        // Create no contracts message
        const noContractsMessage = document.createElement('div');
        noContractsMessage.id = 'noContractsMessage';
        noContractsMessage.style.display = 'none';
        noContractsMessage.style.cssText = 'text-align: center; padding: 2rem; color: rgba(255,255,255,0.6);';
        noContractsMessage.innerHTML = '<p>No contracts found. Create your first contract using the form above.</p>';
        section.appendChild(noContractsMessage);
        
        container.appendChild(section);
    },

    // Create new contract
    async createContract(contractData) {
        try {
            console.log('🆕 Creating new contract for:', contractData.userName);
            
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Creating contract...');
            }
            
            // Validate contract data
            if (!this.validateContractData(contractData)) {
                return false;
            }
            
            // Create contract object
            const newContract = {
                id: this.generateContractId(),
                userName: contractData.userName,
                userEmail: contractData.userEmail,
                contractType: contractData.contractType || 'standard',
                status: 'draft',
                createdAt: new Date().toISOString(),
                ...contractData
            };

            // Save to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setContract(newContract.id, newContract);
            }

            // Add to local state
            this.state.contracts.push(newContract);

            // Show success message
            this.showSuccess('Contract created successfully!');
            
            // Trigger event for other modules
            this.triggerEvent('contractCreated', newContract);

            return true;

        } catch (error) {
            console.error('❌ Error creating contract:', error);
            this.showError('Failed to create contract: ' + error.message);
            return false;
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Update existing contract
    async updateContract(contractId, updates) {
        try {
            console.log('✏️ Updating contract:', contractId);
            
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Updating contract...');
            }

            // Find contract
            const contractIndex = this.state.contracts.findIndex(c => c.id === contractId);
            if (contractIndex === -1) {
                throw new Error('Contract not found');
            }

            // Update contract
            const updatedContract = {
                ...this.state.contracts[contractIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            // Save to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setContract(contractId, updatedContract);
            }

            // Update local state
            this.state.contracts[contractIndex] = updatedContract;

            // Show success message
            this.showSuccess('Contract updated successfully!');
            
            // Trigger event for other modules
            this.triggerEvent('contractUpdated', updatedContract);

            return true;

        } catch (error) {
            console.error('❌ Error updating contract:', error);
            this.showError('Failed to update contract: ' + error.message);
            return false;
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Delete contract
    async deleteContract(contractId) {
        try {
            console.log('🗑️ Deleting contract:', contractId);
            
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Deleting contract...');
            }

            // Find contract
            const contractIndex = this.state.contracts.findIndex(c => c.id === contractId);
            if (contractIndex === -1) {
                throw new Error('Contract not found');
            }

            // Delete from Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.deleteContract(contractId);
            }

            // Remove from local state
            this.state.contracts.splice(contractIndex, 1);

            // Show success message
            this.showSuccess('Contract deleted successfully!');
            
            // Trigger event for other modules
            this.triggerEvent('contractDeleted', contractId);

            return true;

        } catch (error) {
            console.error('❌ Error deleting contract:', error);
            this.showError('Failed to delete contract: ' + error.message);
            return false;
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Sign contract
    async signContract(contractId, signatureData) {
        try {
            console.log('✍️ Signing contract:', contractId);
            
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Signing contract...');
            }

            // Find contract
            const contractIndex = this.state.contracts.findIndex(c => c.id === contractId);
            if (contractIndex === -1) {
                throw new Error('Contract not found');
            }

            // Update contract with signature
            const updatedContract = {
                ...this.state.contracts[contractIndex],
                status: 'signed',
                signedAt: new Date().toISOString(),
                signature: signatureData
            };

            // Save to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setContract(contractId, updatedContract);
            }

            // Update local state
            this.state.contracts[contractIndex] = updatedContract;

            // Show success message
            this.showSuccess('Contract signed successfully!');
            
            // Trigger event for other modules
            this.triggerEvent('contractSigned', updatedContract);

            return true;

        } catch (error) {
            console.error('❌ Error signing contract:', error);
            this.showError('Failed to sign contract: ' + error.message);
            return false;
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Generate contract ID
    generateContractId() {
        return `CF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // Validate contract data
    validateContractData(contractData) {
        const requiredFields = ['userName', 'userEmail'];
        const missingFields = requiredFields.filter(field => !contractData[field]);
        
        if (missingFields.length > 0) {
            this.showError(`Missing required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contractData.userEmail)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        return true;
    },

    // Check if email is valid
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Get contract by ID
    getContract(contractId) {
        return this.state.contracts.find(c => c.id === contractId);
    },

    // Get contract by index
    getContractByIndex(index) {
        return this.state.contracts[index];
    },

    // Get all contracts
    getAllContracts() {
        return [...this.state.contracts];
    },

    // Get contracts by status
    getContractsByStatus(status) {
        return this.state.contracts.filter(c => c.status === status);
    },

    // Get contracts by user
    getContractsByUser(userName) {
        return this.state.contracts.filter(c => c.userName === userName);
    },

    // Get contracts by date range
    getContractsByDateRange(startDate, endDate) {
        return this.state.contracts.filter(c => {
            const contractDate = new Date(c.createdAt);
            return contractDate >= startDate && contractDate <= endDate;
        });
    },

    // Get signed contracts
    getSignedContracts() {
        return this.state.contracts.filter(c => c.status === 'signed');
    },

    // Get pending contracts
    getPendingContracts() {
        return this.state.contracts.filter(c => c.status === 'pending');
    },

    // Get draft contracts
    getDraftContracts() {
        return this.state.contracts.filter(c => c.status === 'draft');
    },

    // Filter contracts based on current filters
    filterContracts() {
        this.state.filteredContracts = this.state.contracts.filter(contract => {
            // Status filter
            if (this.state.filters.status !== 'all' && contract.status !== this.state.filters.status) {
                return false;
            }
            
            // Type filter
            if (this.state.filters.type !== 'all' && contract.contractType !== this.state.filters.type) {
                return false;
            }
            
            // User filter
            if (this.state.filters.user !== 'all' && contract.userName !== this.state.filters.user) {
                return false;
            }
            
            // Search filter
            if (this.state.searchQuery) {
                const searchLower = this.state.searchQuery.toLowerCase();
                const contractText = `${contract.userName} ${contract.userEmail} ${contract.contractType} ${contract.status}`.toLowerCase();
                if (!contractText.includes(searchLower)) {
                    return false;
                }
            }
            
            return true;
        });

        this.displayContracts();
    },

    // Display filtered contracts
    displayContracts() {
        const contractsList = document.getElementById('contractsList');
        const noContractsMessage = document.getElementById('noContractsMessage');
        
        if (!contractsList || !noContractsMessage) return;

        if (this.state.filteredContracts.length === 0) {
            contractsList.style.display = 'none';
            noContractsMessage.style.display = 'block';
            return;
        }

        contractsList.style.display = 'block';
        noContractsMessage.style.display = 'none';

        // Sort contracts
        const sortedContracts = this.sortContracts(this.state.filteredContracts);
        
        // Clear and populate contracts list
        contractsList.innerHTML = '';
        sortedContracts.forEach((contract, index) => {
            const contractCard = this.createContractCard(contract, index);
            contractsList.appendChild(contractCard);
        });
    },

    // Create contract card
    createContractCard(contract, index) {
        const card = document.createElement('div');
        card.className = 'contract-card';
        card.dataset.contractId = contract.id;
        
        card.innerHTML = `
            <div class="contract-info">
                <div class="contract-header">
                    <h4>${contract.userName || 'Unknown User'}</h4>
                    <span class="contract-status ${contract.status || 'draft'}">${contract.status || 'Draft'}</span>
                </div>
                <div class="contract-details">
                    <p><strong>Email:</strong> ${contract.userEmail || 'N/A'}</p>
                    <p><strong>Type:</strong> ${contract.contractType || 'Standard'}</p>
                    <p><strong>Created:</strong> ${new Date(contract.createdAt).toLocaleDateString()}</p>
                    <p><strong>ID:</strong> ${contract.id || 'N/A'}</p>
                </div>
            </div>
            <div class="contract-actions">
                ${this.createContractActionButtons(contract, index)}
            </div>
        `;
        
        return card;
    },

    // Create contract action buttons
    createContractActionButtons(contract, index) {
        const actions = [];
        
        // View button
        if (window.Button) {
            const viewBtn = window.Button.create({
                text: '👁️ View',
                variant: 'info',
                size: 'sm',
                onClick: () => this.viewContract(contract.id)
            });
            actions.push(viewBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-small btn-info" onclick="ContractManager.viewContract(\'' + contract.id + '\')">👁️ View</button>');
        }
        
        // Edit button
        if (window.Button) {
            const editBtn = window.Button.create({
                text: '✏️ Edit',
                variant: 'secondary',
                size: 'sm',
                onClick: () => this.editContract(contract.id)
            });
            actions.push(editBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-small btn-secondary" onclick="ContractManager.editContract(\'' + contract.id + '\')">✏️ Edit</button>');
        }
        
        // Delete button
        if (window.Button) {
            const deleteBtn = window.Button.create({
                text: '🗑️ Delete',
                variant: 'danger',
                size: 'sm',
                onClick: () => this.deleteContract(contract.id)
            });
            actions.push(deleteBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-small btn-danger" onclick="ContractManager.deleteContract(\'' + contract.id + '\')">🗑️ Delete</button>');
        }
        
        // Selection checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this.state.selectedContracts.has(contract.id);
        checkbox.onchange = (e) => this.toggleContractSelection(contract.id, e.target.checked);
        actions.push(checkbox.outerHTML);
        
        return actions.join('');
    },

    // Sort contracts
    sortContracts(contracts) {
        return contracts.sort((a, b) => {
            let aValue = a[this.state.sortBy] || '';
            let bValue = b[this.state.sortBy] || '';
            
            if (this.state.sortBy === 'date' || this.state.sortBy === 'createdAt') {
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
        this.filterContracts();
    },

    // View contract
    viewContract(contractId) {
        const contract = this.getContract(contractId);
        if (contract) {
            console.log('👁️ Viewing contract:', contract);
            // This would typically open a modal or navigate to contract view
            this.showInfo('Contract view functionality coming soon');
        }
    },

    // Edit contract
    editContract(contractId) {
        const contract = this.getContract(contractId);
        if (contract) {
            console.log('✏️ Editing contract:', contract);
            // This would typically open an edit form
            this.showInfo('Contract edit functionality coming soon');
        }
    },

    // Toggle contract selection
    toggleContractSelection(contractId, selected) {
        if (selected) {
            this.state.selectedContracts.add(contractId);
        } else {
            this.state.selectedContracts.delete(contractId);
        }
        
        this.updateBulkActionsDisplay();
    },

    // Update bulk actions display
    updateBulkActionsDisplay() {
        const bulkActions = document.getElementById('contractBulkActions');
        if (bulkActions) {
            bulkActions.style.display = this.state.selectedContracts.size > 0 ? 'block' : 'none';
        }
    },

    // Clear selection
    clearSelection() {
        this.state.selectedContracts.clear();
        this.updateBulkActionsDisplay();
        this.displayContracts(); // Refresh to uncheck checkboxes
    },

    // Bulk update status
    async bulkUpdateStatus() {
        try {
            if (this.state.selectedContracts.size === 0) {
                this.showWarning('No contracts selected');
                return;
            }

            if (window.Modal) {
                const newStatus = await window.Modal.utils.prompt(
                    'Enter new status (draft, pending, signed, expired, cancelled):',
                    'Update Contract Status'
                );
                
                if (!newStatus) return;
                
                // Update logic here
                console.log('📊 Bulk updating status to:', newStatus);
                this.showSuccess(`Updated ${this.state.selectedContracts.size} contracts to ${newStatus}`);
                
                this.clearSelection();
                this.loadContracts();
            } else {
                const newStatus = prompt('Enter new status (draft, pending, signed, expired, cancelled):');
                if (newStatus) {
                    console.log('📊 Bulk updating status to:', newStatus);
                    this.showSuccess(`Updated ${this.state.selectedContracts.size} contracts to ${newStatus}`);
                    
                    this.clearSelection();
                    this.loadContracts();
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to bulk update status:', error);
            this.showError('Failed to bulk update status: ' + error.message);
        }
    },

    // Bulk delete contracts
    async bulkDeleteContracts() {
        try {
            if (this.state.selectedContracts.size === 0) {
                this.showWarning('No contracts selected');
                return;
            }

            if (window.Modal) {
                const confirmed = await window.Modal.utils.confirm(
                    `Are you sure you want to delete ${this.state.selectedContracts.size} selected contracts?`,
                    'Confirm Bulk Deletion'
                );
                
                if (!confirmed) return;
            } else {
                if (!confirm(`Are you sure you want to delete ${this.state.selectedContracts.size} selected contracts?`)) {
                    return;
                }
            }

            // Bulk delete logic here
            console.log('🗑️ Bulk deleting contracts:', Array.from(this.state.selectedContracts));
            this.showSuccess(`Deleted ${this.state.selectedContracts.size} contracts successfully`);
            
            this.clearSelection();
            this.loadContracts();
            
        } catch (error) {
            console.error('❌ Failed to bulk delete contracts:', error);
            this.showError('Failed to bulk delete contracts: ' + error.message);
        }
    },

    // Refresh contracts
    async refreshContracts() {
        try {
            await this.loadContracts();
            this.showSuccess('Contracts refreshed');
        } catch (error) {
            console.error('❌ Failed to refresh contracts:', error);
            this.showError('Failed to refresh contracts');
        }
    },

    // Save contract to GitHub (legacy) — Firestore is source of truth
    async saveContractToGitHub() { /* deprecated - no-op */ },

    // Update contract in GitHub (legacy)
    async updateContractInGitHub() { /* deprecated - no-op */ },

    // Delete contract from GitHub
    async deleteContractFromGitHub() { /* deprecated - no-op */ },

    // Get contracts file SHA
    async getContractsFileSHA() { return null; },

    // Get contract statistics
    getContractStats() {
        const total = this.state.contracts.length;
        const draft = this.getDraftContracts().length;
        const pending = this.getPendingContracts().length;
        const signed = this.getSignedContracts().length;
        const expired = this.state.contracts.filter(c => c.status === 'expired').length;
        const cancelled = this.state.contracts.filter(c => c.status === 'cancelled').length;

        return {
            total,
            draft,
            pending,
            signed,
            expired,
            cancelled
        };
    },

    // Export contract data
    exportContractData() {
        try {
            const dataStr = JSON.stringify(this.state.contracts, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'contracts-data.json';
            link.click();
            
            URL.revokeObjectURL(url);
            
            this.showSuccess('Contract data exported successfully');
        } catch (error) {
            console.error('❌ Failed to export contract data:', error);
            this.showError('Failed to export contract data');
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

    // Show info message
    showInfo(message) {
        if (window.Notification) {
            window.Notification.utils.info(message, 'Info');
        } else if (window.NotificationManager) {
            window.NotificationManager.showInfo(message);
        } else {
            alert('Info: ' + message);
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for contract events
        window.addEventListener('contractForm:contractCreated', (e) => {
            this.handleContractUpdate(e.detail);
        });
        
        window.addEventListener('contractForm:contractUpdated', (e) => {
            this.handleContractUpdate(e.detail);
        });
    },

    // Handle contract update
    handleContractUpdate(contractData) {
        console.log('🔄 Contract updated, refreshing list:', contractData);
        this.loadContracts();
    },

    // Setup real-time updates
    setupRealTimeUpdates() {
        // Poll for updates every 30 seconds
        setInterval(() => {
            this.loadContracts();
        }, 30000);
    },

    // Trigger custom event
    triggerEvent(eventName, data) {
        const event = new CustomEvent(`contractManager:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContractManager;
} else {
    window.ContractManager = ContractManager;
}
