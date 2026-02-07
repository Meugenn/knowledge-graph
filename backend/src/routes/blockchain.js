const express = require('express');
const router = express.Router();

module.exports = function(blockchain) {
  router.get('/status', async (req, res) => {
    // Refresh block numbers
    await Promise.allSettled([
      blockchain.humanChain.getBlockNumber(),
      blockchain.aiChain.getBlockNumber(),
    ]);
    res.json({
      humanChain: blockchain.humanChain.getStatus(),
      aiChain: blockchain.aiChain.getStatus(),
      bridge: blockchain.bridge.getStatus(),
      events: blockchain.eventListener.getEvents(10),
    });
  });

  router.get('/events', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json(blockchain.eventListener.getEvents(limit));
  });

  return router;
};
