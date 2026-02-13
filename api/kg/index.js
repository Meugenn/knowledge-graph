// Vercel serverless function — Knowledge Graph API
// In-memory store per invocation; for persistence, use Vercel KV/Upstash Redis

// Demo papers for initial state
const DEMO_PAPERS = [
  { id: 'vaswani2017', title: 'Attention Is All You Need', authors: ['Vaswani', 'Shazeer', 'Parmar'], year: 2017, abstract: 'The dominant sequence transduction models are based on complex recurrent or convolutional neural networks...', citationCount: 120000, fieldsOfStudy: ['Computer Science'], source: 'seed' },
  { id: 'devlin2019', title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', authors: ['Devlin', 'Chang', 'Lee', 'Toutanova'], year: 2019, abstract: 'We introduce a new language representation model called BERT...', citationCount: 85000, fieldsOfStudy: ['Computer Science'], source: 'seed' },
  { id: 'brown2020', title: 'Language Models are Few-Shot Learners', authors: ['Brown', 'Mann', 'Ryder'], year: 2020, abstract: 'Recent work has demonstrated substantial gains on many NLP tasks...', citationCount: 35000, fieldsOfStudy: ['Computer Science'], source: 'seed' },
  { id: 'he2016', title: 'Deep Residual Learning for Image Recognition', authors: ['He', 'Zhang', 'Ren', 'Sun'], year: 2016, abstract: 'Deeper neural networks are more difficult to train...', citationCount: 180000, fieldsOfStudy: ['Computer Science'], source: 'seed' },
  { id: 'goodfellow2014', title: 'Generative Adversarial Networks', authors: ['Goodfellow', 'Pouget-Abadie', 'Mirza'], year: 2014, abstract: 'We propose a new framework for estimating generative models via an adversarial process...', citationCount: 60000, fieldsOfStudy: ['Computer Science'], source: 'seed' },
];

const DEMO_RELATIONS = [
  { source: 'devlin2019', target: 'vaswani2017', type: 'builds_on' },
  { source: 'brown2020', target: 'vaswani2017', type: 'builds_on' },
  { source: 'brown2020', target: 'devlin2019', type: 'extends' },
];

export default async function handler(req, res) {
  const { action, id, q, depth } = req.query;

  // GET requests
  if (req.method === 'GET') {
    switch (action) {
      case 'papers':
        if (id) {
          const paper = DEMO_PAPERS.find(p => p.id === id);
          if (!paper) return res.status(404).json({ error: 'Paper not found' });
          return res.status(200).json(paper);
        }
        return res.status(200).json(DEMO_PAPERS);

      case 'neighbourhood': {
        if (!id) return res.status(400).json({ error: 'id required' });
        const d = parseInt(depth) || 2;
        const visited = new Set();
        const queue = [{ paperId: id, d: 0 }];
        const nodes = [];
        const edges = [];

        while (queue.length > 0) {
          const { paperId, d: currentDepth } = queue.shift();
          if (visited.has(paperId) || currentDepth > d) continue;
          visited.add(paperId);
          const paper = DEMO_PAPERS.find(p => p.id === paperId);
          if (paper) nodes.push(paper);

          DEMO_RELATIONS.forEach(r => {
            if (r.source === paperId && !visited.has(r.target)) {
              edges.push(r);
              queue.push({ paperId: r.target, d: currentDepth + 1 });
            }
            if (r.target === paperId && !visited.has(r.source)) {
              edges.push(r);
              queue.push({ paperId: r.source, d: currentDepth + 1 });
            }
          });
        }
        return res.status(200).json({ nodes, edges });
      }

      case 'search': {
        if (!q) return res.status(400).json({ error: 'Query parameter q is required' });
        const query = q.toLowerCase();
        const results = DEMO_PAPERS.filter(p =>
          p.title.toLowerCase().includes(query) ||
          (p.abstract && p.abstract.toLowerCase().includes(query)) ||
          (p.fieldsOfStudy && p.fieldsOfStudy.some(f => f.toLowerCase().includes(query)))
        );
        return res.status(200).json(results);
      }

      case 'stats':
        return res.status(200).json({
          paperCount: DEMO_PAPERS.length,
          authorCount: new Set(DEMO_PAPERS.flatMap(p => p.authors || [])).size,
          relationCount: DEMO_RELATIONS.length,
          fields: [...new Set(DEMO_PAPERS.flatMap(p => p.fieldsOfStudy || []))],
        });

      case 'health':
        return res.status(200).json({ status: 'ok', papers: DEMO_PAPERS.length, relations: DEMO_RELATIONS.length });

      default:
        return res.status(200).json(DEMO_PAPERS);
    }
  }

  // POST — add paper
  if (req.method === 'POST') {
    const paper = req.body;
    if (!paper.id || !paper.title) {
      return res.status(400).json({ error: 'id and title are required' });
    }
    // In serverless, this is ephemeral; return the paper as if added
    return res.status(200).json({ ...paper, _note: 'Added (ephemeral in serverless mode)' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
