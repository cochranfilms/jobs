// Test script to debug profile display issue
console.log('🧪 Testing profile display functionality...');

// Simulate the data loading process
async function testProfileDisplay() {
    try {
        // Load users data from the API
        console.log('📡 Loading users data from API...');
        const response = await fetch('/api/users');
        
        if (response.ok) {
            const jsonData = await response.json();
            console.log('✅ Raw API response:', jsonData);
            
            if (jsonData.users) {
                // Test the data transformation logic
                const users = Object.entries(jsonData.users).map(([name, user]) => ({
                    name: name,
                    email: user.profile?.email,
                    password: user.profile?.password,
                    approvedDate: user.profile?.approvedDate,
                    contractUrl: user.contract?.contractUrl || 'contract.html',
                    contractStatus: user.contract?.contractStatus || 'pending',
                    contractSignedDate: user.contract?.contractSignedDate,
                    contractUploadedDate: user.contract?.contractUploadedDate,
                    contractId: user.contract?.contractId,
                    paymentMethod: user.paymentMethod || null,
                    paymentStatus: user.paymentStatus || 'pending',
                    jobs: user.jobs || {
                        'legacy-job': {
                            id: 'legacy-job',
                            role: user.profile?.role,
                            location: user.profile?.location,
                            projectStart: user.profile?.projectStart,
                            rate: user.profile?.rate,
                            status: 'upcoming',
                            projectType: 'Legacy Job',
                            description: `${user.profile?.role} position`
                        }
                    },
                    primaryJob: user.primaryJob || 'legacy-job'
                }));
                
                console.log('🔄 Transformed users data:', users);
                
                // Find Test User
                const testUser = users.find(u => u.name === 'Test User');
                if (testUser) {
                    console.log('👤 Test User data:', testUser);
                    console.log('📋 Test User jobs:', testUser.jobs);
                    
                    // Test getSelectedJob logic
                    const selectedJob = testUser.jobs[testUser.primaryJob] || Object.values(testUser.jobs)[0];
                    console.log('🎯 Selected job:', selectedJob);
                    
                    // Test profile display data
                    const profileData = {
                        name: testUser.name,
                        email: testUser.email,
                        approvedDate: testUser.approvedDate,
                        role: selectedJob?.role || 'Creator',
                        location: selectedJob?.location || 'N/A',
                        rate: selectedJob?.rate || 'N/A'
                    };
                    
                    console.log('📊 Profile display data:', profileData);
                } else {
                    console.log('❌ Test User not found in transformed data');
                }
            }
        } else {
            console.log('❌ API response not ok:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Error testing profile display:', error);
    }
}

// Run the test
testProfileDisplay();
