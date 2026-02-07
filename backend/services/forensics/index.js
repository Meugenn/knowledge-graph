const DeonticScorer = require('./deontic-scorer');
const TraceabilityScorer = require('./traceability-scorer');

class Forensics {
  constructor(opts = {}) {
    this.kg = opts.kg;
    this.deontic = new DeonticScorer();
    this.traceability = new TraceabilityScorer(opts);
  }

  scorePaper(paperId, fullText = '') {
    const deonticScore = this.deontic.score(fullText);
    const traceabilityScore = this.traceability.score(paperId, fullText);

    // Synthetic ethos score: blend of linguistic markers and traceability
    const syntheticEthosScore = Math.round(
      (deonticScore.ratio * 0.3 + traceabilityScore.completeness * 0.4 + traceabilityScore.causalDensity * 0.3) * 100
    );

    return {
      paperId,
      syntheticEthosScore,
      deontic: deonticScore,
      traceability: traceabilityScore,
      verdict: syntheticEthosScore >= 70 ? 'credible' : syntheticEthosScore >= 40 ? 'uncertain' : 'suspicious',
    };
  }

  healthCheck() {
    return { status: 'ok' };
  }
}

module.exports = Forensics;
