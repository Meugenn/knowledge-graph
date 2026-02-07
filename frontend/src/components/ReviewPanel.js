import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function ReviewPanel({ contracts, account }) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({
    paperId: '',
    score: 7,
    comments: '',
  });
  const [isReviewer, setIsReviewer] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('100');

  useEffect(() => {
    loadPapersForReview();
  }, [contracts]);

  const loadPapersForReview = async () => {
    if (!contracts.researchGraph) return;

    try {
      setLoading(true);
      const count = await contracts.researchGraph.paperCount();
      const loadedPapers = [];

      for (let i = 1; i <= Number(count); i++) {
        const paper = await contracts.researchGraph.getPaper(i);
        if (Number(paper.status) === 1) { // Under Review
          const reviewers = await contracts.researchGraph.getPaperReviewers(i);
          loadedPapers.push({
            id: Number(paper.id),
            author: paper.author,
            ipfsHash: paper.ipfsHash,
            doi: paper.doi,
            reviewers: reviewers,
            isAssigned: reviewers.some(r => r.toLowerCase() === account.toLowerCase()),
          });
        }
      }

      setPapers(loadedPapers);
    } catch (error) {
      console.error('Error loading papers:', error);
    } finally {
      setLoading(false);
    }
  };

  const registerAsReviewer = async () => {
    try {
      const amount = ethers.parseEther(stakeAmount);

      // Approve tokens
      const approveTx = await contracts.researchToken.approve(
        await contracts.researchGraph.getAddress(),
        amount
      );
      await approveTx.wait();

      // Register
      const registerTx = await contracts.researchGraph.registerAsReviewer(amount);
      await registerTx.wait();

      alert('Successfully registered as reviewer!');
      setIsReviewer(true);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register: ' + (error.reason || error.message));
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();

    try {
      // Simulate IPFS upload
      const mockIpfsHash = 'QmReview' + Math.random().toString(36).substring(7);

      const tx = await contracts.researchGraph.submitReview(
        reviewForm.paperId,
        reviewForm.score,
        mockIpfsHash
      );

      await tx.wait();

      alert('Review submitted! You will receive $100 USDC via Plasma.');
      setReviewForm({ paperId: '', score: 7, comments: '' });
      loadPapersForReview();
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Failed to submit review: ' + (error.reason || error.message));
    }
  };

  if (loading) {
    return <div className="loading">Loading papers for review</div>;
  }

  return (
    <div>
      <h2>Review Papers</h2>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Earn $100 USDC (Plasma) for each quality review. Reviews are assigned randomly via Flare RNG.
      </p>

      {!isReviewer && (
        <div style={{
          background: '#fff3e0',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '2px solid #f57c00'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Become a Reviewer</h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Stake RESEARCH tokens to become a reviewer. Your stake ensures review quality and can be slashed for poor reviews.
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Stake Amount (RESEARCH tokens)</label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                min="100"
                step="10"
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={registerAsReviewer}
            >
              Register as Reviewer
            </button>
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: '20px' }}>Papers Under Review ({papers.length})</h3>

      {papers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✍️</div>
          <p>No papers currently under review</p>
        </div>
      ) : (
        <div>
          {papers.map((paper) => (
            <div key={paper.id} className="paper-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div className="paper-title">Paper #{paper.id}</div>
                  {paper.doi && (
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
                      DOI: {paper.doi}
                    </div>
                  )}
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px', fontFamily: 'monospace' }}>
                    IPFS: {paper.ipfsHash}
                  </div>
                </div>
                {paper.isAssigned && (
                  <span style={{
                    background: '#4caf50',
                    color: 'white',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.85rem'
                  }}>
                    Assigned to You
                  </span>
                )}
              </div>

              {paper.isAssigned && (
                <form onSubmit={submitReview} style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #f0f0f0' }}>
                  <input
                    type="hidden"
                    value={reviewForm.paperId}
                    onChange={(e) => setReviewForm({ ...reviewForm, paperId: paper.id })}
                  />

                  <div className="form-group">
                    <label>Score (1-10)</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={reviewForm.score}
                      onChange={(e) => setReviewForm({ ...reviewForm, score: Number(e.target.value), paperId: paper.id })}
                      style={{ width: '100%' }}
                    />
                    <div style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                      {reviewForm.score}/10
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Review Comments</label>
                    <textarea
                      value={reviewForm.comments}
                      onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                      placeholder="Provide detailed feedback on methodology, results, and conclusions..."
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Submit Review (Earn $100 USDC)
                  </button>
                </form>
              )}

              {!paper.isAssigned && (
                <div style={{
                  marginTop: '15px',
                  padding: '10px',
                  background: '#f5f5f5',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  This paper is assigned to other reviewers via Flare's Random Number Generator
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewPanel;
