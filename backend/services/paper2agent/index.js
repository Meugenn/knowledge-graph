class Paper2Agent {
  constructor(opts = {}) {
    this.kg = opts.kg;
    this.agentGateway = opts.agentGateway;
    this.forensics = opts.forensics;
  }

  async processPaper(paperId, fullText = '') {
    const paper = this.kg ? this.kg.getPaper(paperId) : null;
    const stages = [];

    // Stage 1: Forensics analysis
    let forensicsResult = null;
    if (this.forensics) {
      forensicsResult = this.forensics.scorePaper(paperId, fullText);
      stages.push({ stage: 'forensics', status: 'completed', result: forensicsResult });
    }

    // Stage 2: Extract triples via LLM
    let triples = [];
    if (this.agentGateway) {
      try {
        const task = `Analyse this paper and extract knowledge graph triples:\n\nTitle: ${paper?.title || paperId}\nAbstract: ${paper?.abstract || ''}\n\n${fullText ? `Full text excerpt: ${fullText.substring(0, 2000)}` : ''}`;
        const response = await this.agentGateway.chat('iris', task);
        stages.push({ stage: 'extraction', status: 'completed', agentResponse: response.content?.substring(0, 500) });

        // Parse triples from response (best-effort)
        const tripleMatch = response.content?.match(/\(([^)]+)\)/g) || [];
        triples = tripleMatch.map(t => {
          const parts = t.replace(/[()]/g, '').split(',').map(s => s.trim());
          return { subject: parts[0], predicate: parts[1], object: parts[2] };
        }).filter(t => t.subject && t.predicate && t.object);
      } catch (err) {
        stages.push({ stage: 'extraction', status: 'error', error: err.message });
      }
    }

    // Stage 3: Write triples to KG
    if (this.kg && triples.length > 0) {
      for (const triple of triples) {
        this.kg.addRelation(triple.subject, triple.object, triple.predicate);
      }
      stages.push({ stage: 'kg_update', status: 'completed', triplesAdded: triples.length });
    }

    return {
      paperId,
      paper: paper ? { title: paper.title, year: paper.year } : null,
      forensics: forensicsResult,
      triples,
      stages,
    };
  }

  healthCheck() {
    return { status: 'ok' };
  }
}

module.exports = Paper2Agent;
