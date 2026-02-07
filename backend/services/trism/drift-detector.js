class DriftDetector {
  constructor() {
    this.history = {};
  }

  check(agentId, content) {
    if (!this.history[agentId]) {
      this.history[agentId] = [];
    }

    const tokens = this._tokenise(content);
    const currentSet = new Set(tokens);

    let driftScore = 1.0; // 1 = no drift

    if (this.history[agentId].length > 0) {
      // Rolling Jaccard similarity with last 3 responses
      const recentSets = this.history[agentId].slice(-3);
      const similarities = recentSets.map(prev => this._jaccard(currentSet, prev));
      const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

      // Low similarity = high drift (potentially problematic)
      // Very high similarity = repetition (also problematic)
      if (avgSimilarity < 0.1) driftScore = 0.3;
      else if (avgSimilarity > 0.9) driftScore = 0.4;
      else driftScore = 0.5 + avgSimilarity * 0.5;
    }

    this.history[agentId].push(currentSet);
    if (this.history[agentId].length > 10) {
      this.history[agentId] = this.history[agentId].slice(-10);
    }

    return { score: driftScore, tokenCount: tokens.length };
  }

  _tokenise(text) {
    return text.toLowerCase().split(/\W+/).filter(t => t.length > 2);
  }

  _jaccard(setA, setB) {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  getHistory() {
    return Object.fromEntries(
      Object.entries(this.history).map(([id, sets]) => [id, sets.length])
    );
  }
}

module.exports = DriftDetector;
