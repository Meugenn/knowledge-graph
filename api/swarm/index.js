// Vercel serverless function — Swarm Engine (polling-based status)

const state = {
  running: false,
  iteration: 0,
  stats: { papersAnalysed: 0, papersDiscovered: 0, triplesExtracted: 0, hypotheses: [], errors: 0 },
  log: [],
};

export default async function handler(req, res) {
  const { action } = req.query;

  if (req.method === 'POST') {
    if (action === 'start') {
      if (state.running) return res.status(200).json({ status: 'already_running', ...getStatus() });
      state.running = true;
      state.log.push({ timestamp: new Date().toISOString(), message: 'Swarm started' });
      return res.status(200).json({ status: 'started', ...getStatus() });
    }

    if (action === 'stop') {
      state.running = false;
      state.log.push({ timestamp: new Date().toISOString(), message: 'Swarm stopping...' });
      return res.status(200).json({ status: 'stopping', ...getStatus() });
    }
  }

  if (req.method === 'GET') {
    switch (action) {
      case 'status':
        return res.status(200).json(getStatus());
      case 'hypotheses':
        return res.status(200).json(state.stats.hypotheses);
      default:
        return res.status(200).json(getStatus());
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function getStatus() {
  return {
    running: state.running,
    iteration: state.iteration,
    queueLength: 0,
    analysedCount: 0,
    stats: state.stats,
    recentLog: state.log.slice(-20),
  };
}
