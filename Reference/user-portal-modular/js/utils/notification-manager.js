// ==================== NOTIFICATION MANAGER MODULE ====================
// Centralized notification system for the user portal

export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.notificationId = 0;
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.container = null;
        this.init();
    }

    // ==================== INITIALIZATION ====================

    init() {
        try {
            // Find or create notification container
            this.container = document.getElementById('toast-container');
            if (!this.container) {
                this.createContainer();
            }
            
            // Set up notification polling
            this.startPolling();
            
            console.log('✅ Notification Manager initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Notification Manager:', error);
        }
    }

    createContainer() {
        try {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                right: 20px;
                bottom: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column-reverse;
                gap: 8px;
                max-width: 400px;
            `;
            
            document.body.appendChild(this.container);
            console.log('✅ Notification container created');
            
        } catch (error) {
            console.error('❌ Failed to create notification container:', error);
        }
    }

    // ==================== NOTIFICATION CREATION ====================

    showNotification(message, type = 'info', duration = null, options = {}) {
        try {
            const notification = this.createNotification(message, type, options);
            
            // Add to container
            if (this.container) {
                this.container.appendChild(notification);
                
                // Animate in
                requestAnimationFrame(() => {
                    notification.classList.add('show');
                });
                
                // Auto-remove
                const removeDuration = duration || this.defaultDuration;
                if (removeDuration > 0) {
                    setTimeout(() => {
                        this.removeNotification(notification);
                    }, removeDuration);
                }
            }
            
            // Store notification
            this.notifications.push({
                id: notification.dataset.id,
                element: notification,
                timestamp: Date.now()
            });
            
            // Limit notifications
            this.limitNotifications();
            
            return notification.dataset.id;
            
        } catch (error) {
            console.error('❌ Failed to show notification:', error);
            return null;
        }
    }

    createNotification(message, type, options = {}) {
        try {
            const id = ++this.notificationId;
            const notification = document.createElement('div');
            
            // Set up notification element
            notification.className = `notification ${type} slide-in`;
            notification.dataset.id = id;
            notification.dataset.type = type;
            
            // Set up content
            notification.innerHTML = `
                <div class="notification-icon">
                    <i class="fas fa-${this.getIconForType(type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${options.title || this.getTitleForType(type)}</div>
                    <div class="notification-message">${message}</div>
                    ${options.showTimestamp !== false ? `<div class="notification-time">${this.getRelativeTime()}</div>` : ''}
                </div>
                <button class="notification-close" onclick="this.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Add custom styles if provided
            if (options.styles) {
                Object.assign(notification.style, options.styles);
            }
            
            // Add click handler if provided
            if (options.onClick) {
                notification.addEventListener('click', options.onClick);
            }
            
            return notification;
            
        } catch (error) {
            console.error('❌ Failed to create notification:', error);
            return null;
        }
    }

    // ==================== NOTIFICATION TYPES ====================

    showSuccess(message, duration = null, options = {}) {
        return this.showNotification(message, 'success', duration, {
            title: 'Success',
            ...options
        });
    }

    showError(message, duration = null, options = {}) {
        return this.showNotification(message, 'error', duration, {
            title: 'Error',
            ...options
        });
    }

    showWarning(message, duration = null, options = {}) {
        return this.showNotification(message, 'warning', duration, {
            title: 'Warning',
            ...options
        });
    }

    showInfo(message, duration = null, options = {}) {
        return this.showNotification(message, 'info', duration, {
            title: 'Information',
            ...options
        });
    }

    showPayment(message, duration = null, options = {}) {
        return this.showNotification(message, 'payment', duration, {
            title: 'Payment Update',
            ...options
        });
    }

    showContract(message, duration = null, options = {}) {
        return this.showNotification(message, 'contract', duration, {
            title: 'Contract Update',
            ...options
        });
    }

    showJob(message, duration = null, options = {}) {
        return this.showNotification(message, 'job', duration, {
            title: 'Job Update',
            ...options
        });
    }

    showPerformance(message, duration = null, options = {}) {
        return this.showNotification(message, 'performance', duration, {
            title: 'Performance Update',
            ...options
        });
    }

    // ==================== NOTIFICATION MANAGEMENT ====================

    removeNotification(notification) {
        try {
            if (typeof notification === 'string') {
                // Find by ID
                const element = this.container?.querySelector(`[data-id="${notification}"]`);
                if (element) {
                    this.removeNotificationElement(element);
                }
            } else if (notification instanceof Element) {
                // Direct element reference
                this.removeNotificationElement(notification);
            }
        } catch (error) {
            console.error('❌ Failed to remove notification:', error);
        }
    }

    removeNotificationElement(element) {
        try {
            // Animate out
            element.classList.remove('show');
            element.classList.add('fade-out');
            
            // Remove after animation
            setTimeout(() => {
                if (element.parentElement) {
                    element.remove();
                }
                
                // Remove from tracking
                this.notifications = this.notifications.filter(n => n.element !== element);
            }, 300);
            
        } catch (error) {
            console.error('❌ Failed to remove notification element:', error);
        }
    }

    removeAllNotifications() {
        try {
            if (this.container) {
                const notifications = this.container.querySelectorAll('.notification');
                notifications.forEach(notification => {
                    this.removeNotificationElement(notification);
                });
            }
            
            this.notifications = [];
            console.log('✅ All notifications removed');
            
        } catch (error) {
            console.error('❌ Failed to remove all notifications:', error);
        }
    }

    limitNotifications() {
        try {
            if (this.notifications.length > this.maxNotifications) {
                const excess = this.notifications.length - this.maxNotifications;
                const toRemove = this.notifications.slice(0, excess);
                
                toRemove.forEach(notification => {
                    this.removeNotificationElement(notification.element);
                });
            }
        } catch (error) {
            console.error('❌ Failed to limit notifications:', error);
        }
    }

    // ==================== NOTIFICATION POLLING ====================

    startPolling() {
        try {
            // Check for new notifications every 30 seconds
            setInterval(() => {
                this.checkForNewNotifications();
            }, 30000);
            
            console.log('✅ Notification polling started');
            
        } catch (error) {
            console.error('❌ Failed to start notification polling:', error);
        }
    }

    async checkForNewNotifications() {
        try {
            // This would typically check an API for new notifications
            // For now, we'll just log that we're checking
            console.log('🔍 Checking for new notifications...');
            
        } catch (error) {
            console.error('❌ Failed to check for new notifications:', error);
        }
    }

    // ==================== UTILITY METHODS ====================

    getIconForType(type) {
        const iconMap = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle',
            payment: 'credit-card',
            contract: 'file-contract',
            job: 'briefcase',
            performance: 'star'
        };
        
        return iconMap[type] || 'info-circle';
    }

    getTitleForType(type) {
        const titleMap = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information',
            payment: 'Payment Update',
            contract: 'Contract Update',
            job: 'Job Update',
            performance: 'Performance Update'
        };
        
        return titleMap[type] || 'Notification';
    }

    getRelativeTime() {
        try {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            return timeString;
        } catch {
            return 'now';
        }
    }

    // ==================== NOTIFICATION STYLES ====================

    getNotificationStyles(type) {
        const baseStyles = {
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            marginBottom: '8px',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            maxWidth: '400px',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease',
            borderLeft: '4px solid',
            backgroundColor: 'white',
            color: '#333'
        };
        
        const typeStyles = {
            success: {
                borderLeftColor: '#28a745',
                borderLeftColor: '#28a745'
            },
            error: {
                borderLeftColor: '#dc3545',
                borderLeftColor: '#dc3545'
            },
            warning: {
                borderLeftColor: '#ffc107',
                borderLeftColor: '#ffc107'
            },
            info: {
                borderLeftColor: '#17a2b8',
                borderLeftColor: '#17a2b8'
            },
            payment: {
                borderLeftColor: '#6f42c1',
                borderLeftColor: '#6f42c1'
            },
            contract: {
                borderLeftColor: '#fd7e14',
                borderLeftColor: '#fd7e14'
            },
            job: {
                borderLeftColor: '#20c997',
                borderLeftColor: '#20c997'
            },
            performance: {
                borderLeftColor: '#ffc107',
                borderLeftColor: '#ffc107'
            }
        };
        
        return { ...baseStyles, ...typeStyles[type] };
    }

    // ==================== NOTIFICATION ACTIONS ====================

    addAction(notificationId, action) {
        try {
            const notification = this.container?.querySelector(`[data-id="${notificationId}"]`);
            if (notification) {
                const actionsContainer = notification.querySelector('.notification-actions') || 
                    this.createActionsContainer(notification);
                
                const actionButton = document.createElement('button');
                actionButton.className = 'notification-action';
                actionButton.textContent = action.label;
                actionButton.onclick = action.onClick;
                
                actionsContainer.appendChild(actionButton);
            }
        } catch (error) {
            console.error('❌ Failed to add notification action:', error);
        }
    }

    createActionsContainer(notification) {
        try {
            const actionsContainer = document.createElement('div');
            actionsContainer.className = 'notification-actions';
            actionsContainer.style.cssText = `
                display: flex;
                gap: 8px;
                margin-top: 8px;
            `;
            
            notification.appendChild(actionsContainer);
            return actionsContainer;
            
        } catch (error) {
            console.error('❌ Failed to create actions container:', error);
            return null;
        }
    }

    // ==================== NOTIFICATION GROUPS ====================

    showNotificationGroup(notifications, groupTitle = 'Updates') {
        try {
            if (!notifications || notifications.length === 0) return;
            
            const groupNotification = this.createNotification(
                `${notifications.length} new ${groupTitle.toLowerCase()}`,
                'info',
                {
                    title: groupTitle,
                    onClick: () => this.expandNotificationGroup(notifications)
                }
            );
            
            if (groupNotification) {
                this.container?.appendChild(groupNotification);
            }
            
        } catch (error) {
            console.error('❌ Failed to show notification group:', error);
        }
    }

    expandNotificationGroup(notifications) {
        try {
            // Remove group notification
            this.removeAllNotifications();
            
            // Show individual notifications
            notifications.forEach(notification => {
                this.showNotification(
                    notification.message,
                    notification.type,
                    notification.duration,
                    notification.options
                );
            });
            
        } catch (error) {
            console.error('❌ Failed to expand notification group:', error);
        }
    }

    // ==================== PUBLIC API ====================

    getNotificationCount() {
        return this.notifications.length;
    }

    getNotifications() {
        return [...this.notifications];
    }

    setMaxNotifications(max) {
        this.maxNotifications = Math.max(1, max);
        this.limitNotifications();
    }

    setDefaultDuration(duration) {
        this.defaultDuration = Math.max(0, duration);
    }

    // ==================== STATIC UTILITIES ====================

    static createQuickNotification(message, type = 'info') {
        // Static method for quick notifications without full manager setup
        try {
            const container = document.getElementById('toast-container');
            if (!container) return null;
            
            const notification = document.createElement('div');
            notification.className = `notification ${type} slide-in`;
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-message">${message}</div>
                </div>
            `;
            
            container.appendChild(notification);
            
            // Auto-remove
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 3000);
            
            return notification;
            
        } catch (error) {
            console.error('❌ Failed to create quick notification:', error);
            return null;
        }
    }

    static showToast(message, type = 'info', duration = 3000) {
        return this.createQuickNotification(message, type);
    }
}

// ==================== DEFAULT EXPORT ====================

export default NotificationManager;
