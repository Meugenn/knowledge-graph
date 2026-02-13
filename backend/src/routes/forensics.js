const express = require('express');

function createForensicsRoutes(forensics) {
  const router = express.Router();

  router.post('/analyse', (req, res) => {
    try {
      const { paperId, fullText } = req.body;
      if (!paperId) return res.status(400).json({ error: 'paperId is required' });
      const result = forensics.scorePaper(paperId, fullText || '');
      res.json(result);
    } catch (err) {
      console.error('[forensics/analyse] Error:', err.message);
      res.status(500).json({ error: 'Forensics analysis failed' });
    }
  });

  router.get('/health', (req, res) => {
    res.json(forensics.healthCheck());
  });

  return router;
}

module.exports = createForensicsRoutes;
