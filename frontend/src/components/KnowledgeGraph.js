import React, { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GRAPH_COLORS } from '../config';
import { loadInitialGraph, searchPapers, buildGraphFromPapers, mergeOnChainPapers } from '../utils/semanticScholar';
import PaperDetail from './PaperDetail';

function KnowledgeGraph({ contracts, account, onImportPaper }) {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, onChain: 0, external: 0 });
  const [filters, setFilters] = useState({
    showExternal: true,
    showOnChain: true,
    minCitations: 0,
    yearRange: [1990, 2026],
  });
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Resize handler
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: Math.max(500, window.innerHeight - 300),
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Load initial graph
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      const data = await loadInitialGraph();
      if (!cancelled) {
        setGraphData(data);
        setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // Merge on-chain papers
  useEffect(() => {
    if (!contracts.researchGraph || graphData.nodes.length === 0) return;
    let cancelled = false;

    async function loadOnChain() {
      try {
        const count = await contracts.researchGraph.paperCount();
        const papers = [];
        for (let i = 1; i <= Math.min(Number(count), 50); i++) {
          try {
            const paper = await contracts.researchGraph.getPaper(i);
            papers.push({
              id: Number(paper.id),
              author: paper.author,
              ipfsHash: paper.ipfsHash,
              doi: paper.doi,
              status: Number(paper.status),
              timestamp: Number(paper.timestamp),
              citationCount: Number(paper.citationCount),
            });
          } catch (e) {
            // Paper might not exist
          }
        }
        if (!cancelled && papers.length > 0) {
          setGraphData(prev => mergeOnChainPapers(prev, papers, account));
        }
      } catch (e) {
        console.log('Could not load on-chain papers:', e.message);
      }
    }
    loadOnChain();
    return () => { cancelled = true; };
  }, [contracts.researchGraph, account, graphData.nodes.length]);

  // Update stats when graph changes
  useEffect(() => {
    const onChain = graphData.nodes.filter(n => n.onChain).length;
    setStats({
      total: graphData.nodes.length,
      onChain,
      external: graphData.nodes.length - onChain,
    });
  }, [graphData.nodes]);

  // Search handler
  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const results = await searchPapers(searchQuery.trim());
      if (results.length > 0) {
        setGraphData(prev => buildGraphFromPapers(results, prev));
      }
    } catch (err) {
      console.error('Search error:', err);
    }
    setSearching(false);
  }, [searchQuery]);

  // Filter graph data
  const filteredData = React.useMemo(() => {
    const filteredNodes = graphData.nodes.filter(node => {
      if (!filters.showExternal && !node.onChain) return false;
      if (!filters.showOnChain && node.onChain) return false;
      if ((node.citationCount || 0) < filters.minCitations) return false;
      if (node.year && (node.year < filters.yearRange[0] || node.year > filters.yearRange[1])) return false;
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = graphData.links.filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [graphData, filters]);

  // Node color
  const getNodeColor = useCallback((node) => {
    if (node.isUserPaper) return GRAPH_COLORS.USER;
    if (node.onChain) return GRAPH_COLORS.ONCHAIN;
    return GRAPH_COLORS.EXTERNAL;
  }, []);

  // Custom node rendering
  const paintNode = useCallback((node, ctx, globalScale) => {
    const label = node.title?.length > 30 ? node.title.slice(0, 28) + '...' : node.title;
    const fontSize = Math.max(10 / globalScale, 2);
    const nodeR = Math.max(node.val || 3, 2);
    const color = getNodeColor(node);

    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;

    // Node circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeR, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.shadowBlur = 0;

    // Border for on-chain
    if (node.onChain) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5 / globalScale;
      ctx.stroke();
    }

    // Label (only when zoomed in enough)
    if (globalScale > 1.5) {
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(label, node.x, node.y + nodeR + 2);
    }
  }, [getNodeColor]);

  // Node click handler
  const handleNodeClick = useCallback((node) => {
    setSelectedPaper(node);
    // Center on clicked node
    if (fgRef.current) {
      fgRef.current.centerAt(node.x, node.y, 500);
      fgRef.current.zoom(3, 500);
    }
  }, []);

  // Import handler
  const handleImport = useCallback((paper) => {
    setSelectedPaper(null);
    if (onImportPaper) {
      onImportPaper({
        title: paper.title,
        abstract: paper.abstract || '',
        doi: paper.doi || '',
        authors: paper.authors,
      });
    }
  }, [onImportPaper]);

  return (
    <div className="knowledge-graph-container">
      {/* Search Bar */}
      <form className="graph-search" onSubmit={handleSearch}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search papers (e.g., BERT, diffusion models, reinforcement learning)..."
          className="graph-search-input"
        />
        <button type="submit" className="btn btn-primary graph-search-btn" disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Filters */}
      <div className="graph-filters">
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={filters.showExternal}
            onChange={(e) => setFilters(f => ({ ...f, showExternal: e.target.checked }))}
          />
          <span style={{ color: GRAPH_COLORS.EXTERNAL }}>External Papers</span>
        </label>
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={filters.showOnChain}
            onChange={(e) => setFilters(f => ({ ...f, showOnChain: e.target.checked }))}
          />
          <span style={{ color: GRAPH_COLORS.ONCHAIN }}>On-Chain Papers</span>
        </label>
        <div className="filter-slider">
          <span>Min Citations: {filters.minCitations.toLocaleString()}</span>
          <input
            type="range"
            min="0"
            max="50000"
            step="1000"
            value={filters.minCitations}
            onChange={(e) => setFilters(f => ({ ...f, minCitations: Number(e.target.value) }))}
          />
        </div>
        <div className="filter-slider">
          <span>From: {filters.yearRange[0]}</span>
          <input
            type="range"
            min="1990"
            max="2026"
            value={filters.yearRange[0]}
            onChange={(e) => setFilters(f => ({ ...f, yearRange: [Number(e.target.value), f.yearRange[1]] }))}
          />
        </div>
      </div>

      {/* Graph */}
      <div className="graph-canvas" ref={containerRef}>
        {loading ? (
          <div className="graph-loading">
            <div className="graph-loading-spinner" />
            <p>Loading knowledge graph...</p>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={filteredData}
            width={dimensions.width}
            height={dimensions.height}
            backgroundColor={GRAPH_COLORS.BACKGROUND}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(node, color, ctx) => {
              const r = Math.max(node.val || 3, 5);
              ctx.beginPath();
              ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            linkColor={() => GRAPH_COLORS.EDGE}
            linkWidth={0.5}
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={1}
            onNodeClick={handleNodeClick}
            cooldownTicks={100}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            nodeLabel={node => `${node.title} (${(node.citationCount || 0).toLocaleString()} citations)`}
          />
        )}

        {/* Legend */}
        <div className="graph-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ background: GRAPH_COLORS.EXTERNAL }} />
            External ({stats.external})
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: GRAPH_COLORS.ONCHAIN }} />
            On-Chain ({stats.onChain})
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ background: GRAPH_COLORS.USER }} />
            Your Papers
          </div>
          <div className="legend-divider" />
          <div className="legend-item legend-stat">
            {stats.total} papers &middot; {filteredData.links.length} citations
          </div>
        </div>
      </div>

      {/* Paper Detail Sidebar */}
      <PaperDetail
        paper={selectedPaper}
        onClose={() => setSelectedPaper(null)}
        onImport={handleImport}
      />
    </div>
  );
}

export default KnowledgeGraph;
