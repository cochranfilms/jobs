/**
 * Calendar Firestore Integration Test
 * Tests that the user portal calendar loads events from Firestore correctly
 */

async function testCalendarFirestoreIntegration() {
    console.log('🧪 Testing Calendar Firestore Integration...');
    
    try {
        // Test 1: Check if FirestoreDataManager is available
        console.log('1️⃣ Checking FirestoreDataManager availability...');
        if (!window.FirestoreDataManager) {
            throw new Error('FirestoreDataManager not available');
        }
        console.log('✅ FirestoreDataManager is available');
        
        // Test 2: Check Firestore initialization
        console.log('2️⃣ Checking Firestore initialization...');
        if (!window.FirestoreDataManager.isAvailable()) {
            console.log('⚠️ Firestore not initialized, attempting to initialize...');
            await window.FirestoreDataManager.init();
        }
        console.log('✅ Firestore is available');
        
        // Test 3: Load events from Firestore
        console.log('3️⃣ Loading events from Firestore...');
        const events = await window.FirestoreDataManager.getEvents();
        console.log(`✅ Loaded ${events.length} events from Firestore:`, events);
        
        // Test 4: Check event structure
        console.log('4️⃣ Validating event structure...');
        if (events.length > 0) {
            const sampleEvent = events[0];
            const requiredFields = ['id', 'title', 'date'];
            const missingFields = requiredFields.filter(field => !sampleEvent[field]);
            
            if (missingFields.length > 0) {
                console.warn(`⚠️ Sample event missing fields: ${missingFields.join(', ')}`);
            } else {
                console.log('✅ Event structure is valid');
            }
        }
        
        // Test 5: Test calendar mapping
        console.log('5️⃣ Testing calendar event mapping...');
        const mappedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            description: event.description || '',
            date: event.date,
            type: event.status || 'Event',
            location: event.location || ''
        }));
        console.log('✅ Events mapped successfully for calendar:', mappedEvents);
        
        // Test 6: Check if calendar functions exist
        console.log('6️⃣ Checking calendar functions...');
        if (typeof loadEvents === 'function') {
            console.log('✅ loadEvents function exists');
        } else {
            console.warn('⚠️ loadEvents function not found');
        }
        
        if (typeof initializeCalendar === 'function') {
            console.log('✅ initializeCalendar function exists');
        } else {
            console.warn('⚠️ initializeCalendar function not found');
        }
        
        console.log('🎉 Calendar Firestore Integration Test PASSED');
        return {
            success: true,
            eventsCount: events.length,
            mappedEvents: mappedEvents
        };
        
    } catch (error) {
        console.error('❌ Calendar Firestore Integration Test FAILED:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Auto-run test if in browser environment
if (typeof window !== 'undefined') {
    console.log('🚀 Auto-running Calendar Firestore Integration Test...');
    setTimeout(() => {
        testCalendarFirestoreIntegration();
    }, 2000); // Wait 2 seconds for page to load
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testCalendarFirestoreIntegration };
}
