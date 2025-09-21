const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
    console.log('🔄 /api/update-job-status endpoint hit');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { jobTitle, newStatus } = req.body;
        
        if (!jobTitle || !newStatus) {
            return res.status(400).json({ 
                error: 'Missing required fields', 
                required: ['jobTitle', 'newStatus'] 
            });
        }
        
        if (!['Active', 'Inactive'].includes(newStatus)) {
            return res.status(400).json({ 
                error: 'Invalid status', 
                validStatuses: ['Active', 'Inactive'] 
            });
        }
        
        const jobsPath = path.join(process.cwd(), 'jobs-data.json');
        console.log('📁 Loading jobs file from:', jobsPath);
        
        // Read current jobs data
        const jobsData = JSON.parse(fs.readFileSync(jobsPath, 'utf8'));
        
        // Find and update the job
        const jobIndex = jobsData.jobs.findIndex(job => job.title === jobTitle);
        
        if (jobIndex === -1) {
            return res.status(404).json({ 
                error: 'Job not found', 
                jobTitle: jobTitle 
            });
        }
        
        // Update the job status
        const oldStatus = jobsData.jobs[jobIndex].status;
        jobsData.jobs[jobIndex].status = newStatus;
        jobsData.lastUpdated = new Date().toISOString().split('T')[0];
        
        // Write updated data back to file
        fs.writeFileSync(jobsPath, JSON.stringify(jobsData, null, 2));
        
        console.log(`✅ Job status updated: "${jobTitle}" from "${oldStatus}" to "${newStatus}"`);
        
        res.json({
            success: true,
            message: `Job status updated successfully`,
            job: {
                title: jobTitle,
                oldStatus: oldStatus,
                newStatus: newStatus
            },
            updatedAt: jobsData.lastUpdated
        });
        
    } catch (error) {
        console.error('❌ Error updating job status:', error);
        res.status(500).json({ 
            error: 'Failed to update job status', 
            details: error.message 
        });
    }
};
