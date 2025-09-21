/**
 * Error Handler Utility Module
 * Provides centralized error handling and user feedback
 */

const ErrorHandler = {
    // Error types and their user-friendly messages
    errorMessages: {
        'auth/user-not-found': 'User not found. Please check your email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-email': 'Invalid email format.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'firebase/not-initialized': 'Authentication system not ready. Please refresh the page.',
        'api/network-error': 'Unable to connect to server. Please check your connection.',
        'api/unauthorized': 'Access denied. Please log in again.',
        'api/forbidden': 'You do not have permission to perform this action.',
        'api/not-found': 'The requested resource was not found.',
        'api/server-error': 'Server error. Please try again later.',
        'validation/required-field': 'This field is required.',
        'validation/invalid-format': 'Invalid format. Please check your input.',
        'validation/too-long': 'Input is too long. Please shorten it.',
        'validation/too-short': 'Input is too short. Please provide more details.',
        'unknown': 'An unexpected error occurred. Please try again.'
    },

    // Default error message
    defaultMessage: 'Something went wrong. Please try again.',

    // Handle errors with user-friendly messages
    handleError(error, context = 'general') {
        console.error(`❌ Error in ${context}:`, error);

        let userMessage = this.defaultMessage;
        let errorType = 'error'; // Default to error type

        // Try to extract error code/message
        if (error && error.code) {
            errorType = 'error';
            userMessage = this.errorMessages[error.code] || this.defaultMessage;
        } else if (error && error.message) {
            errorType = 'error';
            userMessage = this.errorMessages[error.message] || error.message;
        } else if (typeof error === 'string') {
            errorType = 'error';
            userMessage = this.errorMessages[error] || error;
        }

        // Log error details for debugging
        this.logError(error, context, errorType);

        // Show user-friendly error message
        this.showUserError(userMessage, errorType);

        // Return error info for further handling
        return {
            type: errorType,
            message: userMessage,
            originalError: error,
            context: context
        };
    },

    // Log error details for debugging
    logError(error, context, errorType) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            context: context,
            errorType: errorType,
            error: error,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        console.group('🔍 Error Details');
        console.log('Context:', context);
        console.log('Type:', errorType);
        console.log('Error Object:', error);
        console.log('Timestamp:', errorLog.timestamp);
        console.log('URL:', errorLog.url);
        console.groupEnd();

        // Store in session storage for debugging
        this.storeErrorLog(errorLog);
    },

    // Store error log in session storage
    storeErrorLog(errorLog) {
        try {
            const existingLogs = JSON.parse(sessionStorage.getItem('errorLogs') || '[]');
            existingLogs.push(errorLog);
            
            // Keep only last 10 errors
            if (existingLogs.length > 10) {
                existingLogs.splice(0, existingLogs.length - 10);
            }
            
            sessionStorage.setItem('errorLogs', JSON.stringify(existingLogs));
        } catch (e) {
            console.warn('Could not store error log:', e);
        }
    },

    // Show user-friendly error message
    showUserError(message, type = 'error') {
        // Use notification system if available
        if (window.NotificationManager) {
            if (type === 'error') {
                window.NotificationManager.error(message);
            } else if (type === 'warning') {
                window.NotificationManager.warning(message);
            } else if (type === 'success') {
                window.NotificationManager.success(message);
            } else {
                window.NotificationManager.info(message);
            }
        } else {
            // Fallback to alert
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)}: ${message}`);
        }
    },

    // Handle async operations with error catching
    async wrapAsync(operation, context = 'async-operation') {
        try {
            return await operation();
        } catch (error) {
            return this.handleError(error, context);
        }
    },

    // Create error boundary for components
    createErrorBoundary(componentName) {
        return {
            catchError: (error, errorInfo) => {
                this.handleError(error, `component:${componentName}`);
                console.error('Component Error Info:', errorInfo);
            }
        };
    },

    // Validate required fields
    validateRequired(fields, data) {
        const errors = [];
        
        fields.forEach(field => {
            if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
                errors.push({
                    field: field,
                    message: this.errorMessages['validation/required-field']
                });
            }
        });

        return errors;
    },

    // Validate email format
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return {
                field: 'email',
                message: this.errorMessages['validation/invalid-format']
            };
        }
        return null;
    },

    // Get all stored error logs
    getErrorLogs() {
        try {
            return JSON.parse(sessionStorage.getItem('errorLogs') || '[]');
        } catch (e) {
            return [];
        }
    },

    // Clear error logs
    clearErrorLogs() {
        sessionStorage.removeItem('errorLogs');
    },

    // Check if there are recent errors
    hasRecentErrors(minutes = 5) {
        const logs = this.getErrorLogs();
        const cutoff = new Date(Date.now() - minutes * 60 * 1000);
        
        return logs.some(log => new Date(log.timestamp) > cutoff);
    }
};

// Export for use in other modules
window.ErrorHandler = ErrorHandler;
