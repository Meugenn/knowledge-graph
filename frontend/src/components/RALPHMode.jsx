import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RALPHEngine } from '../utils/ralphEngine';
import { FRONTIER_AGENTS } from '../utils/frontierDefinitions';
import FrontierReport from './FrontierReport';
import VerificationPanel from './VerificationPanel';
import CheckpointDialog from './CheckpointDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function buildInitialAgentStates() {
  return Object.fromEntries(
    FRONTIER_AGENTS.map(a => [a.id, { status: 'pending', output: null, duration: null }])
  );
}

function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

const HEALTH_DOT_COLORS = { healthy: '#38a169', warning: '#d69e2e', critical: '#e53e3e' };

function RALPHMode({ seedPapers, hasApiKey }) {
  const engineRef = useRef(null);
  const elapsedRef = useRef(null);
  const startTimeRef = useRef(null);

  const [status, setStatus] = useState('idle');
  const [guidance, setGuidance] = useState('');
  const [iterations, setIterations] = useState([]);
  const [queueLength, setQueueLength] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [currentIteration, setCurrentIteration] = useState(null);
  const [agentStates, setAgentStates] = useState(buildInitialAgentStates());
  const [expandedIteration, setExpandedIteration] = useState(null);
  const [stats, setStats] = useState(null);

  // Verification state
  const [verificationStats, setVerificationStats] = useState(null);
  const [activeCheckpoint, setActiveCheckpoint] = useState(null);
  const [verificationSettings, setVerificationSettings] = useState({
    enabled: true,
    checkpointInterval: 5,
    pauseOnCritical: true,
    runHypothesisCheck: true,
    runSourceCheck: true,
    runLoopQuality: true,
  });

  // Create engine once
  useEffect(() => {
    const engine = new RALPHEngine({
      onStatusChange: (s) => setStatus(s),
      onIterationStart: (id, papers) => {
        setCurrentIteration({ id, papers });
        setAgentStates(buildInitialAgentStates());
      },
      onIterationComplete: (iteration) => {
        setIterations(prev => [iteration, ...prev]);
        setCurrentIteration(null);
        setAgentStates(buildInitialAgentStates());
      },
      onAgentUpdate: (agentId, updates) => {
        setAgentStates(prev => ({
          ...prev,
          [agentId]: { ...prev[agentId], ...updates },
        }));
      },
      onQueueChange: (queue) => setQueueLength(queue.length),
      onCooldown: (remaining) => setCooldown(remaining),
      onVerificationComplete: (iterationId, verification) => {
        // Update the iteration in state with verification data
        setIterations(prev => prev.map(it =>
          it.id === iterationId ? { ...it, verification } : it
        ));
      },
      onCheckpointTriggered: (checkpoint) => {
        setActiveCheckpoint(checkpoint);
      },
      onVerificationStatsUpdate: (stats) => {
        setVerificationStats(stats);
      },
    });
    engineRef.current = engine;

    return () => {
      engine.stop();
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  // Sync verification settings to engine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setVerificationSettings(verificationSettings);
    }
  }, [verificationSettings]);

  // Update accumulated stats when iterations change
  useEffect(() => {
    if (engineRef.current && iterations.length > 0) {
      setStats(engineRef.current.getAccumulatedStats());
    }
  }, [iterations]);

  // Elapsed timer
  useEffect(() => {
    if (status === 'running') {
      if (!startTimeRef.current) startTimeRef.current = Date.now();
      elapsedRef.current = setInterval(() => {
        setElapsed(Date.now() - startTimeRef.current);
      }, 1000);
    } else if (status === 'paused' || status === 'checkpoint') {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    } else if (status === 'stopped' || status === 'idle') {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [status]);

  const handleStart = useCallback(() => {
    if (!seedPapers || seedPapers.length === 0) return;
    startTimeRef.current = Date.now();
    setElapsed(0);
    setIterations([]);
    setStats(null);
    setVerificationStats(null);
    setExpandedIteration(null);
    setActiveCheckpoint(null);
    engineRef.current?.start(seedPapers, { guidance });
  }, [seedPapers, guidance]);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const handleStop = useCallback(() => {
    engineRef.current?.stop();
    setActiveCheckpoint(null);
  }, []);

  // Checkpoint handlers
  const handleCheckpointContinue = useCallback((feedback) => {
    engineRef.current?.resolveCheckpoint('continue', feedback);
    setActiveCheckpoint(null);
  }, []);

  const handleCheckpointRedirect = useCallback((feedback, newGuidance) => {
    engineRef.current?.resolveCheckpoint('redirect', feedback, newGuidance);
    setGuidance(newGuidance);
    setActiveCheckpoint(null);
  }, []);

  const handleCheckpointStop = useCallback((feedback) => {
    engineRef.current?.resolveCheckpoint('stop', feedback);
    setActiveCheckpoint(null);
  }, []);

  const exportFullRun = useCallback(() => {
    if (!engineRef.current) return;
    const data = engineRef.current.exportFullRun();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ralph-run-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const copySummary = useCallback(() => {
    if (!stats) return;
    const lines = [
      'RALPH Research Discovery Run',
      `Iterations: ${iterations.length}`,
      `Elapsed: ${formatElapsed(elapsed)}`,
      `Papers Explored: ${stats.totalPapers}`,
      `Gaps Found: ${stats.totalGaps}`,
      `Hypotheses Generated: ${stats.totalHypotheses}`,
      `Experiments Designed: ${stats.totalExperiments}`,
      `Fields Touched: ${stats.fieldsTouched}`,
      `Breakthroughs: ${stats.breakthroughs.length}`,
    ];
    if (verificationStats) {
      lines.push('', '--- Verification ---',
        `Verified: ${verificationStats.verifiedCount}`,
        `Avg Novelty: ${verificationStats.avgNoveltyScore}%`,
        `Avg Trust: ${verificationStats.avgTrustScore}%`,
        `Flags: ${verificationStats.totalHallucinationFlags}`,
      );
    }
    lines.push('', ...stats.breakthroughs.map(b => `* [Iter ${b.iterationId}] ${b.title}`));
    navigator.clipboard.writeText(lines.join('\n'));
  }, [stats, iterations, elapsed, verificationStats]);

  // Get top highlight from an iteration report
  const getHighlight = (report) => {
    if (!report) return null;
    const bh = (report.hypotheses || []).find(h => h.noveltyLevel === 'breakthrough');
    if (bh) return bh.title;
    const critGap = (report.gaps || []).find(g => g.severity === 'critical');
    if (critGap) return critGap.gap?.split(/\s+/).slice(0, 10).join(' ');
    const dir = (report.emergingDirections || []).find(d => d.potential === 'high');
    if (dir) return dir.direction;
    return null;
  };

  if (!hasApiKey) {
    return (
      <div className="flex items-center justify-center h-64 text-neutral-400 text-sm">
        <p>Set up an API key in the Research Navigator first.</p>
      </div>
    );
  }

  if (!seedPapers || seedPapers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-8">
        <div className="flex h-12 w-12 items-center justify-center border border-neutral-300 bg-neutral-100 text-neutral-500 font-mono font-bold text-lg mb-4">R</div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-1">RALPH</h2>
        <p className="text-sm text-neutral-500 mb-2">Research Autonomous Loop for Progressive Hypotheses</p>
        <p className="text-xs text-neutral-400 max-w-md">
          Select 1-5 seed papers from the left panel. RALPH will autonomously discover research frontiers,
          fetch related papers, and loop -- building a map of what areas of science will be solved.
        </p>
      </div>
    );
  }

  const isRunning = status === 'running' || status === 'paused' || status === 'checkpoint';

  return (
    <div className="space-y-4 p-4">
      {/* Research Direction */}
      <div className="space-y-2">
        <label className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">Research Direction</label>
        <Textarea
          placeholder='e.g. "Find a path to solving protein-drug interaction prediction using graph neural networks and molecular dynamics"'
          value={guidance}
          onChange={(e) => setGuidance(e.target.value)}
          disabled={isRunning}
          rows={2}
        />
        {guidance && !isRunning && (
          <p className="text-xs text-neutral-400">
            RALPH will steer discovery toward this goal -- biasing agent analysis, paper fetching, and scoring.
          </p>
        )}
      </div>

      {/* Verification Settings */}
      <div className="space-y-2">
        <label className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">Verification</label>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
            <Switch
              checked={verificationSettings.enabled}
              onCheckedChange={(checked) => setVerificationSettings(s => ({ ...s, enabled: checked }))}
              disabled={isRunning}
            />
            <span>Enabled</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
            <Switch
              checked={verificationSettings.runHypothesisCheck}
              onCheckedChange={(checked) => setVerificationSettings(s => ({ ...s, runHypothesisCheck: checked }))}
              disabled={isRunning || !verificationSettings.enabled}
            />
            <span>Hypothesis Check (+1 LLM call)</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
            <Switch
              checked={verificationSettings.runSourceCheck}
              onCheckedChange={(checked) => setVerificationSettings(s => ({ ...s, runSourceCheck: checked }))}
              disabled={isRunning || !verificationSettings.enabled}
            />
            <span>Source Check</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
            <Switch
              checked={verificationSettings.runLoopQuality}
              onCheckedChange={(checked) => setVerificationSettings(s => ({ ...s, runLoopQuality: checked }))}
              disabled={isRunning || !verificationSettings.enabled}
            />
            <span>Loop Quality</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
            <Switch
              checked={verificationSettings.pauseOnCritical}
              onCheckedChange={(checked) => setVerificationSettings(s => ({ ...s, pauseOnCritical: checked }))}
              disabled={isRunning || !verificationSettings.enabled}
            />
            <span>Pause on Critical</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-neutral-600">
            <span>Checkpoint every</span>
            <Input
              type="number"
              min={2}
              max={50}
              value={verificationSettings.checkpointInterval}
              onChange={(e) => setVerificationSettings(s => ({ ...s, checkpointInterval: parseInt(e.target.value) || 5 }))}
              disabled={isRunning || !verificationSettings.enabled}
              className="w-16 h-7 text-xs"
            />
            <span>iterations</span>
          </label>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between border border-neutral-200 px-4 py-3">
        <div className="flex items-center gap-2">
          {status === 'idle' || status === 'stopped' ? (
            <Button size="sm" onClick={handleStart}>
              Start RALPH
            </Button>
          ) : status === 'running' ? (
            <>
              <Button variant="outline" size="sm" onClick={handlePause}>
                Pause
              </Button>
              <Button variant="destructive" size="sm" onClick={handleStop}>
                Stop
              </Button>
            </>
          ) : status === 'paused' ? (
            <>
              <Button size="sm" onClick={handleResume}>
                Resume
              </Button>
              <Button variant="destructive" size="sm" onClick={handleStop}>
                Stop
              </Button>
            </>
          ) : status === 'checkpoint' ? (
            <Badge variant="warning">Checkpoint Review...</Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-neutral-500">
            <strong className="text-neutral-900">Iter:</strong> {iterations.length}
          </span>
          <span className="font-mono text-neutral-600">
            {formatElapsed(elapsed)}
          </span>
          <Badge variant="outline">
            Queue: {queueLength}
          </Badge>
          {cooldown > 0 && (
            <Badge variant="info">
              Cooldown: {Math.ceil(cooldown / 1000)}s
            </Badge>
          )}
        </div>
      </div>

      {/* Live Iteration */}
      {currentIteration && (
        <div className="border border-neutral-200 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-900">
            <span className="inline-block h-2 w-2 bg-green-600 animate-pulse" />
            LIVE: Running iteration {currentIteration.id}...
          </div>
          <div className="flex flex-wrap gap-1">
            {currentIteration.papers.map((p, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {p.title?.length > 50 ? p.title.slice(0, 50) + '...' : p.title}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {FRONTIER_AGENTS.map((agent, i) => {
              const agentStatus = agentStates[agent.id]?.status;
              const firstLetter = agent.name?.charAt(0) || '?';
              return (
                <React.Fragment key={agent.id}>
                  {i > 0 && <span className="text-neutral-300 text-xs mx-0.5">{'\u2192'}</span>}
                  <span
                    className={`flex h-7 w-7 items-center justify-center border text-xs font-mono font-bold ${
                      agentStatus === 'working'
                        ? 'border-neutral-900 bg-neutral-900 text-white agent-pulse'
                        : agentStatus === 'complete'
                        ? 'border-green-700 bg-green-50 text-green-700'
                        : agentStatus === 'error'
                        ? 'border-red-700 bg-red-50 text-red-700'
                        : 'border-neutral-300 bg-neutral-100 text-neutral-400'
                    }`}
                    title={agent.name}
                  >
                    {firstLetter}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}

      {/* Discovery Timeline */}
      {iterations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">Discovery Timeline</h3>
          <div className="space-y-2">
            {iterations.map(iter => {
              const highlight = getHighlight(iter.report);
              const gapCount = (iter.report?.gaps || []).length;
              const hypothesisCount = (iter.report?.hypotheses || []).length;
              const isExpanded = expandedIteration === iter.id;
              const health = iter.verification?.loopQuality?.overallHealth;

              return (
                <div key={iter.id} className="border border-neutral-200">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-neutral-50 transition-colors"
                    onClick={() => setExpandedIteration(isExpanded ? null : iter.id)}
                  >
                    <div className="flex items-center gap-3 text-sm">
                      {health && (
                        <span
                          className="inline-block h-2 w-2 shrink-0"
                          style={{ background: HEALTH_DOT_COLORS[health] || '#a0aec0' }}
                          title={`Loop health: ${health}`}
                        />
                      )}
                      <span className="font-semibold text-neutral-900">Iter {iter.id}</span>
                      <span className="text-xs font-mono text-neutral-400">({formatDuration(iter.durationMs)})</span>
                      <span className="text-xs text-neutral-500">
                        {gapCount} gaps, {hypothesisCount} hypotheses
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                  </div>
                  {highlight && (
                    <div className="px-4 pb-1 text-xs text-neutral-500">
                      * {highlight}
                    </div>
                  )}
                  <div className="px-4 pb-3 text-xs text-neutral-400">
                    Papers: {iter.papers.map(p => p.title?.slice(0, 30)).join(', ')}
                    {iter.newPapersFound > 0 && (
                      <Badge variant="success" className="ml-2">+{iter.newPapersFound} papers queued</Badge>
                    )}
                  </div>
                  {isExpanded && iter.report && (
                    <div className="border-t border-neutral-200 p-4 space-y-4">
                      <FrontierReport report={iter.report} />
                      {iter.verification && <VerificationPanel verification={iter.verification} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Accumulated Insights */}
      {stats && (
        <div className="space-y-4">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">Accumulated Insights</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="border border-neutral-200 p-3 text-center">
              <span className="block text-2xl font-semibold text-neutral-900">{stats.totalPapers}</span>
              <span className="block text-xs text-neutral-400 mt-1">Papers</span>
            </div>
            <div className="border border-neutral-200 p-3 text-center">
              <span className="block text-2xl font-semibold text-neutral-900">{stats.totalGaps}</span>
              <span className="block text-xs text-neutral-400 mt-1">Gaps</span>
            </div>
            <div className="border border-neutral-200 p-3 text-center">
              <span className="block text-2xl font-semibold text-neutral-900">{stats.totalHypotheses}</span>
              <span className="block text-xs text-neutral-400 mt-1">Hypotheses</span>
            </div>
            <div className="border border-neutral-200 p-3 text-center">
              <span className="block text-2xl font-semibold text-neutral-900">{stats.totalExperiments}</span>
              <span className="block text-xs text-neutral-400 mt-1">Experiments</span>
            </div>
            <div className="border border-neutral-200 p-3 text-center">
              <span className="block text-2xl font-semibold text-neutral-900">{stats.fieldsTouched}</span>
              <span className="block text-xs text-neutral-400 mt-1">Fields</span>
            </div>
            <div className="border border-neutral-900 bg-neutral-900 p-3 text-center">
              <span className="block text-2xl font-semibold text-white">{stats.breakthroughs.length}</span>
              <span className="block text-xs text-neutral-400 mt-1">Breakthroughs</span>
            </div>
          </div>

          {/* Verification Summary */}
          {verificationStats && verificationStats.verifiedCount > 0 && (
            <div className="space-y-2">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">Verification Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="border border-neutral-200 p-3 text-center">
                  <span className="block text-2xl font-semibold text-neutral-900">{verificationStats.verifiedCount}</span>
                  <span className="block text-xs text-neutral-400 mt-1">Verified</span>
                </div>
                <div className="border border-neutral-200 p-3 text-center">
                  <span className="block text-2xl font-semibold text-neutral-900">{verificationStats.avgNoveltyScore}%</span>
                  <span className="block text-xs text-neutral-400 mt-1">Avg Novelty</span>
                </div>
                <div className="border border-neutral-200 p-3 text-center">
                  <span className="block text-2xl font-semibold text-neutral-900">{verificationStats.avgTrustScore}%</span>
                  <span className="block text-xs text-neutral-400 mt-1">Avg Trust</span>
                </div>
                <div className="border border-neutral-200 p-3 text-center">
                  <span className="block text-2xl font-semibold text-neutral-900">{verificationStats.totalHallucinationFlags}</span>
                  <span className="block text-xs text-neutral-400 mt-1">Flags</span>
                </div>
              </div>
            </div>
          )}

          {stats.breakthroughs.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">Top Breakthroughs</h4>
              <ul className="space-y-1">
                {stats.breakthroughs.map((b, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="shrink-0">Iter {b.iterationId}</Badge>
                    <span className="text-neutral-700">{b.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportFullRun}>
              Export Full Run JSON
            </Button>
            <Button variant="outline" size="sm" onClick={copySummary}>
              Copy Summary
            </Button>
          </div>
        </div>
      )}

      {/* Checkpoint Dialog */}
      {activeCheckpoint && (
        <CheckpointDialog
          checkpoint={activeCheckpoint}
          onContinue={handleCheckpointContinue}
          onRedirect={handleCheckpointRedirect}
          onStop={handleCheckpointStop}
        />
      )}
    </div>
  );
}

export default RALPHMode;
