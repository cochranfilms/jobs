const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Simple HTTP server to serve the admin dashboard
const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/admin-dashboard.html' : req.url;
    filePath = path.join(__dirname, filePath);
    
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;
        case '.jpg':
            contentType = 'image/jpg';
            break;
    }
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const PORT = 3002;

server.listen(PORT, () => {
    console.log(`🚀 Test server running at http://localhost:${PORT}`);
    console.log('📋 Testing dropdown management fix:');
    console.log('✅ Fixed loadDropdownOptions function');
    console.log('✅ Fixed saveDropdownOptions function');
    console.log('✅ Uses correct GitHub API endpoints');
    console.log('✅ Proper SHA handling for file updates');
    console.log('✅ Correct btoa() encoding for GitHub');
    
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
    console.log('2. Go to the Dropdown Management section');
    console.log('3. Try adding a new role (e.g., "Test Role")');
    console.log('4. Try removing an existing role');
    console.log('5. Click "Save All Changes"');
    console.log('6. Check that the changes are saved to GitHub');
    console.log('7. Verify the dropdown-options.json file is not corrupted');
    
    console.log('\n🔧 Key Fixes Applied:');
    console.log('- Fixed loadDropdownOptions to use correct API endpoint');
    console.log('- Fixed saveDropdownOptions to get SHA from file endpoint');
    console.log('- Proper error handling and fallback options');
    console.log('- Correct btoa() encoding for GitHub API');
    
    console.log('\n🛑 Press Ctrl+C to stop the server');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down test server...');
    server.close(() => {
        console.log('✅ Test server stopped');
        process.exit(0);
    });
});
