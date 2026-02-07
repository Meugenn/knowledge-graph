const express = require('express');

function createTrismRoutes(trism) {
  const router = express.Router();

  router.get('/status', (req, res) => {
    res.json(trism.getStatus());
  });

  router.post('/check', async (req, res) => {
    const { agentId, response, context } = req.body;
    if (!agentId || !response) {
      return res.status(400).json({ error: 'agentId and response are required' });
    }
    const result = await trism.evaluateResponse(agentId, response, context || {});
    res.json(result);
  });

  router.get('/health', (req, res) => {
    res.json(trism.healthCheck());
  });

  return router;
}

module.exports = createTrismRoutes;
