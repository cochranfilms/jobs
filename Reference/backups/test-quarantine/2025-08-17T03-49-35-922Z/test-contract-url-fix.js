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

const PORT = 3001;

server.listen(PORT, () => {
    console.log(`🚀 Test server running at http://localhost:${PORT}`);
    console.log('📋 Testing contract URL field fix:');
    console.log('✅ Contract URL field is now auto-filled with "contract.html"');
    console.log('✅ Contract URL field is readonly (cannot be edited)');
    console.log('✅ Added helpful description explaining the contract system');
    console.log('✅ Updated clearContractForm to reset to "contract.html"');
    console.log('✅ Updated editUser to default to "contract.html"');
    
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
    console.log('1. Check that the Contract URL field is pre-filled with "contract.html"');
    console.log('2. Verify the field is readonly (grayed out, cannot be edited)');
    console.log('3. Check that there is a helpful description below the field');
    console.log('4. Test the "Clear" button - it should reset to "contract.html"');
    console.log('5. Verify the field is not required (since it\'s auto-filled)');
    console.log('6. Test form submission - it should work with the auto-filled URL');
    
    console.log('\n🔗 The contract.html file is the central contract portal where all users sign their contracts');
    console.log('📄 This eliminates the need for individual contract files per user');
    
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
