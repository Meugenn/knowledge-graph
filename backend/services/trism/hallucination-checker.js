class HallucinationChecker {
  constructor(opts = {}) {
    this.kg = opts.kg;
  }

  check(content, context = {}) {
    if (!content) return { score: 1, entities: [], flags: [] };

    const flags = [];
    const entities = this._extractEntities(content);

    // Cross-reference entities against KG
    let verified = 0;
    let unverified = 0;

    if (this.kg) {
      for (const entity of entities) {
        const found = this.kg.searchPapers(entity);
        if (found.length > 0) {
          verified++;
        } else {
          unverified++;
          flags.push({ entity, type: 'unverified', message: `Entity "${entity}" not found in knowledge graph` });
        }
      }
    }

    // Check for suspiciously specific claims
    const specificNumbers = content.match(/\d+\.\d{3,}/g) || [];
    if (specificNumbers.length > 5) {
      flags.push({ type: 'suspicious_precision', message: 'Unusually many high-precision numbers' });
    }

    // Check for self-referential claims
    if (/as I mentioned|I previously stated|in my earlier/i.test(content)) {
      flags.push({ type: 'self_reference', message: 'Agent references non-existent prior statements' });
    }

    const total = verified + unverified;
    const score = total === 0 ? 0.8 : verified / total;

    return { score, entities, verified, unverified, flags };
  }

  _extractEntities(text) {
    const entities = [];

    // Extract paper-like references (Author Year)
    const refPattern = /\b([A-Z][a-z]+(?:\s+et\s+al\.)?)\s*\(?(\d{4})\)?/g;
    let m;
    while ((m = refPattern.exec(text)) !== null) {
      entities.push(m[1].trim());
    }

    // Extract capitalised multi-word names (likely paper/model names)
    const namePattern = /\b([A-Z][a-zA-Z]+-?[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;
    while ((m = namePattern.exec(text)) !== null) {
      entities.push(m[1]);
    }

    return [...new Set(entities)].slice(0, 20);
  }
}

module.exports = HallucinationChecker;
