/**
 * Form Component System
 * Professional form components with validation and consistent styling
 */

const Form = {
    // Form field types and configurations
    fieldTypes: {
        text: {
            tag: 'input',
            attributes: { type: 'text' },
            validation: ['required', 'minLength', 'maxLength', 'pattern']
        },
        email: {
            tag: 'input',
            attributes: { type: 'email' },
            validation: ['required', 'email', 'pattern']
        },
        password: {
            tag: 'input',
            attributes: { type: 'password' },
            validation: ['required', 'minLength', 'maxLength', 'pattern']
        },
        number: {
            tag: 'input',
            attributes: { type: 'number' },
            validation: ['required', 'min', 'max', 'step']
        },
        date: {
            tag: 'input',
            attributes: { type: 'date' },
            validation: ['required', 'min', 'max']
        },
        time: {
            tag: 'input',
            attributes: { type: 'time' },
            validation: ['required']
        },
        datetime: {
            tag: 'input',
            attributes: { type: 'datetime-local' },
            validation: ['required', 'min', 'max']
        },
        textarea: {
            tag: 'textarea',
            attributes: {},
            validation: ['required', 'minLength', 'maxLength']
        },
        select: {
            tag: 'select',
            attributes: {},
            validation: ['required']
        },
        checkbox: {
            tag: 'input',
            attributes: { type: 'checkbox' },
            validation: ['required']
        },
        radio: {
            tag: 'input',
            attributes: { type: 'radio' },
            validation: ['required']
        },
        file: {
            tag: 'input',
            attributes: { type: 'file' },
            validation: ['required', 'accept', 'maxSize']
        }
    },

    // Validation rules
    validationRules: {
        required: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        minLength: (value, min) => value.toString().length >= min,
        maxLength: (value, max) => value.toString().length <= max,
        min: (value, min) => parseFloat(value) >= parseFloat(min),
        max: (value, max) => parseFloat(value) <= parseFloat(max),
        pattern: (value, pattern) => new RegExp(pattern).test(value),
        step: (value, step) => parseFloat(value) % parseFloat(step) === 0,
        accept: (value, accept) => {
            const file = value.files?.[0];
            if (!file) return false;
            const acceptedTypes = accept.split(',').map(t => t.trim());
            return acceptedTypes.some(type => {
                if (type.startsWith('.')) {
                    return file.name.toLowerCase().endsWith(type.toLowerCase());
                }
                return file.type.match(new RegExp(type.replace('*', '.*')));
            });
        },
        maxSize: (value, maxSize) => {
            const file = value.files?.[0];
            if (!file) return false;
            return file.size <= maxSize * 1024 * 1024; // Convert MB to bytes
        }
    },

    // Create form container
    createForm(options = {}) {
        const {
            id = '',
            className = 'form',
            method = 'POST',
            action = '',
            onSubmit = null,
            children = [],
            layout = 'vertical', // vertical, horizontal, grid
            gap = '1rem'
        } = options;

        const form = document.createElement('form');
        form.method = method;
        if (action) form.action = action;
        if (id) form.id = id;
        form.className = className;

        // Apply layout styles
        const layoutStyles = {
            vertical: 'display: flex; flex-direction: column; gap: ' + gap + ';',
            horizontal: 'display: flex; flex-direction: row; gap: ' + gap + '; align-items: center;',
            grid: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: ' + gap + ';'
        };

        form.style.cssText = layoutStyles[layout] || layoutStyles.vertical;

        // Add submit handler
        if (onSubmit) {
            form.addEventListener('submit', onSubmit);
        }

        // Add children
        children.forEach(child => {
            if (typeof child === 'string') {
                form.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                form.appendChild(child);
            }
        });

        return form;
    },

    // Create form field
    createField(options = {}) {
        const {
            type = 'text',
            name = '',
            label = '',
            placeholder = '',
            value = '',
            required = false,
            validation = {},
            className = '',
            id = '',
            disabled = false,
            readonly = false,
            options: selectOptions = [], // For select fields
            rows = 3, // For textarea
            cols = 50, // For textarea
            accept = '', // For file inputs
            maxSize = 5, // For file inputs (MB)
            onChange = null,
            onBlur = null,
            onFocus = null,
            helpText = '',
            errorText = ''
        } = options;

        const fieldConfig = this.fieldTypes[type] || this.fieldTypes.text;
        const field = document.createElement(fieldConfig.tag);
        const fieldId = id || `field_${name}_${Date.now()}`;

        // Set common attributes
        field.name = name;
        field.id = fieldId;
        if (placeholder) field.placeholder = placeholder;
        if (required) field.required = true;
        if (disabled) field.disabled = true;
        if (readonly) field.readOnly = true;
        if (className) field.className = className;

        // Set type-specific attributes
        Object.entries(fieldConfig.attributes).forEach(([attr, val]) => {
            field.setAttribute(attr, val);
        });

        // Set value
        if (type === 'checkbox' || type === 'radio') {
            field.checked = Boolean(value);
        } else if (type === 'textarea') {
            field.textContent = value;
            field.rows = rows;
            field.cols = cols;
        } else if (type === 'select') {
            this.populateSelect(field, selectOptions, value);
        } else if (type === 'file') {
            if (accept) field.accept = accept;
            field.setAttribute('data-max-size', maxSize);
        } else {
            field.value = value;
        }

        // Add event listeners
        if (onChange) field.addEventListener('change', onChange);
        if (onBlur) field.addEventListener('blur', onBlur);
        if (onFocus) field.addEventListener('focus', onFocus);

        // Add validation attributes
        this.addValidationAttributes(field, validation);

        // Create field wrapper
        const wrapper = this.createFieldWrapper(field, label, helpText, errorText, required);

        // Store validation rules for later use
        wrapper.dataset.validation = JSON.stringify(validation);
        wrapper.dataset.fieldType = type;

        return wrapper;
    },

    // Create field wrapper with label and help text
    createFieldWrapper(field, label, helpText, errorText, required) {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-field';

        // Create label
        if (label) {
            const labelElement = document.createElement('label');
            labelElement.htmlFor = field.id;
            labelElement.textContent = label;
            if (required) {
                labelElement.innerHTML += ' <span class="required">*</span>';
            }
            wrapper.appendChild(labelElement);
        }

        // Add field
        wrapper.appendChild(field);

        // Add help text
        if (helpText) {
            const helpElement = document.createElement('div');
            helpElement.className = 'help-text';
            helpElement.textContent = helpText;
            wrapper.appendChild(helpElement);
        }

        // Add error text
        if (errorText) {
            const errorElement = document.createElement('div');
            errorElement.className = 'error-text';
            errorElement.textContent = errorText;
            wrapper.appendChild(errorElement);
        }

        // Apply wrapper styles
        wrapper.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            margin-bottom: 1rem;
        `;

        return wrapper;
    },

    // Populate select field with options
    populateSelect(select, options, selectedValue) {
        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Select an option...';
        select.appendChild(defaultOption);

        // Add options
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value || option;
            optionElement.textContent = option.label || option;
            if (option.value === selectedValue || option === selectedValue) {
                optionElement.selected = true;
            }
            select.appendChild(optionElement);
        });
    },

    // Add validation attributes to field
    addValidationAttributes(field, validation) {
        Object.entries(validation).forEach(([rule, value]) => {
            if (rule === 'minLength') field.minLength = value;
            if (rule === 'maxLength') field.maxLength = value;
            if (rule === 'min') field.min = value;
            if (rule === 'max') field.max = value;
            if (rule === 'step') field.step = value;
            if (rule === 'pattern') field.pattern = value;
            if (rule === 'accept') field.accept = value;
        });
    },

    // Validate form field
    validateField(field, validationRules = null) {
        const wrapper = field.closest('.form-field');
        if (!wrapper) return { isValid: true, errors: [] };

        const rules = validationRules || JSON.parse(wrapper.dataset.validation || '{}');
        const fieldType = wrapper.dataset.fieldType;
        const value = this.getFieldValue(field, fieldType);
        const errors = [];

        // Run validation rules
        Object.entries(rules).forEach(([rule, ruleValue]) => {
            if (this.validationRules[rule]) {
                const isValid = this.validationRules[rule](value, ruleValue);
                if (!isValid) {
                    errors.push(this.getErrorMessage(rule, ruleValue));
                }
            }
        });

        // Update field appearance
        this.updateFieldValidationState(wrapper, errors.length === 0);

        return { isValid: errors.length === 0, errors };
    },

    // Get field value based on type
    getFieldValue(field, type) {
        if (type === 'checkbox') return field.checked;
        if (type === 'radio') return field.checked ? field.value : null;
        if (type === 'file') return field;
        if (type === 'select') return field.value;
        return field.value;
    },

    // Get error message for validation rule
    getErrorMessage(rule, value) {
        const messages = {
            required: 'This field is required',
            email: 'Please enter a valid email address',
            minLength: `Minimum length is ${value} characters`,
            maxLength: `Maximum length is ${value} characters`,
            min: `Minimum value is ${value}`,
            max: `Maximum value is ${value}`,
            pattern: 'Please match the required format',
            step: `Value must be a multiple of ${value}`,
            accept: 'Please select a valid file type',
            maxSize: `File size must be less than ${value}MB`
        };
        return messages[rule] || `Validation failed for ${rule}`;
    },

    // Update field validation state
    updateFieldValidationState(wrapper, isValid) {
        const field = wrapper.querySelector('input, select, textarea');
        const errorElement = wrapper.querySelector('.error-text');

        if (isValid) {
            field.classList.remove('error');
            field.classList.add('valid');
            if (errorElement) errorElement.style.display = 'none';
        } else {
            field.classList.remove('valid');
            field.classList.add('error');
            if (errorElement) errorElement.style.display = 'block';
        }
    },

    // Create form section
    createSection(options = {}) {
        const {
            title = '',
            description = '',
            children = [],
            className = 'form-section',
            collapsible = false,
            collapsed = false
        } = options;

        const section = document.createElement('div');
        section.className = className;

        // Create header
        if (title || description) {
            const header = document.createElement('div');
            header.className = 'section-header';

            if (title) {
                const titleElement = document.createElement('h3');
                titleElement.textContent = title;
                header.appendChild(titleElement);
            }

            if (description) {
                const descElement = document.createElement('p');
                descElement.className = 'section-description';
                descElement.textContent = description;
                header.appendChild(descElement);
            }

            // Add collapse functionality
            if (collapsible) {
                const toggleButton = document.createElement('button');
                toggleButton.type = 'button';
                toggleButton.className = 'section-toggle';
                toggleButton.innerHTML = `<i class="fas fa-chevron-${collapsed ? 'down' : 'up'}"></i>`;
                
                toggleButton.addEventListener('click', () => {
                    const content = section.querySelector('.section-content');
                    const icon = toggleButton.querySelector('i');
                    const isCollapsed = content.style.display === 'none';
                    
                    content.style.display = isCollapsed ? 'block' : 'none';
                    icon.className = `fas fa-chevron-${isCollapsed ? 'up' : 'down'}`;
                });

                header.appendChild(toggleButton);
            }

            section.appendChild(header);
        }

        // Create content container
        const content = document.createElement('div');
        content.className = 'section-content';
        if (collapsible && collapsed) {
            content.style.display = 'none';
        }

        // Add children
        children.forEach(child => {
            if (typeof child === 'string') {
                content.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                content.appendChild(child);
            }
        });

        section.appendChild(content);

        // Apply section styles
        section.style.cssText = `
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        `;

        return section;
    },

    // Create form actions
    createActions(options = {}) {
        const {
            submitText = 'Submit',
            cancelText = 'Cancel',
            onSubmit = null,
            onCancel = null,
            submitVariant = 'primary',
            cancelVariant = 'secondary',
            submitDisabled = false,
            submitLoading = false,
            className = 'form-actions'
        } = options;

        const actions = document.createElement('div');
        actions.className = className;

        // Create submit button
        if (window.Button) {
            const submitButton = window.Button.create({
                text: submitText,
                variant: submitVariant,
                type: 'submit',
                disabled: submitDisabled,
                loading: submitLoading,
                onClick: onSubmit
            });
            actions.appendChild(submitButton);
        } else {
            const submitButton = document.createElement('button');
            submitButton.type = 'submit';
            submitButton.textContent = submitText;
            submitButton.disabled = submitDisabled;
            actions.appendChild(submitButton);
        }

        // Create cancel button
        if (onCancel) {
            if (window.Button) {
                const cancelButton = window.Button.create({
                    text: cancelText,
                    variant: cancelVariant,
                    type: 'button',
                    onClick: onCancel
                });
                actions.appendChild(cancelButton);
            } else {
                const cancelButton = document.createElement('button');
                cancelButton.type = 'button';
                cancelButton.textContent = cancelText;
                cancelButton.addEventListener('click', onCancel);
                actions.appendChild(cancelButton);
            }
        }

        // Apply actions styles
        actions.style.cssText = `
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            align-items: center;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        `;

        return actions;
    },

    // Validate entire form
    validateForm(form) {
        const fields = form.querySelectorAll('.form-field');
        const results = [];

        fields.forEach(fieldWrapper => {
            const field = fieldWrapper.querySelector('input, select, textarea');
            if (field) {
                const result = this.validateField(field);
                results.push({
                    field: field,
                    wrapper: fieldWrapper,
                    ...result
                });
            }
        });

        return results;
    },

    // Get form data as object
    getFormData(form) {
        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes, etc.)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        return data;
    },

    // Reset form
    resetForm(form) {
        form.reset();
        
        // Clear validation states
        const fields = form.querySelectorAll('.form-field');
        fields.forEach(fieldWrapper => {
            const field = fieldWrapper.querySelector('input, select, textarea');
            if (field) {
                field.classList.remove('error', 'valid');
            }
        });
    },

    // Utility methods
    utils: {
        // Show field error
        showError(fieldWrapper, message) {
            let errorElement = fieldWrapper.querySelector('.error-text');
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.className = 'error-text';
                fieldWrapper.appendChild(errorElement);
            }
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        },

        // Hide field error
        hideError(fieldWrapper) {
            const errorElement = fieldWrapper.querySelector('.error-text');
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        },

        // Disable all fields in form
        disableForm(form) {
            const fields = form.querySelectorAll('input, select, textarea, button');
            fields.forEach(field => field.disabled = true);
        },

        // Enable all fields in form
        enableForm(form) {
            const fields = form.querySelectorAll('input, select, textarea, button');
            fields.forEach(field => field.disabled = false);
        }
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Form;
} else {
    window.Form = Form;
}
