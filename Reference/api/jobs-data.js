module.exports = (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    // Deprecated: jobs-data.json has been retired in favor of Firestore jobs collection
    return res.status(410).json({
        success: false,
        error: 'Deprecated endpoint',
        message: 'This project no longer serves jobs from jobs-data.json. Use Firestore instead.'
    });
};