// Vercel serverless function — Agent Gateway (stateless agents)

// Agent definitions
const AGENTS = [
  { id: 'iris', name: 'Dr. Iris', role: 'Philosopher King — Deep Literature Analysis', caste: 'philosopher', description: 'Traverses the knowledge graph, identifies gaps, generates hypotheses.', temperature: 0.7 },
  { id: 'atlas', name: 'Prof. Atlas', role: 'Chief Architect — Experimental Design Review', caste: 'guardian', description: 'Evaluates methodology, identifies flaws, suggests improvements.', temperature: 0.4 },
  { id: 'tensor', name: 'Agent Tensor', role: 'Artisan — Computational Realist', caste: 'producer', description: 'Estimates compute costs, replication feasibility, prices truth.', temperature: 0.3 },
  { id: 'sage', name: 'Dr. Sage', role: 'Guardian — Statistical Integrity', caste: 'guardian', description: 'Critiques statistical rigour, reproducibility, methodology.', temperature: 0.3 },
  { id: 'hermes', name: 'Agent Hermes', role: 'Data Oracle — Cross-Reference Verification', caste: 'producer', description: 'Verifies citations, cross-references external sources, detects anomalies.', temperature: 0.5 },
];

const CASTE_LIMITS = {
  guardian: { tokenLimit: 100000, warningAt: 0.8 },
  philosopher: { tokenLimit: 150000, warningAt: 0.8 },
  producer: { tokenLimit: 80000, warningAt: 0.8 },
};

export default async function handler(req, res) {
  const { action } = req.query;

  if (req.method === 'GET') {
    switch (action) {
      case 'list':
        return res.status(200).json(AGENTS);

      case 'budget': {
        const status = {};
        for (const [caste, limit] of Object.entries(CASTE_LIMITS)) {
          status[caste] = {
            used: 0,
            limit: limit.tokenLimit,
            ratio: 0,
            remaining: limit.tokenLimit,
          };
        }
        return res.status(200).json(status);
      }

      default:
        return res.status(200).json(AGENTS);
    }
  }

  if (req.method === 'POST') {
    if (action === 'chat') {
      const { agentId, task } = req.body;
      if (!agentId || !task) {
        return res.status(400).json({ error: 'agentId and task are required' });
      }

      const agent = AGENTS.find(a => a.id === agentId);
      if (!agent) {
        return res.status(404).json({ error: `Agent "${agentId}" not found` });
      }

      return res.status(200).json({
        agentId,
        agentName: agent.name,
        caste: agent.caste,
        content: `[${agent.name}] Analysis pending — configure an LLM provider to enable AI agent responses.`,
        tokensUsed: 0,
        trismResult: null,
      });
    }

    if (action === 'create') {
      const { agentId } = req.body;
      if (!agentId) return res.status(400).json({ error: 'agentId is required' });
      const mockAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return res.status(200).json({ agentId, wallet: mockAddr });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
