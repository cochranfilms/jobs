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

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`🚀 Test server running at http://localhost:${PORT}`);
    console.log('📋 Testing admin dashboard improvements:');
    console.log('✅ Added proper labels for date inputs');
    console.log('✅ Added projectDate field');
    console.log('✅ Changed layout to horizontal rows');
    console.log('✅ Improved form field organization');
    
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
    console.log('1. Check that the date inputs now have proper labels');
    console.log('2. Verify that both approvedDate and projectDate fields are present');
    console.log('3. Confirm the layout is now horizontal rows instead of vertical columns');
    console.log('4. Test the form submission with the new projectDate field');
    console.log('5. Check that the UI is more pleasing with the horizontal layout');
    
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
