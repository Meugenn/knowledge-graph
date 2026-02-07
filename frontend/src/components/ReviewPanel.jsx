import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import EnhancedReview from './EnhancedReview';
import EvaluationDisplay from './EvaluationDisplay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FadeIn } from '@/components/ui/fade-in';
import { Separator } from '@/components/ui/separator';
import { FileText } from 'lucide-react';

function ReviewPanel({ contracts, account }) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPaper, setExpandedPaper] = useState(null);
  const [isReviewer, setIsReviewer] = useState(false);
  const [stakeAmount, setStakeAmount] = useState('100');
  // Store evaluations keyed by paperId — in production this would come from IPFS
  const [evaluationsMap, setEvaluationsMap] = useState({});

  const loadPapersForReview = useCallback(async () => {
    if (!contracts.researchGraph) return;

    try {
      setLoading(true);
      const count = await contracts.researchGraph.paperCount();
      const loadedPapers = [];

      for (let i = 1; i <= Number(count); i++) {
        try {
          const paper = await contracts.researchGraph.getPaper(i);
          if (Number(paper.status) === 1) {
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
        } catch (e) {
          // Paper might not exist
        }
      }

      setPapers(loadedPapers);
    } catch (error) {
      console.error('Error loading papers:', error);
    } finally {
      setLoading(false);
    }
  }, [contracts.researchGraph, account]);

  useEffect(() => {
    loadPapersForReview();
  }, [loadPapersForReview]);

  const registerAsReviewer = async () => {
    try {
      const amount = ethers.parseEther(stakeAmount);

      const approveTx = await contracts.researchToken.approve(
        await contracts.researchGraph.getAddress(),
        amount
      );
      await approveTx.wait();

      const registerTx = await contracts.researchGraph.registerAsReviewer(amount);
      await registerTx.wait();

      alert('Successfully registered as reviewer!');
      setIsReviewer(true);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register: ' + (error.reason || error.message));
    }
  };

  const handleEnhancedSubmit = async ({ paperId, onChainScore, evaluationJson, evaluation }) => {
    try {
      // The evaluationJson would go to IPFS in production
      // For demo, we use a mock hash that encodes the composite score
      const mockIpfsHash = 'QmEval' + Math.random().toString(36).substring(7);

      const tx = await contracts.researchGraph.submitReview(
        paperId,
        onChainScore,
        mockIpfsHash
      );
      await tx.wait();

      // Store evaluation locally (in production: fetch from IPFS)
      setEvaluationsMap(prev => ({
        ...prev,
        [paperId]: [...(prev[paperId] || []), evaluation],
      }));

      setExpandedPaper(null);
      alert(`Evaluation submitted! Composite score: ${onChainScore}/10 on-chain. You will receive $100 USDC via Plasma.`);
      loadPapersForReview();
    } catch (error) {
      console.error('Review submission error:', error);
      alert('Failed to submit review: ' + (error.reason || error.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Loading papers for review
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
          Evaluate Research
        </h2>
        <p className="mt-2 text-neutral-600 font-light leading-relaxed">
          Multi-dimensional evaluation with confidence intervals, replication prediction, and journal tier forecasting.
        </p>
        <p className="mt-1 text-neutral-400 font-light text-sm leading-relaxed">
          Inspired by The Unjournal's open evaluation model -- enhanced with Bayesian aggregation and quantified uncertainty.
        </p>
      </div>

      {/* Reviewer Registration */}
      {!isReviewer && (
        <FadeIn>
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-700">
                Become a Reviewer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-600 font-light leading-relaxed text-sm">
                Stake RESEARCH tokens to become a reviewer. Your stake ensures review quality and can be slashed for poor reviews.
              </p>
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <label className="font-mono text-xs uppercase tracking-widest text-neutral-500">
                    Stake Amount (RESEARCH tokens)
                  </label>
                  <Input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    min="100"
                    step="10"
                  />
                </div>
                <Button onClick={registerAsReviewer}>
                  Register as Reviewer
                </Button>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Papers Under Review */}
      <div>
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-4">
          Papers Under Review ({papers.length})
        </h3>

        {papers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border border-neutral-200 bg-neutral-50">
            <FileText className="h-8 w-8 text-neutral-300 mb-3" />
            <p className="text-neutral-500 font-light">No papers currently under review</p>
          </div>
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => (
              <Card key={paper.id}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-semibold text-neutral-900">
                        Paper #{paper.id}
                      </div>
                      {paper.doi && (
                        <div className="text-neutral-500 font-light text-sm">
                          DOI: {paper.doi}
                        </div>
                      )}
                      <div className="font-mono text-xs text-neutral-400">
                        IPFS: {paper.ipfsHash}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      {paper.isAssigned && (
                        <Badge variant="success">Assigned to You</Badge>
                      )}
                    </div>
                  </div>

                  {/* Show existing evaluations */}
                  {evaluationsMap[paper.id]?.length > 0 && (
                    <div className="mt-4">
                      <EvaluationDisplay evaluations={evaluationsMap[paper.id]} compact />
                    </div>
                  )}

                  {paper.isAssigned && expandedPaper !== paper.id && (
                    <Button
                      className="mt-4 w-full"
                      onClick={() => setExpandedPaper(paper.id)}
                    >
                      Start Evaluation
                    </Button>
                  )}

                  {paper.isAssigned && expandedPaper === paper.id && (
                    <div className="mt-5 pt-5 border-t border-neutral-200">
                      <EnhancedReview
                        paperId={paper.id}
                        onSubmit={handleEnhancedSubmit}
                        account={account}
                      />
                    </div>
                  )}

                  {!paper.isAssigned && (
                    <div className="mt-4 p-3 bg-neutral-50 border border-neutral-100">
                      <span className="text-neutral-500 font-light text-sm">
                        This paper is assigned to other reviewers via Flare's Random Number Generator
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Demo Section */}
      <Separator />
      <Card className="bg-neutral-50">
        <CardHeader>
          <CardTitle className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
            Evaluation System Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-neutral-600 font-light leading-relaxed text-sm">
            This shows how aggregated evaluations look with multiple reviewers.
            Bayesian precision-weighting means confident reviewers count more.
          </p>
          <EvaluationDisplay evaluations={DEMO_EVALUATIONS} />
        </CardContent>
      </Card>
    </div>
  );
}

// Sample evaluations for demo display
const DEMO_EVALUATIONS = [
  {
    scores: {
      overall: { midpoint: 82, low: 75, high: 90 },
      novelty: { midpoint: 90, low: 85, high: 95 },
      methodology: { midpoint: 75, low: 60, high: 85 },
      reproducibility: { midpoint: 70, low: 55, high: 80 },
      clarity: { midpoint: 85, low: 78, high: 92 },
      impact: { midpoint: 95, low: 88, high: 99 },
    },
    replicationProbability: 65,
    tierShould: 5,
    tierWill: 4,
    writtenEvaluation: 'Groundbreaking architecture that fundamentally changed how we approach sequence modeling. The self-attention mechanism is elegant and well-motivated.',
    strengths: 'Novel architecture with clear theoretical motivation. Excellent empirical results across multiple benchmarks.',
    weaknesses: 'Limited analysis of failure modes. Computational cost scaling not fully explored.',
  },
  {
    scores: {
      overall: { midpoint: 78, low: 65, high: 88 },
      novelty: { midpoint: 85, low: 70, high: 93 },
      methodology: { midpoint: 80, low: 72, high: 88 },
      reproducibility: { midpoint: 60, low: 40, high: 75 },
      clarity: { midpoint: 82, low: 75, high: 90 },
      impact: { midpoint: 88, low: 78, high: 95 },
    },
    replicationProbability: 58,
    tierShould: 4,
    tierWill: 4,
    writtenEvaluation: 'Strong contribution with impressive results. Some concerns about reproducibility given the scale of compute required.',
    strengths: 'Clean formulation of attention. Strong ablation studies.',
    weaknesses: 'Reproducibility concerns due to compute requirements. Some claims about universality are overstated.',
  },
  {
    scores: {
      overall: { midpoint: 88, low: 82, high: 94 },
      novelty: { midpoint: 92, low: 88, high: 97 },
      methodology: { midpoint: 82, low: 74, high: 90 },
      reproducibility: { midpoint: 75, low: 65, high: 85 },
      clarity: { midpoint: 90, low: 85, high: 95 },
      impact: { midpoint: 96, low: 92, high: 99 },
    },
    replicationProbability: 72,
    tierShould: 5,
    tierWill: 5,
    writtenEvaluation: 'One of the most important papers in the last decade. The Transformer architecture has become the foundation for virtually all modern AI systems.',
    strengths: 'Paradigm-shifting architecture. Exceptional clarity of writing. Results speak for themselves.',
    weaknesses: 'Could have explored theoretical properties more deeply. Limited discussion of societal implications.',
  },
];

export default ReviewPanel;
