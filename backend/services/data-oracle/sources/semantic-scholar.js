const path = require('path');
const fs = require('fs');

class SemanticScholarSource {
  constructor(opts = {}) {
    this.baseUrl = 'https://api.semanticscholar.org/graph/v1';
    this.apiKey = opts.apiKey || process.env.S2_API_KEY || '';
    this.mockPath = path.join(__dirname, '../../../fixtures/semantic-scholar-sample.json');
    this.mockData = null;
    if (fs.existsSync(this.mockPath)) {
      this.mockData = JSON.parse(fs.readFileSync(this.mockPath, 'utf8'));
    }
  }

  async search(query) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers['x-api-key'] = this.apiKey;

      const url = `${this.baseUrl}/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=paperId,title,abstract,year,citationCount,authors,fieldsOfStudy`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`S2 API error: ${res.status}`);
      const data = await res.json();
      return (data.data || []).map(p => ({ ...p, source: 'semanticScholar' }));
    } catch {
      return this._mockSearch(query);
    }
  }

  async getDetails(paperId) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (this.apiKey) headers['x-api-key'] = this.apiKey;

      const url = `${this.baseUrl}/paper/${paperId}?fields=paperId,title,abstract,year,citationCount,authors,fieldsOfStudy,tldr,influentialCitationCount`;
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`S2 API error: ${res.status}`);
      return await res.json();
    } catch {
      if (this.mockData) {
        return this.mockData.papers.find(p => p.paperId === paperId) || null;
      }
      return null;
    }
  }

  _mockSearch(query) {
    if (!this.mockData) return [];
    const q = query.toLowerCase();
    return this.mockData.papers.filter(p =>
      p.title.toLowerCase().includes(q)
    ).map(p => ({ ...p, source: 'semanticScholar' }));
  }
}

module.exports = SemanticScholarSource;
