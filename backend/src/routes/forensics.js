const express = require('express');

function createForensicsRoutes(forensics) {
  const router = express.Router();

  router.post('/analyse', (req, res) => {
    const { paperId, fullText } = req.body;
    if (!paperId) return res.status(400).json({ error: 'paperId is required' });
    const result = forensics.scorePaper(paperId, fullText || '');
    res.json(result);
  });

  router.get('/health', (req, res) => {
    res.json(forensics.healthCheck());
  });

  return router;
}

module.exports = createForensicsRoutes;
