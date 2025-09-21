const fs = require('fs');
const path = require('path');
const https = require('https');

// Helper function to make HTTPS requests
function makeHttpsRequest(url, options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        status: res.statusCode,
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        json: () => Promise.resolve(parsedData),
                        text: () => Promise.resolve(responseData)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        json: () => Promise.resolve({}),
                        text: () => Promise.resolve(responseData)
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        if (data) {
            req.write(data);
        }
        
        req.end();
    });
}

module.exports = async (req, res) => {
    try {
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            res.status(200).end();
            return;
        }

        // Only allow POST/PUT requests
        if (req.method !== 'POST' && req.method !== 'PUT') {
            res.status(405).json({ error: 'Method not allowed' });
            return;
        }

        const { users, action, userName } = req.body;

        if (!users) {
            res.status(400).json({ error: 'users data is required' });
            return;
        }

        console.log(`🔄 Updating users.json - Action: ${action || 'update'}, User: ${userName || 'N/A'}`);

        // Prepare the updated users data
        const usersData = {
            users: users,
            statusOptions: {
                projectStatus: ["upcoming", "in-progress", "completed", "cancelled"],
                paymentStatus: ["pending", "processing", "paid", "overdue"]
            },
            lastUpdated: new Date().toISOString().split('T')[0],
            totalUsers: Object.keys(users).length,
            system: {
                totalReviews: 0,
                lastUpdated: new Date().toISOString().split('T')[0]
            }
        };

        // Update local users.json file
        const usersFilePath = path.join(__dirname, '..', 'users.json');
        fs.writeFileSync(usersFilePath, JSON.stringify(usersData, null, 2));
        console.log('✅ Updated local users.json file');

        // Try to update GitHub if token is available
        let githubUpdated = false;
        let githubMessage = '';

        try {
            const GITHUB_CONFIG = {
                token: process.env.GITHUB_TOKEN,
                owner: process.env.GITHUB_OWNER || 'cochranfilms',
                repo: process.env.GITHUB_REPO || 'cochran-job-listings',
                branch: process.env.GITHUB_BRANCH || 'main'
            };

            if (GITHUB_CONFIG.token) {
                console.log('🔄 Attempting to update GitHub...');
                
                // Get current file SHA from GitHub
                const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/users.json?ref=${GITHUB_CONFIG.branch}`;
                const getOptions = {
                    method: 'GET',
                    headers: {
                        'Authorization': `token ${GITHUB_CONFIG.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'Cochran-Films-Users-API'
                    }
                };
                
                const getResponse = await makeHttpsRequest(getUrl, getOptions);
                
                let sha = null;
                if (getResponse.ok) {
                    const fileData = await getResponse.json();
                    sha = fileData.sha;
                    console.log('✅ Retrieved current file SHA:', sha.substring(0, 7));
                }
                
                // Update file on GitHub
                const updateUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/users.json`;
                const updateOptions = {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_CONFIG.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                        'User-Agent': 'Cochran-Films-Users-API'
                    }
                };
                
                const updateData = JSON.stringify({
                    message: `Update users.json - ${action || 'update'} ${userName || ''} - ${new Date().toISOString()}`,
                    content: Buffer.from(JSON.stringify(usersData, null, 2)).toString('base64'),
                    sha: sha,
                    branch: GITHUB_CONFIG.branch
                });
                
                const updateResponse = await makeHttpsRequest(updateUrl, updateOptions, updateData);
                
                if (updateResponse.ok) {
                    const result = await updateResponse.json();
                    console.log('✅ Successfully updated users.json on GitHub:', result.commit.sha.substring(0, 7));
                    githubUpdated = true;
                    githubMessage = 'Updated on GitHub successfully';
                } else {
                    const error = await updateResponse.json();
                    console.error('❌ Failed to update GitHub:', error);
                    githubMessage = 'GitHub update failed: ' + (error.message || 'Unknown error');
                }
            } else {
                console.warn('⚠️ GitHub token not configured, skipping GitHub update');
                githubMessage = 'GitHub token not configured';
            }
        } catch (githubError) {
            console.error('❌ Error updating GitHub:', githubError);
            githubMessage = 'GitHub update error: ' + githubError.message;
        }

        // Return success response
        res.status(200).json({
            success: true,
            message: 'Users data updated successfully',
            localUpdated: true,
            githubUpdated: githubUpdated,
            githubMessage: githubMessage,
            totalUsers: Object.keys(users).length,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error in update-users API:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
};
