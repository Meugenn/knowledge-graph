class TraceabilityScorer {
  constructor(opts = {}) {
    this.kg = opts.kg;
  }

  score(paperId, fullText = '') {
    let completeness = 0.5;
    let causalDensity = 0.5;

    if (this.kg) {
      const density = this.kg.getCausalDensity(paperId);
      // Normalise: 10+ citations = full score
      causalDensity = Math.min(1, density.density / 10);

      // Check citation completeness: do referenced papers exist in KG?
      const neighbourhood = this.kg.getNeighbourhood(paperId, 1);
      const referencedCount = neighbourhood.edges.length;
      const existingCount = neighbourhood.nodes.length - 1; // exclude self
      completeness = referencedCount > 0 ? existingCount / referencedCount : 0.5;
    }

    // Text-based signals
    let hasMethodSection = false;
    let hasDataSection = false;
    let hasCodeLink = false;

    if (fullText) {
      const lower = fullText.toLowerCase();
      hasMethodSection = /\b(method|methodology|approach|algorithm)\b/.test(lower);
      hasDataSection = /\b(dataset|data\s+collection|benchmark|evaluation)\b/.test(lower);
      hasCodeLink = /\b(github|gitlab|bitbucket|code\s+available|repository)\b/.test(lower);
    }

    const textScore = [hasMethodSection, hasDataSection, hasCodeLink].filter(Boolean).length / 3;
    completeness = (completeness * 0.6) + (textScore * 0.4);

    return {
      completeness: Math.min(1, completeness),
      causalDensity: Math.min(1, causalDensity),
      hasMethodSection,
      hasDataSection,
      hasCodeLink,
    };
  }
}

module.exports = TraceabilityScorer;
