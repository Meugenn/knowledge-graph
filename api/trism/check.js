// Vercel serverless function — TRiSM check (pure computation)

function checkHallucination(content, context = {}) {
  if (!content) return { score: 1, entities: [], flags: [] };

  const flags = [];

  // Extract paper-like references
  const entities = [];
  const refPattern = /\b([A-Z][a-z]+(?:\s+et\s+al\.)?)\s*\(?(\d{4})\)?/g;
  let m;
  while ((m = refPattern.exec(content)) !== null) entities.push(m[1].trim());

  const namePattern = /\b([A-Z][a-zA-Z]+-?[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;
  while ((m = namePattern.exec(content)) !== null) entities.push(m[1]);

  const uniqueEntities = [...new Set(entities)].slice(0, 20);

  // Check for suspiciously specific claims
  const specificNumbers = content.match(/\d+\.\d{3,}/g) || [];
  if (specificNumbers.length > 5) {
    flags.push({ type: 'suspicious_precision', message: 'Unusually many high-precision numbers' });
  }

  // Check for self-referential claims
  if (/as I mentioned|I previously stated|in my earlier/i.test(content)) {
    flags.push({ type: 'self_reference', message: 'Agent references non-existent prior statements' });
  }

  const score = flags.length === 0 ? 0.8 : Math.max(0.2, 0.8 - flags.length * 0.2);
  return { score, entities: uniqueEntities, flags };
}

function checkDrift(content) {
  const tokens = content.toLowerCase().split(/\W+/).filter(t => t.length > 2);
  return { score: 0.8, tokenCount: tokens.length };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { agentId, response: content, context } = req.body;
  if (!agentId || !content) {
    return res.status(400).json({ error: 'agentId and response are required' });
  }

  const hallucinationResult = checkHallucination(content, context || {});
  const driftResult = checkDrift(content);
  const combinedScore = (hallucinationResult.score + driftResult.score) / 2;

  return res.status(200).json({
    agentId,
    hallucinationScore: hallucinationResult.score,
    driftScore: driftResult.score,
    combinedScore,
    action: combinedScore < 0.3 ? 'throttle' : 'normal',
    details: {
      hallucination: hallucinationResult,
      drift: driftResult,
    },
  });
}
