/**
 * Contract Generator Module
 * Handles PDF generation functionality using Component Library
 */

const ContractGenerator = {
    // Generator state
    state: {
        isGenerating: false,
        templates: {
            standard: 'standard',
            advanced: 'advanced',
            custom: 'custom'
        },
        currentTemplate: 'standard',
        generatedContracts: new Map()
    },

    // Initialize contract generator
    async init() {
        try {
            console.log('📄 Initializing Contract Generator...');
            
            // Wait for component library to be ready
            if (!window.ComponentLibrary) {
                await this.waitForComponentLibrary();
            }
            
            // Check if jsPDF is available
            if (typeof jsPDF === 'undefined') {
                console.warn('⚠️ jsPDF not available, PDF generation will be limited');
            }
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('✅ Contract Generator initialized');
            
        } catch (error) {
            console.error('❌ Contract Generator initialization failed:', error);
            if (window.ErrorHandler) {
                window.ErrorHandler.handleError(error, 'contract-generator-init');
            }
        }
    },

    // Wait for component library to be ready
    waitForComponentLibrary() {
        return new Promise((resolve) => {
            if (window.ComponentLibrary) {
                resolve();
            } else {
                window.addEventListener('componentLibraryReady', resolve);
            }
        });
    },

    // Render contract generator interface using Component Library
    renderContractGenerator(containerId = 'contractGeneratorContainer') {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('⚠️ Contract generator container not found:', containerId);
            return;
        }

        // Clear container
        container.innerHTML = '';

        // Create main content card
        const contentCard = this.createContentCard();
        container.appendChild(contentCard);

        // Render template selection section
        this.renderTemplateSelectionSection();
        
        // Render generation controls section
        this.renderGenerationControlsSection();
        
        // Render generated contracts section
        this.renderGeneratedContractsSection();
    },

    // Create main content card
    createContentCard() {
        const card = document.createElement('div');
        card.className = 'content-card';
        
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = '<h2>📄 Contract Generator</h2>';
        
        const content = document.createElement('div');
        content.className = 'card-content';
        content.id = 'contractGeneratorContent';
        
        card.appendChild(header);
        card.appendChild(content);
        
        return card;
    },

    // Render template selection section
    renderTemplateSelectionSection() {
        const container = document.getElementById('contractGeneratorContent');
        if (!container) return;

        const section = document.createElement('div');
        section.className = 'form-section';
        
        const header = document.createElement('h3');
        header.textContent = 'Template Selection';
        section.appendChild(header);
        
        // Create template selection form
        const templateForm = this.createTemplateSelectionForm();
        section.appendChild(templateForm);
        
        container.appendChild(section);
    },

    // Create template selection form
    createTemplateSelectionForm() {
        if (window.Form) {
            const form = window.Form.createForm({
                id: 'templateSelectionForm',
                className: 'template-selection-form'
            });

            // Template type field
            const templateField = window.Form.createField({
                type: 'select',
                name: 'templateType',
                label: 'Contract Template',
                options: [
                    { value: 'standard', label: 'Standard Contract' },
                    { value: 'advanced', label: 'Advanced Contract' },
                    { value: 'custom', label: 'Custom Contract' }
                ],
                selectedValue: this.state.currentTemplate,
                onChange: (e) => this.setTemplate(e.target.value)
            });

            form.appendChild(templateField);
            return form;
        } else {
            // Fallback form
            const form = document.createElement('form');
            form.id = 'templateSelectionForm';
            form.className = 'template-selection-form';
            
            const label = document.createElement('label');
            label.textContent = 'Contract Template:';
            
            const select = document.createElement('select');
            select.name = 'templateType';
            select.onchange = (e) => this.setTemplate(e.target.value);
            
            const options = [
                { value: 'standard', label: 'Standard Contract' },
                { value: 'advanced', label: 'Advanced Contract' },
                { value: 'custom', label: 'Custom Contract' }
            ];
            
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option.value;
                optionElement.textContent = option.label;
                optionElement.selected = option.value === this.state.currentTemplate;
                select.appendChild(optionElement);
            });
            
            form.appendChild(label);
            form.appendChild(select);
            return form;
        }
    },

    // Render generation controls section
    renderGenerationControlsSection() {
        const container = document.getElementById('contractGeneratorContent');
        if (!container) return;

        const section = document.createElement('div');
        section.className = 'form-section';
        
        const header = document.createElement('h3');
        header.textContent = 'Generation Controls';
        section.appendChild(header);
        
        // Create generation controls
        const controls = this.createGenerationControls();
        section.appendChild(controls);
        
        container.appendChild(section);
    },

    // Create generation controls
    createGenerationControls() {
        const controls = document.createElement('div');
        controls.className = 'generation-controls';
        
        // Generate single contract button
        const generateSingleBtn = this.createActionButton({
            text: '📄 Generate Single Contract',
            variant: 'primary',
            onClick: () => this.showGenerateSingleForm()
        });
        
        // Generate all contracts button
        const generateAllBtn = this.createActionButton({
            text: '📚 Generate All Contracts',
            variant: 'info',
            onClick: () => this.generateAllContracts()
        });
        
        // Clear generated contracts button
        const clearBtn = this.createActionButton({
            text: '🗑️ Clear Generated',
            variant: 'secondary',
            onClick: () => this.clearGeneratedContracts()
        });
        
        controls.appendChild(generateSingleBtn);
        controls.appendChild(generateAllBtn);
        controls.appendChild(clearBtn);
        
        return controls;
    },

    // Create action button using Component Library
    createActionButton(config) {
        if (window.Button) {
            return window.Button.create({
                text: config.text,
                variant: config.variant,
                size: 'md',
                onClick: config.onClick
            });
        } else {
            const button = document.createElement('button');
            button.className = `btn btn-${config.variant}`;
            button.textContent = config.text;
            button.onclick = config.onClick;
            return button;
        }
    },

    // Render generated contracts section
    renderGeneratedContractsSection() {
        const container = document.getElementById('contractGeneratorContent');
        if (!container) return;

        const section = document.createElement('div');
        section.className = 'form-section';
        
        const header = document.createElement('h3');
        header.textContent = 'Generated Contracts';
        section.appendChild(header);
        
        // Create generated contracts list
        const contractsList = document.createElement('div');
        contractsList.id = 'generatedContractsList';
        contractsList.className = 'generated-contracts-list';
        section.appendChild(contractsList);
        
        container.appendChild(section);
        
        // Display generated contracts
        this.displayGeneratedContracts();
    },

    // Generate contract PDF
    async generateContractPDF(contractData, template = 'standard') {
        try {
            this.state.isGenerating = true;
            
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Generating contract PDF...');
            }

            let pdfDoc;
            
            switch (template) {
                case 'advanced':
                    pdfDoc = this.generateAdvancedContractPDF(contractData);
                    break;
                case 'custom':
                    pdfDoc = this.generateCustomContractPDF(contractData);
                    break;
                case 'standard':
                default:
                    pdfDoc = this.generateStandardContractPDF(contractData);
                    break;
            }

            if (pdfDoc) {
                // Store generated contract
                const contractId = contractData.id || `gen-${Date.now()}`;
                this.state.generatedContracts.set(contractId, {
                    pdf: pdfDoc,
                    data: contractData,
                    generatedAt: new Date(),
                    template: template
                });

                // Trigger contract generated event
                this.triggerEvent('contractGenerated', { 
                    contractId, 
                    contractData, 
                    template 
                });

                this.showSuccess('Contract PDF generated successfully!');

                return contractId;
            } else {
                throw new Error('Failed to generate PDF document');
            }
            
        } catch (error) {
            console.error('❌ Error generating contract PDF:', error);
            this.showError('Failed to generate contract PDF: ' + error.message);
            return null;
        } finally {
            this.state.isGenerating = false;
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Show generate single contract form
    async showGenerateSingleForm() {
        try {
            if (window.Modal) {
                const formData = await window.Modal.utils.prompt(
                    'Enter contract data (JSON format):',
                    'Generate Single Contract'
                );
                
                if (formData) {
                    const contractData = JSON.parse(formData);
                    await this.generateContractPDF(contractData, this.state.currentTemplate);
                }
            } else {
                const formData = prompt('Enter contract data (JSON format):');
                if (formData) {
                    try {
                        const contractData = JSON.parse(formData);
                        await this.generateContractPDF(contractData, this.state.currentTemplate);
                    } catch (error) {
                        this.showError('Invalid JSON format');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Failed to show generate form:', error);
            this.showError('Failed to show generate form');
        }
    },

    // Generate standard contract PDF
    generateStandardContractPDF(contractData) {
        try {
            if (!this.isJsPDFAvailable()) {
                throw new Error('jsPDF not available');
            }

            const pdf = new jsPDF();
            
            // Add header
            this.addHeader(pdf, contractData);
            
            // Add contract info
            this.addContractInfo(pdf, contractData);
            
            // Add contractor info
            this.addContractorInfo(pdf, contractData);
            
            // Add terms and conditions
            this.addTermsAndConditions(pdf, contractData);
            
            // Add payment info
            this.addPaymentInfo(pdf, contractData);
            
            // Add signature section
            this.addSignatureSection(pdf, contractData);
            
            // Add footer
            this.addFooter(pdf, contractData);
            
            return pdf;
            
        } catch (error) {
            console.error('❌ Error generating standard contract PDF:', error);
            throw error;
        }
    },

    // Generate advanced contract PDF
    generateAdvancedContractPDF(contractData) {
        try {
            if (!this.isJsPDFAvailable()) {
                throw new Error('jsPDF not available');
            }

            const pdf = new jsPDF();
            
            // Add advanced header
            this.addAdvancedHeader(pdf, contractData);
            
            // Add detailed contract info
            this.addDetailedContractInfo(pdf, contractData);
            
            // Add detailed contractor info
            this.addDetailedContractorInfo(pdf, contractData);
            
            // Add detailed terms and conditions
            this.addDetailedTermsAndConditions(pdf, contractData);
            
            // Add detailed payment info
            this.addDetailedPaymentInfo(pdf, contractData);
            
            // Add project timeline
            this.addProjectTimeline(pdf, contractData);
            
            // Add legal clauses
            this.addLegalClauses(pdf, contractData);
            
            // Add advanced signature section
            this.addAdvancedSignatureSection(pdf, contractData);
            
            // Add advanced footer
            this.addAdvancedFooter(pdf, contractData);
            
            return pdf;
            
        } catch (error) {
            console.error('❌ Error generating advanced contract PDF:', error);
            throw error;
        }
    },

    // Generate custom contract PDF
    generateCustomContractPDF(contractData) {
        try {
            if (!this.isJsPDFAvailable()) {
                throw new Error('jsPDF not available');
            }

            const pdf = new jsPDF();
            
            // Add custom header
            this.addCustomHeader(pdf, contractData);
            
            // Add custom sections based on contract data
            if (contractData.customSections) {
                contractData.customSections.forEach(section => {
                    this.addCustomSection(pdf, section);
                });
            }
            
            // Add custom footer
            this.addCustomFooter(pdf, contractData);
            
            return pdf;
            
        } catch (error) {
            console.error('❌ Error generating custom contract PDF:', error);
            throw error;
        }
    },

    // Add header to PDF
    addHeader(pdf, contractData) {
        pdf.setFontSize(20);
        pdf.text('CONTRACT AGREEMENT', 105, 20, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`Generated on: ${this.formatDate(new Date())}`, 105, 30, { align: 'center' });
    },

    // Add advanced header to PDF
    addAdvancedHeader(pdf, contractData) {
        pdf.setFontSize(24);
        pdf.text('ADVANCED CONTRACT AGREEMENT', 105, 20, { align: 'center' });
        pdf.setFontSize(14);
        pdf.text(`Contract ID: ${contractData.id || 'N/A'}`, 105, 30, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`Generated on: ${this.formatDate(new Date())}`, 105, 40, { align: 'center' });
    },

    // Add custom header to PDF
    addCustomHeader(pdf, contractData) {
        pdf.setFontSize(22);
        pdf.text(contractData.title || 'CUSTOM CONTRACT', 105, 20, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`Custom Template - ${this.formatDate(new Date())}`, 105, 30, { align: 'center' });
    },

    // Add contract info to PDF
    addContractInfo(pdf, contractData) {
        pdf.setFontSize(14);
        pdf.text('Contract Information', 20, 50);
        pdf.setFontSize(10);
        pdf.text(`Type: ${contractData.contractType || 'Standard'}`, 20, 60);
        pdf.text(`Status: ${contractData.status || 'Draft'}`, 20, 70);
        pdf.text(`Created: ${this.formatDate(contractData.createdAt)}`, 20, 80);
    },

    // Add detailed contract info to PDF
    addDetailedContractInfo(pdf, contractData) {
        pdf.setFontSize(16);
        pdf.text('Detailed Contract Information', 20, 50);
        pdf.setFontSize(10);
        pdf.text(`Type: ${contractData.contractType || 'Advanced'}`, 20, 60);
        pdf.text(`Status: ${contractData.status || 'Draft'}`, 20, 70);
        pdf.text(`Created: ${this.formatDate(contractData.createdAt)}`, 20, 80);
        pdf.text(`Last Modified: ${this.formatDate(contractData.updatedAt)}`, 20, 90);
        pdf.text(`Contract ID: ${contractData.id || 'N/A'}`, 20, 100);
    },

    // Add contractor info to PDF
    addContractorInfo(pdf, contractData) {
        pdf.setFontSize(14);
        pdf.text('Contractor Information', 20, 110);
        pdf.setFontSize(10);
        pdf.text(`Name: ${contractData.userName || 'N/A'}`, 20, 120);
        pdf.text(`Email: ${contractData.userEmail || 'N/A'}`, 20, 130);
    },

    // Add detailed contractor info to PDF
    addDetailedContractorInfo(pdf, contractData) {
        pdf.setFontSize(16);
        pdf.text('Detailed Contractor Information', 20, 110);
        pdf.setFontSize(10);
        pdf.text(`Name: ${contractData.userName || 'N/A'}`, 20, 120);
        pdf.text(`Email: ${contractData.userEmail || 'N/A'}`, 20, 130);
        pdf.text(`Role: ${contractData.role || 'N/A'}`, 20, 140);
        pdf.text(`Location: ${contractData.location || 'N/A'}`, 20, 150);
        pdf.text(`Rate: ${contractData.rate || 'N/A'}`, 20, 160);
    },

    // Add terms and conditions to PDF
    addTermsAndConditions(pdf, contractData) {
        pdf.setFontSize(14);
        pdf.text('Terms and Conditions', 20, 180);
        pdf.setFontSize(10);
        pdf.text('Standard terms and conditions apply to this contract.', 20, 190);
        pdf.text('Please review all terms before signing.', 20, 200);
    },

    // Add detailed terms and conditions to PDF
    addDetailedTermsAndConditions(pdf, contractData) {
        pdf.setFontSize(16);
        pdf.text('Detailed Terms and Conditions', 20, 180);
        pdf.setFontSize(10);
        pdf.text('1. Scope of Work: As defined in the project requirements', 20, 190);
        pdf.text('2. Payment Terms: Net 30 days from invoice date', 20, 200);
        pdf.text('3. Timeline: As specified in project schedule', 20, 210);
        pdf.text('4. Quality Standards: Professional industry standards', 20, 220);
        pdf.text('5. Confidentiality: All work remains confidential', 20, 230);
    },

    // Add payment info to PDF
    addPaymentInfo(pdf, contractData) {
        pdf.setFontSize(14);
        pdf.text('Payment Information', 20, 240);
        pdf.setFontSize(10);
        pdf.text(`Rate: ${contractData.rate || 'N/A'}`, 20, 250);
        pdf.text('Payment Schedule: As per project milestones', 20, 260);
    },

    // Add detailed payment info to PDF
    addDetailedPaymentInfo(pdf, contractData) {
        pdf.setFontSize(16);
        pdf.text('Detailed Payment Information', 20, 240);
        pdf.setFontSize(10);
        pdf.text(`Base Rate: ${contractData.rate || 'N/A'}`, 20, 250);
        pdf.text('Payment Schedule: 50% upfront, 50% upon completion', 20, 260);
        pdf.text('Additional Costs: Travel, materials, and expenses', 20, 270);
        pdf.text('Late Payment: 1.5% monthly interest', 20, 280);
    },

    // Add project timeline to PDF
    addProjectTimeline(pdf, contractData) {
        pdf.setFontSize(16);
        pdf.text('Project Timeline', 20, 300);
        pdf.setFontSize(10);
        pdf.text(`Start Date: ${this.formatDate(contractData.startDate)}`, 20, 310);
        pdf.text(`End Date: ${this.formatDate(contractData.endDate)}`, 20, 320);
        pdf.text('Milestones: As defined in project plan', 20, 330);
    },

    // Add legal clauses to PDF
    addLegalClauses(pdf, contractData) {
        pdf.setFontSize(16);
        pdf.text('Legal Clauses', 20, 350);
        pdf.setFontSize(10);
        pdf.text('Force Majeure: Unforeseen circumstances clause', 20, 360);
        pdf.text('Dispute Resolution: Mediation and arbitration', 20, 370);
        pdf.text('Governing Law: State of Georgia', 20, 380);
    },

    // Add signature section to PDF
    addSignatureSection(pdf, contractData) {
        pdf.setFontSize(14);
        pdf.text('Signatures', 20, 400);
        pdf.setFontSize(10);
        pdf.text('Contractor: _________________', 20, 410);
        pdf.text('Date: _________________', 20, 420);
        pdf.text('Client: _________________', 20, 430);
        pdf.text('Date: _________________', 20, 440);
    },

    // Add advanced signature section to PDF
    addAdvancedSignatureSection(pdf, contractData) {
        pdf.setFontSize(16);
        pdf.text('Advanced Signature Section', 20, 400);
        pdf.setFontSize(10);
        pdf.text('Contractor: _________________', 20, 410);
        pdf.text('Title: _________________', 20, 420);
        pdf.text('Date: _________________', 20, 430);
        pdf.text('Client: _________________', 20, 440);
        pdf.text('Title: _________________', 20, 450);
        pdf.text('Date: _________________', 20, 460);
        pdf.text('Witness: _________________', 20, 470);
        pdf.text('Date: _________________', 20, 480);
    },

    // Add custom section to PDF
    addCustomSection(pdf, section) {
        pdf.setFontSize(14);
        pdf.text(section.title || 'Custom Section', 20, pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 10 : 400);
        pdf.setFontSize(10);
        pdf.text(section.content || 'Custom content', 20, pdf.lastAutoTable ? pdf.lastAutoTable.finalY + 20 : 410);
    },

    // Add footer to PDF
    addFooter(pdf, contractData) {
        pdf.setFontSize(8);
        pdf.text('This document was generated electronically', 105, 280, { align: 'center' });
        pdf.text('Cochran Films - Professional Contract Management', 105, 285, { align: 'center' });
    },

    // Add advanced footer to PDF
    addAdvancedFooter(pdf, contractData) {
        pdf.setFontSize(8);
        pdf.text('Advanced Contract Document - Generated Electronically', 105, 500, { align: 'center' });
        pdf.text('Cochran Films - Advanced Contract Management System', 105, 505, { align: 'center' });
        pdf.text(`Document ID: ${contractData.id || 'N/A'}`, 105, 510, { align: 'center' });
    },

    // Add custom footer to PDF
    addCustomFooter(pdf, contractData) {
        pdf.setFontSize(8);
        pdf.text('Custom Contract Document - Generated Electronically', 105, 500, { align: 'center' });
        pdf.text('Cochran Films - Custom Contract Generator', 105, 505, { align: 'center' });
        pdf.text(`Template: ${contractData.template || 'Custom'}`, 105, 510, { align: 'center' });
    },

    // Format date for PDF
    formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    },

    // Download PDF
    downloadPDF(pdf, filename = 'contract.pdf') {
        try {
            pdf.save(filename);
            this.showSuccess('PDF downloaded successfully');
        } catch (error) {
            console.error('❌ Error downloading PDF:', error);
            this.showError('Failed to download PDF');
        }
    },

    // Generate all contracts
    async generateAllContracts() {
        try {
            if (window.LoadingManager) {
                window.LoadingManager.showLoading('Generating all contracts...');
            }

            // Get all contracts from ContractManager
            let contracts = [];
            if (window.ContractManager) {
                contracts = window.ContractManager.getAllContracts();
            }

            if (contracts.length === 0) {
                this.showWarning('No contracts found to generate');
                return;
            }

            let generatedCount = 0;
            for (const contract of contracts) {
                try {
                    await this.generateContractPDF(contract, this.state.currentTemplate);
                    generatedCount++;
                } catch (error) {
                    console.error(`❌ Failed to generate contract for ${contract.userName}:`, error);
                }
            }

            this.showSuccess(`Generated ${generatedCount} out of ${contracts.length} contracts`);
            
        } catch (error) {
            console.error('❌ Error generating all contracts:', error);
            this.showError('Failed to generate all contracts');
        } finally {
            if (window.LoadingManager) {
                window.LoadingManager.hideLoading();
            }
        }
    },

    // Get generated contract
    getGeneratedContract(contractId) {
        return this.state.generatedContracts.get(contractId);
    },

    // Get all generated contracts
    getAllGeneratedContracts() {
        return Array.from(this.state.generatedContracts.values());
    },

    // Clear generated contracts
    clearGeneratedContracts() {
        try {
            this.state.generatedContracts.clear();
            this.displayGeneratedContracts();
            this.showSuccess('Generated contracts cleared');
        } catch (error) {
            console.error('❌ Error clearing generated contracts:', error);
            this.showError('Failed to clear generated contracts');
        }
    },

    // Display generated contracts
    displayGeneratedContracts() {
        const container = document.getElementById('generatedContractsList');
        if (!container) return;

        const contracts = this.getAllGeneratedContracts();
        
        if (contracts.length === 0) {
            container.innerHTML = '<p>No contracts generated yet.</p>';
            return;
        }

        container.innerHTML = '';
        contracts.forEach((contract, index) => {
            const contractItem = this.createGeneratedContractItem(contract, index);
            container.appendChild(contractItem);
        });
    },

    // Create generated contract item
    createGeneratedContractItem(contract, index) {
        const item = document.createElement('div');
        item.className = 'generated-contract-item';
        
        item.innerHTML = `
            <div class="contract-info">
                <h4>${contract.data.userName || 'Unknown User'}</h4>
                <p><strong>Template:</strong> ${contract.template}</p>
                <p><strong>Generated:</strong> ${this.formatDate(contract.generatedAt)}</p>
            </div>
            <div class="contract-actions">
                ${this.createGeneratedContractActions(contract, index)}
            </div>
        `;
        
        return item;
    },

    // Create generated contract actions
    createGeneratedContractActions(contract, index) {
        const actions = [];
        
        // Download button
        if (window.Button) {
            const downloadBtn = window.Button.create({
                text: '📥 Download',
                variant: 'success',
                size: 'sm',
                onClick: () => this.downloadPDF(contract.pdf, `contract-${contract.data.userName}.pdf`)
            });
            actions.push(downloadBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-small btn-success" onclick="ContractGenerator.downloadPDF(contract.pdf, \'contract-' + contract.data.userName + '.pdf\')">📥 Download</button>');
        }
        
        // Delete button
        if (window.Button) {
            const deleteBtn = window.Button.create({
                text: '🗑️ Delete',
                variant: 'danger',
                size: 'sm',
                onClick: () => this.deleteGeneratedContract(contract.data.id)
            });
            actions.push(deleteBtn.outerHTML);
        } else {
            actions.push('<button class="btn btn-small btn-danger" onclick="ContractGenerator.deleteGeneratedContract(\'' + contract.data.id + '\')">🗑️ Delete</button>');
        }
        
        return actions.join('');
    },

    // Delete generated contract
    deleteGeneratedContract(contractId) {
        try {
            this.state.generatedContracts.delete(contractId);
            this.displayGeneratedContracts();
            this.showSuccess('Generated contract deleted');
        } catch (error) {
            console.error('❌ Error deleting generated contract:', error);
            this.showError('Failed to delete generated contract');
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for contract events
        window.addEventListener('contractManager:contractCreated', (e) => {
            this.handleContractUpdate(e.detail);
        });
        
        window.addEventListener('contractManager:contractUpdated', (e) => {
            this.handleContractUpdate(e.detail);
        });
    },

    // Handle contract update
    handleContractUpdate(contractData) {
        console.log('🔄 Contract updated, updating generator:', contractData);
        // Could trigger regeneration or update UI
    },

    // Trigger custom event
    triggerEvent(eventName, data) {
        const event = new CustomEvent(`contractGenerator:${eventName}`, {
            detail: data
        });
        window.dispatchEvent(event);
    },

    // Check if jsPDF is available
    isJsPDFAvailable() {
        return typeof jsPDF !== 'undefined';
    },

    // Get available templates
    getAvailableTemplates() {
        return Object.keys(this.state.templates);
    },

    // Set template
    setTemplate(templateName) {
        if (this.state.templates[templateName]) {
            this.state.currentTemplate = templateName;
            console.log('✅ Template set to:', templateName);
        } else {
            console.warn('⚠️ Invalid template:', templateName);
        }
    },

    // Show success message
    showSuccess(message) {
        if (window.Notification) {
            window.Notification.utils.success(message, 'Success');
        } else if (window.NotificationManager) {
            window.NotificationManager.showSuccess(message);
        } else {
            alert('Success: ' + message);
        }
    },

    // Show error message
    showError(message) {
        if (window.Notification) {
            window.Notification.utils.error(message, 'Error');
        } else if (window.NotificationManager) {
            window.NotificationManager.showError(message);
        } else {
            alert('Error: ' + message);
        }
    },

    // Show warning message
    showWarning(message) {
        if (window.Notification) {
            window.Notification.utils.warning(message, 'Warning');
        } else if (window.NotificationManager) {
            window.NotificationManager.showWarning(message);
        } else {
            alert('Warning: ' + message);
        }
    }
};

// Export to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContractGenerator;
} else {
    window.ContractGenerator = ContractGenerator;
}
