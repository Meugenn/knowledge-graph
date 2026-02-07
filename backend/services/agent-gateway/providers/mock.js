class MockProvider {
  constructor(responses = {}) {
    this.responses = responses;
  }

  async chat({ system, message }) {
    // Extract agent ID from system prompt
    const agentMatch = system.match(/You are (\w+[\.\s]\w+)/);
    let agentId = null;

    if (system.includes('Dr. Iris')) agentId = 'iris';
    else if (system.includes('Prof. Atlas')) agentId = 'atlas';
    else if (system.includes('Agent Tensor')) agentId = 'tensor';

    // Try to match task
    const task = message.toLowerCase().includes('review') ? 'review'
      : message.toLowerCase().includes('analy') ? 'analyse'
      : 'review';

    if (agentId && this.responses[agentId] && this.responses[agentId][task]) {
      return {
        content: this.responses[agentId][task],
        tokensUsed: 500,
      };
    }

    return {
      content: `[Mock response] Agent ${agentId || 'unknown'} received task: ${message.substring(0, 100)}...`,
      tokensUsed: 100,
    };
  }
}

module.exports = MockProvider;
