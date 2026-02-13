// Vercel serverless function — Oracle search (arXiv + Semantic Scholar)

async function searchArxiv(query) {
  try {
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=10`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`arXiv API error: ${res.status}`);
    const xml = await res.text();

    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim();
      const abstract = (entry.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.trim();
      const published = (entry.match(/<published>([\s\S]*?)<\/published>/) || [])[1]?.trim();
      const id = (entry.match(/<id>([\s\S]*?)<\/id>/) || [])[1]?.trim();
      const arxivId = id ? id.split('/abs/').pop() : null;

      const authors = [];
      const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g;
      let am;
      while ((am = authorRegex.exec(entry)) !== null) authors.push(am[1].trim());

      const categories = [];
      const catRegex = /category term="([^"]+)"/g;
      let cm;
      while ((cm = catRegex.exec(entry)) !== null) categories.push(cm[1]);

      entries.push({ arxivId, title, authors, abstract, categories, published, source: 'arxiv' });
    }
    return entries;
  } catch (err) {
    console.warn('[ArxivSource] Search failed:', err.message);
    return [];
  }
}

async function searchSemanticScholar(query) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.S2_API_KEY) headers['x-api-key'] = process.env.S2_API_KEY;

    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=paperId,title,abstract,year,citationCount,authors,fieldsOfStudy`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`S2 API error: ${res.status}`);
    const data = await res.json();
    return (data.data || []).map(p => ({ ...p, source: 'semanticScholar' }));
  } catch (err) {
    console.warn('[S2Source] Search failed:', err.message);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, sources } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

    const srcList = typeof sources === 'string' ? sources.split(',') : ['arxiv', 'semanticScholar'];

    const searches = [];
    if (srcList.includes('arxiv')) searches.push(searchArxiv(q));
    if (srcList.includes('semanticScholar') || srcList.includes('s2')) searches.push(searchSemanticScholar(q));

    const results = await Promise.allSettled(searches);
    const combined = results.filter(r => r.status === 'fulfilled').flatMap(r => r.value || []);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(combined);
  } catch (err) {
    console.error('[oracle/search] Error:', err.message);
    return res.status(500).json({ error: 'Oracle search failed' });
  }
}
