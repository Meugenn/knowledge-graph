const ArxivSource = require('./sources/arxiv');
const SemanticScholarSource = require('./sources/semantic-scholar');
const KaggleSource = require('./sources/kaggle');
const HuggingFaceSource = require('./sources/huggingface');
const GitHubSource = require('./sources/github');

class DataOracle {
  constructor(opts = {}) {
    this.sources = {
      arxiv: new ArxivSource(opts.arxiv),
      semanticScholar: new SemanticScholarSource(opts.semanticScholar),
      kaggle: new KaggleSource(opts.kaggle),
      huggingface: new HuggingFaceSource(opts.huggingface),
      github: new GitHubSource(opts.github),
    };
  }

  async search(query, sources = ['arxiv', 'semanticScholar']) {
    const results = await Promise.allSettled(
      sources.map(s => this.sources[s]?.search(query))
    );
    return results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value || []);
  }

  async enrich(paperId, source = 'semanticScholar') {
    const src = this.sources[source];
    if (!src) return null;
    return src.getDetails(paperId);
  }

  healthCheck() {
    return {
      status: 'ok',
      sources: Object.keys(this.sources),
    };
  }
}

module.exports = DataOracle;
