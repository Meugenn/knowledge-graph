const HallucinationChecker = require('./hallucination-checker');
const DriftDetector = require('./drift-detector');
const CircuitBreaker = require('./circuit-breaker');

class TRiSM {
  constructor(opts = {}) {
    this.kg = opts.kg;
    this.hallucination = new HallucinationChecker(opts);
    this.drift = new DriftDetector();
    this.circuitBreaker = new CircuitBreaker();
  }

  async evaluateResponse(agentId, content, context = {}) {
    const hallucinationResult = this.hallucination.check(content, context);
    const driftResult = this.drift.check(agentId, content);
    const breakerStatus = this.circuitBreaker.getStatus(agentId);

    // Escalate based on combined signals
    const score = (hallucinationResult.score + driftResult.score) / 2;

    if (score < 0.3) {
      this.circuitBreaker.recordFailure(agentId);
    } else {
      this.circuitBreaker.recordSuccess(agentId);
    }

    const action = this.circuitBreaker.getAction(agentId);

    return {
      agentId,
      hallucinationScore: hallucinationResult.score,
      driftScore: driftResult.score,
      combinedScore: score,
      action,
      details: {
        hallucination: hallucinationResult,
        drift: driftResult,
        circuitBreaker: breakerStatus,
      },
    };
  }

  getStatus() {
    return {
      agents: this.circuitBreaker.getAllStatuses(),
      driftHistory: this.drift.getHistory(),
    };
  }

  healthCheck() {
    return { status: 'ok' };
  }
}

module.exports = TRiSM;
