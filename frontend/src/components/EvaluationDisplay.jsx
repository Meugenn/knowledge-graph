import React from 'react';
import { DIMENSIONS, JOURNAL_TIERS, aggregateEvaluations, confidenceGrade } from '../utils/evaluation';
import RadarChart from './RadarChart';
import { Badge } from '@/components/ui/badge';

// Displays aggregated evaluation results for a paper
// Better than Unjournal: visual radar chart, Bayesian aggregation, confidence grades

function EvaluationDisplay({ evaluations, compact = false }) {
  if (!evaluations || evaluations.length === 0) {
    return compact ? null : (
      <div className="p-6 text-center text-neutral-400 text-sm">
        <p>No evaluations yet</p>
      </div>
    );
  }

  const agg = aggregateEvaluations(evaluations);
  if (!agg) return null;

  const grade = confidenceGrade(
    Object.values(agg.dimensions).reduce((sum, d) => sum + d.confidence, 0) / DIMENSIONS.length
  );

  // Compact mode for knowledge graph sidebar
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div
            className="flex items-baseline gap-0.5 border-2 px-2 py-1"
            style={{ borderColor: grade.color }}
          >
            <span className="font-mono text-lg font-bold text-neutral-900">{agg.composite}</span>
            <span className="font-mono text-xs text-neutral-400">/100</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs text-neutral-500">
              {agg.reviewCount} review{agg.reviewCount !== 1 ? 's' : ''}
            </span>
            <span className="font-mono text-xs font-medium" style={{ color: grade.color }}>
              {grade.label} confidence
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          {DIMENSIONS.map(d => (
            <div key={d.key} className="flex items-center gap-2">
              <span
                className="font-mono text-[10px] font-bold uppercase tracking-wider w-10 shrink-0"
                style={{ color: d.color }}
              >
                {d.short}
              </span>
              <div className="relative flex-1 h-1.5 bg-neutral-100">
                {/* CI range */}
                <div
                  className="absolute top-0 h-full"
                  style={{
                    left: `${agg.dimensions[d.key].low}%`,
                    width: `${agg.dimensions[d.key].high - agg.dimensions[d.key].low}%`,
                    background: d.color + '30',
                  }}
                />
                {/* Midpoint */}
                <div
                  className="absolute top-0 h-full"
                  style={{
                    width: `${agg.dimensions[d.key].midpoint}%`,
                    background: d.color,
                  }}
                />
              </div>
              <span className="font-mono text-[10px] font-bold text-neutral-600 w-6 text-right shrink-0">
                {agg.dimensions[d.key].midpoint}
              </span>
            </div>
          ))}
        </div>
        {agg.replicationProbability != null && (
          <div className="font-mono text-xs text-neutral-500 pt-1 border-t border-neutral-100">
            Replication probability: <strong className="text-neutral-800">{agg.replicationProbability}%</strong>
          </div>
        )}
      </div>
    );
  }

  // Full display mode
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-neutral-900">
          Evaluation Summary
        </h3>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-neutral-500">
            {agg.reviewCount} evaluation{agg.reviewCount !== 1 ? 's' : ''}
          </span>
          <Badge
            variant="outline"
            className="font-mono text-[10px]"
            style={{ background: grade.color + '20', color: grade.color, borderColor: grade.color + '40' }}
          >
            {grade.label} Confidence
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Radar Chart */}
        <div className="flex flex-col items-center gap-4">
          <div className="border border-neutral-200 p-4 bg-white">
            <RadarChart evaluations={evaluations} aggregate={agg.dimensions} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div
              className="flex items-baseline gap-0.5 border-2 px-3 py-1.5"
              style={{ borderColor: grade.color }}
            >
              <span className="font-mono text-2xl font-bold text-neutral-900">{agg.composite}</span>
              <span className="font-mono text-sm text-neutral-400">/100</span>
            </div>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
              Composite Score
            </span>
          </div>
        </div>

        {/* Right: Dimension breakdown */}
        <div className="space-y-3">
          {DIMENSIONS.map(d => {
            const dim = agg.dimensions[d.key];
            return (
              <div key={d.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: d.color }}>
                    {d.label}
                  </span>
                  <span className="font-mono text-sm font-bold text-neutral-800">{dim.midpoint}</span>
                </div>
                <div className="relative h-2 bg-neutral-100">
                  <div
                    className="absolute top-0 h-full"
                    style={{
                      left: `${dim.low}%`,
                      width: `${dim.high - dim.low}%`,
                      background: d.color + '25',
                    }}
                  />
                  <div
                    className="absolute top-0 h-full"
                    style={{ width: `${dim.midpoint}%`, background: d.color }}
                  />
                </div>
                <div className="font-mono text-[10px] text-neutral-400">
                  90% CI: [{dim.low}, {dim.high}]
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Predictions Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-200">
        <div className="bg-white p-4 space-y-1">
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
            Replication Probability
          </div>
          <div className="font-mono text-xl font-bold" style={{
            color: agg.replicationProbability >= 70 ? '#38a169' :
                   agg.replicationProbability >= 40 ? '#d69e2e' : '#e53e3e'
          }}>
            {agg.replicationProbability != null ? `${agg.replicationProbability}%` : '--'}
          </div>
          <div className="h-1 bg-neutral-100">
            <div
              className="h-full"
              style={{
                width: `${agg.replicationProbability || 0}%`,
                background: agg.replicationProbability >= 70 ? '#38a169' :
                            agg.replicationProbability >= 40 ? '#d69e2e' : '#e53e3e',
              }}
            />
          </div>
        </div>

        <div className="bg-white p-4 space-y-1">
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
            Should Publish At
          </div>
          <div className="font-mono text-lg font-bold text-neutral-800">
            {JOURNAL_TIERS[Math.round(agg.tierShould)]?.label || '--'}
          </div>
          <div className="font-mono text-[10px] text-neutral-400">
            Tier {agg.tierShould.toFixed(1)}/5 (merit)
          </div>
        </div>

        <div className="bg-white p-4 space-y-1">
          <div className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
            Will Publish At
          </div>
          <div className="font-mono text-lg font-bold text-neutral-800">
            {JOURNAL_TIERS[Math.round(agg.tierWill)]?.label || '--'}
          </div>
          <div className="font-mono text-[10px] text-neutral-400">
            Tier {agg.tierWill.toFixed(1)}/5 (prediction)
          </div>
        </div>

        {agg.tierGap !== 0 && (
          <div className="bg-white p-4 space-y-1">
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
              Merit-Publication Gap
            </div>
            <div className="font-mono text-xl font-bold" style={{
              color: agg.tierGap > 0 ? '#e53e3e' : '#38a169'
            }}>
              {agg.tierGap > 0 ? '+' : ''}{agg.tierGap.toFixed(1)}
            </div>
            <div className="font-mono text-[10px] text-neutral-400">
              {agg.tierGap > 0 ? 'Undervalued by system' : 'Fairly valued'}
            </div>
          </div>
        )}
      </div>

      {/* Individual Reviews */}
      {evaluations.length > 1 && (
        <div className="space-y-3">
          <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
            Individual Evaluations
          </h4>
          <div className="space-y-2">
            {evaluations.map((ev, i) => (
              <div key={i} className="border border-neutral-200 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-neutral-600">
                    Reviewer {i + 1}
                  </span>
                  <span className="font-mono text-sm font-bold text-neutral-800">
                    {Object.values(ev.scores).reduce((sum, s) => sum + (s.midpoint || 0), 0) /
                      Math.max(Object.keys(ev.scores).length, 1)
                    |0}/100
                  </span>
                </div>
                {ev.writtenEvaluation && (
                  <p className="text-sm text-neutral-600 font-light leading-relaxed">
                    {ev.writtenEvaluation}
                  </p>
                )}
                {ev.strengths && (
                  <div className="text-sm text-neutral-600">
                    <strong className="text-neutral-800">Strengths:</strong> {ev.strengths}
                  </div>
                )}
                {ev.weaknesses && (
                  <div className="text-sm text-neutral-600">
                    <strong className="text-neutral-800">Weaknesses:</strong> {ev.weaknesses}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EvaluationDisplay;
