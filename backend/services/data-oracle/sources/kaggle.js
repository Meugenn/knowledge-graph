const path = require('path');
const fs = require('fs');

/** @mock — No real Kaggle API integration. Returns data from fixtures when available. */
class KaggleSource {
  constructor(opts = {}) {
    this.mockPath = path.join(__dirname, '../../../fixtures/kaggle-sample.json');
    this.mockData = null;
    if (fs.existsSync(this.mockPath)) {
      this.mockData = JSON.parse(fs.readFileSync(this.mockPath, 'utf8'));
    } else {
      console.info('[KaggleSource] Mock-only source — no fixtures found, will return empty results');
    }
  }

  async search(query) {
    // Mock-only implementation
    if (!this.mockData) return [];
    const q = query.toLowerCase();
    return [
      ...this.mockData.competitions.filter(c =>
        c.title.toLowerCase().includes(q)
      ).map(c => ({ ...c, type: 'competition', source: 'kaggle' })),
      ...this.mockData.datasets.filter(d =>
        d.title.toLowerCase().includes(q)
      ).map(d => ({ ...d, type: 'dataset', source: 'kaggle' })),
    ];
  }

  async getDetails(id) {
    if (!this.mockData) return null;
    return this.mockData.competitions.find(c => c.id === id)
      || this.mockData.datasets.find(d => d.id === id)
      || null;
  }
}

module.exports = KaggleSource;
