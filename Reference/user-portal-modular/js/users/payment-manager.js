// ==================== PAYMENT MANAGER MODULE ====================
// Handles payment information, financial data, and payment-related operations

export class PaymentManager {
    constructor(config = {}) {
        this.apiBase = config.apiBase || '';
        this.onError = config.onError || (() => {});
        this.paymentData = new Map();
        this.paymentMethods = ['bank-transfer', 'paypal', 'stripe', 'check', 'cash'];
        this.paymentStatuses = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    }

    // ==================== PAYMENT DATA MANAGEMENT ====================

    async getUserPayments(userEmail) {
        try {
            console.log('🔄 Fetching payment data for user:', userEmail);
            
            // Check cache first
            if (this.paymentData.has(userEmail)) {
                console.log('✅ Using cached payment data');
                return this.paymentData.get(userEmail);
            }
            
            // Fetch from API
            const payments = await this.fetchPaymentsFromAPI(userEmail);
            
            // Cache the data
            this.paymentData.set(userEmail, payments);
            console.log(`✅ Cached payment data for user`);
            
            return payments;
            
        } catch (error) {
            console.error('❌ Failed to get user payments:', error);
            this.onError(error, 'Payment Loading Failed');
            return null;
        }
    }

    async fetchPaymentsFromAPI(userEmail) {
        try {
            // Firestore lookup by profile.email
            if (window.FirebaseConfig && window.FirebaseConfig.isInitialized) {
                const db = window.FirebaseConfig.getFirestore();
                const snap = await db.collection('users')
                    .where('profile.email', '==', userEmail)
                    .limit(1)
                    .get();
                if (!snap.empty) {
                    const doc = snap.docs[0];
                    const user = doc.data() || {};
                    return this.extractPaymentsFromUser(doc.id, user);
                }
            }
            return null;
            
        } catch (error) {
            console.error('❌ API fetch failed:', error);
            throw error;
        }
    }

    extractPaymentsFromUser(name, user) {
        try {
            // Extract payment data from user object
            const payments = {
                userId: name,
                userEmail: user.profile?.email,
                paymentMethod: user.paymentMethod || null,
                paymentStatus: user.paymentStatus || 'pending',
                bankDetails: user.bankDetails || null,
                taxInfo: user.taxInfo || null,
                invoices: user.invoices || [],
                transactions: user.transactions || [],
                earnings: user.earnings || {},
                paymentHistory: user.paymentHistory || [],
                nextPaymentDate: user.nextPaymentDate || null,
                lastPaymentDate: user.lastPaymentDate || null,
                totalEarned: this.calculateTotalEarned(user),
                totalPaid: this.calculateTotalPaid(user),
                outstandingBalance: this.calculateOutstandingBalance(user),
                paymentSchedule: user.paymentSchedule || 'monthly',
                currency: user.currency || 'USD',
                notes: user.paymentNotes || '',
                createdAt: user.paymentCreatedAt || new Date().toISOString(),
                updatedAt: user.paymentUpdatedAt || new Date().toISOString()
            };
            
            // Generate default payment data if none exists
            if (!user.paymentMethod) {
                payments.paymentMethod = this.determineDefaultPaymentMethod(user);
                payments.bankDetails = this.generateDefaultBankDetails(user);
                payments.paymentSchedule = this.determinePaymentSchedule(user);
            }
            
            return payments;
            
        } catch (error) {
            console.error('❌ Failed to extract payments from user:', error);
            return null;
        }
    }

    // ==================== PAYMENT CALCULATIONS ====================

    calculateTotalEarned(user) {
        try {
            let total = 0;
            
            // Calculate from jobs
            if (user.jobs) {
                for (const job of Object.values(user.jobs)) {
                    if (job.earnings) {
                        total += parseFloat(job.earnings) || 0;
                    } else if (job.rate) {
                        // Estimate earnings from rate
                        const rateValue = this.extractRateValue(job.rate);
                        if (rateValue) {
                            total += rateValue;
                        }
                    }
                }
            }
            
            // Add any direct earnings
            if (user.earnings && user.earnings.total) {
                total += parseFloat(user.earnings.total) || 0;
            }
            
            return Math.round(total * 100) / 100; // Round to 2 decimal places
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate total earned:', error);
            return 0;
        }
    }

    calculateTotalPaid(user) {
        try {
            let total = 0;
            
            // Calculate from payment history
            if (user.paymentHistory && Array.isArray(user.paymentHistory)) {
                total = user.paymentHistory
                    .filter(payment => payment.status === 'completed')
                    .reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0);
            }
            
            // Add from transactions
            if (user.transactions && Array.isArray(user.transactions)) {
                total += user.transactions
                    .filter(transaction => transaction.type === 'payment' && transaction.status === 'completed')
                    .reduce((sum, transaction) => sum + (parseFloat(transaction.amount) || 0), 0);
            }
            
            return Math.round(total * 100) / 100;
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate total paid:', error);
            return 0;
        }
    }

    calculateOutstandingBalance(user) {
        try {
            const totalEarned = this.calculateTotalEarned(user);
            const totalPaid = this.calculateTotalPaid(user);
            
            return Math.round((totalEarned - totalPaid) * 100) / 100;
            
        } catch (error) {
            console.warn('⚠️ Failed to calculate outstanding balance:', error);
            return 0;
        }
    }

    extractRateValue(rateString) {
        try {
            if (!rateString) return null;
            
            // Extract numeric value from rate strings like "$400.00 USD (Flat)" or "$125/hour"
            const match = rateString.match(/\$([\d,]+\.?\d*)/);
            if (match) {
                return parseFloat(match[1].replace(',', ''));
            }
            
            return null;
            
        } catch (error) {
            console.warn('⚠️ Failed to extract rate value:', error);
            return null;
        }
    }

    // ==================== DEFAULT PAYMENT DATA GENERATION ====================

    determineDefaultPaymentMethod(user) {
        try {
            // Determine payment method based on user data
            if (user.bankDetails) return 'bank-transfer';
            if (user.profile?.location === 'US') return 'stripe';
            if (user.profile?.location === 'International') return 'paypal';
            
            return 'bank-transfer'; // Default fallback
            
        } catch (error) {
            console.warn('⚠️ Failed to determine default payment method:', error);
            return 'bank-transfer';
        }
    }

    generateDefaultBankDetails(user) {
        try {
            // Generate placeholder bank details
            return {
                accountHolder: user.profile?.name || 'Account Holder',
                accountNumber: '****' + Math.random().toString().slice(2, 6),
                routingNumber: '****' + Math.random().toString().slice(2, 6),
                bankName: 'Bank Name',
                accountType: 'Checking',
                isVerified: false,
                lastVerified: null
            };
            
        } catch (error) {
            console.warn('⚠️ Failed to generate default bank details:', error);
            return null;
        }
    }

    determinePaymentSchedule(user) {
        try {
            // Determine payment schedule based on user data
            if (user.contract?.contractType === 'hourly') return 'bi-weekly';
            if (user.contract?.contractType === 'project') return 'monthly';
            if (user.profile?.role === 'Photographer' || user.profile?.role === 'Videographer') return 'monthly';
            
            return 'monthly'; // Default fallback
            
        } catch (error) {
            console.warn('⚠️ Failed to determine payment schedule:', error);
            return 'monthly';
        }
    }

    // ==================== PAYMENT METHOD MANAGEMENT ====================

    async updatePaymentMethod(userEmail, paymentMethod, details = {}) {
        try {
            console.log(`🔄 Updating payment method for user: ${userEmail} to ${paymentMethod}`);
            
            // Validate payment method
            if (!this.paymentMethods.includes(paymentMethod)) {
                throw new Error(`Invalid payment method: ${paymentMethod}`);
            }
            
            // Get current payment data
            const payments = await this.getUserPayments(userEmail);
            if (!payments) {
                throw new Error('Payment data not found');
            }
            
            // Update payment method
            payments.paymentMethod = paymentMethod;
            payments.updatedAt = new Date().toISOString();
            
            // Update method-specific details
            if (paymentMethod === 'bank-transfer' && details.bankDetails) {
                payments.bankDetails = { ...payments.bankDetails, ...details.bankDetails };
            }
            
            // Persist to Firestore
            if (window.FirebaseConfig && window.FirebaseConfig.isInitialized) {
                const db = window.FirebaseConfig.getFirestore();
                const snap = await db.collection('users')
                    .where('profile.email', '==', userEmail)
                    .limit(1)
                    .get();
                if (!snap.empty) {
                    const doc = snap.docs[0];
                    const userRef = db.collection('users').doc(doc.id);
                    // 1) Persist payment fields
                    await userRef.set({
                        paymentMethod: payments.paymentMethod,
                        paymentStatus: payments.paymentStatus || 'pending',
                        bankDetails: payments.bankDetails || null,
                        paymentUpdatedAt: payments.updatedAt
                    }, { merge: true });

                    // 2) Progress project timeline for all current jobs
                    const userData = doc.data() || {};
                    const existingJobs = userData.jobs || {};
                    const progressedJobs = {};
                    Object.entries(existingJobs).forEach(([jobId, job]) => {
                        const currentProjectStatus = job && job.projectStatus ? job.projectStatus : 'upcoming';
                        const currentPaymentStatus = job && job.paymentStatus ? job.paymentStatus : 'pending';
                        progressedJobs[jobId] = {
                            ...(job || {}),
                            projectStatus: currentProjectStatus === 'upcoming' ? 'in-progress' : currentProjectStatus,
                            paymentStatus: currentPaymentStatus === 'pending' ? 'processing' : currentPaymentStatus,
                            updatedAt: new Date().toISOString()
                        };
                    });
                    if (Object.keys(progressedJobs).length > 0) {
                        await userRef.set({ jobs: progressedJobs }, { merge: true });
                    }
                }
            }
            
            // Update cache
            this.paymentData.set(userEmail, payments);
            
            console.log(`✅ Payment method updated: ${paymentMethod}`);
            return payments;
            
        } catch (error) {
            console.error('❌ Failed to update payment method:', error);
            this.onError(error, 'Payment Method Update Failed');
            throw error;
        }
    }

    async updateBankDetails(userEmail, bankDetails) {
        try {
            console.log('🔄 Updating bank details for user:', userEmail);
            
            // Validate bank details
            this.validateBankDetails(bankDetails);
            
            // Get current payment data
            const payments = await this.getUserPayments(userEmail);
            if (!payments) {
                throw new Error('Payment data not found');
            }
            
            // Update bank details
            payments.bankDetails = { ...payments.bankDetails, ...bankDetails };
            payments.bankDetails.isVerified = false; // Reset verification
            payments.bankDetails.lastVerified = null;
            payments.updatedAt = new Date().toISOString();
            
            // Persist to Firestore
            if (window.FirebaseConfig && window.FirebaseConfig.isInitialized) {
                const db = window.FirebaseConfig.getFirestore();
                const snap = await db.collection('users')
                    .where('profile.email', '==', userEmail)
                    .limit(1)
                    .get();
                if (!snap.empty) {
                    const doc = snap.docs[0];
                    await db.collection('users').doc(doc.id).set({
                        bankDetails: payments.bankDetails,
                        paymentUpdatedAt: payments.updatedAt
                    }, { merge: true });
                }
            }
            
            // Update cache
            this.paymentData.set(userEmail, payments);
            
            console.log('✅ Bank details updated successfully');
            return payments;
            
        } catch (error) {
            console.error('❌ Failed to update bank details:', error);
            this.onError(error, 'Bank Details Update Failed');
            throw error;
        }
    }

    validateBankDetails(bankDetails) {
        try {
            const required = ['accountHolder', 'accountNumber', 'routingNumber', 'bankName'];
            const missing = required.filter(field => !bankDetails[field]);
            
            if (missing.length > 0) {
                throw new Error(`Missing required bank fields: ${missing.join(', ')}`);
            }
            
            // Validate account number format (basic)
            if (!/^\d{4,17}$/.test(bankDetails.accountNumber.replace(/\D/g, ''))) {
                throw new Error('Invalid account number format');
            }
            
            // Validate routing number format (US format)
            if (!/^\d{9}$/.test(bankDetails.routingNumber.replace(/\D/g, ''))) {
                throw new Error('Invalid routing number format (must be 9 digits)');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Bank details validation failed:', error);
            throw error;
        }
    }

    // ==================== PAYMENT PROCESSING ====================

    async processPayment(userEmail, amount, description = '') {
        try {
            console.log(`🔄 Processing payment for user: ${userEmail}, amount: $${amount}`);
            
            // Get current payment data
            const payments = await this.getUserPayments(userEmail);
            if (!payments) {
                throw new Error('Payment data not found');
            }
            
            // Validate payment method
            if (!payments.paymentMethod) {
                throw new Error('No payment method configured');
            }
            
            // Create payment record
            const payment = {
                id: `payment-${Date.now()}`,
                amount: parseFloat(amount),
                description: description || 'Payment processing',
                method: payments.paymentMethod,
                status: 'processing',
                createdAt: new Date().toISOString(),
                processedAt: null,
                completedAt: null,
                failureReason: null
            };
            
            // Add to payment history
            payments.paymentHistory.push(payment);
            payments.updatedAt = new Date().toISOString();
            
            // Persist payment history to Firestore
            if (window.FirebaseConfig && window.FirebaseConfig.isInitialized) {
                const db = window.FirebaseConfig.getFirestore();
                const snap = await db.collection('users')
                    .where('profile.email', '==', userEmail)
                    .limit(1)
                    .get();
                if (!snap.empty) {
                    const doc = snap.docs[0];
                    const userRef = db.collection('users').doc(doc.id);
                    await userRef.set({
                        paymentHistory: firebase.firestore.FieldValue.arrayUnion(payment),
                        paymentUpdatedAt: payments.updatedAt
                    }, { merge: true });
                }
            }
            
            // Update cache
            this.paymentData.set(userEmail, payments);
            
            // Simulate payment processing
            await this.simulatePaymentProcessing(payment);
            
            console.log(`✅ Payment processed successfully: ${payment.id}`);
            return payment;
            
        } catch (error) {
            console.error('❌ Failed to process payment:', error);
            this.onError(error, 'Payment Processing Failed');
            throw error;
        }
    }

    async simulatePaymentProcessing(payment) {
        try {
            // Simulate processing delay
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Simulate success/failure (90% success rate)
            const isSuccess = Math.random() > 0.1;
            
            if (isSuccess) {
                payment.status = 'completed';
                payment.processedAt = new Date().toISOString();
                payment.completedAt = new Date().toISOString();
            } else {
                payment.status = 'failed';
                payment.failureReason = 'Simulated payment failure';
                payment.processedAt = new Date().toISOString();
            }
            
        } catch (error) {
            console.warn('⚠️ Payment simulation failed:', error);
            payment.status = 'failed';
            payment.failureReason = 'Simulation error';
        }
    }

    // ==================== PAYMENT ANALYTICS ====================

    async getPaymentAnalytics(userEmail) {
        try {
            const payments = await this.getUserPayments(userEmail);
            if (!payments) return null;
            
            const analytics = {
                totalEarned: payments.totalEarned,
                totalPaid: payments.totalPaid,
                outstandingBalance: payments.outstandingBalance,
                paymentMethod: payments.paymentMethod,
                paymentSchedule: payments.paymentSchedule,
                nextPaymentDate: payments.nextPaymentDate,
                lastPaymentDate: payments.lastPaymentDate,
                paymentHistory: this.analyzePaymentHistory(payments.paymentHistory),
                earningsBreakdown: this.analyzeEarningsBreakdown(payments.earnings),
                paymentTrends: this.analyzePaymentTrends(payments.paymentHistory)
            };
            
            return analytics;
            
        } catch (error) {
            console.error('❌ Failed to get payment analytics:', error);
            this.onError(error, 'Payment Analytics Failed');
            return null;
        }
    }

    analyzePaymentHistory(paymentHistory) {
        try {
            if (!paymentHistory || paymentHistory.length === 0) {
                return { totalPayments: 0, successfulPayments: 0, failedPayments: 0 };
            }
            
            const totalPayments = paymentHistory.length;
            const successfulPayments = paymentHistory.filter(p => p.status === 'completed').length;
            const failedPayments = paymentHistory.filter(p => p.status === 'failed').length;
            
            return {
                totalPayments,
                successfulPayments,
                failedPayments,
                successRate: Math.round((successfulPayments / totalPayments) * 100)
            };
            
        } catch (error) {
            console.warn('⚠️ Failed to analyze payment history:', error);
            return { totalPayments: 0, successfulPayments: 0, failedPayments: 0 };
        }
    }

    analyzeEarningsBreakdown(earnings) {
        try {
            if (!earnings || Object.keys(earnings).length === 0) {
                return { byMonth: {}, byProject: {}, byRole: {} };
            }
            
            const breakdown = {
                byMonth: {},
                byProject: {},
                byRole: {}
            };
            
            // Analyze earnings by month
            for (const [key, amount] of Object.entries(earnings)) {
                if (key.includes('-')) { // Month format: YYYY-MM
                    const month = key;
                    breakdown.byMonth[month] = (breakdown.byMonth[month] || 0) + (parseFloat(amount) || 0);
                }
            }
            
            return breakdown;
            
        } catch (error) {
            console.warn('⚠️ Failed to analyze earnings breakdown:', error);
            return { byMonth: {}, byProject: {}, byRole: {} };
        }
    }

    analyzePaymentTrends(paymentHistory) {
        try {
            if (!paymentHistory || paymentHistory.length < 2) {
                return { trend: 'insufficient data', averageAmount: 0 };
            }
            
            const completedPayments = paymentHistory.filter(p => p.status === 'completed');
            if (completedPayments.length === 0) {
                return { trend: 'no completed payments', averageAmount: 0 };
            }
            
            const amounts = completedPayments.map(p => p.amount);
            const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
            
            // Simple trend analysis
            const sortedPayments = completedPayments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            const firstAmount = sortedPayments[0].amount;
            const lastAmount = sortedPayments[sortedPayments.length - 1].amount;
            
            let trend = 'stable';
            if (lastAmount > firstAmount * 1.1) trend = 'increasing';
            else if (lastAmount < firstAmount * 0.9) trend = 'decreasing';
            
            return {
                trend,
                averageAmount: Math.round(averageAmount * 100) / 100,
                totalPayments: completedPayments.length
            };
            
        } catch (error) {
            console.warn('⚠️ Failed to analyze payment trends:', error);
            return { trend: 'unknown', averageAmount: 0 };
        }
    }

    // ==================== INVOICE MANAGEMENT ====================

    async generateInvoice(userEmail, invoiceData) {
        try {
            console.log('🔄 Generating invoice for user:', userEmail);
            
            // Validate invoice data
            this.validateInvoiceData(invoiceData);
            
            // Get current payment data
            const payments = await this.getUserPayments(userEmail);
            if (!payments) {
                throw new Error('Payment data not found');
            }
            
            // Create invoice
            const invoice = {
                id: `invoice-${Date.now()}`,
                userId: userEmail,
                amount: parseFloat(invoiceData.amount),
                description: invoiceData.description || 'Professional services',
                dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending',
                items: invoiceData.items || [],
                notes: invoiceData.notes || '',
                createdAt: new Date().toISOString(),
                paidAt: null
            };
            
            // Add to invoices
            payments.invoices.push(invoice);
            payments.updatedAt = new Date().toISOString();
            
            // Update cache
            this.paymentData.set(userEmail, payments);
            
            console.log(`✅ Invoice generated successfully: ${invoice.id}`);
            return invoice;
            
        } catch (error) {
            console.error('❌ Failed to generate invoice:', error);
            this.onError(error, 'Invoice Generation Failed');
            throw error;
        }
    }

    validateInvoiceData(invoiceData) {
        try {
            const required = ['amount'];
            const missing = required.filter(field => !invoiceData[field]);
            
            if (missing.length > 0) {
                throw new Error(`Missing required invoice fields: ${missing.join(', ')}`);
            }
            
            // Validate amount
            if (isNaN(invoiceData.amount) || parseFloat(invoiceData.amount) <= 0) {
                throw new Error('Invalid invoice amount');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Invoice validation failed:', error);
            throw error;
        }
    }

    // ==================== PUBLIC API ====================

    getPayments(userEmail) {
        try {
            return this.paymentData.get(userEmail);
        } catch (error) {
            console.warn('⚠️ Failed to get payments:', error);
            return null;
        }
    }

    getAvailablePaymentMethods() {
        return [...this.paymentMethods];
    }

    getAvailablePaymentStatuses() {
        return [...this.paymentStatuses];
    }

    clearCache() {
        try {
            this.paymentData.clear();
            console.log('✅ Payment cache cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear payment cache:', error);
        }
    }

    // ==================== STATIC UTILITIES ====================

    static formatPaymentMethod(method) {
        try {
            if (!method) return 'Not specified';
            
            const methodMap = {
                'bank-transfer': 'Bank Transfer',
                'paypal': 'PayPal',
                'stripe': 'Credit Card (Stripe)',
                'check': 'Check',
                'cash': 'Cash'
            };
            
            return methodMap[method] || method;
            
        } catch (error) {
            return 'Unknown';
        }
    }

    static formatPaymentStatus(status) {
        try {
            if (!status) return 'Unknown';
            
            const statusMap = {
                'pending': 'Pending',
                'processing': 'Processing',
                'completed': 'Completed',
                'failed': 'Failed',
                'cancelled': 'Cancelled'
            };
            
            return statusMap[status] || status;
            
        } catch (error) {
            return 'Unknown';
        }
    }

    static formatCurrency(amount, currency = 'USD') {
        try {
            if (amount === null || amount === undefined) return 'N/A';
            
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount)) return 'Invalid amount';
            
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(numAmount);
            
        } catch (error) {
            return 'Format error';
        }
    }

    static formatPaymentDate(dateString) {
        try {
            if (!dateString) return 'Not specified';
            
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            
            return date.toLocaleDateString();
            
        } catch (error) {
            return 'Invalid date';
        }
    }
}

// ==================== DEFAULT EXPORT ====================

export default PaymentManager;
