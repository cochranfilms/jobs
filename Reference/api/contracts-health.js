module.exports = async (req, res) => {
  try {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const status = {
      ok: true,
      env: {
        hasGithubToken: !!process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_OWNER || 'cochranfilms',
        repo: process.env.GITHUB_REPO || 'cochran-job-listings',
        branch: process.env.GITHUB_BRANCH || 'main'
      },
      timestamp: new Date().toISOString()
    };
    return res.status(200).json(status);
  } catch (e) {
    return res.status(200).json({ ok: false, error: e?.message || 'unknown' });
  }
};


