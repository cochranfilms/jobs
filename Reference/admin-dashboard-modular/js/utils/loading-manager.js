/**
 * Loading Manager Utility Module
 * Provides centralized loading state management
 */

const LoadingManager = {
    // Loading states for different operations
    loadingStates: new Map(),
    
    // Global loading indicator
    globalLoading: false,
    
    // Global loading methods (always available)
    showGlobalLoading() {
        // Respect main dashboard control to avoid interfering with its UI overlay
        if (typeof window !== 'undefined' && window.MAIN_DASHBOARD_LOADING_OVERRIDE === false) {
            return;
        }
        this.globalLoading = true;
        this.globalLoadingStartTime = Date.now();
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'flex';
        }
        document.body.style.overflow = 'hidden';
    },

    hideGlobalLoading() {
        this.globalLoading = false;
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
        document.body.style.overflow = '';
    },
    
    // Initialize loading manager
    init() {
        try {
            this.setupGlobalLoading();
            
            // Add safety mechanism to prevent stuck loading states
            this.setupSafetyMechanism();
            
            console.log('✅ Loading Manager initialized');
        } catch (error) {
            console.error('❌ Loading Manager initialization failed:', error);
        }
    },

    // Setup global loading indicator
    setupGlobalLoading() {
        // Check if main dashboard loading indicator should be overridden
        if (window.MAIN_DASHBOARD_LOADING_OVERRIDE === false) {
            console.log('✅ Main dashboard loading override disabled - not interfering');
            return;
        }
        
        const indicator = document.getElementById('loadingIndicator');
        if (!indicator) {
            console.warn('⚠️ Loading indicator element not found');
            return;
        }

        // The global loading methods are already defined above
        console.log('✅ Global loading methods ready');
    },

    // Show loading for specific operation
    showLoading(operationId, message = 'Loading...') {
        this.loadingStates.set(operationId, {
            active: true,
            message: message,
            startTime: Date.now()
        });

        // Update UI if operation has specific loading element
        this.updateOperationLoading(operationId, true, message);
        
        console.log(`🔄 Loading started: ${operationId} - ${message}`);
    },

    // Hide loading for specific operation
    hideLoading(operationId) {
        const loadingState = this.loadingStates.get(operationId);
        if (loadingState) {
            loadingState.active = false;
            loadingState.endTime = Date.now();
            loadingState.duration = loadingState.endTime - loadingState.startTime;
            
            this.loadingStates.delete(operationId);
            
            // Update UI
            this.updateOperationLoading(operationId, false);
            
            console.log(`✅ Loading completed: ${operationId} (${loadingState.duration}ms)`);
        }
    },

    // Update operation-specific loading UI
    updateOperationLoading(operationId, isLoading, message = '') {
        // Look for loading elements with data-loading-id attribute
        const loadingElements = document.querySelectorAll(`[data-loading-id="${operationId}"]`);
        
        loadingElements.forEach(element => {
            if (isLoading) {
                element.classList.add('loading');
                if (message && element.dataset.loadingMessage) {
                    element.textContent = message;
                }
            } else {
                element.classList.remove('loading');
                // Restore original content if available
                if (element.dataset.originalContent) {
                    element.textContent = element.dataset.originalContent;
                }
            }
        });
    },

    // Check if specific operation is loading
    isLoading(operationId) {
        const loadingState = this.loadingStates.get(operationId);
        return loadingState ? loadingState.active : false;
    },

    // Check if any operation is loading
    hasActiveLoading() {
        return this.loadingStates.size > 0 || this.globalLoading;
    },

    // Get loading state for operation
    getLoadingState(operationId) {
        return this.loadingStates.get(operationId);
    },

    // Get all active loading operations
    getActiveLoading() {
        const active = [];
        this.loadingStates.forEach((state, id) => {
            if (state.active) {
                active.push({ id, ...state });
            }
        });
        return active;
    },

    // Show loading with promise wrapper
    async withLoading(operationId, operation, message = 'Loading...') {
        try {
            this.showLoading(operationId, message);
            const result = await operation();
            return result;
        } finally {
            this.hideLoading(operationId);
        }
    },

    // Show loading for button clicks
    setupButtonLoading(buttonSelector, operationId, message = 'Processing...') {
        const buttons = document.querySelectorAll(buttonSelector);
        
        buttons.forEach(button => {
            const originalText = button.textContent;
            const originalDisabled = button.disabled;
            
            button.addEventListener('click', async (e) => {
                if (this.isLoading(operationId)) return;
                
                try {
                    this.showLoading(operationId, message);
                    button.disabled = true;
                    button.textContent = message;
                    
                    // Wait a bit to show loading state
                    await new Promise(resolve => setTimeout(resolve, 100));
                    
                    // Continue with original click handler
                    return true;
                } catch (error) {
                    console.error('Button loading error:', error);
                    return false;
                }
            });
        });
    },

    // Create loading button
    createLoadingButton(text, operationId, onClick, message = 'Processing...') {
        const button = document.createElement('button');
        button.textContent = text;
        button.className = 'btn';
        button.dataset.loadingId = operationId;
        
        button.addEventListener('click', async (e) => {
            if (this.isLoading(operationId)) return;
            
            try {
                this.showLoading(operationId, message);
                button.disabled = true;
                button.textContent = message;
                
                await onClick(e);
            } catch (error) {
                if (window.ErrorHandler) {
                    window.ErrorHandler.handleError(error, `button:${operationId}`);
                } else {
                    console.error('Button error:', error);
                }
            } finally {
                this.hideLoading(operationId);
                button.disabled = false;
                button.textContent = text;
            }
        });
        
        return button;
    },

    // Show loading overlay for specific element
    showElementLoading(element, message = 'Loading...') {
        if (!element) return;
        
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'element-loading-overlay';
        overlay.innerHTML = `
            <div class="element-loading-spinner"></div>
            <p>${message}</p>
        `;
        
        // Style the overlay
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            border-radius: inherit;
        `;
        
        // Position element relatively if needed
        if (getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(overlay);
        element.classList.add('loading');
        
        return overlay;
    },

    // Hide element loading overlay
    hideElementLoading(element) {
        if (!element) return;
        
        const overlay = element.querySelector('.element-loading-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        element.classList.remove('loading');
    },

    // Get loading statistics
    getLoadingStats() {
        const stats = {
            activeOperations: this.loadingStates.size,
            globalLoading: this.globalLoading,
            operations: Array.from(this.loadingStates.entries()).map(([id, state]) => ({
                id,
                active: state.active,
                message: state.message,
                duration: state.duration || Date.now() - state.startTime
            }))
        };
        
        return stats;
    },

    // Clear all loading states
    clearAllLoading() {
        try {
            this.clearAllLoadingStates();
        } catch (error) {
            console.warn('⚠️ clearAllLoading failed:', error);
        }
    },
    
    // Convenience methods for backward compatibility
    show(message = 'Loading...') {
        try {
            // Respect main dashboard control to avoid interfering with its UI overlay
            if (typeof window !== 'undefined' && window.MAIN_DASHBOARD_LOADING_OVERRIDE === false) {
                return 'global';
            }
            this.showGlobalLoading();
            return 'global';
        } catch (error) {
            console.warn('⚠️ Loading show failed:', error);
            return 'global';
        }
    },
    
    hide() {
        try {
            this.hideGlobalLoading();
        } catch (error) {
            console.warn('⚠️ Loading hide failed:', error);
        }
    },
    
    // Backward compatibility methods
    showLoading(message = 'Loading...') {
        return this.show(message);
    },
    
    hideLoading() {
        this.hide();
    },

    // Setup safety mechanism to prevent stuck loading states
    setupSafetyMechanism() {
        // Check for stuck loading states every 10 seconds
        setInterval(() => {
            this.checkForStuckLoadingStates();
        }, 10000);
        
        // Global safety timeout - force clear all loading after 60 seconds
        setTimeout(() => {
            console.warn('⚠️ Global loading safety timeout - clearing all loading states');
            this.clearAllLoadingStates();
        }, 60000);
    },

    // Check for stuck loading states and clear them
    checkForStuckLoadingStates() {
        const now = Date.now();
        const stuckThreshold = 30000; // 30 seconds
        
        this.loadingStates.forEach((state, operationId) => {
            if (state.active && (now - state.startTime) > stuckThreshold) {
                console.warn(`⚠️ Clearing stuck loading state: ${operationId} (${now - state.startTime}ms)`);
                this.hideLoading(operationId);
            }
        });
        
        // Check global loading state
        if (this.globalLoading) {
            const globalLoadingElement = document.getElementById('loadingIndicator');
            if (globalLoadingElement && globalLoadingElement.style.display === 'flex') {
                // Check if it's been showing for too long
                if (!this.globalLoadingStartTime) {
                    this.globalLoadingStartTime = now;
                } else if ((now - this.globalLoadingStartTime) > stuckThreshold) {
                    console.warn('⚠️ Global loading stuck - forcing clear');
                    this.hideGlobalLoading();
                }
            }
        }
    },

    // Clear all loading states
    clearAllLoadingStates() {
        this.loadingStates.forEach((state, operationId) => {
            this.hideLoading(operationId);
        });
        
        this.hideGlobalLoading();
        console.log('✅ All loading states cleared');
    },

    // Emergency clear function for debugging
    emergencyClear() {
        console.warn('🚨 Emergency loading clear triggered');
        this.clearAllLoadingStates();
        
        // Force hide loading indicator
        const indicator = document.getElementById('loadingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
        
        // Reset body overflow
        document.body.style.overflow = '';
        
        // Reset all state
        this.globalLoading = false;
        this.globalLoadingStartTime = null;
        this.loadingStates.clear();
        
        console.log('✅ Emergency loading clear completed');
    }
};

// Auto-initialize when DOM is ready
function initializeLoadingManager() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            LoadingManager.init();
        });
    } else {
        // DOM is already ready, but wait a bit for other elements
        setTimeout(() => {
            LoadingManager.init();
        }, 100);
    }
}

// Start initialization
initializeLoadingManager();

// Export for use in other modules
window.LoadingManager = LoadingManager;
