/**
 * Admin Bank Details Viewer
 * Secure interface for viewing encrypted bank information
 */

class AdminBankViewer {
    constructor() {
        this.secureStorage = new SecureBankStorage();
        this.accessLog = [];
    }

    // Show bank details for a specific user
    async showUserBankDetails(userName, userData) {
        // If no bankData on the passed object, try to fetch a fresh copy from Firestore
        if (!userData.bankData) {
            try {
                if (window.FirestoreDataManager && window.FirestoreDataManager.isAvailable) {
                    // Prefer a single-doc read to avoid overriding UI state
                    const fresh = await window.FirestoreDataManager.getUser(userName);
                    if (fresh && (fresh.bankData || fresh.bankDetails)) {
                        userData = { ...userData, ...fresh };
                    }
                }
            } catch (_) {}
        }
        // If still no bankData but bankDetails exists (non-encrypted summary), synthesize minimal view
        if (!userData.bankData && userData.bankDetails) {
            userData.bankData = {
                bankName: userData.bankDetails.bankName || '—',
                accountType: userData.bankDetails.accountType || '—',
                lastFour: userData.bankDetails.lastFour || '****',
                savedAt: userData.paymentUpdatedAt || new Date().toISOString(),
                encrypted: null,
                encryptionKey: null
            };
        }
        if (!userData.bankData) {
            this.showNoBankDataModal(userName);
            return;
        }
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;
        
        modal.innerHTML = `
            <div style="
                background: #1a1a2e;
                border-radius: 20px;
                padding: 2rem;
                max-width: 700px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                border: 1px solid rgba(255,255,255,0.1);
                position: relative;
            ">
                <button onclick="closeAdminBankModal()" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.7);
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                    ×
                </button>
                
                <h2 style="color: #FFB200; margin-bottom: 1.5rem; font-family: 'Cinzel', serif;">
                    <i class="fas fa-shield-alt"></i> Secure Bank Details - ${userName}
                </h2>
                
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 0.9rem;">
                        <i class="fas fa-lock"></i>
                        <strong>Security Notice:</strong> This data is encrypted and requires admin authentication to view. 
                        All access is logged for security purposes.
                    </p>
                </div>
                
                <div id="bankDetailsContent" style="display: grid; gap: 1rem;">
                    <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 8px;">
                        <h3 style="color: #FFB200; margin-bottom: 1rem;">
                            <i class="fas fa-university"></i> Bank Information
                        </h3>
                        
                        <div style="display: grid; gap: 0.5rem;">
                            <div>
                                <strong style="color: rgba(255,255,255,0.8);">Bank Name:</strong>
                                <span style="color: white; margin-left: 0.5rem;">${userData.bankData.bankName || '—'}</span>
                            </div>
                            <div>
                                <strong style="color: rgba(255,255,255,0.8);">Account Type:</strong>
                                <span style="color: white; margin-left: 0.5rem;">${userData.bankData.accountType || '—'}</span>
                            </div>
                            <div>
                                <strong style="color: rgba(255,255,255,0.8);">Last 4 Digits:</strong>
                                <span style="color: white; margin-left: 0.5rem;">${userData.bankData.lastFour ? `****${userData.bankData.lastFour}` : '—'}</span>
                            </div>
                            <div>
                                <strong style="color: rgba(255,255,255,0.8);">Saved:</strong>
                                <span style="color: white; margin-left: 0.5rem;">${userData.bankData.savedAt ? new Date(userData.bankData.savedAt).toLocaleString() : '—'}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${userData.bankData.encrypted && userData.bankData.encryptionKey ? `
                    <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 8px;">
                        <h3 style="color: #FFB200; margin-bottom: 1rem;">
                            <i class="fas fa-key"></i> Decrypt Full Details
                        </h3>
                        
                        <p style="color: rgba(255,255,255,0.8); margin-bottom: 1rem; font-size: 0.9rem;">
                            Enter admin password to decrypt and view full bank details:
                        </p>
                        
                        <div style="display: grid; gap: 1rem;">
                            <input type="password" id="adminPassword" placeholder="Enter admin password" style="
                                width: 100%;
                                padding: 12px;
                                border: 2px solid rgba(255,255,255,0.2);
                                border-radius: 8px;
                                background: rgba(255,255,255,0.1);
                                color: white;
                                font-size: 16px;
                                transition: all 0.3s ease;
                            " onfocus="this.style.borderColor='#FFB200'" onblur="this.style.borderColor='rgba(255,255,255,0.2)'">
                            
                            <button onclick="decryptBankDetails('${userName}')" style="
                                padding: 12px;
                                border: none;
                                border-radius: 8px;
                                background: linear-gradient(135deg, #22c55e, #16a34a);
                                color: white;
                                font-weight: bold;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                                <i class="fas fa-unlock"></i>
                                Decrypt Details
                            </button>
                        </div>
                    </div>` : ''}
                    
                    <div id="decryptedDetails" style="display: none; background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 8px;">
                        <h3 style="color: #FFB200; margin-bottom: 1rem;">
                            <i class="fas fa-eye"></i> Decrypted Details
                        </h3>
                        
                        <div id="decryptedContent" style="display: grid; gap: 0.5rem;">
                            <!-- Decrypted content will be inserted here -->
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px; margin-top: 1.5rem;">
                    <p style="color: rgba(255,255,255,0.8); font-size: 0.9rem; margin: 0;">
                        <i class="fas fa-info-circle"></i>
                        <strong>Access Logged:</strong> This access attempt has been logged for security purposes. 
                        Decrypted data is only displayed temporarily and not stored.
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Log access attempt
        this.logAccess(userName, 'view_attempt');
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAdminBankModal();
            }
        });
    }

    // Show modal when no bank data exists
    showNoBankDataModal(userName) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;
        
        modal.innerHTML = `
            <div style="
                background: #1a1a2e;
                border-radius: 20px;
                padding: 2rem;
                max-width: 500px;
                width: 100%;
                border: 1px solid rgba(255,255,255,0.1);
                position: relative;
            ">
                <button onclick="closeAdminBankModal()" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    color: rgba(255,255,255,0.7);
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">
                    ×
                </button>
                
                <h2 style="color: #FFB200; margin-bottom: 1.5rem; font-family: 'Cinzel', serif;">
                    <i class="fas fa-info-circle"></i> No Bank Data
                </h2>
                
                <p style="color: rgba(255,255,255,0.9); margin-bottom: 1.5rem;">
                    <strong>${userName}</strong> has not set up bank transfer details yet.
                </p>
                
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
                    <p style="color: rgba(255,255,255,0.8); font-size: 0.9rem; margin: 0;">
                        <i class="fas fa-info-circle"></i>
                        Bank details will appear here once the user selects "Bank Transfer" as their payment method and completes the secure setup process.
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAdminBankModal();
            }
        });
    }

    // Decrypt bank details with admin password
    async decryptBankDetails(userName) {
        const adminPassword = document.getElementById('adminPassword').value;
        
        if (!adminPassword) {
            showNotification('Please enter admin password', 'warning');
            return;
        }

        // Debug password comparison
        console.log('🔍 Password Debug:');
        console.log('  adminPassword:', adminPassword);
        console.log('  expectedPassword:', 'Cochranfilms2@');
        console.log('  length:', adminPassword.length, 'vs', 'Cochranfilms2@'.length);
        console.log('  exactMatch:', adminPassword === 'Cochranfilms2@');
        console.log('  charCodes:', Array.from(adminPassword).map(c => c.charCodeAt(0)));
        console.log('  expectedCharCodes:', Array.from('Cochranfilms2@').map(c => c.charCodeAt(0)));

        // Verify admin password first
        if (adminPassword !== 'Cochranfilms2@') {
            console.log('❌ Password validation failed!');
            showNotification('❌ Invalid admin password', 'error');
            this.logAccess(userName, 'decrypt_failed_invalid_password');
            return;
        }
        
        console.log('✅ Password validation passed!');

        try {
            // Show loading state
            const decryptButton = document.querySelector('button[onclick*="decryptBankDetails"]');
            const originalText = decryptButton.innerHTML;
            decryptButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Decrypting...';
            decryptButton.disabled = true;

            console.log('🔍 Starting decryption process...');
            
            // Get user data
            console.log('🔍 Loading users data...');
            await loadUsers();
            console.log('🔍 Users data loaded, accessing global users object...');
            
            const userData = users[userName];
            console.log('🔍 User data for', userName + ':', userData);
            
            if (!userData || !userData.bankData) {
                console.log('❌ No bank data found for user');
                throw new Error('No bank data found for user');
            }
            
            console.log('🔍 Bank data found:', userData.bankData);
            console.log('🔍 Encrypted data length:', userData.bankData.encrypted.length);
            console.log('🔍 Encryption key:', userData.bankData.encryptionKey);

            // Use the stored encryption key for decryption
            console.log('🔍 Calling secureStorage.decryptBankData...');
            const decryptedData = await this.secureStorage.decryptBankData(
                userData.bankData.encrypted,
                userData.bankData.encryptionKey
            );
            console.log('🔍 Decryption successful:', decryptedData);

            // Display decrypted data
            this.displayDecryptedData(decryptedData);
            
            // Log successful decryption
            this.logAccess(userName, 'decrypt_success');
            
            // Show success notification
            showNotification('✅ Bank details decrypted successfully', 'success');

        } catch (error) {
            console.error('Decryption failed:', error);
            showNotification('❌ Invalid admin password or decryption failed', 'error');
            
            // Log failed attempt
            this.logAccess(userName, 'decrypt_failed');
        } finally {
            // Reset button
            const decryptButton = document.querySelector('button[onclick*="decryptBankDetails"]');
            decryptButton.innerHTML = '<i class="fas fa-unlock"></i> Decrypt Details';
            decryptButton.disabled = false;
        }
    }

    // Display decrypted bank details
    displayDecryptedData(decryptedData) {
        const decryptedDetails = document.getElementById('decryptedDetails');
        const decryptedContent = document.getElementById('decryptedContent');
        
        decryptedContent.innerHTML = `
            <div>
                <strong style="color: rgba(255,255,255,0.8);">Bank Name:</strong>
                <span style="color: white; margin-left: 0.5rem;">${decryptedData.bankName}</span>
            </div>
            <div>
                <strong style="color: rgba(255,255,255,0.8);">Routing Number:</strong>
                <span style="color: white; margin-left: 0.5rem;">${decryptedData.routingNumber}</span>
            </div>
            <div>
                <strong style="color: rgba(255,255,255,0.8);">Account Number:</strong>
                <span style="color: white; margin-left: 0.5rem;">${decryptedData.accountNumber}</span>
            </div>
            <div>
                <strong style="color: rgba(255,255,255,0.8);">Account Type:</strong>
                <span style="color: white; margin-left: 0.5rem;">${decryptedData.accountType}</span>
            </div>
            <div>
                <strong style="color: rgba(255,255,255,0.8);">Created:</strong>
                <span style="color: white; margin-left: 0.5rem;">${new Date(decryptedData.createdAt).toLocaleString()}</span>
            </div>
        `;
        
        decryptedDetails.style.display = 'block';
        
        // Auto-hide after 5 minutes for security
        setTimeout(() => {
            decryptedDetails.style.display = 'none';
            showNotification('🔒 Decrypted data auto-hidden for security', 'info');
        }, 300000); // 5 minutes
    }

    // Log access attempts
    logAccess(userName, action) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            userName: userName,
            action: action,
            adminUser: 'admin', // In real implementation, get actual admin user
            ipAddress: 'admin-dashboard', // In real implementation, get actual IP
            userAgent: navigator.userAgent
        };
        
        this.accessLog.push(logEntry);
        
        // In production, send to secure logging service
        console.log('🔒 Bank access logged:', logEntry);
        
        // Store in localStorage for demo (in production, send to secure server)
        const existingLogs = JSON.parse(localStorage.getItem('bankAccessLogs') || '[]');
        existingLogs.push(logEntry);
        localStorage.setItem('bankAccessLogs', JSON.stringify(existingLogs.slice(-100))); // Keep last 100 entries
    }

    // Get access logs
    getAccessLogs() {
        return this.accessLog;
    }
}

// Global functions
function closeAdminBankModal() {
    const modal = document.querySelector('div[style*="position: fixed"][style*="z-index: 1000"]');
    if (modal) {
        modal.remove();
    }
}

function decryptBankDetails(userName) {
    console.log('🔍 Global decryptBankDetails called for:', userName);
    console.log('🔍 window.adminBankViewer available:', !!window.adminBankViewer);
    
    if (window.adminBankViewer) {
        console.log('✅ Calling class method...');
        window.adminBankViewer.decryptBankDetails(userName);
    } else {
        console.log('❌ AdminBankViewer not available');
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminBankViewer };
} else {
    window.AdminBankViewer = AdminBankViewer;
    window.closeAdminBankModal = closeAdminBankModal;
    window.decryptBankDetails = decryptBankDetails;
} 