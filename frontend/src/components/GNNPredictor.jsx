import React, { useState, useCallback } from 'react';
import { runGNNPipeline } from '../utils/gnn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const PHASES = [
  { id: 1, label: 'Building Graph Features' },
  { id: 2, label: 'Training GCN' },
  { id: 3, label: 'Predicting Links' },
];

function GNNPredictor({ graphData, onPredictionsReady }) {
  const [running, setRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [completedPhases, setCompletedPhases] = useState(new Set());
  const [phaseInfo, setPhaseInfo] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [showOnGraph, setShowOnGraph] = useState(false);

  const handleRun = useCallback(async () => {
    setRunning(true);
    setCurrentPhase(0);
    setCompletedPhases(new Set());
    setPhaseInfo(null);
    setTrainingProgress(null);
    setPredictions(null);
    setShowOnGraph(false);

    try {
      const results = await runGNNPipeline(graphData, {
        onPhaseStart: (phase) => {
          setCurrentPhase(phase);
        },
        onPhaseComplete: (phase, info) => {
          setCompletedPhases(prev => new Set([...prev, phase]));
          if (phase === 1) setPhaseInfo(info);
        },
        onTrainingProgress: ({ epoch, loss }) => {
          setTrainingProgress({ epoch, loss });
        },
      });

      setPredictions(results);
    } catch (err) {
      console.error('GNN pipeline error:', err);
    }
    setRunning(false);
  }, [graphData]);

  const handleToggleGraph = useCallback(() => {
    const next = !showOnGraph;
    setShowOnGraph(next);
    if (onPredictionsReady) {
      onPredictionsReady(next ? predictions : null);
    }
  }, [showOnGraph, predictions, onPredictionsReady]);

  const getPhaseStatus = (phaseId) => {
    if (completedPhases.has(phaseId)) return 'complete';
    if (currentPhase === phaseId) return 'active';
    return 'pending';
  };

  return (
    <div className="border border-neutral-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
            GCN Link Prediction
          </span>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleRun}
          disabled={running || graphData.nodes.length < 3}
        >
          {running ? 'Running...' : 'Run GCN'}
        </Button>
      </div>

      {(running || predictions) && (
        <div>
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-0 p-4 border-b border-neutral-100">
            {PHASES.map((phase, idx) => {
              const status = getPhaseStatus(phase.id);
              return (
                <React.Fragment key={phase.id}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-7 h-7 flex items-center justify-center text-xs font-mono border ${
                      status === 'complete'
                        ? 'bg-neutral-900 border-neutral-900 text-white'
                        : status === 'active'
                        ? 'bg-white border-neutral-900 text-neutral-900'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                    }`}>
                      {completedPhases.has(phase.id) ? <Check className="w-3.5 h-3.5" /> : phase.id}
                    </div>
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${
                      status === 'complete' || status === 'active'
                        ? 'text-neutral-700'
                        : 'text-neutral-400'
                    }`}>
                      {phase.label}
                    </span>
                  </div>
                  {idx < PHASES.length - 1 && (
                    <div className={`w-12 h-px mx-2 mt-[-16px] ${
                      completedPhases.has(phase.id) ? 'bg-neutral-900' : 'bg-neutral-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Feature Info */}
          {phaseInfo && (
            <div className="grid grid-cols-3 gap-px bg-neutral-100 border-b border-neutral-100">
              <div className="bg-white p-3 text-center">
                <span className="block font-mono text-sm font-bold text-neutral-900">{phaseInfo.nodeCount}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Nodes</span>
              </div>
              <div className="bg-white p-3 text-center">
                <span className="block font-mono text-sm font-bold text-neutral-900">{phaseInfo.edgeCount}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Edges</span>
              </div>
              <div className="bg-white p-3 text-center">
                <span className="block font-mono text-sm font-bold text-neutral-900">{phaseInfo.featDim}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Features</span>
              </div>
            </div>
          )}

          {/* Training Progress */}
          {currentPhase === 2 && trainingProgress && !completedPhases.has(2) && (
            <div className="p-4 border-b border-neutral-100">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-500">Epoch: <strong className="text-neutral-800">{trainingProgress.epoch}/100</strong></span>
                <span className="text-neutral-500">Loss: <strong className="text-neutral-800">{trainingProgress.loss.toFixed(4)}</strong></span>
              </div>
              <div className="h-1.5 bg-neutral-100 w-full">
                <div
                  className="h-full bg-neutral-700 transition-all duration-150"
                  style={{ width: `${trainingProgress.epoch}%` }}
                />
              </div>
            </div>
          )}

          {/* Results Table */}
          {predictions && predictions.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                  Top Predicted Links
                </h4>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    checked={showOnGraph}
                    onChange={handleToggleGraph}
                    className="accent-neutral-900"
                  />
                  <span className="font-mono text-xs">Show on graph</span>
                </label>
              </div>
              <div className="divide-y divide-neutral-100">
                {predictions.slice(0, 10).map((pred, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="font-mono text-xs text-neutral-400 w-6">#{i + 1}</span>
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      <span className="text-sm text-neutral-700 truncate">
                        {pred.sourceName.length > 35
                          ? pred.sourceName.slice(0, 33) + '...'
                          : pred.sourceName}
                      </span>
                      <span className="text-neutral-300 text-xs shrink-0">&harr;</span>
                      <span className="text-sm text-neutral-700 truncate">
                        {pred.targetName.length > 35
                          ? pred.targetName.slice(0, 33) + '...'
                          : pred.targetName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-bold text-neutral-800">
                        {(pred.score * 100).toFixed(1)}%
                      </span>
                      <div className="w-16 h-1 bg-neutral-100">
                        <div
                          className="h-full bg-neutral-700"
                          style={{ width: `${pred.score * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {predictions && predictions.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-neutral-500 font-light text-sm">
                No new links predicted -- the graph is already well-connected.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GNNPredictor;
