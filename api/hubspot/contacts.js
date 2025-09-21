export default async function handler(req, res) {
  // Basic CORS for same-origin and cross-origin preview
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ALLOW_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'Missing HUBSPOT_PRIVATE_APP_TOKEN' });
    }

    const body = req.body || {};
    const incoming = body.properties || body;

    const email = incoming.email || '';
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Normalize allowed properties for HubSpot
    const properties = {
      email,
      firstname: incoming.firstname || incoming.name || '',
      phone: incoming.phone || '',
    };

    // Map portfolio URL to the standard "website" property to avoid custom schema requirements
    if (incoming.portfolio || incoming.portfolio_url || incoming.website) {
      properties.website = incoming.website || incoming.portfolio || incoming.portfolio_url;
    }

    // Optional lifecycle stage tagging
    if (process.env.HUBSPOT_SET_LIFECYCLE === '1') {
      properties.lifecyclestage = 'subscriber';
    }

    const hubspotRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ properties }),
    });

    const data = await hubspotRes.json().catch(() => ({}));
    if (!hubspotRes.ok) {
      return res.status(hubspotRes.status).json({ error: 'HubSpot error', details: data });
    }

    return res.status(200).json({ ok: true, contactId: data.id, data });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: String(err) });
  }
}


