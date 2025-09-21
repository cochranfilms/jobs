module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Deprecated: JSON users endpoint has been retired in favor of Firestore
    return res.status(410).json({
        success: false,
        error: 'Deprecated endpoint',
        message: 'This project no longer serves users from users.json. Use Firestore instead.'
    });
};