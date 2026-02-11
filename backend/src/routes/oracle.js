const express = require('express');

function createOracleRoutes(dataOracle) {
  const router = express.Router();

  router.get('/search', async (req, res) => {
    try {
      const { q, sources } = req.query;
      if (!q) return res.status(400).json({ error: 'Query parameter q is required' });
      const srcList = typeof sources === 'string' ? sources.split(',') : ['arxiv', 's2'];
      const results = await dataOracle.search(q, srcList);
      res.json(results);
    } catch (err) {
      console.error('[oracle/search] Error:', err.message);
      res.status(500).json({ error: 'Oracle search failed' });
    }
  });

  router.post('/ingest', async (req, res) => {
    const { paperId } = req.body;
    if (!paperId) return res.status(400).json({ error: 'paperId is required' });
    const result = await dataOracle.enrich(paperId);
    res.json(result);
  });

  router.get('/health', (req, res) => {
    res.json(dataOracle.healthCheck());
  });

  return router;
}

module.exports = createOracleRoutes;
