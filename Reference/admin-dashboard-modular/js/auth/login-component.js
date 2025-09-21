/**
 * Login Component Module
 * Handles the login form UI and user interaction
 */

const LoginComponent = {
    // Component state
    state: {
        isInitialized: false,
        formData: {
            email: '',
            password: ''
        },
        isLoading: false
    },

    // Initialize login component
    init() {
        try {
            console.log('🔐 Initializing Login Component...');
            
            // Check if main dashboard should handle authentication
            if (window.MAIN_DASHBOARD_AUTH_OVERRIDE === false) {
                console.log('✅ Main dashboard auth override disabled - not rendering login form');
                this.state.isInitialized = true;
                return;
            }
            
            // Render login form
            this.renderLoginForm();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Check for stored credentials
            this.checkStoredCredentials();
            
            this.state.isInitialized = true;
            console.log('✅ Login Component initialized');
            
        } catch (error) {
            console.error('❌ Login Component initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'login-component-init');
            }
        }
    },

    // Render login form
    renderLoginForm() {
        const loginScreen = document.getElementById('loginScreen');
        if (!loginScreen) {
            console.error('❌ Login screen element not found');
            return;
        }

        loginScreen.innerHTML = `
            <div class="login-container">
                <img src="https://static.wixstatic.com/media/aeef42_570164eee75f4394a4fc1cf9c62ceae0~mv2.png" 
                     alt="Cochran Films Logo" class="login-logo">
                
                <h1 class="login-title">Admin Dashboard</h1>
                <p class="login-subtitle">Sign in to access the admin panel</p>
                
                <form id="loginForm" class="login-form">
                    <div class="form-group">
                        <label for="loginEmail">Email Address</label>
                        <input type="email" 
                               id="loginEmail" 
                               name="email" 
                               placeholder="Enter your email"
                               required
                               autocomplete="email">
                    </div>
                    
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" 
                               id="loginPassword" 
                               name="password" 
                               placeholder="Enter your password"
                               required
                               autocomplete="current-password">
                    </div>
                    
                    <button type="submit" 
                            class="login-btn" 
                            id="loginSubmitBtn"
                            data-loading-id="login-submit">
                        <span class="btn-text">Sign In</span>
                        <span class="btn-loading" style="display: none;">
                            <i class="fas fa-spinner fa-spin"></i> Signing In...
                        </span>
                    </button>
                </form>
                
                <div class="login-footer">
                    <p>Admin access only. Contact system administrator for credentials.</p>
                </div>
            </div>
        `;
    },

    // Setup event listeners
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLoginSubmit(e));
        }

        // Listen for auth events
        document.addEventListener('auth:success', () => {
            this.hideLoginForm();
        });

        document.addEventListener('auth:access-denied', () => {
            this.showAccessDeniedMessage();
        });
    },

    // Handle login form submission
    async handleLoginSubmit(event) {
        event.preventDefault();
        
        try {
            this.state.isLoading = true;
            this.showLoadingState();
            
            // Get form data
            const formData = new FormData(event.target);
            const email = formData.get('email').trim();
            const password = formData.get('password');
            
            // Validate form data
            const validation = this.validateFormData(email, password);
            if (!validation.isValid) {
                this.showValidationError(validation.message);
                return;
            }
            
            // Store email for convenience
            this.state.formData.email = email;
            localStorage.setItem('adminEmail', email);
            
            // Attempt sign in
            const result = await this.attemptSignIn(email, password);
            
            if (result.success) {
                this.onLoginSuccess(result.user);
            } else {
                this.onLoginError(result.error);
            }
            
        } catch (error) {
            console.error('❌ Login submission error:', error);
            this.onLoginError('An unexpected error occurred. Please try again.');
        } finally {
            this.state.isLoading = false;
            this.hideLoadingState();
        }
    },

    // Validate form data
    validateFormData(email, password) {
        if (!email) {
            return { isValid: false, message: 'Email address is required.' };
        }
        
        if (!password) {
            return { isValid: false, message: 'Password is required.' };
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { isValid: false, message: 'Please enter a valid email address.' };
        }
        
        return { isValid: true };
    },

    // Attempt sign in
    async attemptSignIn(email, password) {
        if (!window.AuthManager) {
            throw new Error('Authentication manager not available');
        }
        
        return await window.AuthManager.signIn(email, password);
    },

    // Handle login success
    onLoginSuccess(user) {
        console.log('✅ Login successful:', user.email);
        
        // Clear password field
        const passwordField = document.getElementById('loginPassword');
        if (passwordField) {
            passwordField.value = '';
        }
        
        // Show success notification
        if (window.NotificationManager) {
            window.NotificationManager.success(
                `Welcome back, ${user.email}!`,
                { title: 'Login Successful' }
            );
        }
        
        // Trigger login success event
        this.triggerEvent('login:success', { user });
    },

    // Handle login error
    onLoginError(errorMessage) {
        console.error('❌ Login failed:', errorMessage);
        
        // Show error notification
        if (window.NotificationManager) {
            window.NotificationManager.error(errorMessage, { title: 'Login Failed' });
        }
        
        // Focus password field for retry
        const passwordField = document.getElementById('loginPassword');
        if (passwordField) {
            passwordField.focus();
            passwordField.select();
        }
        
        // Trigger login error event
        this.triggerEvent('login:error', { error: errorMessage });
    },

    // Show loading state
    showLoadingState() {
        const submitBtn = document.getElementById('loginSubmitBtn');
        if (submitBtn) {
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';
            
            submitBtn.disabled = true;
        }
    },

    // Hide loading state
    hideLoadingState() {
        const submitBtn = document.getElementById('loginSubmitBtn');
        if (submitBtn) {
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');
            
            if (btnText) btnText.style.display = 'inline';
            if (btnLoading) btnLoading.style.display = 'none';
            
            submitBtn.disabled = false;
        }
    },

    // Show validation error
    showValidationError(message) {
        if (window.NotificationManager) {
            window.NotificationManager.warning(message, { title: 'Validation Error' });
        }
    },

    // Hide login form
    hideLoginForm() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
    },

    // Show access denied message
    showAccessDeniedMessage() {
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer) {
            const accessDeniedDiv = document.createElement('div');
            accessDeniedDiv.className = 'access-denied-message';
            accessDeniedDiv.innerHTML = `
                <div style="
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid #ef4444;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-top: 1rem;
                    text-align: center;
                    color: #ef4444;
                ">
                    <i class="fas fa-exclamation-triangle" style="margin-right: 0.5rem;"></i>
                    Access denied. This email does not have admin privileges.
                </div>
            `;
            
            loginContainer.appendChild(accessDeniedDiv);
            
            // Remove after 5 seconds
            setTimeout(() => {
                if (accessDeniedDiv.parentNode) {
                    accessDeniedDiv.parentNode.removeChild(accessDeniedDiv);
                }
            }, 5000);
        }
    },

    // Check for stored credentials
    checkStoredCredentials() {
        const storedEmail = localStorage.getItem('adminEmail');
        if (storedEmail) {
            const emailField = document.getElementById('loginEmail');
            if (emailField) {
                emailField.value = storedEmail;
                emailField.focus();
            }
        }
    },

    // Clear stored credentials
    clearStoredCredentials() {
        localStorage.removeItem('adminEmail');
    },

    // Reset form
    resetForm() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
        
        this.state.formData = {
            email: '',
            password: ''
        };
    },

    // Trigger custom events
    triggerEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    },

    // Get component state
    getState() {
        return { ...this.state };
    },

    // Destroy component
    destroy() {
        // Remove event listeners
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.removeEventListener('submit', this.handleLoginSubmit);
        }
        
        this.state.isInitialized = false;
        console.log('🗑️ Login Component destroyed');
    }
};

// Export for global access
window.LoginComponent = LoginComponent;
