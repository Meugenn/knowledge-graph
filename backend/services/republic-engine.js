const EventEmitter = require('events');

/**
 * The Republic Engine
 *
 * Not a pipeline. Not a scheduler. A civilisation.
 *
 * Philosopher Kings reason over the knowledge graph.
 * Warriors patrol for fraud and inconsistency.
 * Artisans price truth through prediction markets.
 *
 * Each agent acts because it is their nature — not because
 * a human pressed a button.
 */
class RepublicEngine extends EventEmitter {
  constructor({ kg, agentGateway, dataOracle, forensics, trism, wss }) {
    super();
    this.kg = kg;
    this.agents = agentGateway;
    this.oracle = dataOracle;
    this.forensics = forensics;
    this.trism = trism;
    this.wss = wss;

    this.alive = false;
    this.epoch = 0;
    this.heartbeat = null;

    // The Republic's vital signs
    this.vitals = {
      born: null,
      epoch: 0,
      papersAnalysed: 0,
      papersDiscovered: 0,
      hypothesesGenerated: 0,
      triplesExtracted: 0,
      marketsCreated: 0,
      marketTrades: 0,
      forensicsScans: 0,
      trismInterventions: 0,
      agentActions: 0,
    };

    // Knowledge accumulation
    this.hypotheses = [];
    this.judgements = [];
    this.alerts = [];
    this.marketActivity = [];

    // Agent work queues — each caste has its own
    this.queues = {
      philosophers: [],  // Papers to reason about
      warriors: [],      // Papers to investigate
      artisans: [],      // Markets to price
    };

    // Papers the republic has examined
    this.examined = new Set();

    // Prediction markets (in-memory for demo)
    this.markets = new Map();

    this.log = [];
  }

  // ─── BIRTH ────────────────────────────────────────────────────────

  async awaken() {
    if (this.alive) return;
    this.alive = true;
    this.vitals.born = new Date().toISOString();
    this._broadcast('republic_awakened', { message: 'The Republic stirs to life.' });
    this._log('The Republic awakens.');

    // Seed the queues from the knowledge graph
    const papers = this.kg.getAllPapers();
    for (const p of papers) {
      this.queues.philosophers.push(p.id);
      this.queues.warriors.push(p.id);
      this.queues.artisans.push(p.id);
    }
    this._log(`${papers.length} papers queued across all castes.`);

    // Start the autonomous loops
    this._runPhilosophers();
    this._runWarriors();
    this._runArtisans();

    // Heartbeat — broadcast vitals every 5 seconds
    this.heartbeat = setInterval(() => {
      this._broadcast('republic_heartbeat', {
        epoch: this.epoch,
        vitals: this.vitals,
        queues: {
          philosophers: this.queues.philosophers.length,
          warriors: this.queues.warriors.length,
          artisans: this.queues.artisans.length,
        },
        kgSize: this.kg.getStats(),
        marketsActive: this.markets.size,
        recentHypotheses: this.hypotheses.slice(-3),
        recentAlerts: this.alerts.slice(-3),
      });
    }, 5000);
  }

  sleep() {
    this.alive = false;
    if (this.heartbeat) clearInterval(this.heartbeat);
    this._log('The Republic rests.');
    this._broadcast('republic_sleeping', { vitals: this.vitals });
  }

  // ─── PHILOSOPHER KINGS ────────────────────────────────────────────
  // They read. They reason. They judge.

  async _runPhilosophers() {
    while (this.alive) {
      const paperId = this.queues.philosophers.shift();
      if (!paperId) {
        await this._sleep(10000); // Wait for new work
        continue;
      }

      if (this.examined.has(`phil:${paperId}`)) {
        continue;
      }

      const paper = this.kg.getPaper(paperId);
      if (!paper) continue;
      this.examined.add(`phil:${paperId}`);
      this.epoch++;
      this.vitals.epoch = this.epoch;

      this._log(`[Philosopher] Dr. Iris contemplates: "${paper.title}"`);
      this._broadcast('philosopher_reading', { paperId, title: paper.title, epoch: this.epoch });

      try {
        // Dr. Iris — deep literature analysis with GraphRAG
        const neighbourhood = this.kg.getNeighbourhood(paperId, 2);
        const context = neighbourhood.nodes.map(n => `- ${n.title} (${n.year})`).join('\n');

        const irisResult = await this.agents.chat('iris', `You are traversing the Knowledge Graph of The Republic. This paper exists within a citation network.

PAPER: "${paper.title}" by ${(paper.authors || []).join(', ')} (${paper.year})
Abstract: ${paper.abstract || 'N/A'}
Citations: ${paper.citationCount || 0}

NEARBY IN THE GRAPH (${neighbourhood.nodes.length} connected papers):
${context}

As a Philosopher King of The Republic, render your judgement:
1. What are the 3 most important testable claims? Format each as "HYPOTHESIS: <claim>"
2. What papers should exist but don't? What gaps does this reveal?
3. Rate the paper's contribution to human knowledge (1-10) and explain why.
4. What would Plato say about this work's pursuit of truth?

Be precise. Be honest. Favour evidence over authority.`);

        this.vitals.agentActions++;
        this.vitals.papersAnalysed++;

        // Extract hypotheses
        const hypotheses = this._extractTagged(irisResult.content, 'HYPOTHESIS');
        for (const h of hypotheses) {
          this.hypotheses.push({
            text: h,
            source: 'iris',
            paperId,
            paperTitle: paper.title,
            epoch: this.epoch,
            timestamp: new Date().toISOString(),
          });
          this.vitals.hypothesesGenerated++;
        }

        // Dr. Sage — critical review
        const sageResult = await this.agents.chat('sage', `As a Guardian of epistemic integrity in The Republic, critically review this paper.

PAPER: "${paper.title}" (${paper.year})
Abstract: ${paper.abstract || 'N/A'}

Dr. Iris's analysis identified these hypotheses:
${hypotheses.map((h, i) => `${i + 1}. ${h}`).join('\n')}

Your duty:
1. Rate reproducibility (1-10). Explain.
2. Identify the WEAKEST claim. Why is it weak?
3. What statistical or methodological concerns exist?
4. Would you stake RESEARCH tokens on this paper's core claims? YES/NO and why.
5. Issue a JUDGEMENT: "JUDGEMENT: CREDIBLE|UNCERTAIN|SUSPICIOUS — <reason>"

Be ruthless. Truth requires it.`);

        this.vitals.agentActions++;

        const judgements = this._extractTagged(sageResult.content, 'JUDGEMENT');
        for (const j of judgements) {
          this.judgements.push({
            text: j,
            paperId,
            paperTitle: paper.title,
            epoch: this.epoch,
            timestamp: new Date().toISOString(),
          });
        }

        this._broadcast('philosopher_judged', {
          paperId,
          title: paper.title,
          hypotheses,
          judgements,
          irisTokens: irisResult.tokensUsed,
          sageTokens: sageResult.tokensUsed,
          epoch: this.epoch,
        });

        this._log(`[Philosopher] Judgement rendered on "${paper.title}": ${hypotheses.length} hypotheses, ${judgements.length} judgements`);

        // Discover new papers — feed them to all queues
        await this._discover(paper, irisResult.content);

      } catch (err) {
        this._log(`[Philosopher] Error on "${paper.title}": ${err.message}`);
        this.vitals.errors = (this.vitals.errors || 0) + 1;
      }

      await this._sleep(2000); // Breathing room between analyses
    }
  }

  // ─── WARRIORS ─────────────────────────────────────────────────────
  // They patrol. They investigate. They defend.

  async _runWarriors() {
    await this._sleep(5000); // Let philosophers start first

    while (this.alive) {
      const paperId = this.queues.warriors.shift();
      if (!paperId) {
        // When queue is empty, patrol for citation rings
        await this._patrol();
        await this._sleep(15000);
        continue;
      }

      if (this.examined.has(`war:${paperId}`)) continue;
      const paper = this.kg.getPaper(paperId);
      if (!paper) continue;
      this.examined.add(`war:${paperId}`);

      this._log(`[Warrior] Prof. Atlas investigates: "${paper.title}"`);
      this._broadcast('warrior_investigating', { paperId, title: paper.title });

      try {
        // Forensics scan
        const forensicsResult = this.forensics.scorePaper(paperId, paper.abstract || '');
        this.vitals.forensicsScans++;

        this._broadcast('warrior_forensics', {
          paperId,
          title: paper.title,
          syntheticEthosScore: forensicsResult.syntheticEthosScore,
          verdict: forensicsResult.verdict,
          deontic: forensicsResult.deontic,
        });

        // If suspicious, escalate with full agent analysis
        if (forensicsResult.verdict === 'suspicious' || forensicsResult.syntheticEthosScore < 30) {
          this._log(`[Warrior] ALERT: "${paper.title}" flagged as ${forensicsResult.verdict} (score: ${forensicsResult.syntheticEthosScore})`);

          const atlasResult = await this.agents.chat('atlas', `SECURITY ALERT — A paper has been flagged by The Republic's forensics system.

PAPER: "${paper.title}" (${paper.year})
Abstract: ${paper.abstract || 'N/A'}
Synthetic Ethos Score: ${forensicsResult.syntheticEthosScore}/100
Forensics Verdict: ${forensicsResult.verdict}
Deontic markers: ${forensicsResult.deontic.deonticCount} | Hedge markers: ${forensicsResult.deontic.hedgeCount}

As Chief Architect and Warrior of The Republic:
1. Assess whether this paper shows signs of fabrication or AI generation
2. Check if the methodology described is internally consistent
3. Identify any claims that contradict known results in the graph
4. Issue: "ALERT: <severity HIGH|MEDIUM|LOW> — <finding>"

Defend the Republic's integrity.`);

          this.vitals.agentActions++;

          const alerts = this._extractTagged(atlasResult.content, 'ALERT');
          for (const a of alerts) {
            this.alerts.push({
              text: a,
              paperId,
              paperTitle: paper.title,
              forensicsScore: forensicsResult.syntheticEthosScore,
              epoch: this.epoch,
              timestamp: new Date().toISOString(),
            });
          }

          this._broadcast('warrior_alert', {
            paperId,
            title: paper.title,
            alerts,
            forensicsScore: forensicsResult.syntheticEthosScore,
          });
        } else {
          this._log(`[Warrior] "${paper.title}" cleared (score: ${forensicsResult.syntheticEthosScore})`);
        }

      } catch (err) {
        this._log(`[Warrior] Error on "${paper.title}": ${err.message}`);
      }

      await this._sleep(3000);
    }
  }

  async _patrol() {
    // Check for citation rings — signs of collusion
    const rings = this.kg.detectCitationRings(3);
    if (rings.length > 0) {
      this._log(`[Warrior] PATROL: Detected ${rings.length} potential citation rings`);
      this._broadcast('warrior_patrol', { citationRings: rings.length });
    }

    // Check causal density anomalies — papers with too many or too few connections
    const papers = this.kg.getAllPapers();
    for (const p of papers.slice(0, 5)) {
      const density = this.kg.getCausalDensity(p.id);
      if (density.density === 0 && p.citationCount > 1000) {
        this._log(`[Warrior] ANOMALY: "${p.title}" has ${p.citationCount} citations but 0 graph connections`);
      }
    }
  }

  // ─── ARTISANS ─────────────────────────────────────────────────────
  // They price. They trade. They reveal truth through markets.

  async _runArtisans() {
    await this._sleep(8000); // Let others populate data first

    while (this.alive) {
      const paperId = this.queues.artisans.shift();
      if (!paperId) {
        await this._sleep(12000);
        continue;
      }

      if (this.examined.has(`art:${paperId}`)) continue;
      const paper = this.kg.getPaper(paperId);
      if (!paper) continue;
      this.examined.add(`art:${paperId}`);

      this._log(`[Artisan] Agent Tensor prices: "${paper.title}"`);
      this._broadcast('artisan_pricing', { paperId, title: paper.title });

      try {
        // Agent Tensor — computational feasibility and market pricing
        const tensorResult = await this.agents.chat('tensor', `You are an Artisan of The Republic — a computational realist who prices truth.

PAPER: "${paper.title}" (${paper.year})
Abstract: ${paper.abstract || 'N/A'}
Citations: ${paper.citationCount || 0}

Your duties:
1. Estimate replication cost in GPU-hours and dollars
2. Estimate probability of successful replication (0-100%)
3. Identify the biggest computational risk
4. Create a market: "MARKET: <question> | PROBABILITY: <0-100>"

Price truth accurately. The Republic's treasury depends on it.`);

        this.vitals.agentActions++;

        // Extract market proposals
        const marketLines = this._extractTagged(tensorResult.content, 'MARKET');
        const probLines = this._extractTagged(tensorResult.content, 'PROBABILITY');

        for (let i = 0; i < marketLines.length; i++) {
          const question = marketLines[i];
          const prob = parseInt(probLines[i]) || 50;

          const market = {
            id: `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
            paperId,
            paperTitle: paper.title,
            question,
            yesPrice: prob / 100,
            noPrice: 1 - prob / 100,
            createdBy: 'tensor',
            createdAt: new Date().toISOString(),
            trades: [],
            epoch: this.epoch,
          };

          this.markets.set(market.id, market);
          this.vitals.marketsCreated++;

          this._broadcast('artisan_market_created', { market });
          this._log(`[Artisan] Market created: "${question}" @ ${prob}%`);
        }

        // Hermes — cross-reference and data verification
        const hermesResult = await this.agents.chat('hermes', `You are Hermes, Data Oracle of The Republic. Verify this paper's claims against external sources.

PAPER: "${paper.title}" (${paper.year})
Abstract: ${paper.abstract || 'N/A'}

Cross-reference:
1. Are the claimed citation counts accurate?
2. Does the abstract's language match established norms for this field?
3. Suggest 3 search queries to find papers that CONTRADICT this work. Format: "QUERY: <search terms>"
4. Rate data integrity (1-10)

Trust nothing. Verify everything.`);

        this.vitals.agentActions++;

        // Use Hermes's queries to discover new papers
        const queries = this._extractTagged(hermesResult.content, 'QUERY');
        for (const q of queries.slice(0, 2)) {
          await this._discoverFromQuery(q);
        }

      } catch (err) {
        this._log(`[Artisan] Error on "${paper.title}": ${err.message}`);
      }

      await this._sleep(3000);
    }
  }

  // ─── DISCOVERY ────────────────────────────────────────────────────

  async _discover(paper, analysisContent) {
    // Extract search queries from analysis
    const queries = this._extractTagged(analysisContent, 'QUERY');

    // Also generate queries from paper keywords
    const titleWords = paper.title.split(/\s+/).filter(w => w.length > 4).slice(0, 3);
    if (queries.length === 0 && titleWords.length > 0) {
      queries.push(titleWords.join(' '));
    }

    for (const q of queries.slice(0, 2)) {
      await this._discoverFromQuery(q);
    }
  }

  async _discoverFromQuery(query) {
    try {
      const results = await this.oracle.search(query, ['semanticScholar']);
      let added = 0;

      for (const r of results.slice(0, 5)) {
        const id = r.paperId || `disc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        if (this.kg.getPaper(id)) continue;

        const newPaper = {
          id,
          title: r.title,
          authors: (r.authors || []).map(a => a.name || a),
          year: r.year,
          abstract: r.abstract || r.tldr,
          citationCount: r.citationCount,
          fieldsOfStudy: r.fieldsOfStudy || [],
          source: 'discovered',
          discoveredAt: new Date().toISOString(),
        };

        this.kg.addPaper(newPaper);
        this.vitals.papersDiscovered++;
        added++;

        // Feed to all castes
        this.queues.philosophers.push(id);
        this.queues.warriors.push(id);
        this.queues.artisans.push(id);
      }

      if (added > 0) {
        this._log(`[Discovery] "${query}" → ${added} new papers added to the Republic`);
        this._broadcast('papers_discovered', { query, count: added, kgSize: this.kg.getStats().paperCount });
      }
    } catch (err) {
      this._log(`[Discovery] Error searching "${query}": ${err.message}`);
    }
  }

  // ─── UTILITIES ────────────────────────────────────────────────────

  _extractTagged(text, tag) {
    if (!text) return [];
    const results = [];
    const regex = new RegExp(`${tag}:\\s*(.+)`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push(match[1].trim());
    }
    return results;
  }

  _log(msg) {
    const entry = { timestamp: new Date().toISOString(), message: msg };
    this.log.push(entry);
    if (this.log.length > 1000) this.log = this.log.slice(-500);
    this.emit('log', entry);
    this._broadcast('republic_log', entry);
  }

  _broadcast(type, data) {
    if (!this.wss) return;
    const msg = JSON.stringify({ type, ...data, timestamp: new Date().toISOString() });
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) client.send(msg);
    });
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─── STATUS ───────────────────────────────────────────────────────

  getStatus() {
    return {
      alive: this.alive,
      epoch: this.epoch,
      vitals: this.vitals,
      queues: {
        philosophers: this.queues.philosophers.length,
        warriors: this.queues.warriors.length,
        artisans: this.queues.artisans.length,
      },
      kg: this.kg.getStats(),
      markets: this.markets.size,
      hypotheses: this.hypotheses.length,
      judgements: this.judgements.length,
      alerts: this.alerts.length,
      recentLog: this.log.slice(-30),
      budget: this.agents.getBudget(),
    };
  }

  getHypotheses() { return this.hypotheses; }
  getJudgements() { return this.judgements; }
  getAlerts() { return this.alerts; }
  getMarkets() { return Array.from(this.markets.values()); }
}

module.exports = RepublicEngine;
