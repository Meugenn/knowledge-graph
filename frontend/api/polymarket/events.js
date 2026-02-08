// Vercel serverless function — proxies Polymarket API to avoid CORS
export default async function handler(req, res) {
  const limit = req.query.limit || 30;
  const url = `https://gamma-api.polymarket.com/events?closed=false&active=true&limit=${limit}&order=volume24hr&ascending=false`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Polymarket API returned ${response.status}` });
    }

    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'Failed to reach Polymarket API' });
  }
}
