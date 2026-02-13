const path = require('path');
const fs = require('fs');

/** @mock — No real HuggingFace API integration. Returns data from fixtures when available. */
class HuggingFaceSource {
  constructor(opts = {}) {
    this.mockPath = path.join(__dirname, '../../../fixtures/huggingface-sample.json');
    this.mockData = null;
    if (fs.existsSync(this.mockPath)) {
      this.mockData = JSON.parse(fs.readFileSync(this.mockPath, 'utf8'));
    } else {
      console.info('[HuggingFaceSource] Mock-only source — no fixtures found, will return empty results');
    }
  }

  async search(query) {
    if (!this.mockData) return [];
    const q = query.toLowerCase();
    return [
      ...this.mockData.models.filter(m =>
        m.id.toLowerCase().includes(q) || m.pipeline.toLowerCase().includes(q)
      ).map(m => ({ ...m, type: 'model', source: 'huggingface' })),
      ...this.mockData.datasets.filter(d =>
        d.id.toLowerCase().includes(q) || d.task.toLowerCase().includes(q)
      ).map(d => ({ ...d, type: 'dataset', source: 'huggingface' })),
    ];
  }

  async getDetails(id) {
    if (!this.mockData) return null;
    return this.mockData.models.find(m => m.id === id)
      || this.mockData.datasets.find(d => d.id === id)
      || null;
  }
}

module.exports = HuggingFaceSource;
