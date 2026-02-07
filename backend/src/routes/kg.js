const express = require('express');

function createKgRoutes(kg) {
  const router = express.Router();

  router.get('/papers', (req, res) => {
    res.json(kg.getAllPapers());
  });

  router.get('/papers/:id', (req, res) => {
    const paper = kg.getPaper(req.params.id);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });
    res.json(paper);
  });

  router.get('/papers/:id/neighbourhood', (req, res) => {
    const depth = parseInt(req.query.depth) || 2;
    res.json(kg.getNeighbourhood(req.params.id, depth));
  });

  router.get('/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query parameter q is required' });
    res.json(kg.searchPapers(q));
  });

  router.get('/stats', (req, res) => {
    res.json(kg.getStats());
  });

  router.post('/papers', (req, res) => {
    const paper = req.body;
    if (!paper.id || !paper.title) {
      return res.status(400).json({ error: 'id and title are required' });
    }
    res.json(kg.addPaper(paper));
  });

  router.get('/health', (req, res) => {
    res.json(kg.healthCheck());
  });

  return router;
}

module.exports = createKgRoutes;
