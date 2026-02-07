const express = require('express');

module.exports = function(swarm, wss) {
  const router = express.Router();

  // Broadcast swarm events to WebSocket clients
  swarm.on('log', (entry) => {
    broadcast(wss, { type: 'swarm_log', ...entry });
  });
  swarm.on('iteration_start', (data) => {
    broadcast(wss, { type: 'swarm_iteration_start', ...data });
  });
  swarm.on('agent_done', (data) => {
    broadcast(wss, { type: 'swarm_agent_done', ...data });
  });
  swarm.on('hypotheses', (data) => {
    broadcast(wss, { type: 'swarm_hypotheses', ...data });
  });
  swarm.on('iteration_done', (data) => {
    broadcast(wss, { type: 'swarm_iteration_done', ...data });
  });

  router.post('/start', (req, res) => {
    if (swarm.running) return res.json({ status: 'already_running', ...swarm.getStatus() });
    swarm.start(); // fire and forget — runs async
    res.json({ status: 'started', ...swarm.getStatus() });
  });

  router.post('/stop', (req, res) => {
    swarm.stop();
    res.json({ status: 'stopping', ...swarm.getStatus() });
  });

  router.get('/status', (req, res) => {
    res.json(swarm.getStatus());
  });

  router.get('/hypotheses', (req, res) => {
    res.json(swarm.stats.hypotheses);
  });

  return router;
};

function broadcast(wss, data) {
  if (!wss) return;
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}
