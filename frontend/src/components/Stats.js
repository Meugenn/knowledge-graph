import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function Stats({ contracts, account }) {
  const [stats, setStats] = useState({
    totalPapers: 0,
    acceptedPapers: 0,
    totalCitations: 0,
    totalReviews: 0,
    userBalance: '0',
    usdcBalance: '0',
    submissionFee: '0',
    reviewReward: '0',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [contracts, account]);

  const loadStats = async () => {
    if (!contracts.researchGraph || !contracts.researchToken || !contracts.usdc) return;

    try {
      setLoading(true);

      // Get total papers
      const paperCount = await contracts.researchGraph.paperCount();
      let acceptedCount = 0;
      let totalCites = 0;

      // Count accepted papers and citations
      for (let i = 1; i <= Number(paperCount); i++) {
        const paper = await contracts.researchGraph.getPaper(i);
        if (Number(paper.status) === 2) acceptedCount++; // Accepted
        totalCites += Number(paper.citationCount);
      }

      // Get user balances
      const tokenBalance = await contracts.researchToken.balanceOf(account);
      const usdcBal = await contracts.usdc.balanceOf(account);

      // Get fees and rewards
      const subFee = await contracts.researchGraph.submissionFeeUSD();
      const revReward = await contracts.researchGraph.reviewRewardUSD();

      setStats({
        totalPapers: Number(paperCount),
        acceptedPapers: acceptedCount,
        totalCitations: totalCites,
        totalReviews: 0, // Would need to track separately
        userBalance: ethers.formatEther(tokenBalance),
        usdcBalance: ethers.formatUnits(usdcBal, 6),
        submissionFee: ethers.formatUnits(subFee, 6),
        reviewReward: ethers.formatUnits(revReward, 6),
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading statistics</div>;
  }

  return (
    <div>
      <h2>Platform Statistics</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Real-time stats from the decentralized research graph
      </p>

      <h3 style={{ marginBottom: '20px' }}>Network Overview</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalPapers}</div>
          <div className="stat-label">Total Papers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.acceptedPapers}</div>
          <div className="stat-label">Accepted Papers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalCitations}</div>
          <div className="stat-label">Total Citations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {stats.totalPapers > 0
              ? ((stats.acceptedPapers / stats.totalPapers) * 100).toFixed(0)
              : 0}%
          </div>
          <div className="stat-label">Acceptance Rate</div>
        </div>
      </div>

      <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>Your Balances</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{parseFloat(stats.userBalance).toFixed(2)}</div>
          <div className="stat-label">RESEARCH Tokens</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${parseFloat(stats.usdcBalance).toFixed(2)}</div>
          <div className="stat-label">USDC Balance (Plasma)</div>
        </div>
      </div>

      <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>Platform Economics</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">${stats.submissionFee}</div>
          <div className="stat-label">Submission Fee (USDC)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${stats.reviewReward}</div>
          <div className="stat-label">Review Reward (USDC)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">10</div>
          <div className="stat-label">Citation Reward (RESEARCH)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">50</div>
          <div className="stat-label">Replication Reward (RESEARCH)</div>
        </div>
      </div>

      <div style={{
        marginTop: '40px',
        padding: '30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '12px',
        color: 'white'
      }}>
        <h3 style={{ marginBottom: '15px' }}>🔥 Powered By</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h4 style={{ marginBottom: '10px' }}>Flare Network</h4>
            <ul style={{ listStyle: 'none', fontSize: '0.9rem', opacity: 0.9 }}>
              <li>✅ FDC: External data verification</li>
              <li>✅ FTSO: Token price feeds</li>
              <li>✅ RNG: Random reviewer assignment</li>
            </ul>
          </div>
          <div>
            <h4 style={{ marginBottom: '10px' }}>Plasma Network</h4>
            <ul style={{ listStyle: 'none', fontSize: '0.9rem', opacity: 0.9 }}>
              <li>✅ Stablecoin payments (USDC)</li>
              <li>✅ Fast settlement</li>
              <li>✅ Low transaction fees</li>
            </ul>
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={loadStats}
        style={{ width: '100%', marginTop: '20px' }}
      >
        Refresh Stats
      </button>
    </div>
  );
}

export default Stats;
