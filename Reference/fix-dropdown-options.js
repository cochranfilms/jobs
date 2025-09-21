/**
 * Fix Missing Dropdown Options in Firebase Users Collection
 * 
 * This script creates a system user document in Firebase that contains
 * the dropdown options needed by the admin dashboard.
 */

console.log('🔧 Starting dropdown options fix...');

// Wait for Firebase to be ready
async function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.FirestoreDataManager && window.FirestoreDataManager.isReady()) {
                console.log('✅ Firebase is ready');
                resolve();
            } else {
                console.log('⏳ Waiting for Firebase...');
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Create the system user with dropdown options
async function createDropdownOptionsUser() {
    try {
        console.log('📋 Creating system user with dropdown options...');
        
        // The dropdown options that should be stored
        const dropdownOptions = {
            roles: [
                "Photographer",
                "Videographer", 
                "Producer",
                "Director"
            ],
            locations: [
                "Los Angeles, CA",
                "New York, NY",
                "Miami, FL",
                "Chicago, IL",
                "Atlanta, GA",
                "San Francisco, CA",
                "Douglasville, GA"
            ],
            rates: [
                "$75/hour",
                "$100/hour",
                "$125/hour",
                "$150/hour",
                "$200/hour",
                "$250/hour",
                "$300/hour",
                "$400",
                "$300 + Tip"
            ],
            projectTypes: [
                "Wedding Photography",
                "Corporate Event",
                "Product Photography",
                "Real Estate",
                "Fashion Shoot",
                "Portrait Session",
                "Event Coverage",
                "Commercial Video",
                "Music Video",
                "Documentary",
                "Block Party Photography",
                "On-site Printing"
            ]
        };

        // Create system user data
        const systemUserId = 'system-dropdown-options';
        const systemUserData = {
            profile: {
                role: 'System',
                email: 'system@cochranfilms.com',
                location: 'System',
                projectType: 'System'
            },
            dropdownOptions: dropdownOptions,
            lastUpdated: new Date().toISOString(),
            isSystemUser: true
        };

        // Save to Firebase
        await window.FirestoreDataManager.setUser(systemUserId, systemUserData);
        
        console.log('✅ Successfully created system user with dropdown options');
        console.log('📊 Dropdown options now available in Firebase');
        
        // Update the global dropdownOptions variable
        window.dropdownOptions = dropdownOptions;
        
        // Trigger any UI updates
        if (typeof populateDropdownManagementInterface === 'function') {
            populateDropdownManagementInterface();
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Failed to create dropdown options user:', error);
        return false;
    }
}

// Main fix function
async function fixDropdownOptions() {
    try {
        console.log('🚀 Starting dropdown options fix...');
        
        // Wait for Firebase to be ready
        await waitForFirebase();
        
        // Check if dropdown options already exist
        try {
            const existingOptions = await window.FirestoreDataManager.getDropdownOptions();
            if (existingOptions && Object.keys(existingOptions).length > 0) {
                console.log('✅ Dropdown options already exist in Firebase');
                console.log('📊 Found options:', existingOptions);
                window.dropdownOptions = existingOptions;
                return true;
            }
        } catch (error) {
            console.log('📋 No existing dropdown options found, creating new ones...');
        }
        
        // Create the dropdown options
        const success = await createDropdownOptionsUser();
        
        if (success) {
            console.log('🎉 Dropdown options fix completed successfully!');
            alert('Dropdown options have been fixed! The admin dashboard should now work properly.');
        } else {
            console.error('❌ Dropdown options fix failed');
            alert('Failed to fix dropdown options. Check the console for details.');
        }
        
        return success;
        
    } catch (error) {
        console.error('❌ Dropdown options fix failed:', error);
        alert('Error fixing dropdown options: ' + error.message);
        return false;
    }
}

// Auto-run when script is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixDropdownOptions);
} else {
    fixDropdownOptions();
}

// Export for manual use
window.fixDropdownOptions = fixDropdownOptions;
