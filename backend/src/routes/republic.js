const express = require('express');

module.exports = function(republic, wss) {
  const router = express.Router();

  router.post('/awaken', (req, res) => {
    if (republic.alive) return res.json({ status: 'already_alive', ...republic.getStatus() });
    republic.awaken();
    res.json({ status: 'awakening', ...republic.getStatus() });
  });

  router.post('/sleep', (req, res) => {
    republic.sleep();
    res.json({ status: 'sleeping', ...republic.getStatus() });
  });

  router.get('/status', (req, res) => {
    res.json(republic.getStatus());
  });

  router.get('/hypotheses', (req, res) => {
    res.json(republic.getHypotheses());
  });

  router.get('/judgements', (req, res) => {
    res.json(republic.getJudgements());
  });

  router.get('/alerts', (req, res) => {
    res.json(republic.getAlerts());
  });

  router.get('/markets', (req, res) => {
    res.json(republic.getMarkets());
  });

  return router;
};
