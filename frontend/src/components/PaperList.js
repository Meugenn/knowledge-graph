import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const STATUS_LABELS = ['Submitted', 'Under Review', 'Accepted', 'Rejected'];

function PaperList({ contracts, account }) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaper, setSelectedPaper] = useState(null);

  useEffect(() => {
    loadPapers();
  }, [contracts]);

  const loadPapers = async () => {
    if (!contracts.researchGraph) return;

    try {
      setLoading(true);
      const count = await contracts.researchGraph.paperCount();
      const loadedPapers = [];

      for (let i = 1; i <= Number(count); i++) {
        const paper = await contracts.researchGraph.getPaper(i);
        loadedPapers.push({
          id: Number(paper.id),
          author: paper.author,
          ipfsHash: paper.ipfsHash,
          doi: paper.doi,
          status: Number(paper.status),
          timestamp: Number(paper.timestamp),
          citationCount: Number(paper.citationCount),
          replicationCount: Number(paper.replicationCount),
          externalDataVerified: paper.externalDataVerified,
        });
      }

      setPapers(loadedPapers.reverse());
    } catch (error) {
      console.error('Error loading papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const verifyExternalData = async (paperId) => {
    try {
      const tx = await contracts.researchGraph.verifyExternalData(paperId);
      await tx.wait();
      alert('External data verified successfully!');
      loadPapers();
    } catch (error) {
      console.error('Verification error:', error);
      alert('Failed to verify external data: ' + (error.reason || error.message));
    }
  };

  const addCitation = async (citingPaperId, citedPaperId) => {
    try {
      const tx = await contracts.researchGraph.addCitation(citingPaperId, citedPaperId);
      await tx.wait();
      alert('Citation added successfully!');
      loadPapers();
    } catch (error) {
      console.error('Citation error:', error);
      alert('Failed to add citation: ' + (error.reason || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading papers</div>;
  }

  if (papers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📄</div>
        <h3>No Papers Yet</h3>
        <p>Be the first to submit a research paper to the knowledge graph!</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Research Papers ({papers.length})</h2>
        <button className="btn btn-small" onClick={loadPapers}>
          Refresh
        </button>
      </div>

      {papers.map((paper) => (
        <div key={paper.id} className="paper-card">
          <div className="paper-header">
            <div>
              <div className="paper-title">
                Paper #{paper.id}
                {paper.doi && ` • DOI: ${paper.doi}`}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px', fontFamily: 'monospace' }}>
                Author: {paper.author.slice(0, 10)}...{paper.author.slice(-8)}
              </div>
            </div>
            <span className={`paper-status status-${STATUS_LABELS[paper.status].toLowerCase().replace(' ', '-')}`}>
              {STATUS_LABELS[paper.status]}
            </span>
          </div>

          <div className="paper-meta">
            <span>📅 {new Date(paper.timestamp * 1000).toLocaleDateString()}</span>
            <span>📊 {paper.citationCount} citations</span>
            <span>🔄 {paper.replicationCount} replications</span>
            {paper.externalDataVerified && <span>✅ Verified via Flare FDC</span>}
          </div>

          <div style={{
            background: '#f9f9f9',
            padding: '10px',
            borderRadius: '6px',
            marginTop: '15px',
            fontSize: '0.9rem',
            fontFamily: 'monospace',
            color: '#666'
          }}>
            IPFS: {paper.ipfsHash}
          </div>

          <div className="paper-actions">
            {!paper.externalDataVerified && paper.doi && (
              <button
                className="btn btn-small"
                onClick={() => verifyExternalData(paper.id)}
              >
                🔍 Verify via Flare FDC
              </button>
            )}
            {paper.status === 2 && ( // Accepted
              <button
                className="btn btn-small"
                onClick={() => {
                  const citingId = prompt('Enter the ID of the paper that cites this paper:');
                  if (citingId) addCitation(Number(citingId), paper.id);
                }}
              >
                ➕ Add Citation
              </button>
            )}
            <button
              className="btn btn-small"
              onClick={() => window.open(`https://ipfs.io/ipfs/${paper.ipfsHash}`, '_blank')}
            >
              📖 View on IPFS
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PaperList;
