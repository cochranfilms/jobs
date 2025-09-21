const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    try {
        // CORS
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        if (req.method === 'OPTIONS') return res.status(200).end();
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

        const localPath = path.join(__dirname, '..', 'dropdown-options.json');

        // Try GitHub first if configured
        let options = null;
        try {
            const GITHUB_CONFIG = {
                token: process.env.GITHUB_TOKEN,
                owner: process.env.GITHUB_OWNER || 'cochranfilms',
                repo: process.env.GITHUB_REPO || 'cochran-job-listings',
                branch: process.env.GITHUB_BRANCH || 'main'
            };

            if (GITHUB_CONFIG.token) {
                const ghRes = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/dropdown-options.json?ref=${GITHUB_CONFIG.branch}`, {
                    headers: {
                        'Authorization': `token ${GITHUB_CONFIG.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'Cochran-Films-Admin-API'
                    }
                });
                if (ghRes.ok) {
                    const fileData = await ghRes.json();
                    const decoded = Buffer.from(fileData.content, 'base64').toString('utf8');
                    options = JSON.parse(decoded);
                    // Keep local file in sync
                    try { fs.writeFileSync(localPath, JSON.stringify(options, null, 2)); } catch {}
                }
            }
        } catch (e) {
            // Ignore and fall back to local
        }

        // Fallback to local file
        if (!options) {
            if (!fs.existsSync(localPath)) {
                return res.status(404).json({ error: 'Dropdown options file not found' });
            }
            const data = fs.readFileSync(localPath, 'utf8');
            options = JSON.parse(data);
        }

        return res.status(200).json(options);
    } catch (error) {
        console.error('Error reading dropdown options:', error);
        res.status(500).json({ error: 'Failed to load dropdown options' });
    }
};