import React from 'react';
import { X, ExternalLink, Play, FlaskConical, ArrowUpRight } from 'lucide-react';
import { GRAPH_COLORS } from '../config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EvaluationDisplay from './EvaluationDisplay';

function PaperDetail({ paper, onClose, onImport, onMakeRunnable, onReplicate, evaluations }) {
  if (!paper) return null;

  const sourceLabel = paper.onChain ? 'On-Chain' : paper.source === 'seed' ? 'Seed' : 'Semantic Scholar';
  const statusLabels = ['Submitted', 'Under Review', 'Accepted', 'Rejected'];

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-[420px] max-w-[90vw] bg-white border-l border-neutral-200 overflow-y-auto animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Badge variant="outline" className="font-mono text-[10px]">
              {sourceLabel}
            </Badge>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Title */}
          <h2 className="text-xl font-medium leading-snug mb-4">{paper.title}</h2>

          {/* Authors */}
          {paper.authors?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {paper.authors.map((a, i) => (
                <span key={i} className="text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 px-2 py-0.5">
                  {typeof a === 'string' ? a : a.name}
                </span>
              ))}
            </div>
          )}

          {/* Meta */}
          <div className="space-y-2 text-sm mb-6">
            {paper.year && (
              <div className="flex justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Year</span>
                <span className="text-neutral-700">{paper.year}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Citations</span>
              <span className="text-neutral-700">{(paper.citationCount || 0).toLocaleString()}</span>
            </div>
            {paper.fieldsOfStudy?.length > 0 && (
              <div className="flex justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Fields</span>
                <span className="text-neutral-700 text-right text-xs">{paper.fieldsOfStudy.join(', ')}</span>
              </div>
            )}
            {paper.doi && (
              <div className="flex justify-between">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">DOI</span>
                <a
                  href={`https://doi.org/${paper.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neutral-700 hover:text-neutral-900 text-xs underline underline-offset-2"
                >
                  {paper.doi}
                </a>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Abstract */}
          {paper.abstract && (
            <div className="mb-6">
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">Abstract</span>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">{paper.abstract}</p>
            </div>
          )}

          {/* On-Chain Data */}
          {paper.onChain && (
            <>
              <Separator className="my-6" />
              <div className="mb-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-3">On-Chain Data</span>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Paper ID</span>
                    <span>#{paper.onChainId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Status</span>
                    <Badge variant="outline" className="text-[10px]">
                      {statusLabels[paper.onChainStatus] || 'Unknown'}
                    </Badge>
                  </div>
                  {paper.onChainAuthor && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Author</span>
                      <code className="text-xs">{paper.onChainAuthor.slice(0, 6)}...{paper.onChainAuthor.slice(-4)}</code>
                    </div>
                  )}
                  {paper.ipfsHash && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">IPFS</span>
                      <a
                        href={`https://ipfs.io/ipfs/${paper.ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline underline-offset-2"
                      >
                        {paper.ipfsHash.slice(0, 12)}...
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Evaluations */}
          {evaluations && evaluations.length > 0 && (
            <>
              <Separator className="my-6" />
              <div className="mb-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-3">Evaluation</span>
                <EvaluationDisplay evaluations={evaluations} compact />
              </div>
            </>
          )}

          <Separator className="my-6" />

          {/* Actions */}
          <div className="space-y-2">
            {paper.paperId && paper.paperId.length > 10 && (
              <a
                href={`https://www.semanticscholar.org/paper/${paper.paperId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button variant="outline" size="sm" className="w-full font-mono text-[10px] uppercase tracking-widest justify-between">
                  Semantic Scholar
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </a>
            )}

            {paper.githubRepo && onMakeRunnable && (
              <Button
                variant="outline"
                size="sm"
                className="w-full font-mono text-[10px] uppercase tracking-widest"
                onClick={() => onMakeRunnable(paper)}
              >
                <Play className="h-3 w-3" />
                Make Runnable
              </Button>
            )}

            {onReplicate && (
              <Button
                variant="outline"
                size="sm"
                className="w-full font-mono text-[10px] uppercase tracking-widest"
                onClick={() => onReplicate(paper)}
              >
                <FlaskConical className="h-3 w-3" />
                Replicate
              </Button>
            )}

            {!paper.onChain && onImport && (
              <Button
                className="w-full bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-[10px] uppercase tracking-widest"
                onClick={() => onImport(paper)}
              >
                Import to Blockchain
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaperDetail;
