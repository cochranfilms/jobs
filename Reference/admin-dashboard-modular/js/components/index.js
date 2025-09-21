/**
 * Component Library Index
 * Main entry point for all UI components
 */

// Component Library Namespace
window.ComponentLibrary = {
    // Version
    version: '1.0.0',
    
    // Component registry
    components: new Map(),
    
    // Ready state
    _ready: false,
    
    // Check if component library is ready
    isReady() {
        return this._ready;
    },
    
    // Initialize all components
    async init(options = {}) {
        console.log('🚀 Initializing Component Library v' + this.version);
        
        try {
            // Initialize core components
            await this.initializeComponents();
            
            // Setup global event system
            this.setupGlobalEvents();
            
            // Apply global styles
            this.applyGlobalStyles();
            
            // Mark as ready
            this._ready = true;
            
            console.log('✅ Component Library initialized successfully');
            return this;
            
        } catch (error) {
            console.error('❌ Component Library initialization failed:', error);
            throw error;
        }
    },
    
    // Initialize individual components
    async initializeComponents() {
        // Wait for all required components to be available
        await this.waitForComponents();
        
        // Button Component
        try {
            if (window.Button) {
                this.components.set('Button', window.Button);
                console.log('✅ Button component loaded');
            } else {
                console.warn('⚠️ Button component not available');
            }
        } catch (error) {
            console.warn('⚠️ Button component failed to load:', error);
        }
        
        // Form Component
        try {
            if (window.Form) {
                this.components.set('Form', window.Form);
                console.log('✅ Form component loaded');
            } else {
                console.warn('⚠️ Form component not available');
            }
        } catch (error) {
            console.warn('⚠️ Form component failed to load:', error);
        }
        
        // Modal Component
        try {
            if (window.Modal) {
                this.components.set('Modal', window.Modal);
                console.log('✅ Modal component loaded');
            } else {
                console.warn('⚠️ Modal component not available');
            }
        } catch (error) {
            console.warn('⚠️ Modal component failed to load:', error);
        }
        
        // Notification Component
        try {
            if (window.Notification) {
                this.components.set('Notification', window.Notification);
                console.log('✅ Notification component loaded');
            } else {
                console.warn('⚠️ Notification component not available');
            }
        } catch (error) {
            console.warn('⚠️ Notification component failed to load:', error);
        }
        
        // Initialize notification system
        try {
            if (window.Notification) {
                window.Notification.init({
                    position: 'top-right',
                    maxNotifications: 5,
                    autoClose: true,
                    autoCloseDelay: 5000
                });
            }
        } catch (error) {
            console.warn('⚠️ Notification system initialization failed:', error);
        }
    },
    
    // Wait for all required components to be available
    async waitForComponents() {
        const requiredComponents = ['Button', 'Form', 'Modal', 'Notification'];
        const maxWaitTime = 5000; // 5 seconds
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            const missingComponents = requiredComponents.filter(name => !window[name]);
            
            if (missingComponents.length === 0) {
                return true;
            }
            
            console.log(`⏳ Waiting for components: ${missingComponents.join(', ')}`);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ Some components not available after timeout');
        return false;
    },
    
    // Setup global event system
    setupGlobalEvents() {
        // Global error handler
        window.addEventListener('error', (event) => {
            if (window.Notification) {
                window.Notification.utils.error(
                    event.error?.message || 'An unexpected error occurred',
                    'System Error'
                );
            }
        });
        
        // Global unhandled rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            if (window.Notification) {
                window.Notification.utils.error(
                    event.reason?.message || 'Promise rejection unhandled',
                    'Promise Error'
                );
            }
        });
        
        // Component library ready event
        window.dispatchEvent(new CustomEvent('componentLibraryReady', {
            detail: { version: this.version }
        }));
    },
    
    // Apply global styles
    applyGlobalStyles() {
        // Create global stylesheet
        const style = document.createElement('style');
        style.id = 'component-library-styles';
        style.textContent = this.getGlobalStyles();
        document.head.appendChild(style);
    },
    
    // Get global CSS styles
    getGlobalStyles() {
        return `
            /* Component Library Global Styles */
            
            /* Base form styles */
            .form-field label {
                color: rgba(255, 255, 255, 0.9);
                font-weight: 500;
                margin-bottom: 0.25rem;
                font-size: 0.875rem;
            }
            
            .form-field input,
            .form-field select,
            .form-field textarea {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 0.5rem;
                padding: 0.75rem;
                color: white;
                font-size: 0.875rem;
                transition: all 0.2s ease-in-out;
                width: 100%;
                box-sizing: border-box;
            }
            
            .form-field input:focus,
            .form-field select:focus,
            .form-field textarea:focus {
                outline: none;
                border-color: #FFB200;
                box-shadow: 0 0 0 3px rgba(255, 178, 0, 0.1);
                background: rgba(255, 255, 255, 0.15);
            }
            
            .form-field input.error,
            .form-field select.error,
            .form-field textarea.error {
                border-color: #ef4444;
                box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
            }
            
            .form-field input.valid,
            .form-field select.valid,
            .form-field textarea.valid {
                border-color: #22c55e;
                box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
            }
            
            .form-field .help-text {
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.75rem;
                margin-top: 0.25rem;
            }
            
            .form-field .error-text {
                color: #ef4444;
                font-size: 0.75rem;
                margin-top: 0.25rem;
                display: none;
            }
            
            .form-field .required {
                color: #ef4444;
                font-weight: bold;
            }
            
            /* Modal styles */
            .modal-content {
                background: #1a1a1a;
                border-radius: 0.75rem;
                overflow: hidden;
            }
            
            .modal-header {
                padding: 1.5rem 1.5rem 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .modal-title {
                color: white;
                font-size: 1.25rem;
                font-weight: 600;
                margin: 0;
            }
            
            .modal-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                font-size: 1.25rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 0.25rem;
                transition: all 0.2s ease-in-out;
            }
            
            .modal-close:hover {
                color: white;
                background: rgba(255, 255, 255, 0.1);
            }
            
            .modal-body {
                padding: 1.5rem;
                color: rgba(255, 255, 255, 0.9);
                line-height: 1.6;
            }
            
            .modal-footer {
                padding: 1rem 1.5rem 1.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                gap: 0.75rem;
                justify-content: flex-end;
            }
            
            /* Notification styles */
            .notification-content {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                flex: 1;
            }
            
            .notification-content i {
                font-size: 1.25rem;
                margin-top: 0.125rem;
                flex-shrink: 0;
            }
            
            .notification-text {
                flex: 1;
                min-width: 0;
            }
            
            .notification-title {
                font-weight: 600;
                color: white;
                margin-bottom: 0.25rem;
                font-size: 0.875rem;
            }
            
            .notification-message {
                color: rgba(255, 255, 255, 0.8);
                font-size: 0.875rem;
                line-height: 1.4;
            }
            
            .notification-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.75rem;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                font-size: 1rem;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 0.25rem;
                transition: all 0.2s ease-in-out;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                color: white;
                background: rgba(255, 255, 255, 0.1);
            }
            
            /* Button spinner animation */
            .btn-spinner .animate-spin {
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            
            /* Form section styles */
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .section-header h3 {
                color: white;
                font-size: 1.125rem;
                font-weight: 600;
                margin: 0;
            }
            
            .section-description {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.875rem;
                margin: 0.5rem 0 0 0;
            }
            
            .section-toggle {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                font-size: 1rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 0.25rem;
                transition: all 0.2s ease-in-out;
            }
            
            .section-toggle:hover {
                color: white;
                background: rgba(255, 255, 255, 0.1);
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .modal {
                    margin: 1rem;
                    max-width: calc(100vw - 2rem) !important;
                }
                
                .notification {
                    min-width: 280px;
                    max-width: calc(100vw - 2rem);
                }
                
                .form-actions {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .form-actions button {
                    width: 100%;
                }
            }
        `;
    },
    
    // Get component by name
    get(name) {
        return this.components.get(name);
    },
    
    // Check if component is available
    has(name) {
        return this.components.has(name);
    },
    
    // Get all available components
    getAll() {
        return Array.from(this.components.keys());
    },
    
    // Component status
    getStatus() {
        const status = {};
        this.components.forEach((component, name) => {
            status[name] = {
                loaded: true,
                version: component.version || 'unknown'
            };
        });
        return status;
    },
    
    // Utility methods
    utils: {
        // Create a simple form with common fields
        createSimpleForm(fields, options = {}) {
            if (!window.Form) {
                console.error('Form component not available');
                return null;
            }
            
            const form = window.Form.createForm({
                onSubmit: options.onSubmit,
                layout: options.layout || 'vertical'
            });
            
            fields.forEach(fieldConfig => {
                const field = window.Form.createField(fieldConfig);
                form.appendChild(field);
            });
            
            if (options.showActions !== false) {
                const actions = window.Form.createActions({
                    submitText: options.submitText || 'Submit',
                    cancelText: options.cancelText,
                    onSubmit: options.onSubmit,
                    onCancel: options.onCancel
                });
                form.appendChild(actions);
            }
            
            return form;
        },
        
        // Create a simple modal
        createSimpleModal(options = {}) {
            if (!window.Modal) {
                console.error('Modal component not available');
                return null;
            }
            
            return window.Modal.create(options);
        },
        
        // Show a simple notification
        showNotification(message, type = 'info', options = {}) {
            if (!window.Notification) {
                console.error('Notification component not available');
                return null;
            }
            
            return window.Notification.utils[type]?.(message, options.title, options) ||
                   window.Notification.show({ type, message, ...options });
        },
        
        // Create a button with common variants
        createButton(text, variant = 'primary', options = {}) {
            if (!window.Button) {
                console.error('Button component not available');
                return null;
            }
            
            return window.Button.create({
                text,
                variant,
                ...options
            });
        }
    },
    
    // Event system
    events: {
        // Listen for component library events
        on(event, callback) {
            window.addEventListener(`componentLibrary:${event}`, callback);
        },
        
        // Emit component library events
        emit(event, data) {
            window.dispatchEvent(new CustomEvent(`componentLibrary:${event}`, {
                detail: data
            }));
        },
        
        // Remove event listener
        off(event, callback) {
            window.removeEventListener(`componentLibrary:${event}`, callback);
        }
    }
};

// Auto-initialize when DOM is ready and all components are loaded
function initializeComponentLibrary() {
    // Wait for all components to be loaded
    const checkComponents = () => {
        const requiredComponents = ['Button', 'Form', 'Modal', 'Notification'];
        const allLoaded = requiredComponents.every(name => window[name]);
        
        if (allLoaded) {
            window.ComponentLibrary.init();
        } else {
            setTimeout(checkComponents, 100);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkComponents);
    } else {
        checkComponents();
    }
}

// Start initialization
initializeComponentLibrary();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ComponentLibrary;
}
