const EventEmitter = require('events');

class SwarmEngine extends EventEmitter {
  constructor({ kg, agentGateway, dataOracle, forensics, paper2agent }) {
    super();
    this.kg = kg;
    this.agents = agentGateway;
    this.oracle = dataOracle;
    this.forensics = forensics;
    this.paper2agent = paper2agent;

    this.running = false;
    this.iteration = 0;
    this.stats = { papersAnalysed: 0, papersDiscovered: 0, triplesExtracted: 0, hypotheses: [], errors: 0 };
    this.queue = [];
    this.analysed = new Set();
    this.log = [];
  }

  async start() {
    if (this.running) return;
    this.running = true;
    this.emit('started');
    this._log('Swarm started');

    // Seed queue from KG
    const papers = this.kg.getAllPapers();
    this.queue = papers.filter(p => !this.analysed.has(p.id)).map(p => p.id);
    this._log(`Queue seeded with ${this.queue.length} papers from KG`);

    while (this.running && this.queue.length > 0) {
      this.iteration++;
      const paperId = this.queue.shift();
      if (this.analysed.has(paperId)) continue;

      try {
        await this._processIteration(paperId);
      } catch (err) {
        this.stats.errors++;
        this._log(`Error on ${paperId}: ${err.message}`);
      }

      // Cooldown between iterations
      if (this.running) await this._sleep(3000);
    }

    if (this.queue.length === 0) {
      this._log('Queue empty — swarm pausing');
    }
    this.running = false;
    this.emit('stopped', this.stats);
  }

  stop() {
    this.running = false;
    this._log('Swarm stopping...');
  }

  async _processIteration(paperId) {
    const paper = this.kg.getPaper(paperId);
    if (!paper) return;
    this.analysed.add(paperId);

    this._log(`[Iteration ${this.iteration}] Analysing: ${paper.title}`);
    this.emit('iteration_start', { iteration: this.iteration, paper });

    // Phase 1: Run agent swarm on this paper
    const analyses = {};
    const agentList = this.agents.getAgents();

    for (const agent of agentList) {
      try {
        const task = this._buildTask(paper, agent);
        const result = await this.agents.chat(agent.id, task);
        analyses[agent.id] = result;
        this._log(`  ${agent.name}: ${result.tokensUsed} tokens`);
        this.emit('agent_done', { agent: agent.name, paperId, tokensUsed: result.tokensUsed });
      } catch (err) {
        this._log(`  ${agent.name}: ERROR - ${err.message}`);
      }
    }
    this.stats.papersAnalysed++;

    // Phase 2: Extract hypotheses from agent outputs
    const hypotheses = this._extractHypotheses(analyses, paper);
    this.stats.hypotheses.push(...hypotheses);
    if (hypotheses.length > 0) {
      this._log(`  Hypotheses extracted: ${hypotheses.length}`);
      this.emit('hypotheses', { paperId, hypotheses });
    }

    // Phase 3: Extract KG triples from Iris's analysis
    const triples = this._extractTriples(analyses, paper);
    for (const triple of triples) {
      this.kg.addRelation(triple.source, triple.target, triple.type);
    }
    this.stats.triplesExtracted += triples.length;
    if (triples.length > 0) {
      this._log(`  Triples added to KG: ${triples.length}`);
    }

    // Phase 4: Run forensics
    const forensicsResult = this.forensics.scorePaper(paperId, paper.abstract || '');
    this._log(`  Forensics: score=${forensicsResult.syntheticEthosScore} verdict=${forensicsResult.verdict}`);
    this.emit('forensics', { paperId, result: forensicsResult });

    // Phase 5: Discover new papers from agent insights
    const newPapers = await this._discoverPapers(analyses, paper);
    let added = 0;
    for (const np of newPapers) {
      if (!this.kg.getPaper(np.id) && !this.analysed.has(np.id)) {
        this.kg.addPaper(np);
        this.queue.push(np.id);
        added++;
        this.stats.papersDiscovered++;
      }
    }
    if (added > 0) {
      this._log(`  Discovered ${added} new papers, queue now ${this.queue.length}`);
    }

    this.emit('iteration_done', {
      iteration: this.iteration,
      paperId,
      analyses: Object.keys(analyses).length,
      hypotheses: hypotheses.length,
      triples: triples.length,
      newPapers: added,
      stats: { ...this.stats },
    });
  }

  _buildTask(paper, agent) {
    const base = `Analyse this paper thoroughly from your perspective as ${agent.role} (${agent.caste} caste).

Title: ${paper.title}
Authors: ${(paper.authors || []).join(', ')}
Year: ${paper.year}
Abstract: ${paper.abstract || 'N/A'}
Fields: ${(paper.fieldsOfStudy || []).join(', ')}
Citations: ${paper.citationCount || 'Unknown'}`;

    // Agent-specific instructions
    if (agent.id === 'iris') {
      return base + `\n\nIdentify: (1) key claims that can be tested, (2) papers this builds on, (3) papers that should cite this but don't. Format claims as testable hypotheses prefixed with "HYPOTHESIS:".`;
    }
    if (agent.id === 'atlas') {
      return base + `\n\nAssess: (1) experimental design quality, (2) what's needed to replicate, (3) methodological gaps. Suggest specific experiments to validate claims, prefixed with "EXPERIMENT:".`;
    }
    if (agent.id === 'tensor') {
      return base + `\n\nEstimate: (1) compute requirements for replication, (2) data requirements, (3) expected variance in results. Flag any claims that seem computationally implausible.`;
    }
    if (agent.id === 'sage') {
      return base + `\n\nCritique: (1) statistical rigour, (2) potential confounds, (3) claims that lack sufficient evidence. Rate overall reproducibility 1-10. Identify the weakest claim.`;
    }
    if (agent.id === 'hermes') {
      return base + `\n\nCross-reference: (1) verify citation counts and metadata, (2) identify related work not cited, (3) suggest search queries to find papers that extend or contradict this work. Format queries prefixed with "QUERY:".`;
    }
    return base;
  }

  _extractHypotheses(analyses, paper) {
    const hypotheses = [];
    for (const [agentId, result] of Object.entries(analyses)) {
      if (!result.content) continue;
      const lines = result.content.split('\n');
      for (const line of lines) {
        const match = line.match(/(?:HYPOTHESIS|EXPERIMENT|CLAIM):\s*(.+)/i);
        if (match) {
          hypotheses.push({
            text: match[1].trim(),
            source: agentId,
            paperId: paper.id,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
    return hypotheses;
  }

  _extractTriples(analyses, paper) {
    const triples = [];
    const irisResult = analyses.iris;
    if (!irisResult?.content) return triples;

    // Extract "builds on" relationships
    const buildPatterns = [
      /builds?\s+(?:up)?on\s+["']?([^"'\n,]+)/gi,
      /extends?\s+["']?([^"'\n,]+)/gi,
      /based\s+on\s+["']?([^"'\n,]+)/gi,
    ];

    for (const pattern of buildPatterns) {
      let match;
      while ((match = pattern.exec(irisResult.content)) !== null) {
        const target = match[1].trim().replace(/[."']+$/, '');
        if (target.length > 5 && target.length < 100) {
          triples.push({ source: paper.id, target: target.toLowerCase().replace(/\s+/g, '_'), type: 'builds_on' });
        }
      }
    }

    // Extract "contradicts" or "challenges"
    const contradictPatterns = [
      /contradicts?\s+["']?([^"'\n,]+)/gi,
      /challenges?\s+["']?([^"'\n,]+)/gi,
    ];
    for (const pattern of contradictPatterns) {
      let match;
      while ((match = pattern.exec(irisResult.content)) !== null) {
        const target = match[1].trim().replace(/[."']+$/, '');
        if (target.length > 5 && target.length < 100) {
          triples.push({ source: paper.id, target: target.toLowerCase().replace(/\s+/g, '_'), type: 'challenges' });
        }
      }
    }

    return triples;
  }

  async _discoverPapers(analyses, paper) {
    const queries = [];

    // Extract QUERY: lines from Hermes
    const hermes = analyses.hermes;
    if (hermes?.content) {
      const lines = hermes.content.split('\n');
      for (const line of lines) {
        const match = line.match(/QUERY:\s*(.+)/i);
        if (match) queries.push(match[1].trim());
      }
    }

    // Fallback: search by paper title keywords
    if (queries.length === 0) {
      const keywords = paper.title.split(/\s+/).filter(w => w.length > 4).slice(0, 3).join(' ');
      queries.push(keywords);
    }

    const discovered = [];
    for (const query of queries.slice(0, 3)) {
      try {
        const results = await this.oracle.search(query, ['semanticScholar']);
        for (const r of results.slice(0, 3)) {
          if (r.paperId || r.title) {
            discovered.push({
              id: r.paperId || `disc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              title: r.title,
              authors: (r.authors || []).map(a => a.name || a),
              year: r.year,
              abstract: r.abstract || r.tldr,
              citationCount: r.citationCount,
              fieldsOfStudy: r.fieldsOfStudy || [],
              source: 'discovered',
            });
          }
        }
      } catch (err) {
        this._log(`  Discovery query failed: ${err.message}`);
      }
    }

    return discovered;
  }

  _log(msg) {
    const entry = { timestamp: new Date().toISOString(), message: msg };
    this.log.push(entry);
    if (this.log.length > 500) this.log = this.log.slice(-500);
    this.emit('log', entry);
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStatus() {
    return {
      running: this.running,
      iteration: this.iteration,
      queueLength: this.queue.length,
      analysedCount: this.analysed.size,
      stats: this.stats,
      recentLog: this.log.slice(-20),
    };
  }
}

module.exports = SwarmEngine;
