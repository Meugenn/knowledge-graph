const express = require('express');

function createAgentRoutes(agentGateway) {
  const router = express.Router();

  router.get('/', (req, res) => {
    res.json(agentGateway.getAgents());
  });

  router.get('/budget', (req, res) => {
    const { agentId } = req.query;
    res.json(agentGateway.getBudget(agentId));
  });

  router.post('/chat', async (req, res) => {
    const { agentId, task, context } = req.body;
    if (!agentId || !task) {
      return res.status(400).json({ error: 'agentId and task are required' });
    }
    try {
      const result = await agentGateway.chat(agentId, task, context || {});
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/create', (req, res) => {
    const { agentId } = req.body;
    if (!agentId) return res.status(400).json({ error: 'agentId is required' });
    const wallet = agentGateway.createAgentWallet(agentId);
    res.json({ agentId, wallet: wallet.address });
  });

  return router;
}

module.exports = createAgentRoutes;
