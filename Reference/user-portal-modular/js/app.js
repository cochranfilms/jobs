// ==================== USER PORTAL MODULAR SYSTEM ====================
// Main application file that coordinates all modules

import { AuthManager } from './auth/auth-manager.js';
import { NotificationManager } from './utils/notification-manager.js';
import { LoadingManager } from './utils/loading-manager.js';
import { ErrorHandler } from './utils/error-handler.js';
import { UserManager } from './users/user-manager.js';
import { ContractManager } from './contracts/contract-manager.js';
import { JobManager } from './jobs/job-manager.js';
import { PerformanceManager } from './users/performance-manager.js';
import { PaymentManager } from './users/payment-manager.js';

// ==================== GLOBAL STATE ====================

let currentUser = null;
let users = [];
let uploadedContracts = [];
let jobsData = [];
let performanceReviews = {};

// ==================== ENVIRONMENT CONFIGURATION ====================

const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = window.location.hostname === 'collaborate.cochranfilms.com';
const API_BASE = isLocalhost ? 'http://localhost:8000' : `https://${window.location.hostname}`;

console.log('🔧 Environment detected:', {
    hostname: window.location.hostname,
    isLocalhost: isLocalhost,
    isProduction: isProduction,
    apiBase: API_BASE
});

// ==================== MANAGER INSTANCES ====================

let authManager;
let notificationManager;
let loadingManager;
let errorHandler;
let userManager;
let contractManager;
let jobManager;
let performanceManager;
let paymentManager;

// ==================== APPLICATION INITIALIZATION ====================

class UserPortalApp {
    constructor() {
        this.initialized = false;
        this.modules = new Map();
    }

    async initialize() {
        try {
            console.log('🚀 Initializing User Portal Modular System...');
            
            // Initialize managers
            await this.initializeManagers();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize authentication
            await this.initializeAuthentication();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('✅ User Portal Modular System initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize User Portal:', error);
            errorHandler.handleError(error, 'Application Initialization Failed');
        }
    }

    async initializeManagers() {
        console.log('🔧 Initializing managers...');
        
        // Initialize utility managers first
        errorHandler = new ErrorHandler();
        loadingManager = new LoadingManager();
        notificationManager = new NotificationManager();
        
        // Initialize core managers
        authManager = new AuthManager({
            apiBase: API_BASE,
            onAuthStateChanged: this.handleAuthStateChanged.bind(this),
            onError: errorHandler.handleError.bind(errorHandler)
        });
        
        userManager = new UserManager({
            apiBase: API_BASE,
            onError: errorHandler.handleError.bind(errorHandler)
        });
        
        contractManager = new ContractManager({
            apiBase: API_BASE,
            onError: errorHandler.handleError.bind(errorHandler)
        });
        
        jobManager = new JobManager({
            apiBase: API_BASE,
            onError: errorHandler.handleError.bind(errorHandler)
        });
        
        performanceManager = new PerformanceManager({
            apiBase: API_BASE,
            onError: errorHandler.handleError.bind(errorHandler)
        });
        
        paymentManager = new PaymentManager({
            apiBase: API_BASE,
            onError: errorHandler.handleError.bind(errorHandler)
        });
        
        // Store managers for easy access
        this.modules.set('auth', authManager);
        this.modules.set('user', userManager);
        this.modules.set('contract', contractManager);
        this.modules.set('job', jobManager);
        this.modules.set('performance', performanceManager);
        this.modules.set('payment', paymentManager);
        
        console.log('✅ All managers initialized');
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        // Navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-section]') || e.target.closest('[data-section]')) {
                const section = e.target.dataset.section || e.target.closest('[data-section]').dataset.section;
                this.showSection(section);
            }
        });
        
        // User menu toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('.user-menu-btn') || e.target.closest('.user-menu-btn')) {
                this.toggleUserMenu();
            }
        });
        
        // Notification toggle
        document.addEventListener('click', (e) => {
            if (e.target.matches('.notification-btn') || e.target.closest('.notification-btn')) {
                this.toggleNotifications();
            }
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu') && !e.target.closest('.notification-menu')) {
                this.closeDropdowns();
            }
        });
        
        console.log('✅ Event listeners set up');
    }

    async initializeAuthentication() {
        console.log('🔧 Initializing authentication...');
        
        try {
            await authManager.initialize();
            
            // Check if user is already authenticated
            const authenticatedUser = await authManager.getCurrentUser();
            if (authenticatedUser) {
                await this.handleAuthStateChanged(authenticatedUser);
            }
            
        } catch (error) {
            console.error('❌ Authentication initialization failed:', error);
            errorHandler.handleError(error, 'Authentication Failed');
        }
    }

    // ==================== AUTHENTICATION HANDLERS ====================

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email').trim();
        const password = formData.get('password').trim();
        
        try {
            loadingManager.showLoading('Signing in...');
            
            const user = await authManager.signIn(email, password);
            if (user) {
                await this.handleAuthStateChanged(user);
                notificationManager.showSuccess('Successfully signed in!');
            }
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            errorHandler.handleError(error, 'Login Failed');
            this.showLoginError(error.message);
        } finally {
            loadingManager.hideLoading();
        }
    }

    async handleAuthStateChanged(user) {
        console.log('🔐 Auth state changed:', user ? user.email : 'No user');
        
        if (user) {
            // User is signed in
            currentUser = user;
            await this.loadUserData();
            this.showUserPortal();
        } else {
            // User is signed out
            currentUser = null;
            this.showLoginScreen();
        }
    }

    async handleLogout() {
        try {
            await authManager.signOut();
            currentUser = null;
            this.showLoginScreen();
            notificationManager.showInfo('Successfully signed out!');
        } catch (error) {
            console.error('❌ Logout failed:', error);
            errorHandler.handleError(error, 'Logout Failed');
        }
    }

    // ==================== UI STATE MANAGEMENT ====================

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        const userPortal = document.getElementById('userPortal');
        
        if (loginScreen && userPortal) {
            loginScreen.style.display = 'flex';
            userPortal.style.display = 'none';
        }
        
        // Clear any existing errors
        this.clearLoginError();
    }

    showUserPortal() {
        const loginScreen = document.getElementById('loginScreen');
        const userPortal = document.getElementById('userPortal');
        
        if (loginScreen && userPortal) {
            loginScreen.style.display = 'none';
            userPortal.style.display = 'block';
        }
        
        // Update user name in header
        this.updateUserName();
        
        // Initialize portal sections
        this.initializePortalSections();
    }

    showLoginError(message) {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearLoginError() {
        const errorElement = document.getElementById('loginError');
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    }

    updateUserName() {
        if (currentUser) {
            const userNameElement = document.getElementById('userName');
            if (userNameElement) {
                userNameElement.textContent = currentUser.name || currentUser.email;
            }
        }
    }

    // ==================== NAVIGATION ====================

    showSection(sectionName) {
        console.log('🔍 Showing section:', sectionName);
        
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.remove('active'));
        
        // Show target section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update navigation active state
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        // Load section content
        this.loadSectionContent(sectionName);
    }

    async loadSectionContent(sectionName) {
        try {
            switch (sectionName) {
                case 'dashboard':
                    await this.loadDashboardContent();
                    break;
                case 'contracts':
                    await this.loadContractsContent();
                    break;
                case 'jobs':
                    await this.loadJobsContent();
                    break;
                case 'performance':
                    await this.loadPerformanceContent();
                    break;
                case 'payments':
                    await this.loadPaymentsContent();
                    break;
                default:
                    console.warn('⚠️ Unknown section:', sectionName);
            }
        } catch (error) {
            console.error('❌ Failed to load section content:', error);
            errorHandler.handleError(error, `Failed to load ${sectionName} content`);
        }
    }

    // ==================== SECTION CONTENT LOADING ====================

    async loadDashboardContent() {
        if (!currentUser) return;
        
        try {
            // Load user info
            await this.loadUserInfo();
            
            // Load quick stats
            await this.loadQuickStats();
            
        } catch (error) {
            console.error('❌ Failed to load dashboard content:', error);
            errorHandler.handleError(error, 'Dashboard Loading Failed');
        }
    }

    async loadContractsContent() {
        if (!currentUser) return;
        
        try {
            const contracts = await contractManager.getUserContracts(currentUser.email);
            this.displayContracts(contracts);
        } catch (error) {
            console.error('❌ Failed to load contracts content:', error);
            errorHandler.handleError(error, 'Contracts Loading Failed');
        }
    }

    async loadJobsContent() {
        if (!currentUser) return;
        
        try {
            const jobs = await jobManager.getUserJobs(currentUser.email);
            this.displayJobs(jobs);
        } catch (error) {
            console.error('❌ Failed to load jobs content:', error);
            errorHandler.handleError(error, 'Jobs Loading Failed');
        }
    }

    async loadPerformanceContent() {
        if (!currentUser) return;
        
        try {
            const performance = await performanceManager.getUserPerformance(currentUser.email);
            this.displayPerformance(performance);
        } catch (error) {
            console.error('❌ Failed to load performance content:', error);
            errorHandler.handleError(error, 'Performance Loading Failed');
        }
    }

    async loadPaymentsContent() {
        if (!currentUser) return;
        
        try {
            const payments = await paymentManager.getUserPayments(currentUser.email);
            this.displayPayments(payments);
        } catch (error) {
            console.error('❌ Failed to load payments content:', error);
            errorHandler.handleError(error, 'Payments Loading Failed');
        }
    }

    // ==================== DATA LOADING ====================

    async loadUserData() {
        if (!currentUser) return;
        
        try {
            console.log('🔄 Loading user data...');
            
            // Load all data in parallel
            const [userData, contracts, jobs, performance] = await Promise.all([
                userManager.getUser(currentUser.email),
                contractManager.getUserContracts(currentUser.email),
                jobManager.getUserJobs(currentUser.email),
                performanceManager.getUserPerformance(currentUser.email)
            ]);
            
            // Update global state
            currentUser = { ...currentUser, ...userData };
            uploadedContracts = contracts;
            jobsData = jobs;
            performanceReviews = performance;
            
            console.log('✅ User data loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            errorHandler.handleError(error, 'Data Loading Failed');
        }
    }

    async loadUserInfo() {
        if (!currentUser) return;
        
        try {
            const userInfo = await userManager.getUser(currentUser.email);
            this.displayUserInfo(userInfo);
        } catch (error) {
            console.error('❌ Failed to load user info:', error);
            errorHandler.handleError(error, 'User Info Loading Failed');
        }
    }

    async loadQuickStats() {
        if (!currentUser) return;
        
        try {
            const stats = await this.calculateQuickStats();
            this.displayQuickStats(stats);
        } catch (error) {
            console.error('❌ Failed to load quick stats:', error);
            errorHandler.handleError(error, 'Stats Loading Failed');
        }
    }

    async calculateQuickStats() {
        const stats = {
            totalJobs: jobsData.length,
            activeJobs: jobsData.filter(job => job.status === 'active').length,
            completedJobs: jobsData.filter(job => job.status === 'completed').length,
            totalEarnings: jobsData.reduce((sum, job) => sum + (job.earnings || 0), 0),
            contractStatus: currentUser.contractStatus || 'pending',
            paymentMethod: currentUser.paymentMethod || 'Not set'
        };
        
        return stats;
    }

    // ==================== DISPLAY FUNCTIONS ====================

    displayUserInfo(userInfo) {
        const container = document.getElementById('userInfo');
        if (!container) return;
        
        container.innerHTML = `
            <div class="profile-info">
                <div class="info-item">
                    <span class="label">Full Name</span>
                    <span class="value">${userInfo.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Email Address</span>
                    <span class="value">${userInfo.email || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Approved Date</span>
                    <span class="value">${userInfo.approvedDate || 'Pending'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Role</span>
                    <span class="value">${userInfo.role || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Location</span>
                    <span class="value">${userInfo.location || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Rate</span>
                    <span class="value">${userInfo.rate || 'N/A'}</span>
                </div>
            </div>
        `;
    }

    displayQuickStats(stats) {
        const container = document.querySelector('.quick-actions');
        if (!container) return;
        
        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.totalJobs}</div>
                    <div class="stat-label">Total Jobs</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.activeJobs}</div>
                    <div class="stat-label">Active Jobs</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.completedJobs}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">$${stats.totalEarnings.toFixed(2)}</div>
                    <div class="stat-label">Total Earnings</div>
                </div>
            </div>
            <div class="action-buttons">
                <button class="btn btn-primary" onclick="app.downloadContract()">
                    <i class="fas fa-download"></i>
                    Download Contract
                </button>
                <button class="btn btn-secondary" onclick="app.showBankDetails()">
                    <i class="fas fa-university"></i>
                    Bank Details
                </button>
            </div>
        `;
    }

    displayContracts(contracts) {
        const container = document.getElementById('contractsContent');
        if (!container) return;
        
        if (contracts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-contract"></i>
                    <h3>No Contracts Found</h3>
                    <p>Your contracts will appear here once they're available.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="contracts-grid">
                ${contracts.map(contract => `
                    <div class="contract-card card">
                        <div class="card-header">
                            <h3>Contract ${contract.contractId}</h3>
                        </div>
                        <div class="card-content">
                            <div class="contract-info">
                                <p><strong>Status:</strong> <span class="status ${contract.status}">${contract.status}</span></p>
                                <p><strong>Role:</strong> ${contract.role || 'N/A'}</p>
                                <p><strong>Rate:</strong> ${contract.rate || 'N/A'}</p>
                                <p><strong>Location:</strong> ${contract.location || 'N/A'}</p>
                                <p><strong>Date:</strong> ${contract.contractDate || 'N/A'}</p>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="btn btn-primary btn-sm" onclick="app.downloadContract('${contract.contractId}')">
                                <i class="fas fa-download"></i>
                                Download
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayJobs(jobs) {
        const container = document.getElementById('jobsContent');
        if (!container) return;
        
        if (jobs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-briefcase"></i>
                    <h3>No Jobs Found</h3>
                    <p>Your jobs will appear here once they're assigned.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Job ID</th>
                            <th>Role</th>
                            <th>Location</th>
                            <th>Start Date</th>
                            <th>Rate</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${jobs.map(job => `
                            <tr>
                                <td>${job.id}</td>
                                <td>${job.role || job.title || 'N/A'}</td>
                                <td>${job.location || 'N/A'}</td>
                                <td>${job.projectStart || 'N/A'}</td>
                                <td>${job.rate || 'N/A'}</td>
                                <td><span class="status ${job.status}">${job.status}</span></td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-info" onclick="app.viewJobDetails('${job.id}')">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    displayPerformance(performance) {
        const container = document.getElementById('performanceContent');
        if (!container) return;
        
        if (!performance || Object.keys(performance).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <h3>No Performance Reviews</h3>
                    <p>Performance reviews will appear here once they're available.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="performance-grid">
                ${Object.entries(performance).map(([key, value]) => `
                    <div class="performance-card card">
                        <div class="card-header">
                            <h3>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                        </div>
                        <div class="card-content">
                            <div class="performance-info">
                                <p><strong>Rating:</strong> ${value.rating || 'N/A'}/5</p>
                                <p><strong>Comments:</strong> ${value.comments || 'No comments available'}</p>
                                <p><strong>Date:</strong> ${value.date || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    displayPayments(payments) {
        const container = document.getElementById('paymentsContent');
        if (!container) return;
        
        container.innerHTML = `
            <div class="payment-info">
                <div class="payment-method card">
                    <div class="card-header">
                        <h3>Payment Method</h3>
                    </div>
                    <div class="card-content">
                        <p><strong>Current Method:</strong> ${currentUser.paymentMethod || 'Not set'}</p>
                        <p><strong>Status:</strong> <span class="status ${currentUser.paymentStatus || 'pending'}">${currentUser.paymentStatus || 'pending'}</span></p>
                    </div>
                </div>
                
                <div class="payment-history card">
                    <div class="card-header">
                        <h3>Payment History</h3>
                    </div>
                    <div class="card-content">
                        ${payments && payments.length > 0 ? `
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Amount</th>
                                            <th>Job</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${payments.map(payment => `
                                            <tr>
                                                <td>${payment.date || 'N/A'}</td>
                                                <td>$${payment.amount || '0.00'}</td>
                                                <td>${payment.jobId || 'N/A'}</td>
                                                <td><span class="status ${payment.status}">${payment.status}</span></td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <p>No payment history available.</p>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== UTILITY FUNCTIONS ====================

    toggleUserMenu() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    toggleNotifications() {
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    closeDropdowns() {
        const dropdowns = document.querySelectorAll('.user-dropdown, .notification-dropdown');
        dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
    }

    async downloadContract(contractId = null) {
        try {
            if (!currentUser) {
                notificationManager.showError('Please sign in to download contracts');
                return;
            }
            
            const contract = contractId ? 
                uploadedContracts.find(c => c.contractId === contractId) :
                uploadedContracts[0];
            
            if (!contract) {
                notificationManager.showError('No contract available for download');
                return;
            }
            
            await contractManager.downloadContract(contract);
            notificationManager.showSuccess('Contract downloaded successfully!');
            
        } catch (error) {
            console.error('❌ Failed to download contract:', error);
            errorHandler.handleError(error, 'Contract Download Failed');
        }
    }

    async showBankDetails() {
        try {
            if (typeof showBankDetailsModal === 'function') {
                showBankDetailsModal();
            } else {
                notificationManager.showInfo('Bank details feature not available');
            }
        } catch (error) {
            console.error('❌ Failed to show bank details:', error);
            errorHandler.handleError(error, 'Bank Details Failed');
        }
    }

    async viewJobDetails(jobId) {
        try {
            const job = jobsData.find(j => j.id === jobId);
            if (!job) {
                notificationManager.showError('Job not found');
                return;
            }
            
            // Show job details in a modal or navigate to details view
            notificationManager.showInfo(`Viewing details for job: ${job.role || job.title}`);
            
        } catch (error) {
            console.error('❌ Failed to view job details:', error);
            errorHandler.handleError(error, 'Job Details Failed');
        }
    }

    async refreshUserData() {
        try {
            notificationManager.showInfo('Refreshing data...');
            await this.loadUserData();
            notificationManager.showSuccess('Data refreshed successfully!');
        } catch (error) {
            console.error('❌ Failed to refresh data:', error);
            errorHandler.handleError(error, 'Data Refresh Failed');
        }
    }

    // ==================== PUBLIC API ====================

    getModule(name) {
        return this.modules.get(name);
    }

    getCurrentUser() {
        return currentUser;
    }

    getUsers() {
        return users;
    }

    getContracts() {
        return uploadedContracts;
    }

    getJobs() {
        return jobsData;
    }

    getPerformance() {
        return performanceReviews;
    }
}

// ==================== GLOBAL INSTANCE ====================

const app = new UserPortalApp();

// Make app available globally for onclick handlers
window.app = app;

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await app.initialize();
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
    } catch (error) {
        console.error('❌ Application initialization failed:', error);
        
        // Show error message to user
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="loading-content">
                    <h2>Initialization Failed</h2>
                    <p>Failed to initialize the application. Please refresh the page.</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }
});

// ==================== EXPORT ====================

export default app;
