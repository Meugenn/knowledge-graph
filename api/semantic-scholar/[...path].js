// Vercel serverless function — proxies Semantic Scholar API (keeps API key secure)
export default async function handler(req, res) {
  try {
    // Extract the path after /api/semantic-scholar/
    const { path } = req.query;
    const apiPath = Array.isArray(path) ? path.join('/') : path || '';

    // Build query params (exclude the catch-all 'path' param)
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'path') params.set(key, value);
    }
    const queryString = params.toString();
    const url = `https://api.semanticscholar.org/${apiPath}${queryString ? '?' + queryString : ''}`;

    const headers = { 'Accept': 'application/json' };
    if (process.env.S2_API_KEY) {
      headers['x-api-key'] = process.env.S2_API_KEY;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Semantic Scholar API ${response.status}` });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Semantic Scholar proxy error:', err.message);
    return res.status(502).json({ error: 'Failed to fetch from Semantic Scholar' });
  }
}
