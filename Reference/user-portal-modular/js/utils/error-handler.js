// ==================== ERROR HANDLER MODULE ====================
// Centralized error handling and logging for the user portal

export class ErrorHandler {
    constructor() {
        this.errorCount = 0;
        this.maxErrors = 10;
        this.errorLog = [];
    }

    // ==================== MAIN ERROR HANDLING ====================

    handleError(error, context = 'Unknown Error', showNotification = true) {
        try {
            // Increment error count
            this.errorCount++;
            
            // Create error object
            const errorObj = {
                id: Date.now() + Math.random(),
                timestamp: new Date().toISOString(),
                context: context,
                message: error.message || error.toString(),
                stack: error.stack,
                type: error.name || 'Error',
                count: this.errorCount
            };
            
            // Log error
            this.logError(errorObj);
            
            // Show notification if requested
            if (showNotification) {
                this.showErrorNotification(errorObj);
            }
            
            // Check if we've hit max errors
            if (this.errorCount >= this.maxErrors) {
                this.handleMaxErrorsReached();
            }
            
            // Return error object for further handling
            return errorObj;
            
        } catch (handlingError) {
            // Fallback error handling if our error handler fails
            console.error('❌ Error handler failed:', handlingError);
            console.error('❌ Original error:', error);
        }
    }

    // ==================== ERROR LOGGING ====================

    logError(errorObj) {
        try {
            // Add to internal log
            this.errorLog.push(errorObj);
            
            // Keep only last 100 errors
            if (this.errorLog.length > 100) {
                this.errorLog = this.errorLog.slice(-100);
            }
            
            // Console logging with formatting
            console.group(`❌ ${errorObj.context} (Error #${errorObj.count})`);
            console.error('Message:', errorObj.message);
            console.error('Type:', errorObj.type);
            console.error('Context:', errorObj.context);
            console.error('Timestamp:', errorObj.timestamp);
            if (errorObj.stack) {
                console.error('Stack:', errorObj.stack);
            }
            console.groupEnd();
            
            // Store in session storage for debugging
            this.persistErrorLog();
            
        } catch (loggingError) {
            console.error('❌ Failed to log error:', loggingError);
        }
    }

    persistErrorLog() {
        try {
            const logData = {
                timestamp: new Date().toISOString(),
                errorCount: this.errorCount,
                recentErrors: this.errorLog.slice(-10) // Last 10 errors
            };
            
            sessionStorage.setItem('userPortalErrorLog', JSON.stringify(logData));
            
        } catch (persistError) {
            console.warn('⚠️ Could not persist error log:', persistError);
        }
    }

    // ==================== ERROR NOTIFICATIONS ====================

    showErrorNotification(errorObj) {
        try {
            // Create error notification element
            const notification = document.createElement('div');
            notification.className = 'notification error fade-in';
            notification.innerHTML = `
                <div class="notification-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${errorObj.context}</div>
                    <div class="notification-message">${this.formatErrorMessage(errorObj.message)}</div>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add to notification container
            const container = document.getElementById('toast-container');
            if (container) {
                container.appendChild(notification);
                
                // Auto-remove after 8 seconds
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 8000);
            }
            
        } catch (notificationError) {
            console.warn('⚠️ Failed to show error notification:', notificationError);
            // Fallback to console
            console.error('❌ Error:', errorObj.context, '-', errorObj.message);
        }
    }

    formatErrorMessage(message) {
        try {
            // Truncate long messages
            if (message.length > 100) {
                return message.substring(0, 100) + '...';
            }
            return message;
        } catch {
            return 'An error occurred';
        }
    }

    // ==================== ERROR RECOVERY ====================

    handleMaxErrorsReached() {
        try {
            console.warn('⚠️ Maximum error count reached. Attempting recovery...');
            
            // Show recovery notification
            this.showRecoveryNotification();
            
            // Attempt to clear error state
            this.clearErrorState();
            
            // Reset error count
            this.errorCount = 0;
            
        } catch (recoveryError) {
            console.error('❌ Error recovery failed:', recoveryError);
        }
    }

    showRecoveryNotification() {
        try {
            const notification = document.createElement('div');
            notification.className = 'notification warning fade-in';
            notification.innerHTML = `
                <div class="notification-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">System Recovery</div>
                    <div class="notification-message">Multiple errors detected. System has been reset for stability.</div>
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            const container = document.getElementById('toast-container');
            if (container) {
                container.appendChild(notification);
                
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 10000);
            }
            
        } catch (notificationError) {
            console.warn('⚠️ Failed to show recovery notification:', notificationError);
        }
    }

    clearErrorState() {
        try {
            // Clear error log
            this.errorLog = [];
            
            // Clear session storage
            sessionStorage.removeItem('userPortalErrorLog');
            
            // Clear any error notifications
            const errorNotifications = document.querySelectorAll('.notification.error');
            errorNotifications.forEach(notification => notification.remove());
            
            console.log('✅ Error state cleared');
            
        } catch (clearError) {
            console.warn('⚠️ Failed to clear error state:', clearError);
        }
    }

    // ==================== ERROR ANALYSIS ====================

    getErrorSummary() {
        try {
            const summary = {
                totalErrors: this.errorCount,
                recentErrors: this.errorLog.slice(-10),
                errorTypes: this.analyzeErrorTypes(),
                contextBreakdown: this.analyzeContexts(),
                timestamp: new Date().toISOString()
            };
            
            return summary;
            
        } catch (analysisError) {
            console.warn('⚠️ Failed to generate error summary:', analysisError);
            return null;
        }
    }

    analyzeErrorTypes() {
        try {
            const typeCount = {};
            this.errorLog.forEach(error => {
                const type = error.type || 'Unknown';
                typeCount[type] = (typeCount[type] || 0) + 1;
            });
            
            return typeCount;
            
        } catch (analysisError) {
            console.warn('⚠️ Failed to analyze error types:', analysisError);
            return {};
        }
    }

    analyzeContexts() {
        try {
            const contextCount = {};
            this.errorLog.forEach(error => {
                const context = error.context || 'Unknown';
                contextCount[context] = (contextCount[context] || 0) + 1;
            });
            
            return contextCount;
            
        } catch (analysisError) {
            console.warn('⚠️ Failed to analyze error contexts:', analysisError);
            return {};
        }
    }

    // ==================== DEBUGGING TOOLS ====================

    exportErrorLog() {
        try {
            const logData = {
                summary: this.getErrorSummary(),
                fullLog: this.errorLog,
                exportTimestamp: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(logData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `user-portal-error-log-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            console.log('✅ Error log exported');
            
        } catch (exportError) {
            console.error('❌ Failed to export error log:', exportError);
        }
    }

    // ==================== UTILITY METHODS ====================

    isNetworkError(error) {
        try {
            const networkErrorPatterns = [
                'NetworkError',
                'TypeError',
                'fetch',
                'network',
                'timeout',
                'Failed to fetch'
            ];
            
            const errorString = error.toString().toLowerCase();
            return networkErrorPatterns.some(pattern => 
                errorString.includes(pattern.toLowerCase())
            );
            
        } catch {
            return false;
        }
    }

    isAuthError(error) {
        try {
            const authErrorPatterns = [
                'auth',
                'unauthorized',
                'forbidden',
                '401',
                '403',
                'permission'
            ];
            
            const errorString = error.toString().toLowerCase();
            return authErrorPatterns.some(pattern => 
                errorString.includes(pattern.toLowerCase())
            );
            
        } catch {
            return false;
        }
    }

    getErrorContext(error) {
        try {
            if (this.isNetworkError(error)) {
                return 'Network Error';
            } else if (this.isAuthError(error)) {
                return 'Authentication Error';
            } else {
                return 'Application Error';
            }
        } catch {
            return 'Unknown Error';
        }
    }

    // ==================== PUBLIC API ====================

    getErrorCount() {
        return this.errorCount;
    }

    getErrorLog() {
        return [...this.errorLog]; // Return copy
    }

    clearErrors() {
        this.clearErrorState();
        this.errorCount = 0;
    }

    setMaxErrors(max) {
        this.maxErrors = Math.max(1, max);
    }

    // ==================== STATIC UTILITIES ====================

    static createError(message, context = 'Unknown Error', type = 'Error') {
        const error = new Error(message);
        error.context = context;
        error.type = type;
        error.timestamp = new Date().toISOString();
        return error;
    }

    static isErrorObject(obj) {
        return obj && typeof obj === 'object' && 'message' in obj;
    }

    static formatErrorForDisplay(error) {
        try {
            if (this.isErrorObject(error)) {
                return {
                    message: error.message || 'An error occurred',
                    context: error.context || 'Unknown',
                    type: error.type || 'Error',
                    timestamp: error.timestamp || new Date().toISOString()
                };
            } else {
                return {
                    message: String(error),
                    context: 'Unknown',
                    type: 'Error',
                    timestamp: new Date().toISOString()
                };
            }
        } catch {
            return {
                message: 'An error occurred',
                context: 'Unknown',
                type: 'Error',
                timestamp: new Date().toISOString()
            };
        }
    }
}

// ==================== DEFAULT EXPORT ====================

export default ErrorHandler;
