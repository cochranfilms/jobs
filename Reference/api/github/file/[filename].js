module.exports = async (req, res) => {
    // Handle nested paths by decoding and getting the full filename
    let filename = req.query.filename;
    
    // If filename is encoded, decode it
    if (filename && filename.includes('%')) {
        filename = decodeURIComponent(filename);
    }
    
    // Handle case where Vercel might split the path
    if (req.query['0']) {
        // Reconstruct the full path if it was split
        filename = [filename, ...Object.values(req.query).slice(1)].join('/');
    }
    
    console.log(`📄 GitHub file endpoint hit: ${req.method} /api/github/file/${filename}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
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

    if (!GITHUB_CONFIG.token) {
        console.error('❌ GITHUB_TOKEN environment variable not set');
        return res.status(500).json({ error: 'GitHub token not configured' });
    }

    try {
        if (req.method === 'GET') {
            // GET: Retrieve file from GitHub
            console.log(`🔍 Fetching ${filename} from GitHub...`);
            
            const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filename}?ref=${GITHUB_CONFIG.branch}`, {
                method: 'GET',
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Cochran-Films-Contract-System'
                }
            });

            if (response.ok) {
                const fileData = await response.json();
                console.log(`✅ Retrieved ${filename} successfully (SHA: ${fileData.sha.substring(0, 7)})`);
                res.json(fileData);
            } else if (response.status === 404) {
                console.log(`📄 File ${filename} not found on GitHub`);
                res.status(404).json({ error: 'File not found' });
            } else {
                const error = await response.json();
                console.error(`❌ GitHub API error:`, error);
                res.status(response.status).json({ error: error.message || 'GitHub API error' });
            }

        } else if (req.method === 'PUT') {
            // PUT: Update file on GitHub
            const { content, message, sha } = req.body;
            
            if (!content || !message) {
                return res.status(400).json({ error: 'content and message are required' });
            }

            console.log(`🔄 Updating ${filename} on GitHub...`);
            console.log(`📝 Commit message: ${message}`);
            
            // Determine if the provided content is raw JSON or already base64-encoded.
            // If it looks like JSON (starts with { or [), encode it. Otherwise pass through.
            let encodedContent;
            try {
                const trimmed = typeof content === 'string' ? content.trim() : '';
                if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                    encodedContent = Buffer.from(trimmed).toString('base64');
                } else {
                    encodedContent = trimmed;
                }
            } catch (e) {
                // Fallback to encoding if any doubt
                encodedContent = Buffer.from(String(content)).toString('base64');
            }

            const requestBody = {
                message: message,
                content: encodedContent,
                branch: GITHUB_CONFIG.branch
            };
            
            // Include SHA if provided (for updates)
            if (sha) {
                requestBody.sha = sha;
                console.log(`🔗 Using SHA: ${sha.substring(0, 7)}`);
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
                console.log(`✅ ${filename} updated successfully (SHA: ${result.commit.sha.substring(0, 7)})`);
                res.json(result);
            } else {
                const error = await response.json();
                console.error(`❌ GitHub API error:`, error);
                res.status(response.status).json({ error: error.message || 'GitHub API error' });
            }

        } else if (req.method === 'DELETE') {
            // DELETE: Delete file from GitHub
            const { message, sha } = req.body;
            
            if (!message || !sha) {
                return res.status(400).json({ error: 'message and sha are required for deletion' });
            }

            console.log(`🗑️ Deleting ${filename} from GitHub...`);
            console.log(`📝 Commit message: ${message}`);
            console.log(`🔗 Using SHA: ${sha.substring(0, 7)}`);
            
            const requestBody = {
                message: message,
                sha: sha,
                branch: GITHUB_CONFIG.branch
            };

            const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filename}`, {
                method: 'DELETE',
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
                console.log(`✅ ${filename} deleted successfully (SHA: ${result.commit.sha.substring(0, 7)})`);
                res.json(result);
            } else {
                const error = await response.json();
                console.error(`❌ GitHub API error:`, error);
                res.status(response.status).json({ error: error.message || 'GitHub API error' });
            }

        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error(`❌ Error with ${filename}:`, error);
        res.status(500).json({ error: `Failed to ${req.method} file on GitHub`, details: error.message });
    }
};