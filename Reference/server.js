const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import API routes
const firebaseRouter = require('./api/firebase');
const notificationsRouter = require('./api/notifications');

const deletePdfRouter = require('./api/delete-pdf');
const contractsRouter = require('./api/contracts');
const updateUsersRouter = require('./api/update-users');
const contractsHealth = require('./api/contracts-health');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API Routes
// Deprecated JSON endpoints (use Firestore)
app.get('/api/users', async (req, res) => {
    return res.status(410).json({ success: false, error: 'Deprecated endpoint', message: 'users.json is retired. Use Firestore.' });
});

app.get('/api/jobs-data', async (req, res) => {
    return res.status(410).json({ success: false, error: 'Deprecated endpoint', message: 'jobs-data.json is retired. Use Firestore jobs collection.' });
});

// Update job status endpoint
app.post('/api/update-job-status', async (req, res) => {
    try {
        const { jobTitle, newStatus } = req.body;
        
        if (!jobTitle || !newStatus) {
            return res.status(400).json({ 
                error: 'Missing required fields', 
                required: ['jobTitle', 'newStatus'] 
            });
        }
        
        if (!['Active', 'Inactive'].includes(newStatus)) {
            return res.status(400).json({ 
                error: 'Invalid status', 
                validStatuses: ['Active', 'Inactive'] 
            });
        }
        
        const jobsPath = path.join(__dirname, 'jobs-data.json');
        console.log('📁 Loading jobs file from:', jobsPath);
        
        // Read current jobs data
        const jobsData = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
        
        // Find and update the job
        const jobIndex = jobsData.jobs.findIndex(job => job.title === jobTitle);
        
        if (jobIndex === -1) {
            return res.status(404).json({ 
                error: 'Job not found', 
                jobTitle: jobTitle 
            });
        }
        
        // Update the job status
        const oldStatus = jobsData.jobs[jobIndex].status;
        jobsData.jobs[jobIndex].status = newStatus;
        jobsData.lastUpdated = new Date().toISOString().split('T')[0];
        
        // Write updated data back to file
        fs.writeFileSync(jobsPath, JSON.stringify(jobsData, null, 2));
        
        console.log(`✅ Job status updated: "${jobTitle}" from "${oldStatus}" to "${newStatus}"`);
        
        res.json({
            success: true,
            message: `Job status updated successfully`,
            job: {
                title: jobTitle,
                oldStatus: oldStatus,
                newStatus: newStatus
            },
            updatedAt: jobsData.lastUpdated
        });
        
    } catch (error) {
        console.error('❌ Error updating job status:', error);
        res.status(500).json({ 
            error: 'Failed to update job status', 
            details: error.message 
        });
    }
});

// Uploaded contracts API endpoint
app.get('/api/uploaded-contracts', async (req, res) => {
    try {
        const contractsPath = path.join(__dirname, 'uploaded-contracts.json');
        
        if (fs.existsSync(contractsPath)) {
            const contractsData = JSON.parse(fs.readFileSync(contractsPath, 'utf8'));
            res.status(200).json(contractsData);
        } else {
            // Return empty contracts data if file doesn't exist
            res.status(200).json({
                contracts: [],
                lastUpdated: new Date().toISOString(),
                totalContracts: 0
            });
        }
    } catch (error) {
        console.error('❌ Error in uploaded contracts API:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});



app.get('/api/dropdown-options', async (req, res) => {
    try {
        const dropdownPath = path.join(__dirname, 'dropdown-options.json');
        
        if (fs.existsSync(dropdownPath)) {
            const dropdownData = JSON.parse(fs.readFileSync(dropdownPath, 'utf8'));
            res.status(200).json(dropdownData);
        } else {
            // Return default options
            res.status(200).json({
                roles: ['Backdrop Photographer', 'Editor', 'Videographer', 'Photographer', 'Full Stack Designer', 'Video Editor', 'Corporate Videographer'],
                locations: ['6695 Church Street, Douglasville, GA 30134', 'Sandy Springs, GA', 'Douglasville, GA', 'Atlanta, GA', 'Atlanta Area'],
                rates: ['$400.00 USD (Flat)', '$450.00 USD (Flat)', '$500.00 USD (Flat)', '$750.00 USD (Flat)', '$900.00 USD (Flat)', '$150/day', '$200/day'],
                projectTypes: ['Photography', 'Video', 'Editor Project', 'Corporate Video', 'Event Coverage', 'Product Photography', 'Real Estate', 'Wedding', 'Commercial'],
                paymentMethods: ['Cash', 'Check', 'Zelle', 'PayPal', 'Invoice Request'],
                projectStatuses: ['upcoming', 'in-progress', 'completed', 'cancelled'],
                paymentStatuses: ['pending', 'processing', 'paid', 'overdue']
            });
        }
    } catch (error) {
        console.error('❌ Error in dropdown API:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// GitHub API endpoints (simplified for local testing)
app.get('/api/github/info', async (req, res) => {
    try {
        // For local testing, return a mock SHA
        res.status(200).json({
            sha: 'mock-sha-for-local-testing',
            message: 'Local development mode'
        });
    } catch (error) {
        console.error('❌ Error in GitHub info API:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// GitHub file GET endpoint for retrieving file info
app.get('/api/github/file/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        
        // For local testing, return mock file info
        console.log(`📄 Local GitHub file info request: ${filename}`);
        
        res.status(200).json({
            sha: 'mock-sha-for-local-testing',
            content: {
                sha: 'mock-content-sha',
                path: filename,
                size: 1024,
                encoding: 'base64'
            },
            message: 'Local development mode - mock file info'
        });
        
    } catch (error) {
        console.error('❌ Error in GitHub file GET API:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

app.put('/api/github/file/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const { content, message, sha } = req.body;
        
        if (!content || !message) {
            return res.status(400).json({ error: 'content and message are required' });
        }

        // For local testing, just log the update
        console.log(`🔄 Local GitHub update: ${filename}`);
        console.log(`📝 Message: ${message}`);
        console.log(`📄 Content length: ${content.length} characters`);
        
        // In a real environment, this would update the file on GitHub
        // For local testing, we'll just return success
        res.status(200).json({
            commit: {
                sha: 'local-test-sha',
                message: message
            },
            content: {
                sha: 'local-content-sha'
            }
        });
        
    } catch (error) {
        console.error('❌ Error in GitHub file API:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

app.delete('/api/github/file/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const { message, sha } = req.body;
        
        if (!message || !sha) {
            return res.status(400).json({ error: 'message and sha are required for deletion' });
        }

        console.log(`🗑️ Deleting file from GitHub: ${filename}`);
        console.log(`📝 Message: ${message}`);
        console.log(`🔗 SHA: ${sha.substring(0, 7)}`);

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
            console.log(`✅ ${filename} deleted successfully from GitHub (SHA: ${result.commit.sha.substring(0, 7)})`);
            res.json(result);
        } else {
            const error = await response.json();
            console.error(`❌ GitHub API error:`, error);
            res.status(response.status).json({ error: error.message || 'GitHub API error' });
        }
        
    } catch (error) {
        console.error('❌ Error in GitHub file delete API:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});



// Firebase API routes
app.use('/api/firebase', firebaseRouter);

// Notifications API routes
app.use('/api/notifications', notificationsRouter);



// PDF Deletion API route
app.use('/api/delete-pdf', deletePdfRouter);

// Update Users API route
app.use('/api/update-users', updateUsersRouter);

// Contracts API routes
app.get('/api/contracts', contractsRouter);
app.post('/api/contracts', contractsRouter);

// Contracts health (exposes config status for deployments)
app.get('/api/contracts/health', contractsHealth);

// Local file deletion endpoint for contracts
app.post('/api/contracts/delete-local', async (req, res) => {
    try {
        const { fileName } = req.body;
        
        if (!fileName) {
            return res.status(400).json({ error: 'fileName is required' });
        }
        
        const filePath = path.join(__dirname, 'contracts', fileName);
        
        // Check if file exists
        if (fs.existsSync(filePath)) {
            // Delete the file
            fs.unlinkSync(filePath);
            console.log(`✅ Local PDF file deleted: ${fileName}`);
            res.status(200).json({ 
                success: true, 
                message: `File ${fileName} deleted successfully` 
            });
        } else {
            console.log(`📄 Local PDF file not found: ${fileName}`);
            res.status(200).json({ 
                success: false, 
                message: `File ${fileName} not found locally` 
            });
        }
        
    } catch (error) {
        console.error('❌ Error deleting local file:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: 'local-development'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Local server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints available:`);
    console.log(`   - GET  /api/users`);
    console.log(`   - GET  /api/jobs-data`);
    console.log(`   - GET  /api/dropdown-options`);
    console.log(`   - GET  /api/health`);
    console.log(`   - DELETE /api/firebase (delete user)`);
    console.log(`   - PUT  /api/github/file/:filename`);
    console.log(`   - DELETE /api/github/file/:filename`);
    console.log(`   - GET  /api/notifications`);
    console.log(`   - POST /api/notifications`);
    console.log(`   - DELETE /api/delete-pdf`);
    console.log(`   - POST  /api/update-users`);
    console.log(`📋 Admin dashboard: http://localhost:${PORT}/admin-dashboard.html`);
    console.log(`👤 User portal: http://localhost:${PORT}/user-portal.html`);
}); 