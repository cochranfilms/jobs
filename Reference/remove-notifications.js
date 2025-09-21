/**
 * Remove Unwanted Popup Notifications
 * 
 * This script removes the unwanted popup notifications from both user-portal.html
 * and admin-dashboard.html by modifying the showNotification function to be silent.
 * 
 * The sophisticated notification system is already implemented and should be used instead.
 */

const fs = require('fs');
const path = require('path');

// Files to modify
const FILES_TO_MODIFY = [
    'user-portal.html',
    'admin-dashboard.html'
];

// Backup directory
const BACKUP_DIR = 'backups';

// Function to create backup
function createBackup(filename) {
    try {
        if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR, { recursive: true });
        }
        
        const backupPath = path.join(BACKUP_DIR, `${filename}.backup.${Date.now()}`);
        const originalPath = path.join(__dirname, filename);
        
        if (fs.existsSync(originalPath)) {
            fs.copyFileSync(originalPath, backupPath);
            console.log(`✅ Created backup: ${backupPath}`);
            return backupPath;
        } else {
            console.log(`⚠️ File not found: ${filename}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error creating backup for ${filename}:`, error.message);
        return null;
    }
}

// Function to remove showNotification function
function removeShowNotification(content) {
    console.log('🔧 Removing showNotification function...');
    
    // Pattern to match the entire showNotification function
    const showNotificationPattern = /\/\/ ==================== PROFESSIONAL NOTIFICATION SYSTEM ====================\s*\n\s*\/\/ Enhanced notification system to replace all alert\(\) calls\s*function showNotification\(message, type = 'info', duration = 5000\) \{[\s\S]*?\}\s*\n\s*function getNotificationIcon\(type\) \{[\s\S]*?\}\s*\n\s*function getNotificationColors\(type\) \{[\s\S]*?\}\s*\n\s*\/\/ Enhanced showUpdateStatus function \(backward compatibility\)\s*function showUpdateStatus\(message, type\) \{[\s\S]*?\}\s*\n\s*\/\/ Replace all alert\(\) calls with professional notifications\s*function showAlert\(message, type = 'info'\) \{[\s\S]*?\}/g;
    
    // Replace with a silent version
    const silentNotification = `// ==================== PROFESSIONAL NOTIFICATION SYSTEM ====================
        
        // Enhanced notification system - SILENT VERSION (notifications disabled)
        function showNotification(message, type = 'info', duration = 5000) {
            // Silent notification - only log to console
            console.log(\`🔇 Suppressed notification: \${message} (\${type})\`);
            // No popup display - notifications are handled by sophisticated system
        }
        
        function getNotificationIcon(type) {
            return '🔇'; // Silent icon
        }
        
        function getNotificationColors(type) {
            return { background: 'transparent', border: 'transparent' };
        }
        
        // Enhanced showUpdateStatus function (backward compatibility) - SILENT
        function showUpdateStatus(message, type) {
            console.log(\`🔇 Suppressed status update: \${message} (\${type})\`);
        }
        
        // Replace all alert() calls with silent notifications
        function showAlert(message, type = 'info') {
            console.log(\`🔇 Suppressed alert: \${message} (\${type})\`);
        }`;
    
    const modifiedContent = content.replace(showNotificationPattern, silentNotification);
    
    if (modifiedContent === content) {
        console.log('⚠️ No showNotification function found to replace');
        return content;
    }
    
    console.log('✅ Successfully replaced showNotification function with silent version');
    return modifiedContent;
}

// Function to also remove alert() calls
function removeAlertCalls(content) {
    console.log('🔧 Removing alert() calls...');
    
    // Pattern to match alert() calls
    const alertPattern = /alert\(/g;
    const modifiedContent = content.replace(alertPattern, 'console.log(');
    
    if (modifiedContent === content) {
        console.log('⚠️ No alert() calls found');
        return content;
    }
    
    console.log('✅ Successfully replaced alert() calls with console.log()');
    return modifiedContent;
}

// Function to process a single file
function processFile(filename) {
    console.log(`\n📁 Processing file: ${filename}`);
    console.log('=' .repeat(50));
    
    try {
        // Create backup
        const backupPath = createBackup(filename);
        if (!backupPath) {
            console.log(`❌ Skipping ${filename} - backup failed`);
            return false;
        }
        
        // Read file
        const filePath = path.join(__dirname, filename);
        let content = fs.readFileSync(filePath, 'utf8');
        
        console.log(`📖 Read file: ${filename} (${content.length} characters)`);
        
        // Remove showNotification function
        content = removeShowNotification(content);
        
        // Remove alert() calls
        content = removeAlertCalls(content);
        
        // Write modified content
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Successfully modified: ${filename}`);
        
        return true;
    } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
        return false;
    }
}

// Function to test the changes
function testChanges() {
    console.log('\n🧪 Testing changes...');
    
    const testResults = [];
    
    FILES_TO_MODIFY.forEach(filename => {
        const filePath = path.join(__dirname, filename);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            
            // Check if showNotification is silent
            const hasSilentNotification = content.includes('Suppressed notification:');
            const hasAlertCalls = content.includes('alert(');
            
            testResults.push({
                file: filename,
                silentNotification: hasSilentNotification,
                noAlertCalls: !hasAlertCalls
            });
            
            console.log(`📋 ${filename}:`);
            console.log(`   Silent notifications: ${hasSilentNotification ? '✅' : '❌'}`);
            console.log(`   No alert() calls: ${!hasAlertCalls ? '✅' : '❌'}`);
        }
    });
    
    return testResults;
}

// Main execution function
function main() {
    console.log('🚀 Starting notification removal process...');
    console.log('=' .repeat(60));
    
    const results = [];
    
    // Process each file
    FILES_TO_MODIFY.forEach(filename => {
        const success = processFile(filename);
        results.push({ file: filename, success });
    });
    
    // Test the changes
    const testResults = testChanges();
    
    // Summary
    console.log('\n📋 Summary:');
    console.log('=' .repeat(60));
    
    results.forEach(result => {
        console.log(`${result.file}: ${result.success ? '✅' : '❌'}`);
    });
    
    const successfulFiles = results.filter(r => r.success).length;
    const totalFiles = results.length;
    
    console.log(`\n🎉 Successfully processed: ${successfulFiles}/${totalFiles} files`);
    
    if (successfulFiles === totalFiles) {
        console.log('\n✅ All unwanted popup notifications have been removed!');
        console.log('📝 Notifications are now logged to console instead of displayed as popups');
        console.log('🔔 The sophisticated notification system is still available for important notifications');
    } else {
        console.log('\n⚠️ Some files could not be processed. Check the errors above.');
    }
    
    return successfulFiles === totalFiles;
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    processFile,
    removeShowNotification,
    removeAlertCalls,
    testChanges,
    main
}; 