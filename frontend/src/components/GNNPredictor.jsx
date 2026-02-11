import React, { useState, useCallback } from 'react';
import { runGNNPipeline } from '../utils/gnn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Layers, Star, GitBranch } from 'lucide-react';

const PHASES = [
  { id: 1, label: 'Features' },
  { id: 2, label: 'Training' },
  { id: 3, label: 'Predicting' },
  { id: 4, label: 'Analysing' },
];

const RESULT_TABS = [
  { id: 'links', label: 'Predicted Links', icon: GitBranch },
  { id: 'key', label: 'Key Papers', icon: Star },
  { id: 'gaps', label: 'Research Gaps', icon: Layers },
];

function GNNPredictor({ graphData, onPredictionsReady, onHighlight }) {
  const [running, setRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [completedPhases, setCompletedPhases] = useState(new Set());
  const [phaseInfo, setPhaseInfo] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [showOnGraph, setShowOnGraph] = useState(false);
  const [activeTab, setActiveTab] = useState('links');

  const handleRun = useCallback(async () => {
    setRunning(true);
    setCurrentPhase(0);
    setCompletedPhases(new Set());
    setPhaseInfo(null);
    setTrainingProgress(null);
    setResults(null);
    setShowOnGraph(false);
    setActiveTab('links');

    try {
      const res = await runGNNPipeline(graphData, {
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

      setResults(res);
    } catch (err) {
      console.error('GNN pipeline error:', err);
    }
    setRunning(false);
  }, [graphData]);

  const handleToggleGraph = useCallback(() => {
    const next = !showOnGraph;
    setShowOnGraph(next);
    if (onPredictionsReady) {
      onPredictionsReady(next ? results?.predictions : null);
    }
  }, [showOnGraph, results, onPredictionsReady]);

  const getPhaseStatus = (phaseId) => {
    if (completedPhases.has(phaseId)) return 'complete';
    if (currentPhase === phaseId) return 'active';
    return 'pending';
  };

  const predictions = results?.predictions || [];
  const clusters = results?.clusters || [];
  const keyPapers = results?.keyPapers || [];
  const gaps = results?.gaps || [];

  return (
    <div className="border border-neutral-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
            GCN Analysis
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

      {(running || results) && (
        <div>
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-0 p-3 border-b border-neutral-100">
            {PHASES.map((phase, idx) => {
              const status = getPhaseStatus(phase.id);
              return (
                <React.Fragment key={phase.id}>
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 flex items-center justify-center text-[10px] font-mono border ${
                      status === 'complete'
                        ? 'bg-neutral-900 border-neutral-900 text-white'
                        : status === 'active'
                        ? 'bg-white border-neutral-900 text-neutral-900'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                    }`}>
                      {completedPhases.has(phase.id) ? <Check className="w-3 h-3" /> : phase.id}
                    </div>
                    <span className={`font-mono text-[9px] uppercase tracking-wider ${
                      status === 'complete' || status === 'active'
                        ? 'text-neutral-700'
                        : 'text-neutral-400'
                    }`}>
                      {phase.label}
                    </span>
                  </div>
                  {idx < PHASES.length - 1 && (
                    <div className={`w-8 h-px mx-1 mt-[-14px] ${
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
              <div className="bg-white p-2 text-center">
                <span className="block font-mono text-sm font-bold text-neutral-900">{phaseInfo.nodeCount}</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">Nodes</span>
              </div>
              <div className="bg-white p-2 text-center">
                <span className="block font-mono text-sm font-bold text-neutral-900">{phaseInfo.edgeCount}</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">Edges</span>
              </div>
              <div className="bg-white p-2 text-center">
                <span className="block font-mono text-sm font-bold text-neutral-900">{phaseInfo.featDim}</span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">Features</span>
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

          {/* Insights Summary — shown after analysis complete */}
          {results && (
            <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-mono">{clusters.length} clusters</Badge>
                <Badge variant="outline" className="text-[10px] font-mono">{keyPapers.length} key papers</Badge>
                <Badge variant="outline" className="text-[10px] font-mono">{predictions.length} predicted links</Badge>
                <Badge variant="outline" className="text-[10px] font-mono">{gaps.length} research gaps</Badge>
              </div>
            </div>
          )}

          {/* Result Tabs */}
          {results && (
            <>
              <div className="flex border-b border-neutral-200">
                {RESULT_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                      activeTab === tab.id
                        ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-px'
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                  >
                    <tab.icon className="h-3 w-3" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Predicted Links Tab */}
              {activeTab === 'links' && (
                <div>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-100">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                      Top {Math.min(predictions.length, 10)} links
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-600">
                      <input
                        type="checkbox"
                        checked={showOnGraph}
                        onChange={handleToggleGraph}
                        className="accent-neutral-900"
                      />
                      <span className="font-mono text-[10px]">Show on graph</span>
                    </label>
                  </div>
                  {predictions.length > 0 ? (
                    <div className="divide-y divide-neutral-100 max-h-[200px] overflow-y-auto">
                      {predictions.slice(0, 10).map((pred, i) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-2">
                          <span className="font-mono text-[10px] text-neutral-400 w-5">#{i + 1}</span>
                          <div className="flex-1 min-w-0 text-xs text-neutral-700 truncate">
                            {pred.sourceName?.slice(0, 30)}
                            <span className="text-neutral-300 mx-1">&harr;</span>
                            {pred.targetName?.slice(0, 30)}
                          </div>
                          <span className="font-mono text-[10px] font-bold text-neutral-800 shrink-0">
                            {(pred.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-neutral-400 font-light">
                      No new links predicted — graph is well-connected.
                    </div>
                  )}
                </div>
              )}

              {/* Key Papers Tab */}
              {activeTab === 'key' && (
                <div className="divide-y divide-neutral-100 max-h-[250px] overflow-y-auto">
                  {keyPapers.map((paper, i) => (
                    <div key={paper.id} className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-50 transition-colors">
                      <span className="font-mono text-[10px] text-neutral-400 w-5">#{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-neutral-800 truncate">{paper.title}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-neutral-400 font-mono">{(paper.citationCount || 0).toLocaleString()} cites</span>
                          <span className="text-[9px] text-neutral-400 font-mono">deg:{paper.degree}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className={`text-[9px] font-mono px-1.5 py-0 ${
                          paper.role === 'bridge' ? 'border-purple-300 text-purple-600' :
                          paper.role === 'hub' ? 'border-blue-300 text-blue-600' :
                          'border-neutral-200 text-neutral-500'
                        }`}>
                          {paper.role}
                        </Badge>
                        <span className="font-mono text-[10px] font-bold text-neutral-700">
                          {paper.influence}
                        </span>
                      </div>
                    </div>
                  ))}
                  {keyPapers.length === 0 && (
                    <div className="p-4 text-center text-xs text-neutral-400 font-light">
                      Not enough data for key paper analysis.
                    </div>
                  )}
                </div>
              )}

              {/* Research Gaps Tab */}
              {activeTab === 'gaps' && (
                <div className="max-h-[250px] overflow-y-auto">
                  {gaps.map((gap, i) => (
                    <div key={i} className="px-4 py-3 border-b border-neutral-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] font-mono">{gap.clusterA.label} ({gap.clusterA.size})</Badge>
                          <span className="text-neutral-300 text-[10px]">&harr;</span>
                          <Badge variant="outline" className="text-[9px] font-mono">{gap.clusterB.label} ({gap.clusterB.size})</Badge>
                        </div>
                        <span className="font-mono text-[10px] text-neutral-500">gap: {gap.distance}</span>
                      </div>
                      {gap.bridgePaperA && gap.bridgePaperB && (
                        <div className="text-[10px] text-neutral-500 mt-1">
                          <span className="text-neutral-400">Closest papers:</span>{' '}
                          <span className="text-neutral-600">{gap.bridgePaperA.title?.slice(0, 40)}</span>
                          <span className="text-neutral-300 mx-1">&harr;</span>
                          <span className="text-neutral-600">{gap.bridgePaperB.title?.slice(0, 40)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {gaps.length === 0 && (
                    <div className="p-4 text-center text-xs text-neutral-400 font-light">
                      Not enough clusters to identify research gaps.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default GNNPredictor;
