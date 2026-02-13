// Vercel serverless function — Republic Engine (polling-based status)

// In-memory state for demo; resets on cold start
const state = {
  alive: false,
  epoch: 0,
  vitals: {
    born: null,
    epoch: 0,
    papersAnalysed: 0,
    papersDiscovered: 0,
    hypothesesGenerated: 0,
    triplesExtracted: 0,
    marketsCreated: 0,
    forensicsScans: 0,
    agentActions: 0,
  },
  hypotheses: [],
  judgements: [],
  alerts: [],
  markets: [],
  log: [],
};

export default async function handler(req, res) {
  const { action } = req.query;

  if (req.method === 'POST') {
    if (action === 'awaken') {
      state.alive = true;
      state.vitals.born = new Date().toISOString();
      state.log.push({ timestamp: new Date().toISOString(), message: 'The Republic awakens.' });
      return res.status(200).json({ status: 'awakening', ...getStatus() });
    }

    if (action === 'sleep') {
      state.alive = false;
      state.log.push({ timestamp: new Date().toISOString(), message: 'The Republic rests.' });
      return res.status(200).json({ status: 'sleeping', ...getStatus() });
    }
  }

  if (req.method === 'GET') {
    switch (action) {
      case 'status':
        return res.status(200).json(getStatus());
      case 'hypotheses':
        return res.status(200).json(state.hypotheses);
      case 'judgements':
        return res.status(200).json(state.judgements);
      case 'alerts':
        return res.status(200).json(state.alerts);
      case 'markets':
        return res.status(200).json(state.markets);
      default:
        return res.status(200).json(getStatus());
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function getStatus() {
  return {
    alive: state.alive,
    epoch: state.epoch,
    vitals: state.vitals,
    queues: { philosophers: 0, warriors: 0, artisans: 0 },
    kg: { paperCount: 5, authorCount: 10, relationCount: 3 },
    markets: state.markets.length,
    hypotheses: state.hypotheses.length,
    judgements: state.judgements.length,
    alerts: state.alerts.length,
    recentLog: state.log.slice(-30),
    budget: {},
  };
}
