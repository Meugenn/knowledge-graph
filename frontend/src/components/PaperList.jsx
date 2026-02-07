import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { RefreshCw, ExternalLink, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/fade-in';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_LABELS = ['Submitted', 'Under Review', 'Accepted', 'Rejected'];
const STATUS_VARIANTS = ['info', 'warning', 'success', 'destructive'];

function PaperList({ contracts, account }) {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      loadPapers();
    } catch (error) {
      console.error('Verification error:', error);
    }
  };

  const addCitation = async (citingPaperId, citedPaperId) => {
    try {
      const tx = await contracts.researchGraph.addCitation(citingPaperId, citedPaperId);
      await tx.wait();
      loadPapers();
    } catch (error) {
      console.error('Citation error:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-neutral-400 font-light mb-2">No papers submitted yet.</p>
        <p className="text-sm text-neutral-400">Submit the first research paper to the graph.</p>
      </div>
    );
  }

  return (
    <div>
      <FadeIn>
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="section-label mb-2 block">On-Chain</span>
            <h2 className="section-title">Papers ({papers.length})</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs uppercase tracking-widest"
            onClick={loadPapers}
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </FadeIn>

      <div className="space-y-4">
        {papers.map((paper, i) => (
          <FadeIn key={paper.id} delay={0.05 * i}>
            <div className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-medium">Paper #{paper.id}</span>
                    {paper.doi && (
                      <span className="font-mono text-xs text-neutral-400">DOI: {paper.doi}</span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-neutral-400">
                    {paper.author.slice(0, 10)}...{paper.author.slice(-8)}
                  </span>
                </div>
                <Badge variant={STATUS_VARIANTS[paper.status]}>
                  {STATUS_LABELS[paper.status]}
                </Badge>
              </div>

              <div className="flex items-center gap-6 text-xs text-neutral-500 font-mono mb-4">
                <span>{new Date(paper.timestamp * 1000).toLocaleDateString()}</span>
                <span>{paper.citationCount} citations</span>
                <span>{paper.replicationCount} replications</span>
                {paper.externalDataVerified && (
                  <Badge variant="success" className="text-[10px]">Verified</Badge>
                )}
              </div>

              <div className="bg-neutral-50 border border-neutral-100 px-3 py-2 font-mono text-xs text-neutral-500 mb-4 truncate">
                IPFS: {paper.ipfsHash}
              </div>

              <div className="flex gap-2">
                {!paper.externalDataVerified && paper.doi && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-[10px] uppercase tracking-widest"
                    onClick={() => verifyExternalData(paper.id)}
                  >
                    <Search className="h-3 w-3" />
                    Verify
                  </Button>
                )}
                {paper.status === 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-[10px] uppercase tracking-widest"
                    onClick={() => {
                      const citingId = prompt('Enter the ID of the citing paper:');
                      if (citingId) addCitation(Number(citingId), paper.id);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                    Add Citation
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-[10px] uppercase tracking-widest"
                  onClick={() => window.open(`https://ipfs.io/ipfs/${paper.ipfsHash}`, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  IPFS
                </Button>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}

export default PaperList;
