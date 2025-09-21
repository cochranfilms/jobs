/**
 * Dropdown Manager Module
 * Handles centralized dropdown options management using Component Library
 */

const DropdownManager = {
    // Dropdown options state
    state: {
        options: {
            roles: ['Photographer', 'Videographer', 'Editor', 'Assistant', 'Producer', 'Director'],
            locations: ['Atlanta Area', 'Atlanta Downtown', 'Atlanta Midtown', 'Buckhead', 'Decatur', 'Sandy Springs'],
            rates: ['$50/hour', '$75/hour', '$100/hour', '$125/hour', '$150/hour', '$200/hour', '$250/hour', '$300/hour'],
            projectTypes: ['Photography', 'Videography', 'Event Coverage', 'Portrait Session', 'Commercial', 'Wedding', 'Corporate', 'Product', 'Real Estate'],
            statuses: ['Active', 'Pending', 'Completed', 'Cancelled', 'On Hold', 'In Progress'],
            jobTypes: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Temporary', 'Seasonal']
        },
        isLoading: false,
        isDirty: false,
        lastSaved: null,
        filters: {
            category: 'all',
            searchTerm: ''
        }
    },

    // Initialize dropdown manager
    async init() {
        try {
            console.log('⚙️ Initializing Dropdown Manager...');
            
            // Wait for component library to be ready
            if (window.ComponentLibrary && !window.ComponentLibrary.isReady()) {
                await new Promise(resolve => {
                    window.addEventListener('componentLibraryReady', resolve, { once: true });
                });
            }
            
            // Load dropdown options from Firestore
            await this.loadDropdownOptions();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup auto-save
            this.setupAutoSave();
            
            console.log('✅ Dropdown Manager initialized');
            
        } catch (error) {
            console.error('❌ Dropdown Manager initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'dropdown-manager-init');
            }
        }
    },

    // Load dropdown options (Firestore only)
    async loadDropdownOptions() {
        try {
            this.state.isLoading = true;
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Loading dropdown options...');
            }

            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                try {
                    const fsOptions = await window.FirestoreDataManager.getDropdownOptions();
                    if (fsOptions && Object.keys(fsOptions).length) {
                        this.state.options = { ...this.state.options, ...fsOptions };
                        this.state.lastSaved = new Date();
                        console.log('✅ Loaded dropdown options from Firestore');
                    } else {
                        console.log('⚠️ No dropdown options in Firestore; using defaults');
                    }
                } catch (e) {
                    console.warn('⚠️ Firestore dropdown load failed:', e?.message || e);
                }
            } else {
                console.warn('⚠️ Firestore unavailable; using default dropdown options');
            }
            
        } catch (error) {
            console.log('⚠️ Using default dropdown options due to API error:', error.message);
        } finally {
            this.state.isLoading = false;
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Render dropdown management interface
    renderDropdownManagement(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('⚠️ Dropdown manager container not found');
            return;
        }

        // Create main container
        const mainContainer = document.createElement('div');
        mainContainer.className = 'dropdown-management-container';
        
        // Header section
        const headerSection = this.createHeaderSection();
        mainContainer.appendChild(headerSection);
        
        // Categories section
        const categoriesSection = this.createCategoriesSection();
        mainContainer.appendChild(categoriesSection);
        
        // Actions section
        const actionsSection = this.createActionsSection();
        mainContainer.appendChild(actionsSection);
        
        // Clear container and append new content
        container.innerHTML = '';
        container.appendChild(mainContainer);
        
        // Populate all lists
        this.populateAllLists();
        
        // Setup category-specific event listeners
        this.setupCategoryEventListeners();
    },

    // Create header section
    createHeaderSection() {
        const headerSection = document.createElement('div');
        headerSection.className = 'form-section';
        
        const title = document.createElement('h3');
        title.textContent = 'Manage Dropdown Options';
        
        const description = document.createElement('p');
        description.textContent = 'Add or remove options for roles, locations, rates, and project types used throughout the system.';
        description.className = 'section-description';
        
        headerSection.appendChild(title);
        headerSection.appendChild(description);
        
        return headerSection;
    },

    // Create categories section
    createCategoriesSection() {
        const categoriesSection = document.createElement('div');
        categoriesSection.className = 'categories-section';
        
        const categories = [
            { key: 'roles', label: '🎭 Roles', icon: 'user-tie' },
            { key: 'locations', label: '📍 Locations', icon: 'map-marker-alt' },
            { key: 'rates', label: '💰 Rates', icon: 'dollar-sign' },
            { key: 'projectTypes', label: '🎬 Project Types', icon: 'film' },
            { key: 'statuses', label: '📊 Statuses', icon: 'chart-bar' },
            { key: 'jobTypes', label: '💼 Job Types', icon: 'briefcase' }
        ];
        
        categories.forEach(category => {
            const categoryElement = this.createCategoryElement(category);
            categoriesSection.appendChild(categoryElement);
        });
        
        return categoriesSection;
    },

    // Create individual category element
    createCategoryElement(category) {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category-item';
        categoryDiv.dataset.category = category.key;
        
        const header = document.createElement('h4');
        header.innerHTML = `<i class="fas fa-${category.icon}"></i> ${category.label}`;
        
        const inputContainer = document.createElement('div');
        inputContainer.className = 'input-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `new${category.key.charAt(0).toUpperCase() + category.key.slice(1)}`;
        input.placeholder = `Add new ${category.key.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
        input.className = 'category-input';
        
        const addButton = document.createElement('button');
        addButton.className = 'add-button';
        addButton.innerHTML = '<i class="fas fa-plus"></i> Add';
        addButton.onclick = () => this.addDropdownOption(category.key, input.id);
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(addButton);
        
        const listContainer = document.createElement('div');
        listContainer.id = `${category.key}List`;
        listContainer.className = 'options-list';
        
        categoryDiv.appendChild(header);
        categoryDiv.appendChild(inputContainer);
        categoryDiv.appendChild(listContainer);
        
        return categoryDiv;
    },

    // Create actions section
    createActionsSection() {
        const actionsSection = document.createElement('div');
        actionsSection.className = 'actions-section';
        
        // Save button
        const saveButton = document.createElement('button');
        saveButton.className = 'save-button';
        saveButton.innerHTML = '<i class="fas fa-save"></i> Save All Changes';
        saveButton.onclick = () => this.saveDropdownOptions();
        
        // Save status
        const saveStatus = document.createElement('div');
        saveStatus.id = 'saveStatus';
        saveStatus.className = 'save-status';
        saveStatus.textContent = this.state.lastSaved ? 
            `Last saved: ${this.state.lastSaved.toLocaleString()}` : 
            'Not saved yet';
        
        // Additional action buttons
        const actionButtons = document.createElement('div');
        actionButtons.className = 'action-buttons';
        
        const resetButton = document.createElement('button');
        resetButton.className = 'secondary-button';
        resetButton.innerHTML = '<i class="fas fa-undo"></i> Reset to Defaults';
        resetButton.onclick = () => this.resetAllCategories();
        
        const exportButton = document.createElement('button');
        exportButton.className = 'secondary-button';
        exportButton.innerHTML = '<i class="fas fa-download"></i> Export';
        exportButton.onclick = () => this.exportDropdownOptions();
        
        const importButton = document.createElement('button');
        importButton.className = 'secondary-button';
        importButton.innerHTML = '<i class="fas fa-upload"></i> Import';
        importButton.onclick = () => this.triggerImportDialog();
        
        const cleanupButton = document.createElement('button');
        cleanupButton.className = 'secondary-button';
        cleanupButton.innerHTML = '<i class="fas fa-broom"></i> Cleanup Duplicates';
        cleanupButton.onclick = () => this.cleanupDuplicateOptions();
        
        actionButtons.appendChild(resetButton);
        actionButtons.appendChild(exportButton);
        actionButtons.appendChild(importButton);
        actionButtons.appendChild(cleanupButton);
        
        actionsSection.appendChild(saveButton);
        actionsSection.appendChild(saveStatus);
        actionsSection.appendChild(actionButtons);
        
        return actionsSection;
    },

    // Populate all dropdown lists
    populateAllLists() {
        Object.keys(this.state.options).forEach(category => {
            this.populateList(category);
        });
    },

    // Populate a specific dropdown list
    populateList(category) {
        const listElement = document.getElementById(`${category}List`);
        if (!listElement) return;

        const options = this.state.options[category] || [];
        
        listElement.innerHTML = options.map((option, index) => `
            <div class="option-item" data-category="${category}" data-index="${index}">
                <span class="option-text">${option}</span>
                <button class="remove-button" onclick="DropdownManager.removeDropdownOption('${category}', ${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    },

    // Add new dropdown option
    addDropdownOption(category, inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        const value = input.value.trim();
        if (!value) {
            if (window.NotificationManager) {
                window.NotificationManager.warning('Please enter a value', { title: 'Input Required' });
            }
            return;
        }

        // Check if option already exists
        if (this.state.options[category] && this.state.options[category].includes(value)) {
            if (window.NotificationManager) {
                window.NotificationManager.warning('Option already exists', { title: 'Duplicate Entry' });
            }
            return;
        }

        // Add to options
        if (!this.state.options[category]) {
            this.state.options[category] = [];
        }
        
        this.state.options[category].push(value);
        
        // Clear input
        input.value = '';
        
        // Mark as dirty
        this.state.isDirty = true;
        
        // Update display
        this.populateList(category);
        
        // Trigger option added event
        this.triggerEvent('dropdown:optionAdded', { category, value });
        
        if (window.NotificationManager) {
            window.NotificationManager.success(`Added "${value}" to ${category}`, { title: 'Option Added' });
        }
        
        console.log(`✅ Added "${value}" to ${category}`);
    },

    // Remove dropdown option
    removeDropdownOption(category, index) {
        if (!this.state.options[category] || index >= this.state.options[category].length) {
            return;
        }

        const removedValue = this.state.options[category][index];
        
        // Remove option
        this.state.options[category].splice(index, 1);
        
        // Mark as dirty
        this.state.isDirty = true;
        
        // Update display
        this.populateList(category);
        
        // Trigger option removed event
        this.triggerEvent('dropdown:optionRemoved', { category, value: removedValue });
        
        if (window.NotificationManager) {
            window.NotificationManager.success(`Removed "${removedValue}" from ${category}`, { title: 'Option Removed' });
        }
        
        console.log(`🗑️ Removed "${removedValue}" from ${category}`);
    },

    // Save dropdown options to Firestore
    async saveDropdownOptions() {
        try {
            this.state.isLoading = true;
            
            if (window.LoadingManager) {
                window.LoadingManager.show('Saving dropdown options...');
            }
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setDropdownOptions(this.state.options);
                this.state.isDirty = false;
                this.state.lastSaved = new Date();
                this.updateSaveStatus();
                if (window.NotificationManager) {
                    window.NotificationManager.success('Dropdown options saved successfully', { title: 'Saved' });
                }
                this.triggerEvent('dropdown:optionsSaved', { options: this.state.options });
                console.log('✅ Dropdown options saved successfully');
            } else {
                throw new Error('Firestore unavailable');
            }
            
        } catch (error) {
            console.error('❌ Error saving dropdown options:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error('Failed to save dropdown options', { 
                    title: 'Save Error',
                    details: error.message 
                });
            }
        } finally {
            this.state.isLoading = false;
            if (window.LoadingManager) {
                window.LoadingManager.hide();
            }
        }
    },

    // Update save status display
    updateSaveStatus() {
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            saveStatus.textContent = this.state.lastSaved ? 
                `Last saved: ${this.state.lastSaved.toLocaleString()}` : 
                'Not saved yet';
            
            if (this.state.isDirty) {
                saveStatus.textContent += ' (Unsaved changes)';
                saveStatus.classList.add('unsaved');
            } else {
                saveStatus.classList.remove('unsaved');
            }
        }
    },

    // Get dropdown options for a specific category
    getDropdownOptions(category) {
        return this.state.options[category] || [];
    },

    // Get all dropdown options
    getAllDropdownOptions() {
        return { ...this.state.options };
    },

    // Check if a value exists in a category
    hasOption(category, value) {
        return this.state.options[category] && this.state.options[category].includes(value);
    },

    // Add multiple options at once
    addMultipleOptions(category, values) {
        if (!Array.isArray(values)) return;

        values.forEach(value => {
            if (value && !this.hasOption(category, value)) {
                if (!this.state.options[category]) {
                    this.state.options[category] = [];
                }
                this.state.options[category].push(value);
            }
        });

        this.state.isDirty = true;
        this.populateList(category);
        
        console.log(`✅ Added ${values.length} options to ${category}`);
    },

    // Remove multiple options at once
    removeMultipleOptions(category, values) {
        if (!Array.isArray(values)) return;

        values.forEach(value => {
            const index = this.state.options[category]?.indexOf(value);
            if (index !== -1) {
                this.state.options[category].splice(index, 1);
            }
        });

        this.state.isDirty = true;
        this.populateList(category);
        
        console.log(`🗑️ Removed ${values.length} options from ${category}`);
    },

    // Reset category to defaults
    resetCategory(category) {
        const defaultOptions = {
            roles: ['Photographer', 'Videographer', 'Editor', 'Assistant', 'Producer', 'Director'],
            locations: ['Atlanta Area', 'Atlanta Downtown', 'Atlanta Midtown', 'Buckhead', 'Decatur', 'Sandy Springs'],
            rates: ['$50/hour', '$75/hour', '$100/hour', '$125/hour', '$150/hour', '$200/hour', '$250/hour', '$300/hour'],
            projectTypes: ['Photography', 'Videography', 'Event Coverage', 'Portrait Session', 'Commercial', 'Wedding', 'Corporate', 'Product', 'Real Estate'],
            statuses: ['Active', 'Pending', 'Completed', 'Cancelled', 'On Hold', 'In Progress'],
            jobTypes: ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Temporary', 'Seasonal']
        };

        if (defaultOptions[category]) {
            this.state.options[category] = [...defaultOptions[category]];
            this.state.isDirty = true;
            this.populateList(category);
            
            if (window.NotificationManager) {
                window.NotificationManager.info(`Reset ${category} to defaults`, { title: 'Category Reset' });
            }
        }
    },

    // Reset all categories to defaults
    resetAllCategories() {
        if (confirm('Are you sure you want to reset all dropdown options to defaults? This will remove all custom options.')) {
            Object.keys(this.state.options).forEach(category => {
                this.resetCategory(category);
            });
            
            this.state.isDirty = true;
            this.populateAllLists();
            
            if (window.NotificationManager) {
                window.NotificationManager.info('All categories reset to defaults', { title: 'Reset Complete' });
            }
        }
    },

    // Export dropdown options
    exportDropdownOptions() {
        try {
            const dataStr = JSON.stringify(this.state.options, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'dropdown-options.json';
            link.click();
            
            URL.revokeObjectURL(url);
            
            if (window.NotificationManager) {
                window.NotificationManager.success('Dropdown options exported', { title: 'Export Complete' });
            }
        } catch (error) {
            console.error('❌ Error exporting dropdown options:', error);
        }
    },

    // Import dropdown options
    async importDropdownOptions(file) {
        try {
            const text = await file.text();
            const importedOptions = JSON.parse(text);
            
            if (typeof importedOptions === 'object' && importedOptions !== null) {
                this.state.options = { ...this.state.options, ...importedOptions };
                this.state.isDirty = true;
                this.populateAllLists();
                
                if (window.NotificationManager) {
                    window.NotificationManager.success('Dropdown options imported successfully', { title: 'Import Complete' });
                }
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            console.error('❌ Error importing dropdown options:', error);
            if (window.NotificationManager) {
                window.NotificationManager.error('Failed to import dropdown options', { 
                    title: 'Import Error',
                    details: error.message 
                });
            }
        }
    },

    // Trigger import dialog
    triggerImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importDropdownOptions(file);
            }
        };
        input.click();
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for dropdown-related events
        document.addEventListener('dropdown:optionAdded', (e) => this.handleOptionChange(e));
        document.addEventListener('dropdown:optionRemoved', (e) => this.handleOptionChange(e));
        
        // Listen for window beforeunload to warn about unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.state.isDirty) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes to dropdown options. Are you sure you want to leave?';
            }
        });
    },

    // Setup category-specific event listeners
    setupCategoryEventListeners() {
        // Add enter key support for inputs
        document.querySelectorAll('.category-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const category = e.target.closest('.category-item').dataset.category;
                    const inputId = e.target.id;
                    this.addDropdownOption(category, inputId);
                }
            });
        });
    },

    // Handle option changes
    handleOptionChange(event) {
        this.state.isDirty = true;
        this.updateSaveStatus();
    },

    // Setup auto-save functionality
    setupAutoSave() {
        // Auto-save every 5 minutes if there are unsaved changes
        setInterval(() => {
            if (this.state.isDirty && !this.state.isLoading) {
                console.log('🔄 Auto-saving dropdown options...');
                this.saveDropdownOptions();
            }
        }, 300000); // 5 minutes
    },

    // Trigger custom events
    triggerEvent(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    },

    // Refresh dropdown options
    async refreshDropdownOptions() {
        await this.loadDropdownOptions();
        this.populateAllLists();
        this.updateSaveStatus();
    },

    // Get dropdown statistics
    getDropdownStats() {
        const stats = {};
        Object.keys(this.state.options).forEach(category => {
            stats[category] = this.state.options[category]?.length || 0;
        });
        return stats;
    },

    // Validate dropdown options
    validateDropdownOptions() {
        const errors = [];
        
        Object.entries(this.state.options).forEach(([category, options]) => {
            if (!Array.isArray(options)) {
                errors.push(`${category} is not an array`);
                return;
            }
            
            options.forEach((option, index) => {
                if (!option || typeof option !== 'string' || option.trim().length === 0) {
                    errors.push(`${category}[${index}] is empty or invalid`);
                }
            });
        });
        
        return errors;
    },

    // Clean up duplicate options
    cleanupDuplicateOptions() {
        let cleanedCount = 0;
        
        Object.keys(this.state.options).forEach(category => {
            if (Array.isArray(this.state.options[category])) {
                const originalLength = this.state.options[category].length;
                this.state.options[category] = [...new Set(this.state.options[category])];
                const newLength = this.state.options[category].length;
                
                if (originalLength !== newLength) {
                    cleanedCount += (originalLength - newLength);
                }
            }
        });
        
        if (cleanedCount > 0) {
            this.state.isDirty = true;
            this.populateAllLists();
            
            if (window.NotificationManager) {
                window.NotificationManager.success(`Cleaned up ${cleanedCount} duplicate options`, { title: 'Cleanup Complete' });
            }
        }
        
        return cleanedCount;
    },

    // Filter options by search term
    filterOptions(searchTerm) {
        this.state.filters.searchTerm = searchTerm;
        this.populateAllLists();
    },

    // Switch category view
    switchCategory(category) {
        this.state.filters.category = category;
        this.populateAllLists();
    },

    // Get filtered options
    getFilteredOptions(category) {
        let options = this.state.options[category] || [];
        
        if (this.state.filters.searchTerm) {
            const searchTerm = this.state.filters.searchTerm.toLowerCase();
            options = options.filter(option => 
                option.toLowerCase().includes(searchTerm)
            );
        }
        
        return options;
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DropdownManager;
} else {
    window.DropdownManager = DropdownManager;
}
