const DEONTIC_MARKERS = [
  'should', 'must', 'ought to', 'we recommend', 'it is necessary',
  'requires', 'shall', 'need to', 'have to', 'is essential',
];

const HEDGE_MARKERS = [
  'may', 'might', 'could', 'appears to', 'suggests', 'seems',
  'possibly', 'arguably', 'likely', 'probably', 'approximately',
  'to some extent', 'in part', 'it is possible', 'one might argue',
];

class DeonticScorer {
  score(text) {
    if (!text || text.length === 0) {
      return { deonticCount: 0, hedgeCount: 0, ratio: 0.5, markers: { deontic: [], hedge: [] } };
    }

    const lower = text.toLowerCase();
    const foundDeontic = [];
    const foundHedge = [];

    for (const marker of DEONTIC_MARKERS) {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) foundDeontic.push({ marker, count: matches.length });
    }

    for (const marker of HEDGE_MARKERS) {
      const regex = new RegExp(`\\b${marker}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) foundHedge.push({ marker, count: matches.length });
    }

    const deonticCount = foundDeontic.reduce((s, m) => s + m.count, 0);
    const hedgeCount = foundHedge.reduce((s, m) => s + m.count, 0);
    const total = deonticCount + hedgeCount;

    // Higher ratio = more hedging (good for scientific writing)
    const ratio = total === 0 ? 0.5 : hedgeCount / total;

    return {
      deonticCount,
      hedgeCount,
      ratio,
      markers: { deontic: foundDeontic, hedge: foundHedge },
    };
  }
}

module.exports = DeonticScorer;
