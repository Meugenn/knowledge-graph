import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const TYPE_LABELS = {
  breakthrough: 'Breakthrough',
  critical_gap: 'Critical Gap',
  direction: 'Direction',
};

const TYPE_BADGE_VARIANT = {
  breakthrough: 'warning',
  critical_gap: 'destructive',
  direction: 'info',
};

function CheckpointDialog({ checkpoint, onContinue, onRedirect, onStop }) {
  const [feedback, setFeedback] = useState('');
  const [showRedirect, setShowRedirect] = useState(false);
  const [newGuidance, setNewGuidance] = useState('');

  if (!checkpoint) return null;

  const { iterationId, topFindings = [], stats = {} } = checkpoint;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-200 w-full max-w-xl max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100">
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-neutral-800">
            Checkpoint: Iteration {iterationId}
          </h3>
          <p className="text-neutral-600 font-light leading-relaxed text-sm mt-1">
            RALPH has completed {iterationId} iterations. Review progress and decide how to proceed.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-px bg-neutral-100 border-b border-neutral-100">
          <div className="bg-white p-4 text-center">
            <span className="block font-mono text-lg font-bold text-neutral-900">{stats.hypothesesChecked || 0}</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Checked</span>
          </div>
          <div className="bg-white p-4 text-center">
            <span className="block font-mono text-lg font-bold text-neutral-900">{stats.avgNovelty || 0}%</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Avg Novelty</span>
          </div>
          <div className="bg-white p-4 text-center">
            <span className="block font-mono text-lg font-bold text-neutral-900">{stats.avgTrust || 0}%</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Avg Trust</span>
          </div>
          <div className="bg-white p-4 text-center">
            <span className="block font-mono text-lg font-bold text-neutral-900">{stats.totalFlags || 0}</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Flags</span>
          </div>
        </div>

        {/* Top Findings */}
        {topFindings.length > 0 && (
          <div className="p-6 border-b border-neutral-100">
            <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">
              Top Findings
            </h4>
            <div className="space-y-2">
              {topFindings.slice(0, 8).map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant={TYPE_BADGE_VARIANT[f.type] || 'outline'} className="shrink-0 mt-0.5">
                    {TYPE_LABELS[f.type] || f.type}
                  </Badge>
                  <span className="font-mono text-xs text-neutral-400 shrink-0 mt-0.5">
                    Iter {f.iterationId}
                  </span>
                  <span className="text-neutral-600 font-light leading-relaxed">{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback */}
        <div className="p-6 space-y-4">
          <div>
            <label className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-2">
              Notes (optional)
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any observations or notes about the run so far..."
              rows={2}
            />
          </div>

          {showRedirect && (
            <div>
              <label className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 block mb-2">
                New Research Direction
              </label>
              <Textarea
                value={newGuidance}
                onChange={(e) => setNewGuidance(e.target.value)}
                placeholder="e.g. Focus more on protein folding approaches using diffusion models..."
                rows={2}
                autoFocus
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="default"
              onClick={() => onContinue(feedback)}
            >
              Continue
            </Button>
            {!showRedirect ? (
              <Button
                variant="outline"
                onClick={() => setShowRedirect(true)}
              >
                Redirect
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => onRedirect(feedback, newGuidance)}
                disabled={!newGuidance.trim()}
              >
                Apply New Direction
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => onStop(feedback)}
            >
              Stop Run
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckpointDialog;
