// ==================== CONTRACT MANAGER MODULE ====================
// Handles contract operations, downloads, and management

export class ContractManager {
    constructor(config = {}) {
        this.apiBase = config.apiBase || '';
        this.onError = config.onError || (() => {});
        this.contracts = new Map();
        this.downloadQueue = [];
        this.isProcessing = false;
    }

    // ==================== CONTRACT DATA MANAGEMENT ====================

    async getUserContracts(userEmail) {
        try {
            console.log('🔄 Fetching contracts for user:', userEmail);
            
            // Check cache first
            if (this.contracts.has(userEmail)) {
                console.log('✅ Using cached contracts');
                return this.contracts.get(userEmail);
            }
            
            // Fetch from API
            const contracts = await this.fetchContractsFromAPI(userEmail);
            
            // Cache the contracts
            this.contracts.set(userEmail, contracts);
            console.log(`✅ Cached ${contracts.length} contracts for user`);
            
            return contracts;
            
        } catch (error) {
            console.error('❌ Failed to get user contracts:', error);
            this.onError(error, 'Contract Loading Failed');
            return [];
        }
    }

    async fetchContractsFromAPI(userEmail) {
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
                    return this.extractContractsFromUser(doc.id, user);
                }
            }
            return [];
            
        } catch (error) {
            console.error('❌ API fetch failed:', error);
            throw error;
        }
    }

    extractContractsFromUser(name, user) {
        try {
            const contracts = [];
            
            // Extract contract data from user object
            if (user.contract && user.contract.contractId) {
                const contract = {
                    contractId: user.contract.contractId,
                    freelancerName: name,
                    freelancerEmail: user.profile?.email,
                    role: user.contract.role || user.profile?.role,
                    rate: user.contract.rate || user.profile?.rate,
                    location: user.contract.location || user.profile?.location,
                    fileName: user.contract.fileName || `${name}.pdf`,
                    fileSize: user.contract.fileSize,
                    uploadDate: user.contract.uploadDate,
                    status: user.contract.contractStatus || 'pending',
                    githubUrl: user.contract.githubUrl,
                    notes: user.contract.notes,
                    contractDate: user.contract.contractDate || new Date().toISOString(),
                    signedDate: user.contract.signedDate,
                    projectStart: user.profile?.projectStart || user.application?.eventDate,
                    description: user.profile?.description || `${user.profile?.role} position`
                };
                
                contracts.push(contract);
            }
            
            // Also check for legacy contract data
            if (user.contractUrl && !contracts.length) {
                const legacyContract = {
                    contractId: `legacy-${name.toLowerCase().replace(/\s+/g, '-')}`,
                    freelancerName: name,
                    freelancerEmail: user.profile?.email,
                    role: user.profile?.role,
                    rate: user.profile?.rate,
                    location: user.profile?.location,
                    fileName: `${name}.pdf`,
                    status: user.contractStatus || 'pending',
                    contractDate: user.approvedDate || new Date().toISOString(),
                    projectStart: user.profile?.projectStart || user.application?.eventDate,
                    description: `${user.profile?.role} position`
                };
                
                contracts.push(legacyContract);
            }
            
            return contracts;
            
        } catch (error) {
            console.error('❌ Failed to extract contracts from user:', error);
            return [];
        }
    }

    // ==================== CONTRACT DOWNLOAD ====================

    async downloadContract(contract) {
        try {
            console.log('📥 Starting contract download:', contract.contractId);
            
            // Add to download queue
            this.downloadQueue.push({
                contract: contract,
                timestamp: Date.now(),
                status: 'queued'
            });
            
            // Process queue if not already processing
            if (!this.isProcessing) {
                this.processDownloadQueue();
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to queue contract download:', error);
            this.onError(error, 'Contract Download Failed');
            return false;
        }
    }

    async processDownloadQueue() {
        if (this.isProcessing || this.downloadQueue.length === 0) {
            return;
        }
        
        this.isProcessing = true;
        
        try {
            while (this.downloadQueue.length > 0) {
                const downloadItem = this.downloadQueue.shift();
                downloadItem.status = 'processing';
                
                console.log(`📥 Processing download: ${downloadItem.contract.contractId}`);
                
                // Generate and download the contract
                await this.generateAndDownloadContract(downloadItem.contract);
                
                downloadItem.status = 'completed';
                downloadItem.completedAt = Date.now();
                
                console.log(`✅ Download completed: ${downloadItem.contract.contractId}`);
            }
            
        } catch (error) {
            console.error('❌ Download queue processing failed:', error);
            this.onError(error, 'Download Processing Failed');
        } finally {
            this.isProcessing = false;
        }
    }

    async generateAndDownloadContract(contract) {
        try {
            // Generate contract data
            const contractData = this.prepareContractData(contract);
            
            // Generate PDF
            const pdfBlob = await this.generateContractPDF(contractData);
            
            // Download the PDF
            this.downloadPDF(pdfBlob, contract.fileName);
            
            console.log(`✅ Contract generated and downloaded: ${contract.contractId}`);
            
        } catch (error) {
            console.error('❌ Contract generation failed:', error);
            throw error;
        }
    }

    prepareContractData(contract) {
        try {
            return {
                contractId: contract.contractId,
                freelancerName: contract.freelancerName,
                freelancerEmail: contract.freelancerEmail,
                role: contract.role,
                rate: contract.rate,
                location: contract.location,
                projectStart: contract.projectStart,
                description: contract.description,
                effectiveDate: contract.contractDate,
                contractDate: contract.contractDate,
                signedDate: contract.signedDate,
                status: contract.status
            };
        } catch (error) {
            console.error('❌ Failed to prepare contract data:', error);
            throw error;
        }
    }

    async generateContractPDF(contractData) {
        try {
            // Check if jsPDF is available
            if (typeof window.jspdf === 'undefined') {
                throw new Error('jsPDF library not loaded');
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Generate the contract content
            this.generateContractContent(doc, contractData);
            
            // Convert to blob
            const pdfBlob = doc.output('blob');
            return pdfBlob;
            
        } catch (error) {
            console.error('❌ PDF generation failed:', error);
            throw error;
        }
    }

    generateContractContent(doc, contractData) {
        try {
            // ==================== HEADER ====================
            doc.setFillColor(255, 178, 0);
            doc.rect(0, 0, 210, 25, 'F');
            
            doc.setFontSize(20);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text('COCHRAN FILMS', 105, 12, { align: 'center' });
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'normal');
            doc.text('FREELANCE CONTRACT AGREEMENT', 105, 20, { align: 'center' });
            
            // ==================== CONTRACT METADATA ====================
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Contract ID: ${contractData.contractId}`, 20, 35);
            doc.text(`Effective Date: ${contractData.effectiveDate}`, 20, 40);
            
            // ==================== CONTRACTOR INFORMATION ====================
            doc.setFillColor(255, 178, 0);
            doc.rect(20, 50, 170, 8, 'F');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text('CONTRACTOR INFORMATION', 105, 56, { align: 'center' });
            
            // Contractor details
            doc.setFillColor(248, 249, 250);
            doc.rect(20, 65, 170, 25, 'F');
            doc.setDrawColor(255, 178, 0);
            doc.setLineWidth(0.5);
            doc.rect(20, 65, 170, 25, 'S');
            
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text(`Name: ${contractData.freelancerName}`, 25, 72);
            doc.text(`Email: ${contractData.freelancerEmail}`, 25, 78);
            doc.text(`Role: ${contractData.role}`, 25, 84);
            doc.text(`Location: ${contractData.location}`, 25, 90);
            doc.text(`Rate: ${contractData.rate}`, 25, 96);
            
            // ==================== PROJECT DETAILS ====================
            doc.setFillColor(255, 178, 0);
            doc.rect(20, 100, 170, 8, 'F');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text('PROJECT DETAILS', 105, 106, { align: 'center' });
            
            doc.setFillColor(248, 249, 250);
            doc.rect(20, 115, 170, 20, 'F');
            doc.setDrawColor(255, 178, 0);
            doc.setLineWidth(0.5);
            doc.rect(20, 115, 170, 20, 'S');
            
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text(`Project Start: ${contractData.projectStart || 'TBD'}`, 25, 122);
            doc.text(`Description: ${contractData.description}`, 25, 128);
            doc.text(`Contract Date: ${contractData.contractDate}`, 25, 134);
            
            // ==================== SIGNATURES ====================
            const signatureY = 160;
            
            doc.setFillColor(255, 178, 0);
            doc.rect(20, signatureY - 5, 170, 8, 'F');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text('CONTRACT SIGNATURES', 105, signatureY + 2, { align: 'center' });
            
            // Company signature
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'bold');
            doc.text('COCHRAN FILMS (COMPANY)', 20, signatureY + 15);
            
            doc.setFillColor(248, 249, 250);
            doc.rect(20, signatureY + 20, 75, 25, 'F');
            doc.setDrawColor(255, 178, 0);
            doc.setLineWidth(0.5);
            doc.rect(20, signatureY + 20, 75, 25, 'S');
            
            doc.setFontSize(6);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text('Authorized Signature:', 25, signatureY + 26);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'italic');
            doc.text('Cody Cochran', 25, signatureY + 32);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.text('Title: Founder & CEO', 25, signatureY + 38);
            doc.text('Date: ' + contractData.effectiveDate, 25, signatureY + 42);
            
            // Contractor signature
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('CONTRACTOR SIGNATURE', 105, signatureY + 15);
            
            doc.setFillColor(248, 249, 250);
            doc.rect(105, signatureY + 20, 75, 25, 'F');
            doc.setDrawColor(255, 178, 0);
            doc.setLineWidth(0.5);
            doc.rect(105, signatureY + 20, 75, 25, 'S');
            
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.text('Contractor:', 115, signatureY + 26);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'italic');
            doc.text(contractData.freelancerName, 115, signatureY + 32);
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.text('Signature: Digital Signature', 115, signatureY + 38);
            doc.text('Date: ' + contractData.effectiveDate, 115, signatureY + 42);
            
            // ==================== FOOTER ====================
            const footerY = 220;
            doc.setFillColor(248, 249, 250);
            doc.rect(20, footerY - 5, 170, 15, 'F');
            doc.setDrawColor(255, 178, 0);
            doc.setLineWidth(0.3);
            doc.rect(20, footerY - 5, 170, 15, 'S');
            
            doc.setFontSize(6);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            doc.text('This contract was digitally signed and is legally binding under Georgia law.', 105, footerY + 3, { align: 'center' });
            doc.text('Generated by Cochran Films Contract Portal • ' + new Date().toLocaleDateString(), 105, footerY + 8, { align: 'center' });
            doc.text('Contract ID: ' + contractData.contractId, 105, footerY + 13, { align: 'center' });
            
        } catch (error) {
            console.error('❌ Failed to generate contract content:', error);
            throw error;
        }
    }

    downloadPDF(pdfBlob, filename) {
        try {
            // Create download link
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            URL.revokeObjectURL(url);
            
            console.log(`✅ PDF downloaded: ${filename}`);
            
        } catch (error) {
            console.error('❌ PDF download failed:', error);
            throw error;
        }
    }

    // ==================== CONTRACT STATUS MANAGEMENT ====================

    async updateContractStatus(contractId, status, userEmail) {
        try {
            console.log(`🔄 Updating contract ${contractId} status to: ${status}`);
            
            // In a real system, this would make an API call
            // For now, we'll update the cache
            const userContracts = this.contracts.get(userEmail) || [];
            const contractIndex = userContracts.findIndex(c => c.contractId === contractId);
            
            if (contractIndex !== -1) {
                userContracts[contractIndex].status = status;
                userContracts[contractIndex].lastUpdated = new Date().toISOString();
                
                // Update cache
                this.contracts.set(userEmail, userContracts);
                
                console.log(`✅ Contract status updated: ${contractId} -> ${status}`);
                return true;
            }
            
            throw new Error('Contract not found');
            
        } catch (error) {
            console.error('❌ Failed to update contract status:', error);
            this.onError(error, 'Contract Status Update Failed');
            return false;
        }
    }

    // ==================== CONTRACT VALIDATION ====================

    validateContract(contract) {
        try {
            const required = ['contractId', 'freelancerName', 'freelancerEmail', 'role'];
            const missing = required.filter(field => !contract[field]);
            
            if (missing.length > 0) {
                throw new Error(`Missing required contract fields: ${missing.join(', ')}`);
            }
            
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(contract.freelancerEmail)) {
                throw new Error('Invalid contractor email format');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Contract validation failed:', error);
            throw error;
        }
    }

    // ==================== PUBLIC API ====================

    getContract(userEmail, contractId) {
        try {
            const userContracts = this.contracts.get(userEmail) || [];
            return userContracts.find(c => c.contractId === contractId);
        } catch (error) {
            console.warn('⚠️ Failed to get contract:', error);
            return null;
        }
    }

    getContractCount(userEmail) {
        try {
            const userContracts = this.contracts.get(userEmail) || [];
            return userContracts.length;
        } catch (error) {
            console.warn('⚠️ Failed to get contract count:', error);
            return 0;
        }
    }

    clearCache() {
        try {
            this.contracts.clear();
            console.log('✅ Contract cache cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear contract cache:', error);
        }
    }

    getDownloadQueueStatus() {
        return {
            isProcessing: this.isProcessing,
            queueLength: this.downloadQueue.length,
            completed: this.downloadQueue.filter(item => item.status === 'completed').length
        };
    }

    // ==================== STATIC UTILITIES ====================

    static formatContractId(id) {
        try {
            if (!id) return 'Unknown';
            
            // Format contract ID for display
            return id.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            
        } catch (error) {
            return 'Unknown';
        }
    }

    static formatContractStatus(status) {
        try {
            if (!status) return 'Unknown';
            
            const statusMap = {
                'pending': 'Pending',
                'active': 'Active',
                'completed': 'Completed',
                'cancelled': 'Cancelled',
                'expired': 'Expired'
            };
            
            return statusMap[status] || status;
            
        } catch (error) {
            return 'Unknown';
        }
    }

    static formatContractDate(dateString) {
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

export default ContractManager;
