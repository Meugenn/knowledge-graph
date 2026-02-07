const fs = require('fs');
const path = require('path');

class KnowledgeGraph {
  constructor(opts = {}) {
    this.dataPath = opts.dataPath || path.join(__dirname, '../../data/kg.json');
    this.seedPath = opts.seedPath || path.join(__dirname, '../../fixtures/demo-seed.json');
    this.papers = new Map();
    this.authors = new Map();
    this.relations = [];
    this._load();
  }

  _load() {
    if (fs.existsSync(this.dataPath)) {
      const raw = JSON.parse(fs.readFileSync(this.dataPath, 'utf8'));
      this._hydrate(raw);
    } else if (fs.existsSync(this.seedPath)) {
      const raw = JSON.parse(fs.readFileSync(this.seedPath, 'utf8'));
      this._hydrate(raw);
      this._persist();
    }
  }

  _hydrate(raw) {
    (raw.papers || []).forEach(p => this.papers.set(p.id, p));
    (raw.authors || []).forEach(a => this.authors.set(a.id, a));
    this.relations = raw.relations || [];
  }

  _persist() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.dataPath, JSON.stringify({
      papers: Array.from(this.papers.values()),
      authors: Array.from(this.authors.values()),
      relations: this.relations,
    }, null, 2));
  }

  addPaper(paper) {
    if (!paper.id) paper.id = `paper_${Date.now()}`;
    this.papers.set(paper.id, paper);
    this._persist();
    return paper;
  }

  addAuthor(author) {
    if (!author.id) author.id = `author_${Date.now()}`;
    this.authors.set(author.id, author);
    this._persist();
    return author;
  }

  addRelation(source, target, type = 'cites') {
    const rel = { source, target, type };
    this.relations.push(rel);
    this._persist();
    return rel;
  }

  getPaper(id) {
    return this.papers.get(id) || null;
  }

  getAllPapers() {
    return Array.from(this.papers.values());
  }

  getNeighbourhood(paperId, depth = 2) {
    const visited = new Set();
    const queue = [{ id: paperId, d: 0 }];
    const nodes = [];
    const edges = [];

    while (queue.length > 0) {
      const { id, d } = queue.shift();
      if (visited.has(id) || d > depth) continue;
      visited.add(id);
      const paper = this.papers.get(id);
      if (paper) nodes.push(paper);

      this.relations.forEach(r => {
        if (r.source === id && !visited.has(r.target)) {
          edges.push(r);
          queue.push({ id: r.target, d: d + 1 });
        }
        if (r.target === id && !visited.has(r.source)) {
          edges.push(r);
          queue.push({ id: r.source, d: d + 1 });
        }
      });
    }

    return { nodes, edges };
  }

  searchPapers(query) {
    const q = query.toLowerCase();
    return Array.from(this.papers.values()).filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.abstract && p.abstract.toLowerCase().includes(q)) ||
      (p.fieldsOfStudy && p.fieldsOfStudy.some(f => f.toLowerCase().includes(q)))
    );
  }

  getCausalDensity(paperId) {
    const incoming = this.relations.filter(r => r.target === paperId).length;
    const outgoing = this.relations.filter(r => r.source === paperId).length;
    return { paperId, incoming, outgoing, density: incoming + outgoing };
  }

  detectCitationRings(minSize = 3) {
    const rings = [];
    const paperIds = Array.from(this.papers.keys());

    for (const startId of paperIds) {
      const visited = [startId];
      const _dfs = (current, depth) => {
        if (depth > minSize + 1) return;
        this.relations.forEach(r => {
          if (r.source === current) {
            if (r.target === startId && depth >= minSize) {
              rings.push([...visited]);
            } else if (!visited.includes(r.target)) {
              visited.push(r.target);
              _dfs(r.target, depth + 1);
              visited.pop();
            }
          }
        });
      };
      _dfs(startId, 1);
    }
    return rings;
  }

  getStats() {
    return {
      paperCount: this.papers.size,
      authorCount: this.authors.size,
      relationCount: this.relations.length,
      fields: [...new Set(Array.from(this.papers.values()).flatMap(p => p.fieldsOfStudy || []))],
    };
  }

  healthCheck() {
    return { status: 'ok', papers: this.papers.size, relations: this.relations.length };
  }
}

module.exports = KnowledgeGraph;
