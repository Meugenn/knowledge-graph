const path = require('path');
const fs = require('fs');

class ArxivSource {
  constructor(opts = {}) {
    this.baseUrl = 'http://export.arxiv.org/api/query';
    this.mockPath = path.join(__dirname, '../../../fixtures/arxiv-sample.json');
    this.mockData = null;
    if (fs.existsSync(this.mockPath)) {
      this.mockData = JSON.parse(fs.readFileSync(this.mockPath, 'utf8'));
    }
  }

  async search(query) {
    try {
      const url = `${this.baseUrl}?search_query=all:${encodeURIComponent(query)}&max_results=10`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`arXiv API error: ${res.status}`);
      const xml = await res.text();
      return this._parseXml(xml);
    } catch {
      return this._mockSearch(query);
    }
  }

  async getDetails(arxivId) {
    try {
      const url = `${this.baseUrl}?id_list=${arxivId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`arXiv API error: ${res.status}`);
      const xml = await res.text();
      const results = this._parseXml(xml);
      return results[0] || null;
    } catch {
      if (this.mockData) {
        return this.mockData.papers.find(p => p.arxivId === arxivId) || null;
      }
      return null;
    }
  }

  _parseXml(xml) {
    const entries = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xml)) !== null) {
      const entry = match[1];
      const title = (entry.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim();
      const abstract = (entry.match(/<summary>([\s\S]*?)<\/summary>/) || [])[1]?.trim();
      const published = (entry.match(/<published>([\s\S]*?)<\/published>/) || [])[1]?.trim();
      const id = (entry.match(/<id>([\s\S]*?)<\/id>/) || [])[1]?.trim();
      const arxivId = id ? id.split('/abs/').pop() : null;

      const authors = [];
      const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g;
      let am;
      while ((am = authorRegex.exec(entry)) !== null) {
        authors.push(am[1].trim());
      }

      const categories = [];
      const catRegex = /category term="([^"]+)"/g;
      let cm;
      while ((cm = catRegex.exec(entry)) !== null) {
        categories.push(cm[1]);
      }

      entries.push({ arxivId, title, authors, abstract, categories, published, source: 'arxiv' });
    }
    return entries;
  }

  _mockSearch(query) {
    if (!this.mockData) return [];
    const q = query.toLowerCase();
    return this.mockData.papers.filter(p =>
      p.title.toLowerCase().includes(q) || (p.abstract && p.abstract.toLowerCase().includes(q))
    ).map(p => ({ ...p, source: 'arxiv' }));
  }
}

module.exports = ArxivSource;
