class HumanChain {
  constructor(opts = {}) {
    this.name = 'Flare Testnet (Coston2)';
    this.chainId = 114;
    this.rpcUrl = opts.rpcUrl || 'https://coston2-api.flare.network/ext/C/rpc';
    this.connected = false;
    this.blockNumber = null;
    this._connect();
  }

  async _connect() {
    try {
      const res = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      this.blockNumber = parseInt(data.result, 16);
      this.connected = true;
    } catch {
      this.connected = false;
    }
  }

  async getBlockNumber() {
    try {
      const res = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      this.blockNumber = parseInt(data.result, 16);
      this.connected = true;
      return this.blockNumber;
    } catch {
      return this.blockNumber;
    }
  }

  getStatus() {
    return {
      name: this.name,
      chainId: this.chainId,
      connected: this.connected,
      blockNumber: this.blockNumber,
      role: 'Human verification, paper submissions, reviews',
    };
  }
}

module.exports = HumanChain;
