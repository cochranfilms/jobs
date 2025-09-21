module.exports = (req, res) => {
    console.log('📄 /api/health endpoint hit');
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        deployment: 'v5.0.0-INDIVIDUAL-FUNCTIONS',
        message: 'Vercel serverless functions are working!'
    });
};