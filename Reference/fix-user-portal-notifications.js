/**
 * Fix User Portal Notifications
 * 
 * This script specifically targets the showNotification function in user-portal.html
 * and replaces it with a silent version to remove unwanted popup notifications.
 */

const fs = require('fs');
const path = require('path');

// Function to fix user-portal.html notifications
function fixUserPortalNotifications() {
    console.log('🔧 Fixing user-portal.html notifications...');
    
    const filePath = path.join(__dirname, 'user-portal.html');
    
    try {
        // Read the file
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Create backup
        const backupPath = path.join(__dirname, 'backups', `user-portal.html.backup.fix.${Date.now()}`);
        if (!fs.existsSync('backups')) {
            fs.mkdirSync('backups', { recursive: true });
        }
        fs.copyFileSync(filePath, backupPath);
        console.log(`✅ Created backup: ${backupPath}`);
        
        // Find the showNotification function and replace it
        const showNotificationPattern = /\/\/ ==================== PROFESSIONAL NOTIFICATION SYSTEM ====================\s*\n\s*\/\/ Enhanced notification system to replace all console\.log\(\) calls\s*function showNotification\(message, type = 'info', duration = 5000\) \{[\s\S]*?\}\s*\n\s*function getNotificationIcon\(type\) \{[\s\S]*?\}\s*\n\s*function getNotificationColors\(type\) \{[\s\S]*?\}\s*\n\s*\/\/ Replace all alert\(\) calls with professional notifications\s*function showAlert\(message, type = 'info'\) \{[\s\S]*?\}/g;
        
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
        
        // Replace all alert() calls with silent notifications
        function showAlert(message, type = 'info') {
            console.log(\`🔇 Suppressed alert: \${message} (\${type})\`);
        }`;
        
        const modifiedContent = content.replace(showNotificationPattern, silentNotification);
        
        if (modifiedContent === content) {
            console.log('⚠️ No showNotification function found to replace in user-portal.html');
            return false;
        }
        
        // Write the modified content
        fs.writeFileSync(filePath, modifiedContent, 'utf8');
        console.log('✅ Successfully replaced showNotification function in user-portal.html');
        
        return true;
    } catch (error) {
        console.error('❌ Error fixing user-portal.html notifications:', error.message);
        return false;
    }
}

// Function to test the fix
function testUserPortalFix() {
    console.log('\n🧪 Testing user-portal.html fix...');
    
    const filePath = path.join(__dirname, 'user-portal.html');
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if showNotification is silent
        const hasSilentNotification = content.includes('Suppressed notification:');
        const hasOriginalNotification = content.includes('document.createElement(\'div\')');
        
        console.log(`📋 user-portal.html:`);
        console.log(`   Silent notifications: ${hasSilentNotification ? '✅' : '❌'}`);
        console.log(`   Original popup notifications: ${hasOriginalNotification ? '❌' : '✅'}`);
        
        return hasSilentNotification && !hasOriginalNotification;
    } catch (error) {
        console.error('❌ Error testing user-portal.html fix:', error.message);
        return false;
    }
}

// Main execution
function main() {
    console.log('🚀 Fixing user-portal.html notifications...');
    console.log('=' .repeat(50));
    
    const success = fixUserPortalNotifications();
    
    if (success) {
        const testPassed = testUserPortalFix();
        
        console.log('\n📋 Results:');
        console.log('=' .repeat(50));
        console.log(`Fix applied: ${success ? '✅' : '❌'}`);
        console.log(`Test passed: ${testPassed ? '✅' : '❌'}`);
        
        if (testPassed) {
            console.log('\n🎉 User portal notifications successfully disabled!');
            console.log('📝 Notifications are now logged to console instead of displayed as popups');
        } else {
            console.log('\n⚠️ Fix applied but test failed. Check the implementation.');
        }
    } else {
        console.log('\n❌ Failed to fix user portal notifications');
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    fixUserPortalNotifications,
    testUserPortalFix,
    main
}; 