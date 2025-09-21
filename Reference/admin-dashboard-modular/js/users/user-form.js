/**
 * User Form Module
 * Handles user creation and editing forms using Component Library
 */

const UserForm = {
    // Form state
    state: {
        isEditing: false,
        editUserName: null,
        formData: {},
        dropdownOptions: {},
        formElement: null
    },

    // Initialize user form
    async init() {
        try {
            console.log('📝 Initializing User Form...');
            
            // Wait for component library to be ready
            if (!window.ComponentLibrary) {
                await this.waitForComponentLibrary();
            }
            
            // Load dropdown options
            await this.loadDropdownOptions();
            
            console.log('✅ User Form initialized');
            
        } catch (error) {
            console.error('❌ User Form initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'user-form-init');
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

    // Load dropdown options
    async loadDropdownOptions() {
        try {
            // Try Firestore first
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                try {
                    const fsOptions = await window.FirestoreDataManager.getDropdownOptions();
                    if (fsOptions && Object.keys(fsOptions).length) {
                        this.state.dropdownOptions = fsOptions;
                        console.log('✅ Loaded dropdown options from Firestore');
                        return;
                    }
                } catch (_) {}
            }
            console.warn('⚠️ Firestore unavailable; using default dropdown options');
            this.state.dropdownOptions = this.getDefaultDropdownOptions();
        } catch (error) {
            console.warn('⚠️ Error loading dropdown options, using defaults:', error);
            this.state.dropdownOptions = this.getDefaultDropdownOptions();
        }
    },

    // Get default dropdown options
    getDefaultDropdownOptions() {
        return {
            roles: ['Backdrop Photographer', 'Editor', 'Videographer', 'Photographer', 'Full Stack Designer', 'Video Editor', 'Corporate Videographer'],
            locations: ['6695 Church Street, Douglasville, GA 30134', 'Sandy Springs, GA', 'Douglasville, GA', 'Atlanta, GA', 'Atlanta Area'],
            rates: ['$400.00 USD (Flat)', '$450.00 USD (Flat)', '$500.00 USD (Flat)', '$750.00 USD (Flat)', '$900.00 USD (Flat)', '$150/day', '$200/day'],
            projectTypes: ['Photography', 'Video', 'Editor Project', 'Corporate Video', 'Event Coverage', 'Product Photography', 'Real Estate', 'Wedding', 'Commercial']
        };
    },

    // Render user creation form using Component Library
    renderForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('❌ Container not found:', containerId);
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Create form using Component Library
        const form = this.createUserForm();
        
        // Store form reference
        this.state.formElement = form;
        
        // Add form to container
        container.appendChild(form);
        
        // Populate job selection dropdown
        this.populateJobDropdown();
        
        // Setup form submission
        this.setupFormSubmission();
    },

    // Create user form using Component Library
    createUserForm() {
        if (!window.Form) {
            console.error('❌ Form component not available');
            return this.createFallbackForm();
        }

        // Create form container
        const form = window.Form.createForm({
            id: 'userForm',
            className: 'user-form',
            onSubmit: (data) => this.handleFormSubmission(data)
        });

        // Create form sections
        const personalInfoSection = this.createPersonalInfoSection();
        const roleSection = this.createRoleSection();
        const projectSection = this.createProjectSection();
        const contractSection = this.createContractSection();
        const actionsSection = this.createActionsSection();

        // Add sections to form
        form.appendChild(personalInfoSection);
        form.appendChild(roleSection);
        form.appendChild(projectSection);
        form.appendChild(contractSection);
        form.appendChild(actionsSection);

        return form;
    },

    // Create personal information section
    createPersonalInfoSection() {
        const section = window.Form.createSection({
            title: 'Personal Information',
            description: 'Basic user details and contact information'
        });

        const fields = [
            window.Form.createField({
                type: 'text',
                name: 'name',
                label: 'Full Name',
                placeholder: 'Enter full name',
                required: true,
                validation: { minLength: 2, maxLength: 100 }
            }),
            window.Form.createField({
                type: 'email',
                name: 'email',
                label: 'Email Address',
                placeholder: 'Enter email address',
                required: true,
                validation: { email: true }
            })
        ];

        fields.forEach(field => section.querySelector('.section-content').appendChild(field));
        return section;
    },

    // Create role and location section
    createRoleSection() {
        const section = window.Form.createSection({
            title: 'Role & Location',
            description: 'User role and geographical information'
        });

        const fields = [
            window.Form.createField({
                type: 'select',
                name: 'role',
                label: 'Role',
                required: true,
                options: this.state.dropdownOptions.roles || []
            }),
            window.Form.createField({
                type: 'select',
                name: 'location',
                label: 'Location',
                required: true,
                options: this.state.dropdownOptions.locations || []
            })
        ];

        fields.forEach(field => section.querySelector('.section-content').appendChild(field));
        return section;
    },

    // Create project and job section
    createProjectSection() {
        const section = window.Form.createSection({
            title: 'Project & Job Assignment',
            description: 'Project type and job assignment details'
        });

        const fields = [
            window.Form.createField({
                type: 'select',
                name: 'jobSelection',
                label: 'Job Assignment',
                options: [{ value: '', label: 'Select Job (from jobs-data)...' }],
                helpText: 'Choose from available jobs'
            }),
            window.Form.createField({
                type: 'select',
                name: 'projectType',
                label: 'Project Type',
                options: this.state.dropdownOptions.projectTypes || []
            })
        ];

        fields.forEach(field => section.querySelector('.section-content').appendChild(field));
        return section;
    },

    // Create contract and rate section
    createContractSection() {
        const section = window.Form.createSection({
            title: 'Contract & Rate Information',
            description: 'Rate details and contract information'
        });

        const fields = [
            window.Form.createField({
                type: 'select',
                name: 'rate',
                label: 'Rate',
                required: true,
                options: this.state.dropdownOptions.rates || []
            }),
            window.Form.createField({
                type: 'date',
                name: 'approvedDate',
                label: 'Approved Date',
                helpText: 'Date when user was approved'
            }),
            window.Form.createField({
                type: 'date',
                name: 'projectDate',
                label: 'Project Start Date',
                helpText: 'When the project begins'
            }),
            window.Form.createField({
                type: 'text',
                name: 'contractUrl',
                label: 'Contract URL',
                value: 'contract.html',
                readonly: true,
                helpText: '📝 All creators use the same contract.html portal. No individual files needed!'
            })
        ];

        fields.forEach(field => section.querySelector('.section-content').appendChild(field));
        return section;
    },

    // Create form actions section
    createActionsSection() {
        const submitText = this.state.isEditing ? '✏️ Update User' : '➕ Save User';
        const cancelText = this.state.isEditing ? '❌ Cancel Edit' : null;

        return window.Form.createActions({
            submitText: submitText,
            cancelText: cancelText,
            onSubmit: (data) => this.handleFormSubmission(data),
            onCancel: () => this.state.isEditing ? this.cancelEdit() : this.clearForm(),
            submitVariant: 'primary',
            cancelVariant: 'secondary'
        });
    },

    // Create fallback form (when Component Library not available)
    createFallbackForm() {
        const form = document.createElement('form');
        form.id = 'userForm';
        form.className = 'user-form';
        form.innerHTML = `
            <div class="form-section">
                <h3>Add New User</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label for="userName">Full Name *</label>
                        <input type="text" id="userName" name="name" placeholder="Enter full name" required>
                    </div>
                    <div class="form-group">
                        <label for="userEmail">Email Address *</label>
                        <input type="email" id="userEmail" name="email" placeholder="Enter email address" required>
                    </div>
                </div>
                <!-- Additional form fields would go here -->
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">
                        ${this.state.isEditing ? '✏️ Update User' : '➕ Save User'}
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="UserForm.clearForm()">
                        🔄 Clear
                    </button>
                </div>
            </div>
        `;
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            this.handleFormSubmission(Object.fromEntries(formData));
        });
        
        return form;
    },

    // Populate job selection dropdown
    async populateJobDropdown() {
        try {
            const jobSelect = this.state.formElement?.querySelector('select[name="jobSelection"]');
            if (!jobSelect) return;

            let jobs = [];
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                jobs = (await window.FirestoreDataManager.getJobListings()) || [];
            }
                 
                // Clear existing options except the first one
                while (jobSelect.children.length > 1) {
                    jobSelect.removeChild(jobSelect.lastChild);
                }
                
                jobs.forEach((job, idx) => {
                    const option = document.createElement('option');
                    option.value = String(idx);
                    option.textContent = job.title || 'Untitled Job';
                    jobSelect.appendChild(option);
                });
                
            console.log('✅ Populated job dropdown with', jobs.length, 'jobs');
        } catch (error) {
            console.warn('⚠️ Error populating job dropdown:', error);
        }
    },

    // Setup form submission
    setupFormSubmission() {
        if (!this.state.formElement) return;
        
        // Form submission is handled by Component Library
        // Additional setup can be added here if needed
        console.log('✅ Form submission setup complete');
    },

    // Handle form submission
    async handleFormSubmission(formData) {
        try {
            console.log('📝 Form submitted:', formData);
            
            if (this.state.isEditing) {
                await this.updateExistingUser(formData);
            } else {
                await this.createNewUser(formData);
            }
            
        } catch (error) {
            console.error('❌ Form submission failed:', error);
            this.showError('Failed to save user. Please try again.');
        }
    },

    // Create new user
    async createNewUser(userData) {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Creating user...');
            }

            // Validate required fields
            if (!this.validateFormData(userData)) {
                return;
            }

            // Create user object
            const newUser = {
                name: userData.name,
                email: userData.email,
                role: userData.role,
                location: userData.location,
                rate: userData.rate,
                jobSelection: userData.jobSelection || '',
                projectType: userData.projectType || '',
                approvedDate: userData.approvedDate || '',
                projectDate: userData.projectDate || '',
                contractUrl: userData.contractUrl || 'contract.html',
                status: 'Active',
                createdAt: new Date().toISOString()
            };

            // Save to Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setUser(newUser.name, {
                    profile: {
                        email: newUser.email,
                        role: newUser.role,
                        location: newUser.location,
                        rate: newUser.rate,
                        projectType: newUser.projectType,
                        approvedDate: newUser.approvedDate,
                        projectDate: newUser.projectDate
                    },
                    contract: { contractUrl: newUser.contractUrl, contractStatus: 'pending' },
                    application: { status: 'pending', updatedAt: new Date().toISOString() }
                });
            }

            // Show success message
            this.showSuccess('User created successfully!');
            
            // Clear form
            this.clearForm();
            
            // Trigger event for other modules
            this.triggerEvent('userCreated', newUser);

        } catch (error) {
            console.error('❌ Failed to create user:', error);
            this.showError('Failed to create user: ' + error.message);
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Update existing user
    async updateExistingUser(userData) {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Updating user...');
            }

            // Validate required fields
            if (!this.validateFormData(userData)) {
                return;
            }

            // Get existing user data
            const existingUsers = await this.getExistingUsers();
            const userIndex = existingUsers.findIndex(u => u.name === this.state.editUserName);
            
            if (userIndex === -1) {
                throw new Error('User not found');
            }

            // Update user data
            const updatedUser = {
                ...existingUsers[userIndex],
                name: userData.name,
                email: userData.email,
                role: userData.role,
                location: userData.location,
                rate: userData.rate,
                jobSelection: userData.jobSelection || '',
                projectType: userData.projectType || '',
                approvedDate: userData.approvedDate || '',
                projectDate: userData.projectDate || '',
                contractUrl: userData.contractUrl || 'contract.html',
                updatedAt: new Date().toISOString()
            };

            // Update in Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setUser(updatedUser.name, {
                    profile: {
                        email: updatedUser.email,
                        role: updatedUser.role,
                        location: updatedUser.location,
                        rate: updatedUser.rate,
                        projectType: updatedUser.projectType,
                        approvedDate: updatedUser.approvedDate,
                        projectDate: updatedUser.projectDate
                    },
                    contract: { contractUrl: updatedUser.contractUrl },
                    application: { ...(updatedUser.application || {}), updatedAt: new Date().toISOString() }
                });
            }

            // Show success message
            this.showSuccess('User updated successfully!');
            
            // Exit edit mode
            this.exitEditMode();
            
            // Trigger event for other modules
            this.triggerEvent('userUpdated', updatedUser);

        } catch (error) {
            console.error('❌ Failed to update user:', error);
            this.showError('Failed to update user: ' + error.message);
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Validate form data
    validateFormData(userData) {
        const requiredFields = ['name', 'email', 'role', 'location', 'rate'];
        const missingFields = requiredFields.filter(field => !userData[field]);
        
        if (missingFields.length > 0) {
            this.showError(`Missing required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            this.showError('Please enter a valid email address');
            return false;
        }

        return true;
    },

    // Save/Update to GitHub deprecated (no-ops)
    async saveUserToGitHub() { /* deprecated - no-op */ },
    async updateUserInGitHub() { /* deprecated - no-op */ },
    async getUsersFileSHA() { return null; },

    // Get existing users
    async getExistingUsers() {
        try {
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                const usersObj = await window.FirestoreDataManager.getUsers();
                // Convert map to array with name field
                return Object.entries(usersObj || {}).map(([name, data]) => ({ name, ...data.profile, contractUrl: data.contract?.contractUrl }));
            }
            return [];
        } catch (error) {
            console.warn('⚠️ Could not get existing users:', error);
            return [];
        }
    },

    // Edit user
    async editUser(userName) {
        try {
            console.log('✏️ Editing user:', userName);
            
            // Get user data
            const users = await this.getExistingUsers();
            const user = users.find(u => u.name === userName);
            
            if (!user) {
                throw new Error('User not found');
            }

            // Set edit state
            this.state.isEditing = true;
            this.state.editUserName = userName;
            this.state.formData = user;

            // Populate form fields
            this.populateFormFields(user);

            // Update form actions
            this.updateFormForEditing();

            console.log('✅ User edit mode activated');

        } catch (error) {
            console.error('❌ Failed to enter edit mode:', error);
            this.showError('Failed to load user for editing');
        }
    },

    // Populate form fields with user data
    populateFormFields(user) {
        if (!this.state.formElement) return;

        const fields = this.state.formElement.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            const fieldName = field.name;
            if (user[fieldName] !== undefined) {
                if (field.type === 'checkbox') {
                    field.checked = Boolean(user[fieldName]);
                } else {
                    field.value = user[fieldName];
                }
            }
        });
    },

    // Update form for editing mode
    updateFormForEditing() {
        if (!this.state.formElement) return;

        // Update form title
        const titleElement = this.state.formElement.querySelector('.section-header h3');
        if (titleElement) {
            titleElement.textContent = 'Edit User';
        }

        // Update actions section
        const actionsSection = this.state.formElement.querySelector('.form-actions');
        if (actionsSection) {
            actionsSection.innerHTML = '';
            const newActions = this.createActionsSection();
            actionsSection.appendChild(newActions);
        }
    },

    // Cancel edit mode
    cancelEdit() {
        console.log('❌ Cancelling edit mode');
        
        this.state.isEditing = false;
        this.state.editUserName = null;
        this.state.formData = {};
        
        // Re-render form
        const container = document.getElementById('userForm')?.parentElement;
        if (container) {
            this.renderForm(container.id);
        }
    },

    // Exit edit mode
    exitEditMode() {
        this.state.isEditing = false;
        this.state.editUserName = null;
        this.state.formData = {};
        
        // Re-render form
        const container = document.getElementById('userForm')?.parentElement;
        if (container) {
            this.renderForm(container.id);
        }
    },

    // Clear form
    clearForm() {
        if (!this.state.formElement) return;

        // Reset form using Component Library
        if (window.Form) {
            window.Form.resetForm(this.state.formElement);
        } else {
            // Fallback reset
            this.state.formElement.reset();
        }

        // Clear any custom state
        this.state.formData = {};
        
        console.log('✅ Form cleared');
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

    // Trigger custom event
    triggerEvent(eventName, data) {
        const event = new CustomEvent(`userForm:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
    },

    // Refresh dropdown options
    async refreshDropdownOptions() {
        await this.loadDropdownOptions();
        console.log('✅ Dropdown options refreshed');
    },

    // Add dropdown option
    addDropdownOption(category, option) {
        if (!this.state.dropdownOptions[category]) {
            this.state.dropdownOptions[category] = [];
        }
        
        if (!this.state.dropdownOptions[category].includes(option)) {
            this.state.dropdownOptions[category].push(option);
            console.log(`✅ Added ${option} to ${category}`);
        }
    },

    // Save dropdown options
    async saveDropdownOptions() {
        try {
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setDropdownOptions(this.state.dropdownOptions);
                console.log('✅ Dropdown options saved to Firestore');
            } else {
                console.warn('⚠️ Firestore unavailable; cannot save dropdown options');
            }
        } catch (error) {
            console.error('❌ Error saving dropdown options:', error);
        }
    },

    // Assign jobs to users (placeholder for future implementation)
    async assignJobsToUsers() {
        console.log('🔄 Job assignment functionality - to be implemented');
        // This will be implemented in Phase 4
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserForm;
} else {
    window.UserForm = UserForm;
}
