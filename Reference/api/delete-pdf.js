const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
    // Set CORS headers for Vercel
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'DELETE') {
            const { fileName, contractId } = req.body;
            
            if (!fileName) {
                return res.status(400).json({ success: false, error: 'fileName is required' });
            }
            
            console.log(`🗑️ Attempting to delete PDF: ${fileName}`);

            let localDeleted = false;
            const localFilePath = path.join(__dirname, '../contracts', fileName);
            
            try {
                await fs.access(localFilePath);
                await fs.unlink(localFilePath);
                localDeleted = true;
                console.log(`✅ Local PDF deleted: ${fileName}`);
            } catch (localError) {
                console.log(`📄 Local PDF not found: ${fileName}`);
            }

            let jsonUpdated = false;
            
            // Update centralized users.json instead of uploaded-contracts.json
            const usersPath = path.join(__dirname, '../users.json');
            
            try {
                const usersData = JSON.parse(await fs.readFile(usersPath, 'utf8'));
                let contractsRemoved = 0;
                
                // Remove contract data from all users
                for (const [userName, user] of Object.entries(usersData.users)) {
                    if (user.contract && user.contract.fileName === fileName) {
                        console.log(`🗑️ Removing contract from user: ${userName}`);
                        user.contract = {
                            contractId: null,
                            fileName: null,
                            status: 'pending',
                            signedDate: null,
                            uploadDate: null,
                            githubUrl: null,
                            notes: 'Contract deleted'
                        };
                        contractsRemoved++;
                    }
                }
                
                // Update system totals
                if (contractsRemoved > 0) {
                    usersData.system.totalContracts = Math.max(0, usersData.system.totalContracts - contractsRemoved);
                    usersData.system.lastUpdated = new Date().toISOString().split('T')[0];
                    
                    await fs.writeFile(usersPath, JSON.stringify(usersData, null, 2));
                    jsonUpdated = true;
                    console.log(`✅ Contract removed from centralized data: ${fileName} (${contractsRemoved} user(s) updated)`);
                }
            } catch (jsonError) {
                console.error(`❌ Error updating centralized JSON:`, jsonError.message);
            }

            let githubDeleted = false;
            if (contractId) {
                try {
                    // First, get the file SHA from GitHub
                    const getFileResponse = await fetch(`https://api.github.com/repos/${process.env.GITHUB_OWNER || 'cochranfilms'}/${process.env.GITHUB_REPO || 'cochran-job-listings'}/contents/contracts/${fileName}?ref=${process.env.GITHUB_BRANCH || 'main'}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'Cochran-Films-Contract-System'
                        }
                    });
                    
                    if (getFileResponse.ok) {
                        const fileData = await getFileResponse.json();
                        const fileSHA = fileData.sha;
                        
                        // Now delete the file with the correct SHA
                        const githubResponse = await fetch(`https://api.github.com/repos/${process.env.GITHUB_OWNER || 'cochranfilms'}/${process.env.GITHUB_REPO || 'cochran-job-listings'}/contents/contracts/${fileName}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                                'Accept': 'application/vnd.github.v3+json',
                                'Content-Type': 'application/json',
                                'User-Agent': 'Cochran-Films-Contract-System'
                            },
                            body: JSON.stringify({ 
                                message: `Delete contract ${contractId} - ${fileName}`, 
                                sha: fileSHA,
                                branch: process.env.GITHUB_BRANCH || 'main'
                            })
                        });
                    
                        if (githubResponse.ok) {
                            githubDeleted = true;
                            console.log(`✅ GitHub file deleted: ${fileName}`);
                        } else {
                            console.log(`⚠️ GitHub deletion failed: ${fileName}`);
                        }
                    }
                } catch (githubError) {
                    console.log(`⚠️ GitHub deletion error: ${githubError.message}`);
                }
            }

            const success = localDeleted || jsonUpdated;
            
            res.status(200).json({
                success: success,
                message: success ? 'PDF deleted successfully' : 'PDF not found',
                details: { 
                    fileName, 
                    contractId, 
                    localDeleted, 
                    jsonUpdated, 
                    githubDeleted 
                }
            });
            
        } else {
            res.status(405).json({ success: false, error: 'Method not allowed. Use DELETE.' });
        }
        
    } catch (error) {
        console.error('❌ PDF deletion API error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error', 
            message: error.message 
        });
    }
}; 