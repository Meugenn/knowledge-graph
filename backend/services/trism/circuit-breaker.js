// 3-level escalation: throttle → quarantine → kill
const LEVELS = {
  NORMAL: 'normal',
  THROTTLE: 'throttle',
  QUARANTINE: 'quarantine',
  KILL: 'kill',
};

class CircuitBreaker {
  constructor(opts = {}) {
    this.thresholds = {
      throttle: opts.throttleAfter || 3,
      quarantine: opts.quarantineAfter || 5,
      kill: opts.killAfter || 8,
    };
    this.agents = {};
  }

  _ensure(agentId) {
    if (!this.agents[agentId]) {
      this.agents[agentId] = { failures: 0, successes: 0, level: LEVELS.NORMAL, lastUpdate: Date.now() };
    }
  }

  recordFailure(agentId) {
    this._ensure(agentId);
    this.agents[agentId].failures++;
    this.agents[agentId].lastUpdate = Date.now();
    this._updateLevel(agentId);
  }

  recordSuccess(agentId) {
    this._ensure(agentId);
    this.agents[agentId].successes++;
    // Decay failures on success
    this.agents[agentId].failures = Math.max(0, this.agents[agentId].failures - 0.5);
    this.agents[agentId].lastUpdate = Date.now();
    this._updateLevel(agentId);
  }

  _updateLevel(agentId) {
    const state = this.agents[agentId];
    if (state.failures >= this.thresholds.kill) {
      state.level = LEVELS.KILL;
    } else if (state.failures >= this.thresholds.quarantine) {
      state.level = LEVELS.QUARANTINE;
    } else if (state.failures >= this.thresholds.throttle) {
      state.level = LEVELS.THROTTLE;
    } else {
      state.level = LEVELS.NORMAL;
    }
  }

  getAction(agentId) {
    this._ensure(agentId);
    return this.agents[agentId].level;
  }

  getStatus(agentId) {
    this._ensure(agentId);
    return { ...this.agents[agentId] };
  }

  getAllStatuses() {
    return { ...this.agents };
  }

  reset(agentId) {
    if (agentId) {
      delete this.agents[agentId];
    } else {
      this.agents = {};
    }
  }
}

module.exports = CircuitBreaker;
