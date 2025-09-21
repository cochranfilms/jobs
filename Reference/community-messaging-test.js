/**
 * Community Messaging Integration Test
 * Tests the consolidated messaging functionality in the Community section
 */

// Test configuration
const TEST_CONFIG = {
    testName: 'Community Messaging Integration Test',
    version: '1.0.0',
    description: 'Tests the consolidated messaging functionality after removing Team Collaboration Hub',
    testUrl: 'user-portal.html',
    timeout: 30000
};

// Test results storage
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);
    
    if (type === 'error') {
        console.error(logMessage);
    }
}

function addTestResult(testName, passed, message, details = null) {
    testResults.total++;
    if (passed) {
        testResults.passed++;
        log(`✅ ${testName}: ${message}`, 'info');
    } else {
        testResults.failed++;
        log(`❌ ${testName}: ${message}`, 'error');
    }
    
    testResults.details.push({
        test: testName,
        passed,
        message,
        details,
        timestamp: new Date().toISOString()
    });
}

// Test functions
async function testCommunitySectionExists() {
    try {
        const communitySection = document.getElementById('community-section');
        const passed = communitySection !== null;
        addTestResult(
            'Community Section Exists',
            passed,
            passed ? 'Community section found' : 'Community section not found'
        );
        return passed;
    } catch (error) {
        addTestResult('Community Section Exists', false, `Error: ${error.message}`);
        return false;
    }
}

async function testMessagingBoardExists() {
    try {
        const messagingBoard = document.querySelector('.messaging-board-card');
        const passed = messagingBoard !== null;
        addTestResult(
            'Messaging Board Exists',
            passed,
            passed ? 'Messaging board found in Community section' : 'Messaging board not found'
        );
        return passed;
    } catch (error) {
        addTestResult('Messaging Board Exists', false, `Error: ${error.message}`);
        return false;
    }
}

async function testMessageInputExists() {
    try {
        const messageInput = document.getElementById('messageInput');
        const passed = messageInput !== null;
        addTestResult(
            'Message Input Exists',
            passed,
            passed ? 'Message input field found' : 'Message input field not found'
        );
        return passed;
    } catch (error) {
        addTestResult('Message Input Exists', false, `Error: ${error.message}`);
        return false;
    }
}

async function testSendMessageFunction() {
    try {
        const sendMessageFunction = typeof window.sendMessage === 'function';
        addTestResult(
            'Send Message Function Exists',
            sendMessageFunction,
            sendMessageFunction ? 'sendMessage function found' : 'sendMessage function not found'
        );
        return sendMessageFunction;
    } catch (error) {
        addTestResult('Send Message Function Exists', false, `Error: ${error.message}`);
        return false;
    }
}

async function testTeamDirectoryExists() {
    try {
        const teamDirectory = document.querySelector('.contractor-directory-card');
        const passed = teamDirectory !== null;
        addTestResult(
            'Team Directory Exists',
            passed,
            passed ? 'Team directory found in Community section' : 'Team directory not found'
        );
        return passed;
    } catch (error) {
        addTestResult('Team Directory Exists', false, `Error: ${error.message}`);
        return false;
    }
}

async function testProfilePictureSection() {
    try {
        const profileSection = document.querySelector('.profile-picture-card');
        const passed = profileSection !== null;
        addTestResult(
            'Profile Picture Section Exists',
            passed,
            passed ? 'Profile picture section found' : 'Profile picture section not found'
        );
        return passed;
    } catch (error) {
        addTestResult('Profile Picture Section Exists', false, `Error: ${error.message}`);
        return false;
    }
}

async function testNoCollaborationHubReferences() {
    try {
        // Check for any remaining references to the old collaboration hub
        const collaborationHubButton = document.querySelector('button[onclick*="showTeamCollaborationDashboard"]');
        const collaborationHubFunction = typeof window.showTeamCollaborationDashboard === 'function';
        
        const passed = !collaborationHubButton && !collaborationHubFunction;
        addTestResult(
            'No Collaboration Hub References',
            passed,
            passed ? 'No references to old Team Collaboration Hub found' : 'Found references to old Team Collaboration Hub'
        );
        return passed;
    } catch (error) {
        addTestResult('No Collaboration Hub References', false, `Error: ${error.message}`);
        return false;
    }
}

async function testCommunityNavigation() {
    try {
        const communityNavLink = document.querySelector('a[href="#community"]');
        const passed = communityNavLink !== null;
        addTestResult(
            'Community Navigation Exists',
            passed,
            passed ? 'Community navigation link found' : 'Community navigation link not found'
        );
        return passed;
    } catch (error) {
        addTestResult('Community Navigation Exists', false, `Error: ${error.message}`);
        return false;
    }
}

// Main test runner
async function runCommunityMessagingTest() {
    log(`Starting ${TEST_CONFIG.testName} v${TEST_CONFIG.version}`, 'info');
    log(`Description: ${TEST_CONFIG.description}`, 'info');
    log(`Testing URL: ${TEST_CONFIG.testUrl}`, 'info');
    
    // Reset test results
    testResults = {
        passed: 0,
        failed: 0,
        total: 0,
        details: []
    };
    
    try {
        // Run all tests
        await testCommunitySectionExists();
        await testMessagingBoardExists();
        await testMessageInputExists();
        await testSendMessageFunction();
        await testTeamDirectoryExists();
        await testProfilePictureSection();
        await testNoCollaborationHubReferences();
        await testCommunityNavigation();
        
        // Generate test report
        generateTestReport();
        
    } catch (error) {
        log(`Test execution failed: ${error.message}`, 'error');
        addTestResult('Test Execution', false, `Test execution failed: ${error.message}`);
    }
}

function generateTestReport() {
    const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
    
    log('\n' + '='.repeat(60), 'info');
    log(`${TEST_CONFIG.testName} - Test Report`, 'info');
    log('='.repeat(60), 'info');
    log(`Total Tests: ${testResults.total}`, 'info');
    log(`Passed: ${testResults.passed}`, 'info');
    log(`Failed: ${testResults.failed}`, 'info');
    log(`Success Rate: ${successRate}%`, 'info');
    log('='.repeat(60), 'info');
    
    if (testResults.failed > 0) {
        log('\nFailed Tests:', 'error');
        testResults.details
            .filter(test => !test.passed)
            .forEach(test => {
                log(`  ❌ ${test.test}: ${test.message}`, 'error');
            });
    }
    
    log('\nTest Summary:', 'info');
    if (testResults.failed === 0) {
        log('🎉 All tests passed! Community messaging integration is working correctly.', 'info');
    } else {
        log(`⚠️  ${testResults.failed} test(s) failed. Please review the issues above.`, 'error');
    }
    
    // Store results for external access
    window.communityMessagingTestResults = testResults;
    
    return testResults;
}

// Auto-run test when script loads
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runCommunityMessagingTest);
    } else {
        runCommunityMessagingTest();
    }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runCommunityMessagingTest,
        testResults,
        TEST_CONFIG
    };
}
