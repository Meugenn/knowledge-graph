class EventListener {
  constructor(opts = {}) {
    this.humanChain = opts.humanChain;
    this.aiChain = opts.aiChain;
    this.events = [];

    // Add demo events
    this.events = [
      { id: 'evt-1', chain: 'human', type: 'PaperSubmitted', data: { paperId: 1, author: '0x742d...4a3e' }, timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 'evt-2', chain: 'human', type: 'ReviewSubmitted', data: { paperId: 1, reviewer: '0x8f3b...c2d1' }, timestamp: new Date(Date.now() - 2400000).toISOString() },
      { id: 'evt-3', chain: 'ai', type: 'AgentAnalysis', data: { agentId: 'iris', paperId: 'vaswani2017' }, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'evt-4', chain: 'ai', type: 'AgentAnalysis', data: { agentId: 'atlas', paperId: 'vaswani2017' }, timestamp: new Date(Date.now() - 1200000).toISOString() },
      { id: 'evt-5', chain: 'human', type: 'MarketCreated', data: { marketId: 1, paperId: 'vaswani2017' }, timestamp: new Date(Date.now() - 600000).toISOString() },
      { id: 'evt-6', chain: 'ai', type: 'ForensicsScore', data: { paperId: 'vaswani2017', score: 87 }, timestamp: new Date(Date.now() - 300000).toISOString() },
    ];
  }

  getEvents(limit = 20) {
    return this.events.slice(-limit).reverse();
  }
}

module.exports = EventListener;
