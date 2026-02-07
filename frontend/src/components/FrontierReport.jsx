import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function FrontierReport({ report }) {
  const [expandedSections, setExpandedSections] = useState({
    gaps: false, hypotheses: false, connections: false, experiments: false, lean: false,
  });

  if (!report) return null;

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const titleSlug = report.papers?.[0]?.title?.slice(0, 30).replace(/\s+/g, '-') || 'frontier';
    a.download = `frontier-proposal-${titleSlug}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = () => {
    const paperTitles = (report.papers || []).map(p => p.title).join(', ');
    const summary = [
      `Frontier Research Proposal`,
      `Papers: ${paperTitles}`,
      `Novelty Score: ${report.noveltyScore}%`,
      '',
      `Gaps Found: ${report.stats?.gapCount || 0}`,
      `Hypotheses Proposed: ${report.stats?.hypothesisCount || 0}`,
      `Fields Connected: ${report.stats?.connectionCount || 0}`,
      `Experiments Designed: ${report.stats?.experimentCount || 0}`,
      '',
      report.summaries?.nova ? `Frontier: ${report.summaries.nova}` : '',
      report.summaries?.eureka ? `Hypotheses: ${report.summaries.eureka}` : '',
      report.summaries?.flux ? `Connections: ${report.summaries.flux}` : '',
      report.summaries?.nexus ? `Experiments: ${report.summaries.nexus}` : '',
      '',
      `Generated: ${report.generatedAt}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(summary);
  };

  const noveltyVariant = { incremental: 'info', moderate: 'warning', breakthrough: 'destructive' };

  const getDifficultyVariant = (difficulty) => {
    if (difficulty === 'open_problem' || difficulty === 'hard') return 'destructive';
    if (difficulty === 'moderate') return 'warning';
    return 'info';
  };

  const getSeverityVariant = (severity) => {
    if (severity === 'critical') return 'destructive';
    if (severity === 'moderate') return 'warning';
    return 'info';
  };

  return (
    <div className="border border-neutral-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-100">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
          Research Frontier Proposal
        </h3>
        <Badge variant="success">
          Novelty: {report.noveltyScore}%
        </Badge>
      </div>

      {/* Summary */}
      {report.summaries?.nova && (
        <div className="px-6 py-4 border-b border-neutral-100">
          <p className="text-neutral-600 font-light leading-relaxed text-sm">{report.summaries.nova}</p>
        </div>
      )}

      {/* Score Cards */}
      <div className="grid grid-cols-4 gap-px bg-neutral-100 border-b border-neutral-100">
        <div className="bg-white p-4 text-center">
          <span className="block font-mono text-lg font-bold text-neutral-900">{report.stats?.gapCount || 0}</span>
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Gaps Found</span>
        </div>
        <div className="bg-white p-4 text-center">
          <span className="block font-mono text-lg font-bold text-neutral-900">{report.stats?.hypothesisCount || 0}</span>
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Hypotheses</span>
        </div>
        <div className="bg-white p-4 text-center">
          <span className="block font-mono text-lg font-bold text-neutral-900">{report.stats?.connectionCount || 0}</span>
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Fields Connected</span>
        </div>
        <div className="bg-white p-4 text-center">
          <span className="block font-mono text-lg font-bold text-neutral-900">{report.stats?.experimentCount || 0}</span>
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Experiments</span>
        </div>
      </div>

      {/* Gap Analysis */}
      <div
        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
        onClick={() => toggleSection('gaps')}
      >
        <span className="text-sm text-neutral-700">Gap Analysis ({report.gaps?.length || 0} gaps, {report.assumptions?.length || 0} assumptions)</span>
        <span className="text-neutral-400 text-xs">{expandedSections.gaps ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expandedSections.gaps && (
        <div className="p-6 border-b border-neutral-100 space-y-4">
          {report.gaps?.length > 0 && (
            <div>
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">Research Gaps</h4>
              <ul className="space-y-2">
                {report.gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Badge variant={getSeverityVariant(g.severity)} className="shrink-0 mt-0.5">
                      {g.severity}
                    </Badge>
                    <span className="text-neutral-600 font-light leading-relaxed">{g.gap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.openQuestions?.length > 0 && (
            <div>
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Open Questions</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 font-light">
                {report.openQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Hypotheses */}
      <div
        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
        onClick={() => toggleSection('hypotheses')}
      >
        <span className="text-sm text-neutral-700">Novel Hypotheses ({report.hypotheses?.length || 0})</span>
        <span className="text-neutral-400 text-xs">{expandedSections.hypotheses ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expandedSections.hypotheses && report.hypotheses?.length > 0 && (
        <div className="p-6 border-b border-neutral-100 space-y-3">
          {report.hypotheses.map((h, i) => (
            <div key={i} className="border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <strong className="text-sm text-neutral-800">{h.title || `Hypothesis ${h.id || i + 1}`}</strong>
                <Badge variant={noveltyVariant[h.noveltyLevel] || 'outline'}>
                  {h.noveltyLevel}
                </Badge>
              </div>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">{h.hypothesis}</p>
              {h.rationale && (
                <p className="text-xs text-neutral-500 font-light mt-2 border-t border-neutral-100 pt-2">{h.rationale}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cross-Field Opportunities */}
      <div
        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
        onClick={() => toggleSection('connections')}
      >
        <span className="text-sm text-neutral-700">Cross-Field Opportunities ({report.crossFieldConnections?.length || 0} connections)</span>
        <span className="text-neutral-400 text-xs">{expandedSections.connections ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expandedSections.connections && (
        <div className="p-6 border-b border-neutral-100 space-y-4">
          {report.crossFieldConnections?.length > 0 && report.crossFieldConnections.map((c, i) => (
            <div key={i} className="border border-neutral-100 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{c.sourceField}</Badge>
                <span className="text-neutral-400 text-xs">&harr;</span>
                <Badge variant="outline">{c.targetField}</Badge>
              </div>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">{c.connection}</p>
            </div>
          ))}
          {report.unexpectedApplications?.length > 0 && (
            <div>
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Unexpected Applications</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 font-light">
                {report.unexpectedApplications.map((a, i) => <li key={i}><strong className="text-neutral-800">{a.domain}:</strong> {a.application}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Experiment Designs */}
      <div
        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
        onClick={() => toggleSection('experiments')}
      >
        <span className="text-sm text-neutral-700">Experiment Designs ({report.experiments?.length || 0})</span>
        <span className="text-neutral-400 text-xs">{expandedSections.experiments ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expandedSections.experiments && (
        <div className="p-6 border-b border-neutral-100 space-y-4">
          {report.experiments?.length > 0 && report.experiments.map((e, i) => (
            <div key={i} className="border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <strong className="text-sm text-neutral-800">{e.title || `Experiment ${e.id || i + 1}`}</strong>
                {e.timeline && (
                  <span className="font-mono text-xs text-neutral-400">{e.timeline}</span>
                )}
              </div>
              <p className="text-sm text-neutral-600 font-light leading-relaxed">{e.methodology}</p>
            </div>
          ))}
          {report.quickWins?.length > 0 && (
            <div>
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Quick Wins</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 font-light">
                {report.quickWins.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
          {report.moonshots?.length > 0 && (
            <div>
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Moonshots</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 font-light">
                {report.moonshots.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Lean Formalization */}
      {report.formalization?.leanCode && (
        <>
          <div
            className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
            onClick={() => toggleSection('lean')}
          >
            <span className="text-sm text-neutral-700">Lean 4 Formalization ({report.formalization.theorems?.length || 0} theorems)</span>
            <span className="text-neutral-400 text-xs">{expandedSections.lean ? '\u25B2' : '\u25BC'}</span>
          </div>
          {expandedSections.lean && (
            <div className="p-6 border-b border-neutral-100 space-y-4">
              {report.formalization.formalizationNotes && (
                <p className="text-neutral-600 font-light leading-relaxed text-sm">{report.formalization.formalizationNotes}</p>
              )}
              {report.formalization.theorems?.length > 0 && (
                <div>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Theorems</h4>
                  <ul className="space-y-2">
                    {report.formalization.theorems.map((t, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <code className="font-mono text-xs font-semibold text-neutral-800">{t.name}</code>
                        <span className="text-neutral-600 font-light"> -- {t.claim}</span>
                        {t.difficulty && (
                          <Badge variant={getDifficultyVariant(t.difficulty)} className="shrink-0">
                            {t.difficulty.replace('_', ' ')}
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <pre className="bg-neutral-50 border border-neutral-200 p-4 overflow-x-auto">
                <code className="font-mono text-xs text-neutral-700">{report.formalization.leanCode}</code>
              </pre>
              {report.formalization.mathlibDeps?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="font-mono text-xs text-neutral-500">Mathlib deps:</strong>
                  {report.formalization.mathlibDeps.map((d, i) => (
                    <Badge key={i} variant="outline">{d}</Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 p-6">
        <Button variant="outline" size="sm" onClick={exportJSON}>
          Export JSON
        </Button>
        <Button variant="ghost" size="sm" onClick={copySummary}>
          Copy Summary
        </Button>
      </div>
    </div>
  );
}

export default FrontierReport;
