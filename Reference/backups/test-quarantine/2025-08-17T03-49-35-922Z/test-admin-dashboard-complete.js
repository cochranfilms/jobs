const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Import API routes
const dropdownOptionsRouter = require('./api/dropdown-options');
const jobsDataRouter = require('./api/jobs-data');

const app = express();
const PORT = 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API Routes
app.get('/api/dropdown-options', async (req, res) => {
    try {
        const dropdownPath = path.join(__dirname, 'dropdown-options.json');
        
        if (!fs.existsSync(dropdownPath)) {
            return res.status(404).json({ error: 'Dropdown options file not found' });
        }
        
        const data = fs.readFileSync(dropdownPath, 'utf8');
        const options = JSON.parse(data);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        res.json(options);
    } catch (error) {
        console.error('Error reading dropdown options:', error);
        res.status(500).json({ error: 'Failed to load dropdown options' });
    }
});

app.get('/api/jobs-data', async (req, res) => {
    try {
        const jobsPath = path.join(__dirname, 'jobs-data.json');
        
        if (!fs.existsSync(jobsPath)) {
            // Create default jobs data
            const defaultJobs = {
                jobs: [],
                lastUpdated: new Date().toISOString().split('T')[0],
                totalJobs: 0
            };
            fs.writeFileSync(jobsPath, JSON.stringify(defaultJobs, null, 2));
        }
        
        const data = fs.readFileSync(jobsPath, 'utf8');
        const jobs = JSON.parse(data);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        res.json(jobs);
    } catch (error) {
        console.error('Error reading jobs data:', error);
        res.status(500).json({ error: 'Failed to load jobs data' });
    }
});

// Mock GitHub API endpoints for testing
app.get('/api/github/file/dropdown-options.json', async (req, res) => {
    try {
        const dropdownPath = path.join(__dirname, 'dropdown-options.json');
        
        if (!fs.existsSync(dropdownPath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const data = fs.readFileSync(dropdownPath, 'utf8');
        const options = JSON.parse(data);
        
        // Return GitHub API format
        res.json({
            sha: 'test-sha-123',
            content: Buffer.from(data).toString('base64'),
            size: data.length,
            url: 'https://api.github.com/repos/test/test/contents/dropdown-options.json'
        });
    } catch (error) {
        console.error('Error reading dropdown options for GitHub:', error);
        res.status(500).json({ error: 'Failed to load file' });
    }
});

app.put('/api/github/file/dropdown-options.json', async (req, res) => {
    try {
        const { content, message, sha } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        
        // Decode the content
        const decodedContent = Buffer.from(content, 'base64').toString('utf8');
        
        // Validate JSON
        const options = JSON.parse(decodedContent);
        
        // Save to file
        const dropdownPath = path.join(__dirname, 'dropdown-options.json');
        fs.writeFileSync(dropdownPath, JSON.stringify(options, null, 2));
        
        console.log('✅ Mock GitHub API: Updated dropdown-options.json');
        console.log('📝 Message:', message);
        console.log('🔑 SHA:', sha);
        
        res.json({
            content: {
                sha: 'new-test-sha-456',
                size: decodedContent.length,
                url: 'https://api.github.com/repos/test/test/contents/dropdown-options.json'
            },
            commit: {
                sha: 'commit-sha-789',
                message: message
            }
        });
    } catch (error) {
        console.error('Error updating dropdown options via GitHub:', error);
        res.status(500).json({ error: 'Failed to update file' });
    }
});

// Users API endpoint
app.get('/api/users', async (req, res) => {
    try {
        const usersPath = path.join(__dirname, 'users.json');
        
        if (!fs.existsSync(usersPath)) {
            return res.status(404).json({ error: 'Users file not found' });
        }
        
        const data = fs.readFileSync(usersPath, 'utf8');
        const users = JSON.parse(data);
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        res.json(users);
    } catch (error) {
        console.error('Error reading users:', error);
        res.status(500).json({ error: 'Failed to load users' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Complete test server running at http://localhost:${PORT}`);
    console.log('📋 Testing admin dashboard with full API support:');
    console.log('✅ /api/dropdown-options - Working');
    console.log('✅ /api/jobs-data - Working');
    console.log('✅ /api/users - Working');
    console.log('✅ Mock GitHub API - Working');
    console.log('✅ All static files served');
    
    // Open browser
    const url = `http://localhost:${PORT}`;
    console.log(`🌐 Opening browser to: ${url}`);
    
    // Open browser based on OS
    const platform = process.platform;
    let command;
    
    if (platform === 'darwin') {
        command = `open ${url}`;
    } else if (platform === 'win32') {
        command = `start ${url}`;
    } else {
        command = `xdg-open ${url}`;
    }
    
    exec(command, (error) => {
        if (error) {
            console.log('⚠️ Could not open browser automatically. Please open manually:');
            console.log(`   ${url}`);
        } else {
            console.log('✅ Browser opened successfully');
        }
    });
    
    console.log('\n📝 Test Instructions:');
    console.log('1. Login to the admin dashboard');
    console.log('2. Test dropdown management (add/remove options)');
    console.log('3. Test job management');
    console.log('4. Test user management');
    console.log('5. Verify all API endpoints work');
    console.log('6. Check that changes are saved properly');
    
    console.log('\n🔧 API Endpoints Available:');
    console.log('- GET  /api/dropdown-options');
    console.log('- GET  /api/jobs-data');
    console.log('- GET  /api/users');
    console.log('- GET  /api/github/file/dropdown-options.json');
    console.log('- PUT  /api/github/file/dropdown-options.json');
    
    console.log('\n🛑 Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down test server...');
    process.exit(0);
});
