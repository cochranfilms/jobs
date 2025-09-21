/**
 * Notification Manager Utility Module
 * Provides centralized notification system for user feedback
 */

const NotificationManager = {
    // Notification types and their configurations
    types: {
        success: {
            icon: '✅',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            border: '#16a34a',
            duration: 5000
        },
        error: {
            icon: '❌',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: '#dc2626',
            duration: 7000
        },
        warning: {
            icon: '⚠️',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: '#d97706',
            duration: 6000
        },
        info: {
            icon: 'ℹ️',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: '#2563eb',
            duration: 4000
        }
    },

    // Active notifications
    activeNotifications: new Map(),
    
    // Notification counter
    notificationCounter: 0,

    // Initialize notification manager
    init() {
        try {
            const containerSetup = this.setupContainer();
            if (containerSetup) {
                console.log('✅ Notification Manager initialized');
            } else {
                console.warn('⚠️ Notification Manager initialization incomplete - container setup failed');
            }
        } catch (error) {
            console.error('❌ Notification Manager initialization failed:', error);
        }
    },

    // Setup notification container
    setupContainer() {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            // Try to create the container if it doesn't exist
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                right: 20px;
                top: 20px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                z-index: 9999;
                max-width: 400px;
            `;
            document.body.appendChild(container);
            console.log('✅ Created notification container');
        }
        
        if (!container) {
            console.error('❌ Could not create notification container');
            return false;
        }
        
        this.container = container;
        return true;
    },

    // Show notification
    show(message, type = 'info', duration = null, options = {}) {
        // Ensure container exists
        if (!this.container) {
            const containerSetup = this.setupContainer();
            if (!containerSetup) {
                console.error('❌ Notification container setup failed');
                return null;
            }
        }
        
        if (!this.container) {
            console.error('❌ Notification container not found');
            return null;
        }
        
        const notificationId = `notification-${++this.notificationCounter}`;
        const typeConfig = this.types[type] || this.types.info;
        const autoDuration = duration !== null ? duration : typeConfig.duration;

        // Create notification element
        const notification = this.createNotificationElement(
            notificationId,
            message,
            type,
            typeConfig,
            options
        );

        // Add to container
        this.container.appendChild(notification);
        this.activeNotifications.set(notificationId, {
            element: notification,
            type: type,
            message: message,
            startTime: Date.now()
        });

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });

        // Auto remove
        if (autoDuration > 0) {
            setTimeout(() => {
                this.remove(notificationId);
            }, autoDuration);
        }

        console.log(`🔔 Notification shown: ${type} - ${message}`);
        return notificationId;
    },

    // Create notification element
    createNotificationElement(id, message, type, typeConfig, options) {
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification-toast notification-${type}`;
        
        // Apply styles
        notification.style.cssText = `
            background: ${typeConfig.background};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin-top: 8px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.35);
            font-family: Inter, system-ui, -apple-system, sans-serif;
            max-width: 360px;
            line-height: 1.4;
            font-size: 14px;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            border: 1px solid ${typeConfig.border};
            position: relative;
            overflow: hidden;
        `;

        // Add content
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <span style="font-size: 1.2rem;">${typeConfig.icon}</span>
                <div style="flex: 1;">
                    ${options.title ? `<div style="font-weight: 600; margin-bottom: 0.25rem;">${options.title}</div>` : ''}
                    <div style="opacity: 0.9; line-height: 1.4;">${message}</div>
                </div>
                ${options.dismissible !== false ? `
                    <button class="notification-close" style="
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        font-size: 18px;
                        opacity: 0.7;
                        transition: opacity 0.2s ease;
                    " onclick="window.NotificationManager.remove('${id}')">×</button>
                ` : ''}
            </div>
            ${options.progress !== false ? `
                <div class="notification-progress" style="
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    height: 3px;
                    background: rgba(255,255,255,0.3);
                    width: 100%;
                ">
                    <div class="notification-progress-bar" style="
                        height: 100%;
                        background: rgba(255,255,255,0.8);
                        width: 100%;
                        transition: width linear;
                    "></div>
                </div>
            ` : ''}
        `;

        // Add progress animation if enabled
        if (options.progress !== false) {
            const progressBar = notification.querySelector('.notification-progress-bar');
            if (progressBar) {
                const duration = options.duration || typeConfig.duration;
                progressBar.style.transition = `width ${duration}ms linear`;
                requestAnimationFrame(() => {
                    progressBar.style.width = '0%';
                });
            }
        }

        return notification;
    },

    // Remove notification
    remove(notificationId) {
        const notification = this.activeNotifications.get(notificationId);
        if (!notification) return;

        const element = notification.element;
        
        // Animate out
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';

        // Remove after animation
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.activeNotifications.delete(notificationId);
        }, 300);

        console.log(`🔔 Notification removed: ${notificationId}`);
    },

    // Remove all notifications
    removeAll() {
        this.activeNotifications.forEach((notification, id) => {
            this.remove(id);
        });
    },

    // Show success notification
    success(message, options = {}) {
        return this.show(message, 'success', null, options);
    },

    // Show error notification
    error(message, options = {}) {
        return this.show(message, 'error', null, options);
    },

    // Show warning notification
    warning(message, options = {}) {
        return this.show(message, 'warning', null, options);
    },

    // Show info notification
    info(message, options = {}) {
        return this.show(message, 'info', null, options);
    },

    // Show notification with custom duration
    showTimed(message, type, duration, options = {}) {
        return this.show(message, type, duration, options);
    },

    // Show persistent notification (no auto-remove)
    showPersistent(message, type = 'info', options = {}) {
        return this.show(message, type, -1, options);
    },

    // Update notification message
    update(notificationId, newMessage, newType = null) {
        const notification = this.activeNotifications.get(notificationId);
        if (!notification) return false;

        const element = notification.element;
        const messageDiv = element.querySelector('div > div:last-child');
        
        if (messageDiv) {
            messageDiv.textContent = newMessage;
        }

        if (newType && this.types[newType]) {
            const typeConfig = this.types[newType];
            element.style.background = typeConfig.background;
            element.style.borderColor = typeConfig.border;
            
            const iconSpan = element.querySelector('span');
            if (iconSpan) {
                iconSpan.textContent = typeConfig.icon;
            }
        }

        notification.message = newMessage;
        if (newType) notification.type = newType;

        return true;
    },

    // Get notification info
    getNotification(notificationId) {
        return this.activeNotifications.get(notificationId);
    },

    // Get all active notifications
    getAllNotifications() {
        return Array.from(this.activeNotifications.entries()).map(([id, notification]) => ({
            id,
            type: notification.type,
            message: notification.message,
            startTime: notification.startTime,
            duration: Date.now() - notification.startTime
        }));
    },

    // Get notification count
    getCount() {
        return this.activeNotifications.size;
    },

    // Check if notification exists
    exists(notificationId) {
        return this.activeNotifications.has(notificationId);
    },

    // Show toast (alias for show)
    toast(message, type = 'info', duration = null, options = {}) {
        return this.show(message, type, duration, options);
    },

    // Show admin-specific notification
    showAdminNotification(title, message, type = 'info', data = {}) {
        return this.show(message, type, null, {
            title: title,
            ...data,
            adminSpecific: true
        });
    },

    // Show user-specific notification
    showUserNotification(title, message, type = 'info', data = {}) {
        return this.show(message, type, null, {
            title: title,
            ...data,
            userSpecific: true
        });
    },
    
    // Backward compatibility methods
    showSuccess(message, options = {}) {
        return this.success(message, options);
    },
    
    showError(message, options = {}) {
        return this.error(message, options);
    },
    
    showWarning(message, options = {}) {
        return this.warning(message, options);
    },
    
    showInfo(message, options = {}) {
        return this.info(message, options);
    }
};

// Auto-initialize when DOM is ready
function initializeNotificationManager() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            NotificationManager.init();
        });
    } else {
        // DOM is already ready, but wait a bit for other elements
        setTimeout(() => {
            NotificationManager.init();
        }, 100);
    }
}

// Start initialization
initializeNotificationManager();

// Export for use in other modules
window.NotificationManager = NotificationManager;
