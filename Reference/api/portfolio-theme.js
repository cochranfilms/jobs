module.exports = async (req, res) => {
    console.log(`🎨 /api/portfolio-theme hit: ${req.method}`);

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const apiKey = process.env.OPENAI_API_KEY;
        const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
        if (!apiKey) {
            console.error('❌ OPENAI_API_KEY not configured');
            return res.status(500).json({ error: 'OpenAI not configured' });
        }

        const { brand = {}, preferences = {}, examples = [] } = req.body || {};

        const systemPrompt = [
            'You are a senior design system and front-end theming assistant.',
            'Generate modern, social-profile style portfolio themes as strict JSON.',
            'Output MUST be valid JSON with no commentary or code fences.',
            'Prefer accessibility (WCAG AA contrast), mobile-first, and clean CSS variables.',
            'Return tokens, cssVariables, layout, components, and meta only.'
        ].join(' ');

        const userPrompt = {
            brand,
            preferences,
            examples,
            requiredJsonShape: {
                tokens: {
                    colors: ['primary', 'secondary', 'background', 'surface', 'text', 'muted', 'success', 'warning', 'danger'],
                    fonts: ['heading', 'body'],
                    radii: ['sm', 'md', 'lg', 'xl'],
                    spacing: ['xs', 'sm', 'md', 'lg', 'xl']
                },
                cssVariables: 'Map of CSS custom properties for quick apply',
                layout: {
                    type: ['grid', 'masonry', 'timeline', 'profile'],
                    cardStyle: ['solid', 'bordered', 'glass'],
                    hero: 'boolean'
                },
                components: 'Style tokens for card, button, avatar, navbar, badge',
                meta: 'nameSuggestion, keywords array, description string'
            }
        };

        const body = {
            model,
            temperature: 0.7,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(userPrompt) }
            ]
        };

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            console.error('❌ OpenAI error:', err);
            return res.status(500).json({ error: 'OpenAI request failed', details: err });
        }

        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content || '';

        // Attempt robust JSON extraction
        let jsonText = raw.trim();
        if (jsonText.startsWith('```')) {
            const match = jsonText.match(/```(?:json)?\n([\s\S]*?)\n```/);
            if (match && match[1]) jsonText = match[1].trim();
        }
        // Fallback: try to find first { ... }
        if (!jsonText.startsWith('{')) {
            const braceStart = jsonText.indexOf('{');
            const braceEnd = jsonText.lastIndexOf('}');
            if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
                jsonText = jsonText.slice(braceStart, braceEnd + 1);
            }
        }

        let theme;
        try {
            theme = JSON.parse(jsonText);
        } catch (e) {
            console.error('❌ Failed to parse OpenAI JSON:', e.message);
            return res.status(500).json({ error: 'Invalid JSON from OpenAI', raw });
        }

        // Basic validation & defaults
        theme.tokens = theme.tokens || {};
        theme.cssVariables = theme.cssVariables || {};
        theme.layout = theme.layout || { type: 'grid', cardStyle: 'solid', hero: true };
        theme.components = theme.components || {};
        theme.meta = theme.meta || {};

        return res.status(200).json({ success: true, theme });
    } catch (error) {
        console.error('❌ /api/portfolio-theme error:', error);
        return res.status(500).json({ error: error.message });
    }
};


