import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const HEALTH_VARIANT = { healthy: 'success', warning: 'warning', critical: 'destructive' };

const VERDICT_VARIANT = {
  novel: 'success', incremental: 'warning', known: 'destructive',
  strong: 'success', moderate: 'warning', weak: 'destructive', unsupported: 'destructive',
  feasible: 'success', challenging: 'warning', infeasible: 'destructive',
};

function Gauge({ label, value }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">{label}</span>
        <span className="font-mono text-xs font-bold text-neutral-700">{value}%</span>
      </div>
      <div className="h-1.5 bg-neutral-100 w-full">
        <div
          className="h-full bg-neutral-700 transition-all duration-300"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const variant = VERDICT_VARIANT[verdict] || 'outline';
  return (
    <Badge variant={variant} className="ml-1">
      {verdict}
    </Badge>
  );
}

function VerificationPanel({ verification }) {
  const [expanded, setExpanded] = useState({
    hypothesis: false, source: false, loop: false,
  });

  if (!verification) return null;

  const { hypothesisVerification: hv, sourceVerification: sv, loopQuality: lq } = verification;
  const overallHealth = lq?.overallHealth || 'healthy';
  const alerts = lq?.alerts || [];

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="border border-neutral-200 bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-neutral-100">
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
          Verification Results
        </span>
        <Badge variant={HEALTH_VARIANT[overallHealth] || 'outline'}>
          {overallHealth}
        </Badge>
      </div>

      {/* Gauges */}
      <div className="flex gap-6 p-4 border-b border-neutral-100">
        {hv && <Gauge label="Novelty" value={hv.overallNoveltyScore || 0} />}
        {sv && <Gauge label="Trust" value={sv.overallTrust || 0} />}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="p-4 space-y-1 border-b border-neutral-100">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`text-sm font-light px-3 py-2 border-l-2 ${
                a.severity === 'critical'
                  ? 'border-l-red-500 bg-red-50 text-red-800'
                  : 'border-l-amber-500 bg-amber-50 text-amber-800'
              }`}
            >
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Hypothesis Verification */}
      {hv && (
        <>
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
            onClick={() => toggle('hypothesis')}
          >
            <span className="text-sm text-neutral-700">
              Hypothesis Verification ({hv.assessments?.length || 0} checked, {hv.flaggedHypotheses?.length || 0} flagged)
            </span>
            <span className="text-neutral-400 text-xs">{expanded.hypothesis ? '\u25B2' : '\u25BC'}</span>
          </div>
          {expanded.hypothesis && (
            <div className="p-4 border-b border-neutral-100 space-y-3">
              {hv.summary && (
                <p className="text-neutral-600 font-light leading-relaxed text-sm">{hv.summary}</p>
              )}
              {(hv.assessments || []).map((a, i) => (
                <div key={i} className="border border-neutral-100 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-neutral-800">
                      {a.hypothesisId !== undefined ? `H${a.hypothesisId + 1}` : `H${i + 1}`}
                    </span>
                    {a.confidence != null && (
                      <span className="font-mono text-xs text-neutral-400">{a.confidence}% conf</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-neutral-500">Novelty: <VerdictBadge verdict={a.novelty?.verdict || 'unknown'} /></span>
                    <span className="text-neutral-500">Evidence: <VerdictBadge verdict={a.evidenceSupport?.verdict || 'unknown'} /></span>
                    <span className="text-neutral-500">Feasibility: <VerdictBadge verdict={a.feasibility?.verdict || 'unknown'} /></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Source Verification */}
      {sv && (
        <>
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
            onClick={() => toggle('source')}
          >
            <span className="text-sm text-neutral-700">
              Source Verification (Trust: {sv.overallTrust}%, {sv.hallucinationFlags?.length || 0} flags)
            </span>
            <span className="text-neutral-400 text-xs">{expanded.source ? '\u25B2' : '\u25BC'}</span>
          </div>
          {expanded.source && (
            <div className="p-4 border-b border-neutral-100 space-y-3">
              <div className="flex gap-6 text-sm">
                <span className="text-neutral-500">Field Alignment: <strong className="text-neutral-800">{sv.paperFieldAlignment?.score ?? '?'}%</strong></span>
                <span className="text-neutral-500">Gap Relevance: <strong className="text-neutral-800">{sv.gapRelevance?.score ?? '?'}%</strong></span>
              </div>
              {sv.hallucinationFlags?.length > 0 && (
                <div className="space-y-2">
                  {sv.hallucinationFlags.map((f, i) => (
                    <div
                      key={i}
                      className={`text-sm px-3 py-2 border-l-2 ${
                        f.severity === 'critical'
                          ? 'border-l-red-500 bg-red-50'
                          : 'border-l-amber-500 bg-amber-50'
                      }`}
                    >
                      <strong className="text-neutral-800 block">{f.claim}</strong>
                      <span className="text-neutral-600 font-light">{f.issue}</span>
                    </div>
                  ))}
                </div>
              )}
              {sv.gapRelevance?.unreferenced?.length > 0 && (
                <div className="text-sm">
                  <strong className="text-neutral-700 block mb-1">Unreferenced gaps:</strong>
                  <ul className="list-disc list-inside space-y-0.5 text-neutral-600 font-light">
                    {sv.gapRelevance.unreferenced.map((g, i) => <li key={i}>{g}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Loop Health */}
      {lq && (
        <>
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
            onClick={() => toggle('loop')}
          >
            <span className="text-sm text-neutral-700">
              Loop Health ({lq.overallHealth})
            </span>
            <span className="text-neutral-400 text-xs">{expanded.loop ? '\u25B2' : '\u25BC'}</span>
          </div>
          {expanded.loop && (
            <div className="p-4 space-y-1">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <span className="text-neutral-500">Novelty Trend: <strong className="text-neutral-800">{lq.noveltyTrend}</strong></span>
                <span className="text-neutral-500">Query Diversity: <strong className="text-neutral-800">{lq.queryDiversity}%</strong></span>
                <span className="text-neutral-500">Field Coverage: <strong className="text-neutral-800">{lq.fieldCoverage}</strong></span>
                <span className="text-neutral-500">Hypothesis Dupes: <strong className="text-neutral-800">{lq.duplicateCount || 0}</strong></span>
                <span className="text-neutral-500">Queue: <strong className="text-neutral-800">{lq.queueHealth}</strong></span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default VerificationPanel;
