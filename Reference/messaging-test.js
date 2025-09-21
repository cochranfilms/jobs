/**
 * Messaging System Test Script
 * Tests the complete messaging functionality between users and admins
 */

class MessagingTestSuite {
    constructor() {
        this.testResults = [];
        this.messagingService = null;
        this.testUser = null;
        this.testAdmin = null;
    }

    async runAllTests() {
        console.log('🧪 Starting Messaging System Test Suite...');
        
        try {
            // Initialize Firebase and messaging service
            await this.initializeTestEnvironment();
            
            // Run individual tests
            await this.testMessagingServiceInitialization();
            await this.testConversationCreation();
            await this.testMessageSending();
            await this.testFileAttachments();
            await this.testRealTimeUpdates();
            await this.testReadReceipts();
            await this.testSearchFunctionality();
            await this.testAdminMessaging();
            await this.testSecurityRules();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.addTestResult('Test Suite', false, `Failed to run tests: ${error.message}`);
        }
    }

    async initializeTestEnvironment() {
        try {
            // Wait for Firebase to be ready
            await window.FirebaseConfig.waitForInit();
            
            // Initialize messaging service
            this.messagingService = new MessagingService();
            
            // Get current user
            this.testUser = window.FirebaseConfig.getCurrentUser();
            this.testAdmin = {
                email: 'cody@cochranfilms.com',
                isAdmin: true
            };
            
            console.log('✅ Test environment initialized');
            this.addTestResult('Environment Setup', true, 'Firebase and messaging service initialized');
            
        } catch (error) {
            throw new Error(`Failed to initialize test environment: ${error.message}`);
        }
    }

    async testMessagingServiceInitialization() {
        try {
            if (!this.messagingService) {
                throw new Error('Messaging service not initialized');
            }
            
            if (!this.messagingService.firestore) {
                throw new Error('Firestore not available');
            }
            
            if (!this.messagingService.auth) {
                throw new Error('Auth not available');
            }
            
            console.log('✅ Messaging service initialization test passed');
            this.addTestResult('Service Initialization', true, 'All required services initialized correctly');
            
        } catch (error) {
            console.error('❌ Messaging service initialization test failed:', error);
            this.addTestResult('Service Initialization', false, error.message);
        }
    }

    async testConversationCreation() {
        try {
            const participants = [this.testUser.email, this.testAdmin.email];
            const conversationId = await this.messagingService.createConversation(participants, 'test-job-123', 'Test conversation');
            
            if (!conversationId) {
                throw new Error('Conversation ID not returned');
            }
            
            // Verify conversation exists in Firestore
            const conversationDoc = await this.messagingService.firestore
                .collection('directMessages')
                .doc(conversationId)
                .get();
            
            if (!conversationDoc.exists) {
                throw new Error('Conversation not found in Firestore');
            }
            
            const conversationData = conversationDoc.data();
            if (!conversationData.participants.includes(this.testUser.email)) {
                throw new Error('User not in participants list');
            }
            
            if (!conversationData.participants.includes(this.testAdmin.email)) {
                throw new Error('Admin not in participants list');
            }
            
            console.log('✅ Conversation creation test passed');
            this.addTestResult('Conversation Creation', true, `Created conversation: ${conversationId}`);
            
        } catch (error) {
            console.error('❌ Conversation creation test failed:', error);
            this.addTestResult('Conversation Creation', false, error.message);
        }
    }

    async testMessageSending() {
        try {
            // Get or create a test conversation
            const conversationId = await this.messagingService.getOrCreateAdminConversation();
            
            // Send a test message
            const messageContent = `Test message at ${new Date().toISOString()}`;
            const messageId = await this.messagingService.sendMessage(conversationId, messageContent);
            
            if (!messageId) {
                throw new Error('Message ID not returned');
            }
            
            // Verify message exists
            const messages = await this.messagingService.loadMessages(conversationId);
            const sentMessage = messages.find(msg => msg.content === messageContent);
            
            if (!sentMessage) {
                throw new Error('Message not found in conversation');
            }
            
            if (sentMessage.senderId !== this.testUser.email) {
                throw new Error('Message sender ID incorrect');
            }
            
            console.log('✅ Message sending test passed');
            this.addTestResult('Message Sending', true, `Sent message: ${messageId}`);
            
        } catch (error) {
            console.error('❌ Message sending test failed:', error);
            this.addTestResult('Message Sending', false, error.message);
        }
    }

    async testFileAttachments() {
        try {
            // Create a test file
            const testFile = new File(['Test file content'], 'test.txt', { type: 'text/plain' });
            
            // Get or create a test conversation
            const conversationId = await this.messagingService.getOrCreateAdminConversation();
            
            // Upload attachment
            const attachment = await this.messagingService.uploadAttachment(conversationId, 'test-message', testFile);
            
            if (!attachment.url) {
                throw new Error('Attachment URL not returned');
            }
            
            if (attachment.name !== 'test.txt') {
                throw new Error('Attachment name incorrect');
            }
            
            // Send message with attachment
            const messageId = await this.messagingService.sendMessage(conversationId, 'Message with attachment', [attachment]);
            
            // Verify message with attachment
            const messages = await this.messagingService.loadMessages(conversationId);
            const messageWithAttachment = messages.find(msg => msg.attachments && msg.attachments.length > 0);
            
            if (!messageWithAttachment) {
                throw new Error('Message with attachment not found');
            }
            
            console.log('✅ File attachment test passed');
            this.addTestResult('File Attachments', true, `Uploaded and sent attachment: ${attachment.name}`);
            
        } catch (error) {
            console.error('❌ File attachment test failed:', error);
            this.addTestResult('File Attachments', false, error.message);
        }
    }

    async testRealTimeUpdates() {
        try {
            let realTimeUpdateReceived = false;
            
            // Get or create a test conversation
            const conversationId = await this.messagingService.getOrCreateAdminConversation();
            
            // Set up real-time listener
            const unsubscribe = this.messagingService.listenToMessages(conversationId, (messages) => {
                realTimeUpdateReceived = true;
                console.log('✅ Real-time update received');
            });
            
            // Send a message to trigger real-time update
            await this.messagingService.sendMessage(conversationId, 'Real-time test message');
            
            // Wait for real-time update
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Clean up listener
            if (unsubscribe) {
                unsubscribe();
            }
            
            if (!realTimeUpdateReceived) {
                throw new Error('Real-time update not received');
            }
            
            console.log('✅ Real-time updates test passed');
            this.addTestResult('Real-time Updates', true, 'Real-time listener working correctly');
            
        } catch (error) {
            console.error('❌ Real-time updates test failed:', error);
            this.addTestResult('Real-time Updates', false, error.message);
        }
    }

    async testReadReceipts() {
        try {
            // Get or create a test conversation
            const conversationId = await this.messagingService.getOrCreateAdminConversation();
            
            // Mark messages as read
            await this.messagingService.markMessagesAsRead(conversationId);
            
            // Verify read status was updated
            const conversationDoc = await this.messagingService.firestore
                .collection('directMessages')
                .doc(conversationId)
                .get();
            
            const conversationData = conversationDoc.data();
            const readStatus = conversationData.readStatus[this.testUser.email];
            
            if (!readStatus) {
                throw new Error('Read status not updated');
            }
            
            console.log('✅ Read receipts test passed');
            this.addTestResult('Read Receipts', true, 'Read status updated correctly');
            
        } catch (error) {
            console.error('❌ Read receipts test failed:', error);
            this.addTestResult('Read Receipts', false, error.message);
        }
    }

    async testSearchFunctionality() {
        try {
            // Get or create a test conversation
            const conversationId = await this.messagingService.getOrCreateAdminConversation();
            
            // Send a searchable message
            const searchableContent = 'Search test message with unique keyword: ' + Date.now();
            await this.messagingService.sendMessage(conversationId, searchableContent);
            
            // Search for the message
            const searchResults = await this.messagingService.searchMessages('Search test message', conversationId);
            
            if (searchResults.length === 0) {
                throw new Error('Search returned no results');
            }
            
            const foundMessage = searchResults.find(msg => msg.content.includes('Search test message'));
            if (!foundMessage) {
                throw new Error('Search did not find the expected message');
            }
            
            console.log('✅ Search functionality test passed');
            this.addTestResult('Search Functionality', true, `Found ${searchResults.length} search results`);
            
        } catch (error) {
            console.error('❌ Search functionality test failed:', error);
            this.addTestResult('Search Functionality', false, error.message);
        }
    }

    async testAdminMessaging() {
        try {
            // Test admin conversation creation
            const adminConversationId = await this.messagingService.getOrCreateAdminConversation();
            
            if (!adminConversationId) {
                throw new Error('Admin conversation not created');
            }
            
            // Test user conversation creation (admin perspective)
            const userEmail = this.testUser.email;
            const userConversationId = await this.messagingService.getOrCreateUserConversation(userEmail);
            
            if (!userConversationId) {
                throw new Error('User conversation not created');
            }
            
            console.log('✅ Admin messaging test passed');
            this.addTestResult('Admin Messaging', true, 'Admin conversation management working');
            
        } catch (error) {
            console.error('❌ Admin messaging test failed:', error);
            this.addTestResult('Admin Messaging', false, error.message);
        }
    }

    async testSecurityRules() {
        try {
            // Test that users can only access their own conversations
            const conversations = await this.messagingService.loadUserConversations();
            
            // Verify all conversations include the current user
            const invalidConversations = conversations.filter(conv => 
                !conv.participants.includes(this.testUser.email)
            );
            
            if (invalidConversations.length > 0) {
                throw new Error('User can access conversations they are not part of');
            }
            
            console.log('✅ Security rules test passed');
            this.addTestResult('Security Rules', true, 'User can only access their own conversations');
            
        } catch (error) {
            console.error('❌ Security rules test failed:', error);
            this.addTestResult('Security Rules', false, error.message);
        }
    }

    addTestResult(testName, passed, message) {
        this.testResults.push({
            test: testName,
            passed: passed,
            message: message,
            timestamp: new Date().toISOString()
        });
    }

    generateTestReport() {
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log('\n📊 MESSAGING SYSTEM TEST REPORT');
        console.log('================================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        console.log('\nDetailed Results:');
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.message}`);
        });
        
        // Save report to localStorage for debugging
        localStorage.setItem('messagingTestReport', JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: { totalTests, passedTests, failedTests },
            results: this.testResults
        }));
        
        return {
            totalTests,
            passedTests,
            failedTests,
            successRate: (passedTests / totalTests) * 100,
            results: this.testResults
        };
    }
}

// Auto-run tests when script loads
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Firebase to be ready
    if (window.FirebaseConfig) {
        await window.FirebaseConfig.waitForInit();
        
        // Run tests after a short delay
        setTimeout(async () => {
            const testSuite = new MessagingTestSuite();
            await testSuite.runAllTests();
        }, 3000);
    } else {
        console.error('❌ Firebase not available for testing');
    }
});

// Export for manual testing
window.MessagingTestSuite = MessagingTestSuite;
