/**
 * Job Form Module
 * Handles job creation and editing forms using Component Library
 */

const JobForm = {
    // Form state
    state: {
        isEditing: false,
        editIndex: null,
        isLoading: false,
        dropdownOptions: {
            types: ['Photography', 'Videography', 'Event Coverage', 'Portrait Session', 'Commercial', 'Wedding', 'Other'],
            statuses: ['Active', 'Pending', 'Completed', 'Cancelled'],
            locations: ['Atlanta Area']
        },
        formElement: null
    },

    // Initialize job form
    async init() {
        try {
            console.log('📝 Initializing Job Form...');
            
            // Wait for component library to be ready
            if (!window.ComponentLibrary) {
                await this.waitForComponentLibrary();
            }
            
            // Load dropdown options
            await this.loadDropdownOptions();
            
            console.log('✅ Job Form initialized');
            
        } catch (error) {
            console.error('❌ Job Form initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'job-form-init');
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

    // Load dropdown options (Firestore only or defaults)
    async loadDropdownOptions() {
        try {
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                try {
                    const fsOptions = await window.FirestoreDataManager.getDropdownOptions();
                    if (fsOptions && Object.keys(fsOptions).length) {
                        this.state.dropdownOptions = {
                            types: fsOptions.projectTypes || this.state.dropdownOptions.types,
                            statuses: fsOptions.statuses || this.state.dropdownOptions.statuses,
                            locations: fsOptions.locations || this.state.dropdownOptions.locations
                        };
                        console.log('✅ Loaded dropdown options from Firestore');
                        return;
                    }
                } catch (_) {}
            }
            console.warn('⚠️ Firestore unavailable; using default dropdown options');
        } catch (error) {
            console.log('⚠️ Using default dropdown options');
            // Keep default options
        }
    },

    // Render the job form using Component Library
    renderForm(containerId = 'jobFormContainer') {
        const formContainer = document.getElementById(containerId);
        if (!formContainer) {
            console.warn('⚠️ Job form container not found:', containerId);
            return;
        }

        // Clear container
        formContainer.innerHTML = '';

        // Create form using Component Library
        const form = this.createJobForm();
        
        // Store form reference
        this.state.formElement = form;
        
        // Add form to container
        formContainer.appendChild(form);
        
        // Setup form event listeners
        this.setupFormEventListeners();
        
        console.log('✅ Job form rendered using Component Library');
    },

    // Create job form using Component Library
    createJobForm() {
        if (!window.Form) {
            console.error('❌ Form component not available');
            return this.createFallbackForm();
        }

        // Create form container
        const form = window.Form.createForm({
            id: 'jobForm',
            className: 'job-form',
            onSubmit: (data) => this.handleFormSubmission(data)
        });

        // Create form sections
        const basicInfoSection = this.createBasicInfoSection();
        const detailsSection = this.createDetailsSection();
        const actionsSection = this.createActionsSection();

        // Add sections to form
        form.appendChild(basicInfoSection);
        form.appendChild(detailsSection);
        form.appendChild(actionsSection);

        return form;
    },

    // Create basic information section
    createBasicInfoSection() {
        const section = window.Form.createSection({
            title: 'Basic Information',
            description: 'Job title and scheduling details'
        });

        const fields = [
            window.Form.createField({
                type: 'text',
                name: 'title',
                label: 'Job Title',
                placeholder: 'Enter job title',
                required: true,
                validation: { minLength: 3, maxLength: 100 }
            }),
            window.Form.createField({
                type: 'date',
                name: 'date',
                label: 'Event Date',
                helpText: 'When the job/event will take place'
            })
        ];

        fields.forEach(field => section.querySelector('.section-content').appendChild(field));
        return section;
    },

    // Create job details section
    createDetailsSection() {
        const section = window.Form.createSection({
            title: 'Job Details',
            description: 'Location, pay rate, type, and status'
        });

        const fields = [
            window.Form.createField({
                type: 'text',
                name: 'location',
                label: 'Location',
                value: 'Atlanta Area',
                helpText: 'Where the job will be performed'
            }),
            window.Form.createField({
                type: 'text',
                name: 'pay',
                label: 'Pay Rate',
                placeholder: 'Enter pay rate (e.g., $500/day)',
                helpText: 'Compensation for the job'
            }),
            window.Form.createField({
                type: 'select',
                name: 'type',
                label: 'Job Type',
                options: this.state.dropdownOptions.types || [],
                selectedValue: 'Photography'
            }),
            window.Form.createField({
                type: 'select',
                name: 'status',
                label: 'Job Status',
                options: this.state.dropdownOptions.statuses || [],
                selectedValue: 'Active'
            }),
            window.Form.createField({
                type: 'textarea',
                name: 'description',
                label: 'Job Description',
                placeholder: 'Describe the job requirements and details',
                rows: 3,
                helpText: 'Detailed description of what needs to be done'
            })
        ];

        fields.forEach(field => section.querySelector('.section-content').appendChild(field));
        return section;
    },

    // Create form actions section
    createActionsSection() {
        const submitText = this.state.isEditing ? '✏️ Update Job' : '➕ Add Job';
        const cancelText = this.state.isEditing ? '❌ Cancel Edit' : null;

        return window.Form.createActions({
            submitText: submitText,
            cancelText: cancelText,
            onSubmit: (data) => this.handleFormSubmission(data),
            onCancel: () => this.state.isEditing ? this.cancelEdit() : this.clearForm(),
            submitVariant: 'primary',
            cancelVariant: 'secondary',
            additionalActions: [
                {
                    text: '🎯 Assign to Users',
                    variant: 'info',
                    onClick: () => this.assignJobsToUsers()
                }
            ]
        });
    },

    // Create fallback form (when Component Library not available)
    createFallbackForm() {
        const form = document.createElement('form');
        form.id = 'jobForm';
        form.className = 'job-form';
        form.innerHTML = `
            <div class="form-section">
                <h3>Add/Edit Job</h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <input type="text" id="jobTitle" name="title" placeholder="Job Title" required>
                    <input type="date" id="jobDate" name="date" placeholder="Event Date">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <input type="text" id="jobLocation" name="location" placeholder="Location" value="Atlanta Area">
                    <input type="text" id="jobPay" name="pay" placeholder="Pay Rate">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <select id="jobType" name="type">
                        ${this.renderDropdownOptions(this.state.dropdownOptions.types, 'Photography')}
                    </select>
                    <select id="jobStatus" name="status">
                        ${this.renderDropdownOptions(this.state.dropdownOptions.statuses, 'Active')}
                    </select>
                </div>
                <textarea id="jobDescription" name="description" placeholder="Job Description" rows="3"></textarea>
                <div class="form-actions">
                    <button type="submit" class="btn" id="jobSubmitBtn">➕ Add Job</button>
                    <button type="button" class="btn btn-secondary" onclick="JobForm.clearForm()">🔄 Clear</button>
                    <button type="button" class="btn btn-secondary" onclick="JobForm.assignJobsToUsers()">🎯 Assign to Users</button>
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

    // Render dropdown options (for fallback form)
    renderDropdownOptions(options, defaultValue) {
        if (!options || !Array.isArray(options)) return '';
        
        return options.map(option => 
            `<option value="${option}" ${option === defaultValue ? 'selected' : ''}>${option}</option>`
        ).join('');
    },

    // Setup form event listeners
    setupFormEventListeners() {
        if (!this.state.formElement) return;
        
        // Form submission is handled by Component Library
        // Additional setup can be added here if needed
        console.log('✅ Form event listeners setup complete');
    },

    // Handle form submission
    async handleFormSubmission(formData) {
        try {
            console.log('📝 Job form submitted:', formData);
            
            if (this.state.isEditing) {
                await this.updateExistingJob(formData);
            } else {
                await this.createNewJob(formData);
            }
            
        } catch (error) {
            console.error('❌ Form submission failed:', error);
            this.showError('Failed to save job. Please try again.');
        }
    },

    // Create new job
    async createNewJob(jobData) {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Creating job...');
            }

            // Validate required fields
            if (!this.validateFormData(jobData)) {
                return;
            }

            // Create job object
            const newJob = {
                title: jobData.title,
                date: jobData.date || '',
                location: jobData.location || 'Atlanta Area',
                pay: jobData.pay || '',
                type: jobData.type || 'Photography',
                status: jobData.status || 'Active',
                description: jobData.description || '',
                createdAt: new Date().toISOString()
            };

            // Save to Firestore
            const id = `job-${(newJob.title || 'job').toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                await window.FirestoreDataManager.setJobListing(id, newJob);
            }

            // Show success message
            this.showSuccess('Job created successfully!');
            
            // Clear form
            this.clearForm();
            
            // Trigger event for other modules
            this.triggerEvent('jobCreated', newJob);

        } catch (error) {
            console.error('❌ Failed to create job:', error);
            this.showError('Failed to create job: ' + error.message);
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Update existing job
    async updateExistingJob(jobData) {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Updating job...');
            }

            // Validate required fields
            if (!this.validateFormData(jobData)) {
                return;
            }

            // Get existing job data
            const existingJobs = await this.getExistingJobs();
            const jobIndex = this.state.editIndex;
            
            if (jobIndex === null || jobIndex < 0 || jobIndex >= existingJobs.length) {
                throw new Error('Job not found');
            }

            // Update job data
            const updatedJob = {
                ...existingJobs[jobIndex],
                title: jobData.title,
                date: jobData.date || '',
                location: jobData.location || 'Atlanta Area',
                pay: jobData.pay || '',
                type: jobData.type || 'Photography',
                status: jobData.status || 'Active',
                description: jobData.description || '',
                updatedAt: new Date().toISOString()
            };

            // Update in Firestore
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                const id = updatedJob.id || `job-${(updatedJob.title || 'job').toLowerCase().replace(/\s+/g, '-')}`;
                const { id: _omit, ...payload } = updatedJob;
                await window.FirestoreDataManager.setJobListing(id, payload);
            }

            // Show success message
            this.showSuccess('Job updated successfully!');
            
            // Exit edit mode
            this.exitEditMode();
            
            // Trigger event for other modules
            this.triggerEvent('jobUpdated', updatedJob);

        } catch (error) {
            console.error('❌ Failed to update job:', error);
            this.showError('Failed to update job: ' + error.message);
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Validate form data
    validateFormData(jobData) {
        const requiredFields = ['title'];
        const missingFields = requiredFields.filter(field => !jobData[field]);
        
        if (missingFields.length > 0) {
            this.showError(`Missing required fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Title validation
        if (jobData.title.length < 3) {
            this.showError('Job title must be at least 3 characters long');
            return false;
        }

        return true;
    },

    // Get existing jobs (Firestore)
    async getExistingJobs() {
        try {
            if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable()) {
                const listings = await window.FirestoreDataManager.getJobListings();
                return listings || [];
            }
            return [];
        } catch (error) {
            console.warn('⚠️ Could not get existing jobs:', error);
            return [];
        }
    },

    // Edit job
    async editJob(jobIndex) {
        try {
            console.log('✏️ Editing job at index:', jobIndex);
            
            // Get job data
            const jobs = await this.getExistingJobs();
            const job = jobs[jobIndex];
            
            if (!job) {
                throw new Error('Job not found');
            }

            // Set edit state
            this.state.isEditing = true;
            this.state.editIndex = jobIndex;

            // Populate form fields
            this.populateFormFields(job);

            // Update form actions
            this.updateFormForEditing();

            console.log('✅ Job edit mode activated');

        } catch (error) {
            console.error('❌ Failed to enter edit mode:', error);
            this.showError('Failed to load job for editing');
        }
    },

    // Populate form fields with job data
    populateFormFields(job) {
        if (!this.state.formElement) return;

        const fields = this.state.formElement.querySelectorAll('input, select, textarea');
        fields.forEach(field => {
            const fieldName = field.name;
            if (job[fieldName] !== undefined) {
                if (field.type === 'checkbox') {
                    field.checked = Boolean(job[fieldName]);
                } else {
                    field.value = job[fieldName];
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
            titleElement.textContent = 'Edit Job';
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
        this.state.editIndex = null;
        
        // Re-render form
        const container = document.getElementById('jobFormContainer');
        if (container) {
            this.renderForm('jobFormContainer');
        }
    },

    // Exit edit mode
    exitEditMode() {
        this.state.isEditing = false;
        this.state.editIndex = null;
        
        // Re-render form
        const container = document.getElementById('jobFormContainer');
        if (container) {
            this.renderForm('jobFormContainer');
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
        const event = new CustomEvent(`jobForm:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
    },

    // Refresh dropdown options
    async refreshDropdownOptions() {
        await this.loadDropdownOptions();
        console.log('✅ Dropdown options refreshed');
    },

    // Assign jobs to users (placeholder for future implementation)
    async assignJobsToUsers() {
        console.log('🎯 Job assignment functionality - to be implemented');
        // This will be implemented in Phase 4
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JobForm;
} else {
    window.JobForm = JobForm;
}
