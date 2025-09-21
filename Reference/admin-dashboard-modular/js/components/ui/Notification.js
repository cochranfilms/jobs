/**
 * Notification Component System
 * Professional notification components with toast messages and alerts
 */

const Notification = {
    // Notification types and configurations
    types: {
        info: {
            icon: 'fas fa-info-circle',
            color: '#3b82f6',
            bgColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            textColor: '#dbeafe'
        },
        success: {
            icon: 'fas fa-check-circle',
            color: '#22c55e',
            bgColor: 'rgba(34, 197, 94, 0.1)',
            borderColor: 'rgba(34, 197, 94, 0.3)',
            textColor: '#dcfce7'
        },
        warning: {
            icon: 'fas fa-exclamation-triangle',
            color: '#f59e0b',
            bgColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            textColor: '#fef3c7'
        },
        error: {
            icon: 'fas fa-times-circle',
            color: '#ef4444',
            bgColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            textColor: '#fee2e2'
        }
    },

    // Notification positions
    positions: {
        'top-left': { top: '1rem', left: '1rem', right: 'auto', bottom: 'auto' },
        'top-right': { top: '1rem', right: '1rem', left: 'auto', bottom: 'auto' },
        'top-center': { top: '1rem', left: '50%', right: 'auto', bottom: 'auto', transform: 'translateX(-50%)' },
        'bottom-left': { bottom: '1rem', left: '1rem', right: 'auto', top: 'auto' },
        'bottom-right': { bottom: '1rem', right: '1rem', left: 'auto', top: 'auto' },
        'bottom-center': { bottom: '1rem', left: '50%', right: 'auto', top: 'auto', transform: 'translateX(-50%)' },
        'center': { top: '50%', left: '50%', right: 'auto', bottom: 'auto', transform: 'translate(-50%, -50%)' }
    },

    // Global notification registry
    registry: new Map(),
    activeNotifications: [],
    container: null,

    // Initialize notification system
    init(options = {}) {
        const {
            position = 'top-right',
            maxNotifications = 5,
            autoClose = true,
            autoCloseDelay = 5000,
            containerId = 'notification-container'
        } = options;

        this.config = {
            position,
            maxNotifications,
            autoClose,
            autoCloseDelay
        };

        // Create or get container
        this.container = this.getOrCreateContainer(containerId, position);
        
        // Apply container styles
        this.applyContainerStyles(this.container, position);

        console.log('✅ Notification system initialized');
        return this;
    },

    // Get or create notification container
    getOrCreateContainer(containerId, position) {
        let container = document.getElementById(containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            container.className = 'notification-container';
            document.body.appendChild(container);
        }

        return container;
    },

    // Apply container styles
    applyContainerStyles(container, position) {
        const pos = this.positions[position] || this.positions['top-right'];
        
        container.style.cssText = `
            position: fixed;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            pointer-events: none;
            ${Object.entries(pos).map(([key, value]) => `${key}: ${value};`).join('')}
        `;
    },

    // Show notification
    show(options = {}) {
        const {
            type = 'info',
            title = '',
            message = '',
            duration = null,
            closable = true,
            actions = [],
            onClose = null,
            onAction = null,
            persistent = false,
            id = `notification_${Date.now()}`,
            className = '',
            customStyles = ''
        } = options;

        // Check if we've reached max notifications
        if (this.activeNotifications.length >= this.config.maxNotifications) {
            this.removeOldestNotification();
        }

        // Create notification element
        const notification = this.createNotification({
            id,
            type,
            title,
            message,
            closable,
            actions,
            onClose,
            onAction,
            className,
            customStyles
        });

        // Add to container
        this.container.appendChild(notification);

        // Add to registry
        this.registry.set(id, {
            element: notification,
            type,
            options,
            timestamp: Date.now()
        });

        // Add to active notifications
        this.activeNotifications.push(id);

        // Show notification with animation
        this.showNotification(notification);

        // Auto-close if enabled and not persistent
        if (!persistent && this.config.autoClose && duration !== 0) {
            const closeDelay = duration || this.config.autoCloseDelay;
            setTimeout(() => {
                this.hide(id);
            }, closeDelay);
        }

        return notification;
    },

    // Create notification element
    createNotification(options) {
        const {
            id,
            type,
            title,
            message,
            closable,
            actions,
            onClose,
            onAction,
            className,
            customStyles
        } = options;

        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification notification-${type} ${className}`.trim();
        notification.dataset.notificationType = type;

        // Get type configuration
        const typeConfig = this.types[type] || this.types.info;

        // Create notification content
        const content = this.createNotificationContent({
            typeConfig,
            title,
            message,
            actions,
            onAction
        });

        // Create close button if closable
        if (closable) {
            const closeButton = this.createCloseButton(notification, onClose);
            notification.appendChild(closeButton);
        }

        // Add content
        notification.appendChild(content);

        // Apply styles
        this.applyNotificationStyles(notification, typeConfig, customStyles);

        return notification;
    },

    // Create notification content
    createNotificationContent(options) {
        const { typeConfig, title, message, actions, onAction } = options;

        const content = document.createElement('div');
        content.className = 'notification-content';

        // Create icon
        const icon = document.createElement('i');
        icon.className = typeConfig.icon;
        icon.style.color = typeConfig.color;
        content.appendChild(icon);

        // Create text container
        const textContainer = document.createElement('div');
        textContainer.className = 'notification-text';

        // Add title if provided
        if (title) {
            const titleElement = document.createElement('div');
            titleElement.className = 'notification-title';
            titleElement.textContent = title;
            textContainer.appendChild(titleElement);
        }

        // Add message if provided
        if (message) {
            const messageElement = document.createElement('div');
            messageElement.className = 'notification-message';
            messageElement.textContent = message;
            textContainer.appendChild(messageElement);
        }

        content.appendChild(textContainer);

        // Add actions if provided
        if (actions && actions.length > 0) {
            const actionsContainer = this.createActionsContainer(actions, onAction);
            content.appendChild(actionsContainer);
        }

        return content;
    },

    // Create actions container
    createActionsContainer(actions, onAction) {
        const container = document.createElement('div');
        container.className = 'notification-actions';

        actions.forEach((action, index) => {
            const button = window.Button ? 
                window.Button.create({
                    text: action.text,
                    variant: action.variant || 'ghost',
                    size: 'sm',
                    onClick: () => {
                        if (onAction) onAction(action.key, action);
                    }
                }) :
                this.createFallbackActionButton(action, onAction);

            container.appendChild(button);
        });

        return container;
    },

    // Create fallback action button
    createFallbackActionButton(action, onAction) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = action.text;
        button.className = 'btn btn-ghost btn-sm';
        button.addEventListener('click', () => {
            if (onAction) onAction(action.key, action);
        });
        return button;
    },

    // Create close button
    createCloseButton(notification, onClose) {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.title = 'Close';

        closeButton.addEventListener('click', () => {
            this.hide(notification.id);
            if (onClose) onClose();
        });

        return closeButton;
    },

    // Apply notification styles
    applyNotificationStyles(notification, typeConfig, customStyles) {
        const baseStyles = `
            background: ${typeConfig.bgColor};
            border: 1px solid ${typeConfig.borderColor};
            border-radius: 0.75rem;
            padding: 1rem;
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(10px);
            pointer-events: auto;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
        `;

        notification.style.cssText = baseStyles + customStyles;
    },

    // Show notification with animation
    showNotification(notification) {
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });
    },

    // Hide notification
    hide(id) {
        const notificationData = this.registry.get(id);
        if (!notificationData) return;

        const { element } = notificationData;

        // Hide with animation
        element.style.opacity = '0';
        element.style.transform = 'translateX(100%)';

        // Remove after animation
        setTimeout(() => {
            this.removeNotification(id);
        }, 300);
    },

    // Remove notification completely
    removeNotification(id) {
        const notificationData = this.registry.get(id);
        if (!notificationData) return;

        const { element } = notificationData;

        // Remove from DOM
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }

        // Remove from registry
        this.registry.delete(id);
        this.activeNotifications = this.activeNotifications.filter(nId => nId !== id);
    },

    // Remove oldest notification
    removeOldestNotification() {
        if (this.activeNotifications.length > 0) {
            const oldestId = this.activeNotifications[0];
            this.hide(oldestId);
        }
    },

    // Clear all notifications
    clear() {
        this.activeNotifications.forEach(id => {
            this.hide(id);
        });
    },

    // Clear notifications by type
    clearByType(type) {
        this.activeNotifications.forEach(id => {
            const notificationData = this.registry.get(id);
            if (notificationData && notificationData.type === type) {
                this.hide(id);
            }
        });
    },

    // Update notification
    update(id, newOptions) {
        const notificationData = this.registry.get(id);
        if (!notificationData) return;

        const { element } = notificationData;
        
        // Update content
        if (newOptions.title || newOptions.message) {
            const titleElement = element.querySelector('.notification-title');
            const messageElement = element.querySelector('.notification-message');
            
            if (newOptions.title && titleElement) {
                titleElement.textContent = newOptions.title;
            }
            
            if (newOptions.message && messageElement) {
                messageElement.textContent = newOptions.message;
            }
        }

        // Update type if changed
        if (newOptions.type && newOptions.type !== notificationData.type) {
            const typeConfig = this.types[newOptions.type] || this.types.info;
            element.className = `notification notification-${newOptions.type}`;
            element.dataset.notificationType = newOptions.type;
            
            // Update icon and colors
            const icon = element.querySelector('.notification-content i');
            if (icon) {
                icon.className = typeConfig.icon;
                icon.style.color = typeConfig.color;
            }
            
            this.applyNotificationStyles(element, typeConfig, newOptions.customStyles || '');
        }
    },

    // Utility methods for common notification types
    utils: {
        // Show info notification
        info(message, title = 'Info', options = {}) {
            return Notification.show({ type: 'info', title, message, ...options });
        },

        // Show success notification
        success(message, title = 'Success', options = {}) {
            return Notification.show({ type: 'success', title, message, ...options });
        },

        // Show warning notification
        warning(message, title = 'Warning', options = {}) {
            return Notification.show({ type: 'warning', title, message, ...options });
        },

        // Show error notification
        error(message, title = 'Error', options = {}) {
            return Notification.show({ type: 'error', title, message, ...options });
        },

        // Show toast notification (shorter duration)
        toast(message, type = 'info', options = {}) {
            return Notification.show({
                type,
                message,
                duration: 3000,
                closable: false,
                ...options
            });
        },

        // Show persistent notification
        persistent(message, title = '', type = 'info', options = {}) {
            return Notification.show({
                type,
                title,
                message,
                persistent: true,
                ...options
            });
        },

        // Show notification with actions
        withActions(message, title = '', actions = [], type = 'info', options = {}) {
            return Notification.show({
                type,
                title,
                message,
                actions,
                ...options
            });
        }
    },

    // Event-driven notification system
    events: {
        // Listen for notification events
        on(event, callback) {
            if (!this.eventListeners) {
                this.eventListeners = new Map();
            }
            
            if (!this.eventListeners.has(event)) {
                this.eventListeners.set(event, []);
            }
            
            this.eventListeners.get(event).push(callback);
        },

        // Emit notification events
        emit(event, data) {
            if (this.eventListeners && this.eventListeners.has(event)) {
                this.eventListeners.get(event).forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('Notification event callback error:', error);
                    }
                });
            }
        },

        // Remove event listener
        off(event, callback) {
            if (this.eventListeners && this.eventListeners.has(event)) {
                const listeners = this.eventListeners.get(event);
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                }
            }
        }
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Notification;
} else {
    window.Notification = Notification;
}
