/**
 * Button Component System
 * Professional, consistent button components with multiple variants
 */

const Button = {
    // Button variants and styles
    variants: {
        primary: {
            base: 'btn',
            styles: 'background: linear-gradient(135deg, #FFB200, #FF8C00); color: #1a1a1a; border: none; font-weight: 600;',
            hover: 'background: linear-gradient(135deg, #FFD700, #FFB200); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(255, 178, 0, 0.3);'
        },
        secondary: {
            base: 'btn btn-secondary',
            styles: 'background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.2);',
            hover: 'background: rgba(255, 255, 255, 0.2); border-color: rgba(255, 255, 255, 0.3);'
        },
        success: {
            base: 'btn btn-success',
            styles: 'background: #22c55e; color: white; border: none;',
            hover: 'background: #16a34a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);'
        },
        warning: {
            base: 'btn btn-warning',
            styles: 'background: #f59e0b; color: white; border: none;',
            hover: 'background: #d97706; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);'
        },
        danger: {
            base: 'btn btn-danger',
            styles: 'background: #ef4444; color: white; border: none;',
            hover: 'background: #dc2626; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);'
        },
        info: {
            base: 'btn btn-info',
            styles: 'background: #3b82f6; color: white; border: none;',
            hover: 'background: #2563eb; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);'
        },
        outline: {
            base: 'btn btn-outline',
            styles: 'background: transparent; color: #FFB200; border: 2px solid #FFB200;',
            hover: 'background: #FFB200; color: #1a1a1a;'
        },
        ghost: {
            base: 'btn btn-ghost',
            styles: 'background: transparent; color: rgba(255, 255, 255, 0.8); border: none;',
            hover: 'background: rgba(255, 255, 255, 0.1); color: white;'
        }
    },

    // Button sizes
    sizes: {
        xs: 'padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.375rem;',
        sm: 'padding: 0.5rem 1rem; font-size: 0.875rem; border-radius: 0.5rem;',
        md: 'padding: 0.75rem 1.5rem; font-size: 1rem; border-radius: 0.5rem;',
        lg: 'padding: 1rem 2rem; font-size: 1.125rem; border-radius: 0.75rem;',
        xl: 'padding: 1.25rem 2.5rem; font-size: 1.25rem; border-radius: 0.75rem;'
    },

    // Button states
    states: {
        loading: 'opacity: 0.7; cursor: not-allowed;',
        disabled: 'opacity: 0.5; cursor: not-allowed; pointer-events: none;',
        active: 'transform: translateY(1px); box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);'
    },

    // Create button element
    create(options = {}) {
        const {
            text = 'Button',
            variant = 'primary',
            size = 'md',
            icon = null,
            iconPosition = 'left',
            loading = false,
            disabled = false,
            onClick = null,
            type = 'button',
            className = '',
            id = '',
            title = '',
            dataAttributes = {}
        } = options;

        // Create button element
        const button = document.createElement('button');
        button.type = type;
        button.textContent = text;

        // Add classes
        const variantConfig = this.variants[variant] || this.variants.primary;
        button.className = variantConfig.base;

        // Add custom classes
        if (className) {
            button.className += ` ${className}`;
        }

        // Add ID and title
        if (id) button.id = id;
        if (title) button.title = title;

        // Add data attributes
        Object.entries(dataAttributes).forEach(([key, value]) => {
            button.setAttribute(`data-${key}`, value);
        });

        // Apply styles
        this.applyStyles(button, variant, size, loading, disabled);

        // Add icon if specified
        if (icon) {
            this.addIcon(button, icon, iconPosition, text);
        }

        // Add loading state
        if (loading) {
            this.addLoadingState(button);
        }

        // Add event listeners
        if (onClick && !disabled) {
            button.addEventListener('click', onClick);
        }

        // Add hover effects
        this.addHoverEffects(button, variant);

        return button;
    },

    // Apply styles to button
    applyStyles(button, variant, size, loading, disabled) {
        const variantConfig = this.variants[variant] || this.variants.primary;
        const sizeConfig = this.sizes[size] || this.sizes.md;
        
        let styles = `
            ${variantConfig.styles}
            ${sizeConfig}
            transition: all 0.2s ease-in-out;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            min-width: fit-content;
            border-radius: 0.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        `;

        // Add state styles
        if (loading) styles += this.states.loading;
        if (disabled) styles += this.states.disabled;

        button.style.cssText = styles;
    },

    // Add icon to button
    addIcon(button, icon, position, text) {
        const iconElement = document.createElement('i');
        
        // Handle different icon formats
        if (typeof icon === 'string') {
            if (icon.startsWith('fas ') || icon.startsWith('fa ')) {
                iconElement.className = icon;
            } else {
                iconElement.className = `fas fa-${icon}`;
            }
        } else if (icon instanceof HTMLElement) {
            iconElement.appendChild(icon.cloneNode(true));
        }

        // Position icon
        if (position === 'left') {
            button.insertBefore(iconElement, button.firstChild);
        } else {
            button.appendChild(iconElement);
        }

        // Update button content
        if (text) {
            const textNode = document.createTextNode(text);
            if (position === 'left') {
                button.appendChild(textNode);
            } else {
                button.insertBefore(textNode, iconElement);
            }
        }
    },

    // Add loading state
    addLoadingState(button) {
        const spinner = document.createElement('div');
        spinner.className = 'btn-spinner';
        spinner.innerHTML = `
            <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        `;
        
        // Replace button content with spinner
        button.innerHTML = '';
        button.appendChild(spinner);
        
        // Add loading styles
        button.style.cssText += this.states.loading;
    },

    // Add hover effects
    addHoverEffects(button, variant) {
        const variantConfig = this.variants[variant] || this.variants.primary;
        
        button.addEventListener('mouseenter', () => {
            if (variantConfig.hover) {
                button.style.cssText += variantConfig.hover;
            }
        });
        
        button.addEventListener('mouseleave', () => {
            // Reset to base styles
            this.applyStyles(button, variant, 'md', false, false);
        });
    },

    // Button group component
    createGroup(buttons, options = {}) {
        const {
            vertical = false,
            className = 'btn-group',
            size = 'md'
        } = options;

        const group = document.createElement('div');
        group.className = className;
        
        if (vertical) {
            group.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            `;
        } else {
            group.style.cssText = `
                display: inline-flex;
                border-radius: 0.5rem;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            `;
        }

        // Add buttons to group
        buttons.forEach((buttonConfig, index) => {
            const button = this.create(buttonConfig);
            
            if (!vertical && index > 0) {
                button.style.borderLeft = '1px solid rgba(255, 255, 255, 0.2)';
                button.style.borderRadius = '0';
            }
            
            if (!vertical && index === 0) {
                button.style.borderTopLeftRadius = '0.5rem';
                button.style.borderBottomLeftRadius = '0.5rem';
            }
            
            if (!vertical && index === buttons.length - 1) {
                button.style.borderTopRightRadius = '0.5rem';
                button.style.borderBottomRightRadius = '0.5rem';
            }
            
            group.appendChild(button);
        });

        return group;
    },

    // Toggle button component
    createToggle(options = {}) {
        const {
            text = 'Toggle',
            variant = 'outline',
            size = 'md',
            icon = null,
            initialState = false,
            onChange = null
        } = options;

        const button = this.create({
            text,
            variant: initialState ? 'primary' : variant,
            size,
            icon,
            onClick: () => {
                const newState = !button.dataset.active;
                button.dataset.active = newState;
                
                // Update appearance
                if (newState) {
                    button.className = this.variants.primary.base;
                    this.applyStyles(button, 'primary', size, false, false);
                } else {
                    button.className = this.variants[variant].base;
                    this.applyStyles(button, variant, size, false, false);
                }
                
                // Call onChange callback
                if (onChange) onChange(newState);
            }
        });

        button.dataset.active = initialState;
        button.dataset.component = 'toggle';

        return button;
    },

    // Icon button component
    createIcon(options = {}) {
        const {
            icon,
            variant = 'ghost',
            size = 'md',
            onClick = null,
            title = '',
            className = ''
        } = options;

        const button = this.create({
            text: '',
            variant,
            size,
            icon,
            onClick,
            title,
            className: `${className} btn-icon`
        });

        // Adjust size for icon buttons
        const iconSizes = {
            xs: 'width: 2rem; height: 2rem; padding: 0;',
            sm: 'width: 2.5rem; height: 2.5rem; padding: 0;',
            md: 'width: 3rem; height: 3rem; padding: 0;',
            lg: 'width: 3.5rem; height: 3.5rem; padding: 0;',
            xl: 'width: 4rem; height: 4rem; padding: 0;'
        };

        button.style.cssText += iconSizes[size] || iconSizes.md;

        return button;
    },

    // Update button state
    updateState(button, newState) {
        if (newState.loading !== undefined) {
            if (newState.loading) {
                this.addLoadingState(button);
            } else {
                // Restore original content
                button.innerHTML = button.dataset.originalContent || button.textContent;
            }
        }

        if (newState.disabled !== undefined) {
            button.disabled = newState.disabled;
            this.applyStyles(button, button.dataset.variant || 'primary', button.dataset.size || 'md', false, newState.disabled);
        }

        if (newState.text !== undefined) {
            button.textContent = newState.text;
        }

        if (newState.variant !== undefined) {
            button.dataset.variant = newState.variant;
            this.applyStyles(button, newState.variant, button.dataset.size || 'md', false, button.disabled);
        }
    },

    // Utility methods
    utils: {
        // Disable all buttons in a container
        disableAll(container) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(button => button.disabled = true);
        },

        // Enable all buttons in a container
        enableAll(container) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(button => button.disabled = false);
        },

        // Show loading state for all buttons in a container
        showLoading(container) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(button => {
                if (button.dataset.component !== 'toggle') {
                    Button.addLoadingState(button);
                }
            });
        },

        // Hide loading state for all buttons in a container
        hideLoading(container) {
            const buttons = container.querySelectorAll('button');
            buttons.forEach(button => {
                if (button.dataset.component !== 'toggle') {
                    button.innerHTML = button.dataset.originalContent || button.textContent;
                }
            });
        }
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Button;
} else {
    window.Button = Button;
}
