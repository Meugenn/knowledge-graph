// Timeline layout for the Knowledge Graph
// Positions papers by year (X-axis) and research cluster (Y-axis)
// Uses fx/fy pinned positions so ForceGraph2D respects the layout

// 6 research clusters — Y-band index 0=top, 5=bottom
export const CLUSTERS = {
  nlp:         { index: 0, label: 'NLP / Transformers' },
  vision:      { index: 1, label: 'Vision / CNNs' },
  generative:  { index: 2, label: 'Generative Models' },
  rl:          { index: 3, label: 'Reinforcement Learning' },
  gnn:         { index: 4, label: 'Graph Neural Networks' },
  foundations:  { index: 5, label: 'Foundations' },
};

// Every seed paper mapped to its cluster
const PAPER_CLUSTER = {
  // NLP / Transformers
  vaswani2017: 'nlp',
  devlin2019: 'nlp',
  brown2020: 'nlp',
  openai2023: 'nlp',
  radford2019: 'nlp',
  raffel2020: 'nlp',
  liu2019: 'nlp',
  touvron2023: 'nlp',
  ouyang2022: 'nlp',
  wei2022: 'nlp',
  chowdhery2022: 'nlp',
  bubeck2023: 'nlp',
  kaplan2020: 'nlp',
  lewis2020: 'nlp',
  radford2021: 'nlp',
  // Vision / CNNs
  krizhevsky2012: 'vision',
  he2016: 'vision',
  simonyan2015: 'vision',
  szegedy2015: 'vision',
  ronneberger2015: 'vision',
  redmon2016: 'vision',
  ren2015: 'vision',
  dosovitskiy2021: 'vision',
  // Generative Models
  goodfellow2014: 'generative',
  kingma2014: 'generative',
  ho2020: 'generative',
  rombach2022: 'generative',
  song2021: 'generative',
  sohl2015: 'generative',
  ramesh2022: 'generative',
  // Reinforcement Learning
  silver2016: 'rl',
  silver2017: 'rl',
  mnih2015: 'rl',
  schulman2017: 'rl',
  // Graph Neural Networks
  kipf2017: 'gnn',
  hamilton2017: 'gnn',
  velickovic2018: 'gnn',
  // Foundations
  hochreiter1997: 'foundations',
  lecun1998: 'foundations',
  mikolov2013: 'foundations',
  srivastava2014: 'foundations',
  ioffe2015: 'foundations',
  kingma2015: 'foundations',
  hinton2006: 'foundations',
  hendrycks2016: 'foundations',
  loshchilov2019: 'foundations',
  bahdanau2015: 'foundations',
  sutskever2014: 'foundations',
  xu2015: 'foundations',
  zoph2017: 'foundations',
};

// Layout coordinate space (world units, not pixels)
const X_MIN = -800;
const X_MAX = 800;
const Y_MIN = -500;
const Y_MAX = 500;
const MIN_YEAR = 1997;
const MAX_YEAR = 2024;
const NUM_CLUSTERS = Object.keys(CLUSTERS).length;
const BAND_HEIGHT = (Y_MAX - Y_MIN) / NUM_CLUSTERS;

export function yearToX(year) {
  const clamped = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year || 2020));
  return X_MIN + ((clamped - MIN_YEAR) / (MAX_YEAR - MIN_YEAR)) * (X_MAX - X_MIN);
}

export function clusterToY(index) {
  return Y_MIN + (index + 0.5) * BAND_HEIGHT;
}

function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Assigns fx/fy to all nodes that don't already have them.
 * Seed papers get positioned by year + cluster.
 * Non-seed papers get positioned near their connected seed papers.
 */
export function assignTimelinePositions(nodes, links) {
  // Track how many papers share a (year, cluster) cell for vertical spreading
  const cellCount = new Map(); // "year-cluster" -> count
  const cellIndex = new Map(); // "year-cluster" -> next index

  // First pass: position seed papers
  for (const node of nodes) {
    if (node.fx !== undefined && node.fy !== undefined) continue;

    const clusterKey = PAPER_CLUSTER[node.id];
    if (!clusterKey) continue;

    const cluster = CLUSTERS[clusterKey];
    const cellKey = `${node.year}-${clusterKey}`;
    cellCount.set(cellKey, (cellCount.get(cellKey) || 0) + 1);
  }

  for (const node of nodes) {
    if (node.fx !== undefined && node.fy !== undefined) continue;

    const clusterKey = PAPER_CLUSTER[node.id];
    if (!clusterKey) continue;

    const cluster = CLUSTERS[clusterKey];
    const cellKey = `${node.year}-${clusterKey}`;
    const total = cellCount.get(cellKey) || 1;
    const idx = cellIndex.get(cellKey) || 0;
    cellIndex.set(cellKey, idx + 1);

    const baseX = yearToX(node.year);
    const baseY = clusterToY(cluster.index);

    // Spread papers sharing a cell vertically
    const offset = (idx - (total - 1) / 2) * 25;

    node.fx = baseX;
    node.fy = baseY + offset;
    node.x = node.fx;
    node.y = node.fy;
  }

  // Build adjacency for non-seed papers
  const nodeById = new Map(nodes.map(n => [n.id, n]));

  // Second pass: position non-seed papers near connected neighbors
  for (const node of nodes) {
    if (node.fx !== undefined && node.fy !== undefined) continue;

    // Find connected nodes that already have positions
    const connectedPositions = [];
    for (const link of links) {
      const srcId = typeof link.source === 'object' ? link.source.id : link.source;
      const tgtId = typeof link.target === 'object' ? link.target.id : link.target;

      let neighborId = null;
      if (srcId === node.id) neighborId = tgtId;
      else if (tgtId === node.id) neighborId = srcId;
      if (!neighborId) continue;

      const neighbor = nodeById.get(neighborId);
      if (neighbor && neighbor.fx !== undefined && neighbor.fy !== undefined) {
        connectedPositions.push({ x: neighbor.fx, y: neighbor.fy });
      }
    }

    const hash = simpleHash(String(node.id));

    if (connectedPositions.length > 0) {
      const avgX = connectedPositions.reduce((s, p) => s + p.x, 0) / connectedPositions.length;
      const avgY = connectedPositions.reduce((s, p) => s + p.y, 0) / connectedPositions.length;
      node.fx = avgX + (hash % 60) - 30;
      node.fy = avgY + ((hash >> 8) % 40) - 20;
    } else {
      // No connections — place by year at center
      node.fx = yearToX(node.year || 2020) + (hash % 60) - 30;
      node.fy = ((hash >> 8) % (Y_MAX - Y_MIN)) + Y_MIN;
    }

    node.x = node.fx;
    node.y = node.fy;
  }
}

// Axis drawing constants exported for KnowledgeGraph paintNode
export const LAYOUT_BOUNDS = { X_MIN, X_MAX, Y_MIN, Y_MAX, MIN_YEAR, MAX_YEAR };
