// ==================== LOADING MANAGER MODULE ====================
// Centralized loading state management for the user portal

export class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
        this.globalLoading = false;
        this.loadingOverlay = null;
        this.spinnerElement = null;
        this.init();
    }

    // ==================== INITIALIZATION ====================

    init() {
        try {
            // Create loading overlay
            this.createLoadingOverlay();
            
            // Set up global loading state
            this.setupGlobalLoading();
            
            console.log('✅ Loading Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Loading Manager:', error);
        }
    }

    createLoadingOverlay() {
        try {
            // Create overlay container
            this.loadingOverlay = document.createElement('div');
            this.loadingOverlay.id = 'loading-overlay';
            this.loadingOverlay.className = 'loading-overlay';
            this.loadingOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                backdrop-filter: blur(2px);
            `;
            
            // Create spinner
            this.spinnerElement = document.createElement('div');
            this.spinnerElement.className = 'loading-spinner';
            this.spinnerElement.style.cssText = `
                width: 60px;
                height: 60px;
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid #ffb200;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            `;
            
            // Create loading content
            const loadingContent = document.createElement('div');
            loadingContent.className = 'loading-content';
            loadingContent.style.cssText = `
                text-align: center;
                color: white;
                background: rgba(0, 0, 0, 0.8);
                padding: 2rem;
                border-radius: 12px;
                backdrop-filter: blur(10px);
            `;
            
            // Add spinner and text
            loadingContent.appendChild(this.spinnerElement);
            
            const loadingText = document.createElement('h3');
            loadingText.id = 'loading-text';
            loadingText.textContent = 'Loading...';
            loadingText.style.cssText = `
                margin: 1rem 0 0.5rem 0;
                font-size: 1.2rem;
                font-weight: 600;
                color: white;
            `;
            
            const loadingSubtext = document.createElement('p');
            loadingSubtext.id = 'loading-subtext';
            loadingSubtext.textContent = 'Please wait...';
            loadingSubtext.style.cssText = `
                margin: 0;
                font-size: 0.9rem;
                color: rgba(255, 255, 255, 0.8);
            `;
            
            loadingContent.appendChild(loadingText);
            loadingContent.appendChild(loadingSubtext);
            
            // Add to overlay
            this.loadingOverlay.appendChild(loadingContent);
            
            // Add to body
            document.body.appendChild(this.loadingOverlay);
            
            // Add CSS animation
            this.addLoadingCSS();
            
            console.log('✅ Loading overlay created');
            
        } catch (error) {
            console.error('❌ Failed to create loading overlay:', error);
        }
    }

    addLoadingCSS() {
        try {
            if (!document.getElementById('loading-manager-styles')) {
                const style = document.createElement('style');
                style.id = 'loading-manager-styles';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    
                    .loading-overlay.show {
                        display: flex !important;
                        animation: fadeIn 0.3s ease;
                    }
                    
                    .loading-overlay.hide {
                        animation: fadeOut 0.3s ease;
                    }
                    
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                    
                    .loading-spinner {
                        animation: spin 1s linear infinite;
                    }
                `;
                
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error('❌ Failed to add loading CSS:', error);
        }
    }

    setupGlobalLoading() {
        try {
            // Listen for global loading events
            document.addEventListener('globalLoadingStart', () => {
                this.showGlobalLoading();
            });
            
            document.addEventListener('globalLoadingEnd', () => {
                this.hideGlobalLoading();
            });
            
        } catch (error) {
            console.error('❌ Failed to setup global loading:', error);
        }
    }

    // ==================== GLOBAL LOADING ====================

    showGlobalLoading(message = 'Loading...', subtext = 'Please wait...') {
        try {
            this.globalLoading = true;
            
            if (this.loadingOverlay) {
                // Update text
                const loadingText = this.loadingOverlay.querySelector('#loading-text');
                const loadingSubtext = this.loadingOverlay.querySelector('#loading-subtext');
                
                if (loadingText) loadingText.textContent = message;
                if (loadingSubtext) loadingSubtext.textContent = subtext;
                
                // Show overlay
                this.loadingOverlay.style.display = 'flex';
                this.loadingOverlay.classList.add('show');
                
                // Dispatch event
                document.dispatchEvent(new CustomEvent('globalLoadingStarted', {
                    detail: { message, subtext }
                }));
            }
            
            console.log('🌐 Global loading started:', message);
            
        } catch (error) {
            console.error('❌ Failed to show global loading:', error);
        }
    }

    hideGlobalLoading() {
        try {
            this.globalLoading = false;
            
            if (this.loadingOverlay) {
                // Hide overlay
                this.loadingOverlay.classList.remove('show');
                this.loadingOverlay.classList.add('hide');
                
                // Remove after animation
                setTimeout(() => {
                    this.loadingOverlay.style.display = 'none';
                    this.loadingOverlay.classList.remove('hide');
                }, 300);
                
                // Dispatch event
                document.dispatchEvent(new CustomEvent('globalLoadingEnded'));
            }
            
            console.log('🌐 Global loading ended');
            
        } catch (error) {
            console.error('❌ Failed to hide global loading:', error);
        }
    }

    // ==================== COMPONENT LOADING ====================

    showLoading(componentId, message = 'Loading...') {
        try {
            const loadingState = {
                id: componentId,
                message: message,
                timestamp: Date.now(),
                active: true
            };
            
            this.loadingStates.set(componentId, loadingState);
            
            // Find component and show loading state
            const component = document.querySelector(`[data-loading-id="${componentId}"]`) ||
                            document.getElementById(componentId);
            
            if (component) {
                this.showComponentLoading(component, message);
            }
            
            console.log(`🔄 Component loading started: ${componentId}`);
            
            return loadingState;
            
        } catch (error) {
            console.error('❌ Failed to show component loading:', error);
            return null;
        }
    }

    hideLoading(componentId) {
        try {
            const loadingState = this.loadingStates.get(componentId);
            if (loadingState) {
                loadingState.active = false;
                this.loadingStates.delete(componentId);
                
                // Find component and hide loading state
                const component = document.querySelector(`[data-loading-id="${componentId}"]`) ||
                                document.getElementById(componentId);
                
                if (component) {
                    this.hideComponentLoading(component);
                }
                
                console.log(`✅ Component loading ended: ${componentId}`);
            }
            
        } catch (error) {
            console.error('❌ Failed to hide component loading:', error);
        }
    }

    showComponentLoading(component, message) {
        try {
            // Add loading class
            component.classList.add('loading');
            
            // Create loading indicator if it doesn't exist
            if (!component.querySelector('.component-loading')) {
                const loadingIndicator = document.createElement('div');
                loadingIndicator.className = 'component-loading';
                loadingIndicator.innerHTML = `
                    <div class="component-spinner"></div>
                    <span class="component-loading-text">${message}</span>
                `;
                
                loadingIndicator.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    z-index: 10;
                `;
                
                component.appendChild(loadingIndicator);
            }
            
            // Disable interactions
            component.style.pointerEvents = 'none';
            
        } catch (error) {
            console.error('❌ Failed to show component loading:', error);
        }
    }

    hideComponentLoading(component) {
        try {
            // Remove loading class
            component.classList.remove('loading');
            
            // Remove loading indicator
            const loadingIndicator = component.querySelector('.component-loading');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            
            // Re-enable interactions
            component.style.pointerEvents = '';
            
        } catch (error) {
            console.error('❌ Failed to hide component loading:', error);
        }
    }

    // ==================== BUTTON LOADING ====================

    showButtonLoading(button, message = 'Loading...') {
        try {
            if (!button) return;
            
            // Store original content
            button.dataset.originalContent = button.innerHTML;
            button.dataset.originalText = button.textContent;
            
            // Show loading state
            button.innerHTML = `
                <div class="button-spinner"></div>
                <span>${message}</span>
            `;
            
            // Disable button
            button.disabled = true;
            button.classList.add('loading');
            
            // Add loading styles
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            
            console.log('🔄 Button loading started:', button);
            
        } catch (error) {
            console.error('❌ Failed to show button loading:', error);
        }
    }

    hideButtonLoading(button) {
        try {
            if (!button) return;
            
            // Restore original content
            if (button.dataset.originalContent) {
                button.innerHTML = button.dataset.originalContent;
                delete button.dataset.originalContent;
            }
            
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
            
            // Re-enable button
            button.disabled = false;
            button.classList.remove('loading');
            
            // Remove loading styles
            button.style.position = '';
            button.style.overflow = '';
            
            console.log('✅ Button loading ended:', button);
            
        } catch (error) {
            console.error('❌ Failed to hide button loading:', error);
        }
    }

    // ==================== FORM LOADING ====================

    showFormLoading(form, message = 'Submitting...') {
        try {
            if (!form) return;
            
            // Find submit button
            const submitButton = form.querySelector('button[type="submit"]') ||
                               form.querySelector('.btn-primary') ||
                               form.querySelector('.submit-btn');
            
            if (submitButton) {
                this.showButtonLoading(submitButton, message);
            }
            
            // Disable all form inputs
            const inputs = form.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => {
                input.disabled = true;
                input.classList.add('loading');
            });
            
            // Add loading class to form
            form.classList.add('loading');
            
            console.log('🔄 Form loading started:', form);
            
        } catch (error) {
            console.error('❌ Failed to show form loading:', error);
        }
    }

    hideFormLoading(form) {
        try {
            if (!form) return;
            
            // Find submit button
            const submitButton = form.querySelector('button[type="submit"]') ||
                               form.querySelector('.btn-primary') ||
                               form.querySelector('.submit-btn');
            
            if (submitButton) {
                this.hideButtonLoading(submitButton);
            }
            
            // Re-enable all form inputs
            const inputs = form.querySelectorAll('input, select, textarea, button');
            inputs.forEach(input => {
                input.disabled = false;
                input.classList.remove('loading');
            });
            
            // Remove loading class from form
            form.classList.remove('loading');
            
            console.log('✅ Form loading ended:', form);
            
        } catch (error) {
            console.error('❌ Failed to hide form loading:', error);
        }
    }

    // ==================== TABLE LOADING ====================

    showTableLoading(table, message = 'Loading data...') {
        try {
            if (!table) return;
            
            // Add loading class
            table.classList.add('loading');
            
            // Create loading row if it doesn't exist
            if (!table.querySelector('.table-loading-row')) {
                const tbody = table.querySelector('tbody');
                if (tbody) {
                    const loadingRow = document.createElement('tr');
                    loadingRow.className = 'table-loading-row';
                    loadingRow.innerHTML = `
                        <td colspan="100%" class="table-loading-cell">
                            <div class="table-loading-content">
                                <div class="table-spinner"></div>
                                <span>${message}</span>
                            </div>
                        </td>
                    `;
                    
                    tbody.appendChild(loadingRow);
                }
            }
            
            console.log('🔄 Table loading started:', table);
            
        } catch (error) {
            console.error('❌ Failed to show table loading:', error);
        }
    }

    hideTableLoading(table) {
        try {
            if (!table) return;
            
            // Remove loading class
            table.classList.remove('loading');
            
            // Remove loading row
            const loadingRow = table.querySelector('.table-loading-row');
            if (loadingRow) {
                loadingRow.remove();
            }
            
            console.log('✅ Table loading ended:', table);
            
        } catch (error) {
            console.error('❌ Failed to hide table loading:', error);
        }
    }

    // ==================== LOADING STATE MANAGEMENT ====================

    isLoading(componentId) {
        const loadingState = this.loadingStates.get(componentId);
        return loadingState ? loadingState.active : false;
    }

    getLoadingState(componentId) {
        return this.loadingStates.get(componentId);
    }

    getAllLoadingStates() {
        return Array.from(this.loadingStates.values());
    }

    clearLoadingStates() {
        try {
            // Hide all component loading states
            this.loadingStates.forEach((state, componentId) => {
                this.hideLoading(componentId);
            });
            
            // Clear map
            this.loadingStates.clear();
            
            console.log('✅ All loading states cleared');
            
        } catch (error) {
            console.error('❌ Failed to clear loading states:', error);
        }
    }

    // ==================== LOADING PROGRESS ====================

    showProgress(componentId, progress = 0, message = 'Processing...') {
        try {
            const loadingState = this.loadingStates.get(componentId);
            if (loadingState) {
                loadingState.progress = progress;
                loadingState.message = message;
                
                // Update progress display
                this.updateProgressDisplay(componentId, progress, message);
            }
            
        } catch (error) {
            console.error('❌ Failed to show progress:', error);
        }
    }

    updateProgressDisplay(componentId, progress, message) {
        try {
            const component = document.querySelector(`[data-loading-id="${componentId}"]`) ||
                            document.getElementById(componentId);
            
            if (component) {
                const progressBar = component.querySelector('.loading-progress');
                if (progressBar) {
                    progressBar.style.width = `${progress}%`;
                    progressBar.setAttribute('aria-valuenow', progress);
                }
                
                const progressText = component.querySelector('.loading-progress-text');
                if (progressText) {
                    progressText.textContent = `${Math.round(progress)}% - ${message}`;
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to update progress display:', error);
        }
    }

    // ==================== UTILITY METHODS ====================

    createLoadingElement(type = 'spinner', options = {}) {
        try {
            const loadingElement = document.createElement('div');
            loadingElement.className = `loading-element loading-${type}`;
            
            switch (type) {
                case 'spinner':
                    loadingElement.innerHTML = '<div class="spinner"></div>';
                    break;
                case 'dots':
                    loadingElement.innerHTML = '<div class="dots"><span></span><span></span><span></span></div>';
                    break;
                case 'bar':
                    loadingElement.innerHTML = '<div class="progress-bar"><div class="progress-fill"></div></div>';
                    break;
                case 'skeleton':
                    loadingElement.innerHTML = '<div class="skeleton-line"></div>';
                    break;
                default:
                    loadingElement.innerHTML = '<div class="spinner"></div>';
            }
            
            // Apply custom options
            if (options.size) {
                loadingElement.style.fontSize = options.size;
            }
            
            if (options.color) {
                loadingElement.style.color = options.color;
            }
            
            return loadingElement;
            
        } catch (error) {
            console.error('❌ Failed to create loading element:', error);
            return null;
        }
    }

    // ==================== PUBLIC API ====================

    isGlobalLoading() {
        return this.globalLoading;
    }

    getLoadingCount() {
        return this.loadingStates.size;
    }

    setGlobalLoadingMessage(message, subtext) {
        if (this.loadingOverlay) {
            const loadingText = this.loadingOverlay.querySelector('#loading-text');
            const loadingSubtext = this.loadingOverlay.querySelector('#loading-subtext');
            
            if (loadingText) loadingText.textContent = message;
            if (loadingSubtext) loadingSubtext.textContent = subtext;
        }
    }

    // ==================== STATIC UTILITIES ====================

    static showQuickLoading(element, message = 'Loading...') {
        try {
            if (!element) return null;
            
            // Create simple loading indicator
            const loading = document.createElement('div');
            loading.className = 'quick-loading';
            loading.innerHTML = `
                <div class="quick-spinner"></div>
                <span>${message}</span>
            `;
            
            loading.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #666;
                font-size: 0.9rem;
            `;
            
            element.style.position = 'relative';
            element.appendChild(loading);
            
            return loading;
            
        } catch (error) {
            console.error('❌ Failed to show quick loading:', error);
            return null;
        }
    }

    static hideQuickLoading(element) {
        try {
            if (!element) return;
            
            const loading = element.querySelector('.quick-loading');
            if (loading) {
                loading.remove();
            }
            
        } catch (error) {
            console.error('❌ Failed to hide quick loading:', error);
        }
    }
}

// ==================== DEFAULT EXPORT ====================

export default LoadingManager;
