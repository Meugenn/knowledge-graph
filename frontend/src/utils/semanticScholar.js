import { SEMANTIC_SCHOLAR } from '../config';
import { getSeedGraphData } from './seedData';

// In-memory cache
const cache = new Map();

function normalizeS2Paper(paper) {
  return {
    id: paper.paperId,
    paperId: paper.paperId,
    title: paper.title || 'Untitled',
    authors: (paper.authors || []).map(a => a.name || a),
    year: paper.year,
    citationCount: paper.citationCount || 0,
    abstract: paper.abstract || '',
    fieldsOfStudy: paper.fieldsOfStudy || [],
    doi: paper.externalIds?.DOI || null,
    source: 'semantic_scholar',
    references: (paper.references || []).filter(r => r.paperId).map(r => r.paperId),
    citations: (paper.citations || []).filter(c => c.paperId).map(c => c.paperId),
  };
}

async function fetchWithFallback(url) {
  // Tier 1: Direct call
  try {
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (e) {
    // CORS or network error, try proxy
  }

  // Tier 2: allorigins proxy
  try {
    const proxyUrl = `${SEMANTIC_SCHOLAR.PROXY_URL}${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (res.ok) return await res.json();
  } catch (e) {
    // Proxy failed too
  }

  return null;
}

export async function searchPapers(query, limit = SEMANTIC_SCHOLAR.SEARCH_LIMIT) {
  const cacheKey = `search:${query}:${limit}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const url = `${SEMANTIC_SCHOLAR.BASE_URL}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=${SEMANTIC_SCHOLAR.SEARCH_FIELDS}`;
  const data = await fetchWithFallback(url);

  if (!data?.data) return [];

  const papers = data.data.map(normalizeS2Paper);
  cache.set(cacheKey, papers);
  return papers;
}

export async function getPaperDetails(paperId) {
  const cacheKey = `paper:${paperId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const url = `${SEMANTIC_SCHOLAR.BASE_URL}/paper/${paperId}?fields=${SEMANTIC_SCHOLAR.FIELDS}`;
  const data = await fetchWithFallback(url);

  if (!data) return null;

  const paper = normalizeS2Paper(data);
  cache.set(cacheKey, paper);
  return paper;
}

export function buildGraphFromPapers(papers, existingGraph = null) {
  const nodeMap = new Map();
  const linkSet = new Set();

  // Carry over existing graph
  if (existingGraph) {
    existingGraph.nodes.forEach(n => nodeMap.set(n.id, n));
    existingGraph.links.forEach(l => {
      const key = `${typeof l.source === 'object' ? l.source.id : l.source}->${typeof l.target === 'object' ? l.target.id : l.target}`;
      linkSet.add(key);
    });
  }

  papers.forEach(paper => {
    if (!nodeMap.has(paper.id)) {
      nodeMap.set(paper.id, {
        ...paper,
        val: Math.max(3, Math.log10((paper.citationCount || 0) + 1) * 3),
      });
    }

    // Add citation links
    (paper.references || []).forEach(refId => {
      const key = `${paper.id}->${refId}`;
      if (!linkSet.has(key)) {
        linkSet.add(key);
      }
    });

    (paper.citations || []).forEach(citId => {
      const key = `${citId}->${paper.id}`;
      if (!linkSet.has(key)) {
        linkSet.add(key);
      }
    });
  });

  const nodeIds = new Set(nodeMap.keys());
  const links = [];
  linkSet.forEach(key => {
    const [source, target] = key.split('->');
    // Only include links where both nodes exist in our graph
    if (nodeIds.has(source) && nodeIds.has(target)) {
      links.push({ source, target });
    }
  });

  return {
    nodes: Array.from(nodeMap.values()),
    links,
  };
}

export function mergeOnChainPapers(graphData, onChainPapers, userAddress) {
  const nodeMap = new Map();
  graphData.nodes.forEach(n => nodeMap.set(n.id, n));

  onChainPapers.forEach(paper => {
    const matchKey = paper.doi ?
      graphData.nodes.find(n => n.doi && n.doi === paper.doi)?.id : null;

    if (matchKey) {
      // Merge: mark existing node as on-chain
      const existing = nodeMap.get(matchKey);
      nodeMap.set(matchKey, {
        ...existing,
        source: existing.source === 'seed' ? 'onchain' : existing.source,
        onChain: true,
        onChainId: paper.id,
        onChainStatus: paper.status,
        onChainAuthor: paper.author,
        ipfsHash: paper.ipfsHash,
        isUserPaper: paper.author?.toLowerCase() === userAddress?.toLowerCase(),
      });
    } else {
      // Add as new on-chain node
      const nodeId = `onchain_${paper.id}`;
      nodeMap.set(nodeId, {
        id: nodeId,
        paperId: nodeId,
        title: paper.doi || `On-chain Paper #${paper.id}`,
        authors: [paper.author?.slice(0, 10) + '...'],
        year: new Date(Number(paper.timestamp) * 1000).getFullYear(),
        citationCount: Number(paper.citationCount) || 0,
        abstract: '',
        fieldsOfStudy: [],
        doi: paper.doi,
        source: 'onchain',
        onChain: true,
        onChainId: paper.id,
        onChainStatus: paper.status,
        onChainAuthor: paper.author,
        ipfsHash: paper.ipfsHash,
        isUserPaper: paper.author?.toLowerCase() === userAddress?.toLowerCase(),
        val: 5,
      });
    }
  });

  return {
    nodes: Array.from(nodeMap.values()),
    links: graphData.links,
  };
}

export async function loadInitialGraph() {
  // Start with guaranteed seed data
  const seedGraph = getSeedGraphData();

  // Try to enhance with live data (non-blocking)
  try {
    const liveResults = await Promise.race([
      searchPapers('transformer language model', 10),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);

    if (liveResults.length > 0) {
      return buildGraphFromPapers(liveResults, seedGraph);
    }
  } catch (e) {
    // Live API unavailable, seed data is fine
  }

  return seedGraph;
}
