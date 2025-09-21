exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': process.env.CORS_ALLOW_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
    if (!token) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing HUBSPOT_PRIVATE_APP_TOKEN' }) };
    }

    const body = JSON.parse(event.body || '{}');
    const incoming = body.properties || body;
    const email = incoming.email || '';
    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) };
    }

    const properties = {
      email,
      firstname: incoming.firstname || incoming.name || '',
      phone: incoming.phone || ''
    };
    if (incoming.portfolio || incoming.portfolio_url || incoming.website) {
      properties.website = incoming.website || incoming.portfolio || incoming.portfolio_url;
    }
    if (process.env.HUBSPOT_SET_LIFECYCLE === '1') {
      properties.lifecyclestage = 'subscriber';
    }

    const resp = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ properties })
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return { statusCode: resp.status, headers, body: JSON.stringify({ error: 'HubSpot error', details: data }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, contactId: data.id, data }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', details: String(e) }) };
  }
};


