/**
 * Modal Component System
 * Professional modal components with animations and consistent styling
 */

const Modal = {
    // Modal types and configurations
    types: {
        default: {
            className: 'modal modal-default',
            backdrop: true,
            closeOnBackdrop: true,
            closeOnEscape: true,
            animation: 'fadeIn'
        },
        alert: {
            className: 'modal modal-alert',
            backdrop: true,
            closeOnBackdrop: false,
            closeOnEscape: true,
            animation: 'slideIn'
        },
        confirm: {
            className: 'modal modal-confirm',
            backdrop: true,
            closeOnBackdrop: false,
            closeOnEscape: true,
            animation: 'scaleIn'
        },
        fullscreen: {
            className: 'modal modal-fullscreen',
            backdrop: true,
            closeOnBackdrop: true,
            closeOnEscape: true,
            animation: 'slideUp'
        },
        sidebar: {
            className: 'modal modal-sidebar',
            backdrop: true,
            closeOnBackdrop: true,
            closeOnEscape: true,
            animation: 'slideRight'
        }
    },

    // Animation configurations
    animations: {
        fadeIn: {
            in: 'opacity: 0; transform: scale(0.95);',
            out: 'opacity: 1; transform: scale(1);',
            duration: '300ms'
        },
        slideIn: {
            in: 'opacity: 0; transform: translateY(-20px);',
            out: 'opacity: 1; transform: translateY(0);',
            duration: '300ms'
        },
        scaleIn: {
            in: 'opacity: 0; transform: scale(0.8);',
            out: 'opacity: 1; transform: scale(1);',
            duration: '250ms'
        },
        slideUp: {
            in: 'opacity: 0; transform: translateY(100%);',
            out: 'opacity: 1; transform: translateY(0);',
            duration: '400ms'
        },
        slideRight: {
            in: 'opacity: 0; transform: translateX(100%);',
            out: 'opacity: 1; transform: translateX(0);',
            duration: '350ms'
        }
    },

    // Global modal registry
    registry: new Map(),
    activeModals: [],

    // Create modal
    create(options = {}) {
        const {
            id = `modal_${Date.now()}`,
            type = 'default',
            title = '',
            content = '',
            size = 'md', // xs, sm, md, lg, xl, full
            closable = true,
            backdrop = true,
            closeOnBackdrop = true,
            closeOnEscape = true,
            animation = 'fadeIn',
            onOpen = null,
            onClose = null,
            onConfirm = null,
            onCancel = null,
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmVariant = 'primary',
            cancelVariant = 'secondary',
            className = '',
            customStyles = '',
            zIndex = 1000
        } = options;

        // Get type configuration
        const typeConfig = this.types[type] || this.types.default;
        const finalBackdrop = backdrop !== undefined ? backdrop : typeConfig.backdrop;
        const finalCloseOnBackdrop = closeOnBackdrop !== undefined ? closeOnBackdrop : typeConfig.closeOnBackdrop;
        const finalCloseOnEscape = closeOnEscape !== undefined ? closeOnEscape : typeConfig.closeOnEscape;
        const finalAnimation = animation || typeConfig.animation;

        // Create modal container
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = `${typeConfig.className} ${className}`.trim();
        modal.dataset.modalType = type;
        modal.dataset.modalSize = size;

        // Create backdrop
        let backdropElement = null;
        if (finalBackdrop) {
            backdropElement = this.createBackdrop(modal, finalCloseOnBackdrop);
        }

        // Create modal content
        const modalContent = this.createModalContent(modal, {
            title,
            content,
            size,
            closable,
            type,
            confirmText,
            cancelText,
            confirmVariant,
            cancelVariant,
            onConfirm,
            onCancel
        });

        // Apply styles
        this.applyStyles(modal, size, type, finalAnimation, zIndex, customStyles);

        // Add to DOM
        document.body.appendChild(modal);
        if (backdropElement) {
            document.body.appendChild(backdropElement);
        }

        // Store in registry
        this.registry.set(id, {
            modal,
            backdrop: backdropElement,
            type,
            options
        });

        // Add to active modals
        this.activeModals.push(id);

        // Setup event listeners
        this.setupEventListeners(modal, {
            closeOnEscape: finalCloseOnEscape,
            onOpen,
            onClose
        });

        // Trigger open animation
        this.openModal(modal, finalAnimation);

        // Call onOpen callback
        if (onOpen) {
            setTimeout(() => onOpen(modal), 100);
        }

        return modal;
    },

    // Create backdrop
    createBackdrop(modal, closeOnBackdrop) {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.dataset.modalId = modal.id;

        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: ${parseInt(modal.style.zIndex) - 1};
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
        `;

        if (closeOnBackdrop) {
            backdrop.addEventListener('click', () => {
                this.closeModal(modal.id);
            });
        }

        return backdrop;
    },

    // Create modal content
    createModalContent(modal, options) {
        const {
            title,
            content,
            size,
            closable,
            type,
            confirmText,
            cancelText,
            confirmVariant,
            cancelVariant,
            onConfirm,
            onCancel
        } = options;

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        // Create header
        if (title || closable) {
            const header = document.createElement('div');
            header.className = 'modal-header';

            if (title) {
                const titleElement = document.createElement('h3');
                titleElement.className = 'modal-title';
                titleElement.textContent = title;
                header.appendChild(titleElement);
            }

            if (closable) {
                const closeButton = this.createCloseButton(modal);
                header.appendChild(closeButton);
            }

            modalContent.appendChild(header);
        }

        // Create body
        if (content) {
            const body = document.createElement('div');
            body.className = 'modal-body';

            if (typeof content === 'string') {
                body.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                body.appendChild(content);
            } else if (Array.isArray(content)) {
                content.forEach(item => {
                    if (typeof item === 'string') {
                        body.appendChild(document.createTextNode(item));
                    } else if (item instanceof HTMLElement) {
                        body.appendChild(item);
                    }
                });
            }

            modalContent.appendChild(body);
        }

        // Create footer for confirm/cancel modals
        if (type === 'confirm' || onConfirm || onCancel) {
            const footer = this.createModalFooter({
                confirmText,
                cancelText,
                confirmVariant,
                cancelVariant,
                onConfirm: () => {
                    if (onConfirm) onConfirm(modal);
                    this.closeModal(modal.id);
                },
                onCancel: () => {
                    if (onCancel) onCancel(modal);
                    this.closeModal(modal.id);
                }
            });
            modalContent.appendChild(footer);
        }

        modal.appendChild(modalContent);
        return modalContent;
    },

    // Create close button
    createCloseButton(modal) {
        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'modal-close';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.title = 'Close';

        closeButton.addEventListener('click', () => {
            this.closeModal(modal.id);
        });

        return closeButton;
    },

    // Create modal footer
    createModalFooter(options) {
        const {
            confirmText,
            cancelText,
            confirmVariant,
            cancelVariant,
            onConfirm,
            onCancel
        } = options;

        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        // Create cancel button
        if (onCancel) {
            const cancelButton = window.Button ? 
                window.Button.create({
                    text: cancelText,
                    variant: cancelVariant,
                    onClick: onCancel
                }) :
                this.createFallbackButton(cancelText, onCancel, 'secondary');
            footer.appendChild(cancelButton);
        }

        // Create confirm button
        if (onConfirm) {
            const confirmButton = window.Button ? 
                window.Button.create({
                    text: confirmText,
                    variant: confirmVariant,
                    onClick: onConfirm
                }) :
                this.createFallbackButton(confirmText, onConfirm, 'primary');
            footer.appendChild(confirmButton);
        }

        return footer;
    },

    // Create fallback button (when Button component not available)
    createFallbackButton(text, onClick, variant) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.className = `btn btn-${variant}`;
        button.addEventListener('click', onClick);
        return button;
    },

    // Apply modal styles
    applyStyles(modal, size, type, animation, zIndex, customStyles) {
        const sizeStyles = {
            xs: 'max-width: 300px;',
            sm: 'max-width: 500px;',
            md: 'max-width: 700px;',
            lg: 'max-width: 900px;',
            xl: 'max-width: 1200px;',
            full: 'max-width: 95vw; max-height: 95vh;'
        };

        const typeStyles = {
            sidebar: 'position: fixed; top: 0; right: 0; height: 100vh; width: 400px; max-width: 90vw;',
            fullscreen: 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; max-width: none; max-height: none;'
        };

        const baseStyles = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1a1a1a;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.75rem;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            z-index: ${zIndex};
            opacity: 0;
            transition: all ${this.animations[animation]?.duration || '300ms'} ease-in-out;
            overflow: hidden;
        `;

        const sizeStyle = sizeStyles[size] || sizeStyles.md;
        const typeStyle = typeStyles[type] || '';

        modal.style.cssText = baseStyles + sizeStyle + typeStyle + customStyles;
    },

    // Setup event listeners
    setupEventListeners(modal, options) {
        const { closeOnEscape, onOpen, onClose } = options;

        // Escape key handler
        if (closeOnEscape) {
            const escapeHandler = (event) => {
                if (event.key === 'Escape' && this.activeModals.includes(modal.id)) {
                    this.closeModal(modal.id);
                }
            };
            document.addEventListener('keydown', escapeHandler);
            modal.dataset.escapeHandler = 'true';
        }

        // Store callbacks
        if (onClose) {
            modal.dataset.onClose = 'true';
        }
    },

    // Open modal with animation
    openModal(modal, animation) {
        const animationConfig = this.animations[animation];
        if (animationConfig) {
            modal.style.cssText += animationConfig.in;
            
            // Trigger animation
            requestAnimationFrame(() => {
                modal.style.cssText += animationConfig.out;
            });
        } else {
            modal.style.opacity = '1';
        }

        // Show backdrop
        const backdrop = document.querySelector(`[data-modal-id="${modal.id}"]`);
        if (backdrop) {
            backdrop.style.opacity = '1';
        }

        // Focus management
        this.focusModal(modal);
    },

    // Close modal
    closeModal(modalId) {
        const modalData = this.registry.get(modalId);
        if (!modalData) return;

        const { modal, backdrop, options } = modalData;
        const animation = options.animation || 'fadeIn';

        // Trigger close animation
        const animationConfig = this.animations[animation];
        if (animationConfig) {
            modal.style.cssText += animationConfig.in;
        } else {
            modal.style.opacity = '0';
        }

        // Hide backdrop
        if (backdrop) {
            backdrop.style.opacity = '0';
        }

        // Remove after animation
        setTimeout(() => {
            this.removeModal(modalId);
        }, parseInt(animationConfig?.duration || '300'));

        // Call onClose callback
        if (options.onClose) {
            options.onClose(modal);
        }
    },

    // Remove modal from DOM
    removeModal(modalId) {
        const modalData = this.registry.get(modalId);
        if (!modalData) return;

        const { modal, backdrop } = modalData;

        // Remove from DOM
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }
        if (backdrop && backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }

        // Remove from registry
        this.registry.delete(modalId);
        this.activeModals = this.activeModals.filter(id => id !== modalId);

        // Restore focus
        this.restoreFocus();
    },

    // Focus management
    focusModal(modal) {
        // Store previously focused element
        modal.dataset.previousFocus = document.activeElement?.id || '';

        // Focus first focusable element in modal
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
    },

    // Restore focus
    restoreFocus() {
        const lastModal = this.activeModals[this.activeModals.length - 1];
        if (lastModal) {
            const modalData = this.registry.get(lastModal);
            if (modalData) {
                this.focusModal(modalData.modal);
            }
        } else {
            // Restore focus to previously focused element
            const previousFocus = document.querySelector('[data-previous-focus]');
            if (previousFocus) {
                previousFocus.focus();
            }
        }
    },

    // Utility methods
    utils: {
        // Close all modals
        closeAll() {
            Modal.activeModals.forEach(id => {
                Modal.closeModal(id);
            });
        },

        // Get modal by ID
        getModal(id) {
            return Modal.registry.get(id)?.modal || null;
        },

        // Check if modal is open
        isOpen(id) {
            return Modal.activeModals.includes(id);
        },

        // Update modal content
        updateContent(id, newContent) {
            const modalData = Modal.registry.get(id);
            if (!modalData) return;

            const body = modalData.modal.querySelector('.modal-body');
            if (body) {
                body.innerHTML = '';
                if (typeof newContent === 'string') {
                    body.innerHTML = newContent;
                } else if (newContent instanceof HTMLElement) {
                    body.appendChild(newContent);
                }
            }
        },

        // Show alert modal
        alert(message, title = 'Alert', options = {}) {
            return Modal.create({
                type: 'alert',
                title,
                content: message,
                confirmText: 'OK',
                onConfirm: options.onConfirm,
                ...options
            });
        },

        // Show confirm modal
        confirm(message, title = 'Confirm', options = {}) {
            return new Promise((resolve) => {
                Modal.create({
                    type: 'confirm',
                    title,
                    content: message,
                    onConfirm: () => resolve(true),
                    onCancel: () => resolve(false),
                    ...options
                });
            });
        },

        // Show prompt modal
        prompt(message, title = 'Prompt', defaultValue = '', options = {}) {
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'text';
                input.value = defaultValue;
                input.className = 'form-control';
                input.style.cssText = 'width: 100%; padding: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 0.25rem; background: rgba(255, 255, 255, 0.1); color: white;';

                const content = document.createElement('div');
                content.appendChild(document.createTextNode(message));
                content.appendChild(document.createElement('br'));
                content.appendChild(input);

                Modal.create({
                    type: 'confirm',
                    title,
                    content,
                    onConfirm: () => resolve(input.value),
                    onCancel: () => resolve(null),
                    onOpen: () => input.focus(),
                    ...options
                });
            });
        }
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Modal;
} else {
    window.Modal = Modal;
}
