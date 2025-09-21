module.exports = async (req, res) => {
    console.log(`📄 Contracts API endpoint hit: ${req.method}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GitHub configuration from environment variables
    const GITHUB_CONFIG = {
        token: process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_OWNER || 'cochranfilms',
        repo: process.env.GITHUB_REPO || 'cochran-job-listings',
        branch: process.env.GITHUB_BRANCH || 'main'
    };

    // Only require GitHub token for POST requests (uploading to GitHub)
    if (req.method === 'POST' && !GITHUB_CONFIG.token) {
        console.error('❌ GITHUB_TOKEN environment variable not set');
        return res.status(500).json({ error: 'GitHub token not configured' });
    }

    // Handle GET requests for downloading PDF files
    if (req.method === 'GET') {
        try {
            const { filename } = req.query;
            
            // If no filename provided, return list of all contracts
            if (!filename) {
                const fs = require('fs');
                const path = require('path');
                const uploadedContractsFile = path.join(__dirname, '..', 'uploaded-contracts.json');
                
                // Check if uploaded-contracts.json exists
                if (!fs.existsSync(uploadedContractsFile)) {
                    console.log('📄 No uploaded-contracts.json found, returning empty list');
                    return res.json({ contracts: [] });
                }
                
                // Read and return the contracts data
                const contractsData = fs.readFileSync(uploadedContractsFile, 'utf8');
                const contracts = JSON.parse(contractsData);
                
                console.log(`✅ Returning ${contracts.uploadedContracts?.length || 0} contracts`);
                return res.json(contracts);
            }

            const fs = require('fs');
            const path = require('path');
            
            // Ensure the filename is safe and only allows PDF files
            const safeFilename = path.basename(filename);
            if (!safeFilename.endsWith('.pdf')) {
                return res.status(400).json({ error: 'Only PDF files are allowed' });
            }

            const filePath = path.join(__dirname, '..', 'contracts', safeFilename);
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.log(`❌ PDF file not found: ${filePath}`);
                return res.status(404).json({ error: 'PDF file not found' });
            }

            // Set appropriate headers for PDF download
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
            res.setHeader('Cache-Control', 'no-cache');
            
            // Stream the file
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            
            console.log(`✅ PDF file served: ${safeFilename}`);
            
        } catch (error) {
            console.error(`❌ Error serving PDF file:`, error);
            res.status(500).json({ error: 'Failed to serve PDF file', details: error.message });
        }
        return;
    }

    if (req.method === 'POST') {
        try {
            const { contractId, pdfContent, freelancerName, fileName } = req.body;
            
            if (!contractId || !pdfContent) {
                return res.status(400).json({ error: 'contractId and pdfContent are required' });
            }

            // Use the fileName from request body, or fall back to contractId if not provided
            const safeFileName = fileName || `${contractId}.pdf`;
            const filename = `contracts/${safeFileName}`;
            const commitMessage = `Add signed contract: ${safeFileName.replace('.pdf', '')}${freelancerName ? ` - ${freelancerName}` : ''}`;
            
            console.log(`📤 Uploading contract PDF: ${filename}`);
            
            // Check if file already exists
            let existingSha = null;
            try {
                const getResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filename}?ref=${GITHUB_CONFIG.branch}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `token ${GITHUB_CONFIG.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'Cochran-Films-Contract-System'
                    }
                });
                
                if (getResponse.ok) {
                    const existingFile = await getResponse.json();
                    existingSha = existingFile.sha;
                    console.log(`📄 Found existing file, SHA: ${existingSha.substring(0, 7)}`);
                }
            } catch (getError) {
                console.log(`📄 File doesn't exist yet, creating new: ${filename}`);
            }

            const requestBody = {
                message: commitMessage,
                content: pdfContent, // Should already be base64
                branch: GITHUB_CONFIG.branch
            };
            
            // Include SHA if file exists
            if (existingSha) {
                requestBody.sha = existingSha;
            }

            const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filename}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Cochran-Films-Contract-System'
                },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`✅ Contract PDF uploaded successfully: ${result.commit.sha.substring(0, 7)}`);
                
                res.json({
                    success: true,
                    contractId: contractId,
                    filename: filename,
                    downloadUrl: result.content.download_url,
                    sha: result.commit.sha,
                    commit: result.commit
                });
            } else {
                const error = await response.json();
                console.error(`❌ GitHub API error:`, error);
                res.status(response.status).json({ error: error.message || 'GitHub API error' });
            }

        } catch (error) {
            console.error(`❌ Error uploading contract:`, error);
            res.status(500).json({ error: 'Failed to upload contract to GitHub', details: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
};