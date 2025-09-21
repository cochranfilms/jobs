/**
 * EmailJS Configuration Module
 * Handles EmailJS initialization and configuration
 */

const EmailJSConfig = {
    // EmailJS Configuration
    config: {
        publicKey: 'p4pF3OWvh-DXtae4c',
        serviceId: 'service_t11yvru',
        templates: {
            jobAcceptance: 'template_job_acceptance',
            jobClosed: 'template_jobs_closed'
        }
    },

    // Initialize EmailJS
    init() {
        try {
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS library not loaded');
            }

            emailjs.init(this.config.publicKey);
            console.log('✅ EmailJS initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ EmailJS initialization failed:', error);
            return false;
        }
    },

    // Send job acceptance email
    async sendJobAcceptanceEmail(params) {
        try {
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS not available');
            }

            const response = await emailjs.send(
                this.config.serviceId,
                this.config.templates.jobAcceptance,
                params
            );

            console.log('✅ Job acceptance email sent successfully:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ Job acceptance email failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Send job closed/denial email
    async sendJobClosedEmail(params) {
        try {
            if (typeof emailjs === 'undefined') {
                throw new Error('EmailJS not available');
            }

            const response = await emailjs.send(
                this.config.serviceId,
                this.config.templates.jobClosed,
                params
            );

            console.log('✅ Job closed email sent successfully:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ Job closed email failed:', error);
            return { success: false, error: error.message };
        }
    },

    // Check if EmailJS is available
    isAvailable() {
        return typeof emailjs !== 'undefined';
    },

    // Get configuration
    getConfig() {
        return this.config;
    }
};

// Auto-initialize EmailJS when this module loads
if (typeof emailjs !== 'undefined') {
    EmailJSConfig.init();
} else {
    console.warn('⚠️ EmailJS library not loaded yet, will initialize when available');
    // Wait for EmailJS to load
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof emailjs !== 'undefined') {
            EmailJSConfig.init();
        }
    });
}

// Export for use in other modules
window.EmailJSConfig = EmailJSConfig;
