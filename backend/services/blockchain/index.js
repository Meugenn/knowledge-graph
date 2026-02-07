const HumanChain = require('./human-chain');
const AIChain = require('./ai-chain');
const Bridge = require('./bridge');
const EventListener = require('./event-listener');

class Blockchain {
  constructor(opts = {}) {
    this.humanChain = new HumanChain(opts.humanChain);
    this.aiChain = new AIChain(opts.aiChain);
    this.bridge = new Bridge({ humanChain: this.humanChain, aiChain: this.aiChain });
    this.eventListener = new EventListener({ humanChain: this.humanChain, aiChain: this.aiChain });
  }

  getStatus() {
    return {
      humanChain: this.humanChain.getStatus(),
      aiChain: this.aiChain.getStatus(),
      bridge: this.bridge.getStatus(),
    };
  }

  getEvents(limit = 20) {
    return this.eventListener.getEvents(limit);
  }

  healthCheck() {
    return {
      status: 'ok',
      humanChain: this.humanChain.getStatus(),
      aiChain: this.aiChain.getStatus(),
    };
  }
}

module.exports = Blockchain;
