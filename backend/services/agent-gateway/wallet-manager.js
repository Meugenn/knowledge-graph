const fs = require('fs');
const path = require('path');

class WalletManager {
  constructor(opts = {}) {
    this.walletsPath = opts.path || path.join(__dirname, '../../data/agent-wallets.json');
    this.wallets = {};
    this._load();
  }

  _load() {
    if (fs.existsSync(this.walletsPath)) {
      this.wallets = JSON.parse(fs.readFileSync(this.walletsPath, 'utf8'));
    }
  }

  _persist() {
    const dir = path.dirname(this.walletsPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.walletsPath, JSON.stringify(this.wallets, null, 2));
  }

  async createWallet(agentId) {
    if (this.wallets[agentId]) return this.wallets[agentId];

    // Lazy-load ethers to avoid hard dependency
    let ethers;
    try {
      ethers = require('ethers');
    } catch {
      // Generate a mock wallet if ethers not available
      const mockAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      this.wallets[agentId] = { address: mockAddr, agentId, createdAt: new Date().toISOString() };
      this._persist();
      return this.wallets[agentId];
    }

    const wallet = ethers.Wallet.createRandom();
    this.wallets[agentId] = {
      address: wallet.address,
      privateKey: wallet.privateKey,
      agentId,
      createdAt: new Date().toISOString(),
    };
    this._persist();
    return { address: wallet.address, agentId, createdAt: this.wallets[agentId].createdAt };
  }

  getWallet(agentId) {
    const w = this.wallets[agentId];
    if (!w) return null;
    return { address: w.address, agentId: w.agentId, createdAt: w.createdAt };
  }

  getAllWallets() {
    return Object.values(this.wallets).map(w => ({
      address: w.address,
      agentId: w.agentId,
      createdAt: w.createdAt,
    }));
  }
}

module.exports = WalletManager;
