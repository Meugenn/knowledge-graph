const express = require('express');

function createPaper2AgentRoutes(paper2agent) {
  const router = express.Router();

  router.post('/process', async (req, res) => {
    const { paperId, fullText } = req.body;
    if (!paperId) return res.status(400).json({ error: 'paperId is required' });
    try {
      const result = await paper2agent.processPaper(paperId, fullText || '');
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/health', (req, res) => {
    res.json(paper2agent.healthCheck());
  });

  return router;
}

module.exports = createPaper2AgentRoutes;
