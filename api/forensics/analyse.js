// Vercel serverless function — Forensics analysis (pure computation, no state)

const DEONTIC_MARKERS = [
  'should', 'must', 'ought to', 'we recommend', 'it is necessary',
  'requires', 'shall', 'need to', 'have to', 'is essential',
];

const HEDGE_MARKERS = [
  'may', 'might', 'could', 'appears to', 'suggests', 'seems',
  'possibly', 'arguably', 'likely', 'probably', 'approximately',
  'to some extent', 'in part', 'it is possible', 'one might argue',
];

function scoreDeontic(text) {
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

  const ratio = total === 0 ? 0.5 : hedgeCount / total;

  return { deonticCount, hedgeCount, ratio, markers: { deontic: foundDeontic, hedge: foundHedge } };
}

function scoreTraceability(fullText) {
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
  const completeness = Math.min(1, textScore);
  const causalDensity = 0.5; // No KG context in serverless

  return { completeness, causalDensity, hasMethodSection, hasDataSection, hasCodeLink };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paperId, fullText } = req.body;
    if (!paperId) return res.status(400).json({ error: 'paperId is required' });

    const deonticScore = scoreDeontic(fullText || '');
    const traceabilityScore = scoreTraceability(fullText || '');

    const syntheticEthosScore = Math.round(
      (deonticScore.ratio * 0.3 + traceabilityScore.completeness * 0.4 + traceabilityScore.causalDensity * 0.3) * 100
    );

    return res.status(200).json({
      paperId,
      syntheticEthosScore,
      deontic: deonticScore,
      traceability: traceabilityScore,
      verdict: syntheticEthosScore >= 70 ? 'credible' : syntheticEthosScore >= 40 ? 'uncertain' : 'suspicious',
    });
  } catch (err) {
    console.error('[forensics/analyse] Error:', err.message);
    return res.status(500).json({ error: 'Forensics analysis failed' });
  }
}
