module.exports = async (req, res) => {
    console.log('📄 GitHub info endpoint hit');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
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
        console.log(`🔍 Fetching repository info for ${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}...`);
        
        const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`, {
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Cochran-Films-Contract-System'
            }
        });

        if (response.ok) {
            const repoData = await response.json();
            console.log(`✅ Retrieved repository info successfully`);
            
            // Return useful repository information
            res.json({
                name: repoData.name,
                full_name: repoData.full_name,
                owner: repoData.owner.login,
                private: repoData.private,
                default_branch: repoData.default_branch,
                updated_at: repoData.updated_at,
                configured_branch: GITHUB_CONFIG.branch,
                api_status: 'connected'
            });
        } else {
            const error = await response.json();
            console.error(`❌ GitHub API error:`, error);
            res.status(response.status).json({ error: error.message || 'GitHub API error' });
        }
    } catch (error) {
        console.error(`❌ Error fetching repository info:`, error);
        res.status(500).json({ error: 'Failed to fetch repository info', details: error.message });
    }
};