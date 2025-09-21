const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    console.log('🔄 /api/rebuild-contracts endpoint hit');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const contractsDir = path.join(process.cwd(), 'contracts');
        const uploadedContractsFile = path.join(process.cwd(), 'uploaded-contracts.json');
        
        console.log('📁 Scanning contracts directory:', contractsDir);
        
        // Get all PDF files in contracts directory
        const files = fs.readdirSync(contractsDir);
        const pdfFiles = files.filter(file => file.endsWith('.pdf'));
        
        console.log(`📋 Found ${pdfFiles.length} PDF files:`, pdfFiles);
        
        // Load current uploaded contracts data
        let uploadedContractsData = { uploadedContracts: [], lastUpdated: new Date().toISOString(), totalContracts: 0 };
        try {
            const existingData = fs.readFileSync(uploadedContractsFile, 'utf8');
            uploadedContractsData = JSON.parse(existingData);
            console.log(`📄 Loaded existing data with ${uploadedContractsData.uploadedContracts?.length || 0} contracts`);
        } catch (error) {
            console.log('📄 No existing uploaded-contracts.json found, creating new one');
        }
        
        if (!uploadedContractsData.uploadedContracts) {
            uploadedContractsData.uploadedContracts = [];
        }
        
        // Create a map of existing contracts by filename to avoid duplicates
        const existingContractsMap = new Map();
        uploadedContractsData.uploadedContracts.forEach(contract => {
            if (contract.fileName) {
                existingContractsMap.set(contract.fileName, contract);
            }
        });
        
        let contractsAdded = 0;
        const newContracts = [];
        
        // Process each PDF file
        pdfFiles.forEach(filename => {
            if (existingContractsMap.has(filename)) {
                console.log(`📄 Contract already exists for ${filename}, skipping`);
                return;
            }
            
            // Extract contract ID from filename
            const contractId = filename.replace('.pdf', '');
            
            // Get file stats
            const filePath = path.join(contractsDir, filename);
            const stats = fs.statSync(filePath);
            
            // Create contract object
            const contract = {
                contractId: contractId,
                fileName: filename,
                freelancerName: extractFreelancerName(filename),
                uploadDate: stats.mtime.toISOString(),
                signedDate: stats.mtime.toISOString(),
                fileSize: stats.size,
                role: 'Unknown', // Will need to be updated manually
                rate: 'Unknown', // Will need to be updated manually
                location: 'Unknown', // Will need to be updated manually
                notes: 'Rebuilt from local file',
                status: 'uploaded'
            };
            
            newContracts.push(contract);
            contractsAdded++;
            console.log(`✅ Added contract for ${contract.freelancerName}: ${filename}`);
        });
        
        // Add new contracts to the data
        uploadedContractsData.uploadedContracts.push(...newContracts);
        uploadedContractsData.totalContracts = uploadedContractsData.uploadedContracts.length;
        uploadedContractsData.lastUpdated = new Date().toISOString();
        
        // Save the updated data
        fs.writeFileSync(uploadedContractsFile, JSON.stringify(uploadedContractsData, null, 2));
        
        console.log(`✅ Rebuild completed: ${contractsAdded} new contracts added`);
        
        res.json({
            success: true,
            contractsFound: pdfFiles.length,
            contractsAdded: contractsAdded,
            totalContracts: uploadedContractsData.totalContracts,
            message: `Rebuild completed successfully. Found ${pdfFiles.length} PDF files and added ${contractsAdded} new contracts.`
        });
        
    } catch (error) {
        console.error('❌ Error rebuilding contracts:', error);
        res.status(500).json({ 
            error: 'Failed to rebuild contracts', 
            details: error.message 
        });
    }
};

// Helper function to extract freelancer name from filename
function extractFreelancerName(filename) {
    const nameWithoutExt = filename.replace('.pdf', '');
    
    // Handle CF- prefixed files (contract IDs)
    if (nameWithoutExt.startsWith('CF-')) {
        return `Contract ${nameWithoutExt}`;
    }
    
    // Handle files like "Francisco-Flores.pdf"
    if (nameWithoutExt.includes('-')) {
        return nameWithoutExt.replace('-', ' ');
    }
    
    // Handle files like "Francisco Flores.pdf"
    return nameWithoutExt;
} 