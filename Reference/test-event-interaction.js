/**
 * Event Interaction Test
 * Tests the upgraded event cards and popup modal functionality
 */

async function testEventInteraction() {
    console.log('🧪 Testing Event Interaction Features...');
    
    try {
        // Test 1: Check if event modal exists
        console.log('1️⃣ Checking event details modal...');
        const modal = document.getElementById('eventDetailsModal');
        if (!modal) {
            throw new Error('Event details modal not found');
        }
        console.log('✅ Event details modal exists');
        
        // Test 2: Check if modal functions exist
        console.log('2️⃣ Checking modal functions...');
        if (typeof openEventDetails !== 'function') {
            throw new Error('openEventDetails function not found');
        }
        if (typeof closeEventDetails !== 'function') {
            throw new Error('closeEventDetails function not found');
        }
        if (typeof formatEventDate !== 'function') {
            throw new Error('formatEventDate function not found');
        }
        console.log('✅ All modal functions exist');
        
        // Test 3: Test modal opening with sample data
        console.log('3️⃣ Testing modal opening...');
        const testEvent = {
            id: 'test-123',
            title: 'Test Company Event',
            date: '2025-10-15',
            status: 'scheduled',
            location: 'Atlanta HQ',
            description: 'This is a test event for validation purposes.'
        };
        
        openEventDetails(
            testEvent.id,
            testEvent.title,
            testEvent.date,
            testEvent.status,
            testEvent.location,
            testEvent.description
        );
        
        // Wait a moment for modal to open
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if modal is visible
        if (modal.style.display === 'none' || modal.style.display === '') {
            throw new Error('Modal did not open properly');
        }
        console.log('✅ Modal opened successfully');
        
        // Test 4: Check modal content population
        console.log('4️⃣ Checking modal content...');
        const titleElement = document.getElementById('eventDetailsTitle');
        const dateElement = document.getElementById('eventDetailsDate');
        const statusElement = document.getElementById('eventDetailsStatus');
        const locationElement = document.getElementById('eventDetailsLocation');
        const descriptionElement = document.getElementById('eventDetailsDescription');
        
        if (!titleElement || titleElement.textContent !== testEvent.title) {
            throw new Error('Title not populated correctly');
        }
        if (!dateElement || !dateElement.textContent.includes('October')) {
            throw new Error('Date not formatted correctly');
        }
        if (!statusElement || !statusElement.textContent.includes('scheduled')) {
            throw new Error('Status not populated correctly');
        }
        if (!locationElement || locationElement.textContent !== testEvent.location) {
            throw new Error('Location not populated correctly');
        }
        if (!descriptionElement || descriptionElement.textContent !== testEvent.description) {
            throw new Error('Description not populated correctly');
        }
        console.log('✅ Modal content populated correctly');
        
        // Test 5: Test modal closing
        console.log('5️⃣ Testing modal closing...');
        closeEventDetails();
        
        // Wait a moment for modal to close
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (modal.style.display !== 'none') {
            throw new Error('Modal did not close properly');
        }
        console.log('✅ Modal closed successfully');
        
        // Test 6: Test date formatting function
        console.log('6️⃣ Testing date formatting...');
        const formattedDate = formatEventDate('2025-12-25');
        if (!formattedDate.includes('December') || !formattedDate.includes('2025')) {
            throw new Error('Date formatting not working correctly');
        }
        console.log('✅ Date formatting works correctly');
        
        // Test 7: Check event cards styling
        console.log('7️⃣ Checking event card styles...');
        const eventCardStyle = getComputedStyle(document.querySelector('.calendar-event'));
        if (!eventCardStyle.background.includes('gradient')) {
            console.warn('⚠️ Event card may not have gradient background');
        }
        console.log('✅ Event card styles loaded');
        
        console.log('🎉 Event Interaction Test PASSED');
        return {
            success: true,
            testsPassed: 7,
            features: {
                modalExists: true,
                functionsExist: true,
                modalOpens: true,
                contentPopulated: true,
                modalCloses: true,
                dateFormatting: true,
                cardStyling: true
            }
        };
        
    } catch (error) {
        console.error('❌ Event Interaction Test FAILED:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Auto-run test if in browser environment
if (typeof window !== 'undefined') {
    console.log('🚀 Auto-running Event Interaction Test...');
    setTimeout(() => {
        testEventInteraction();
    }, 3000); // Wait 3 seconds for page to load
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testEventInteraction };
}
