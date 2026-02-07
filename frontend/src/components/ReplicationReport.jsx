import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function ReplicationReport({ report }) {
  const [expandedSections, setExpandedSections] = useState({ plan: false, code: false, results: false, review: false, lean: false });

  if (!report) return null;

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const verdictVariant = report.verdict?.toLowerCase().includes('unlikely') ? 'destructive'
    : report.verdict?.toLowerCase().includes('partial') ? 'warning' : 'success';

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `replication-report-${report.paper?.title?.slice(0, 30).replace(/\s+/g, '-') || 'report'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = () => {
    const summary = [
      `Replication Report: ${report.paper?.title}`,
      `Verdict: ${report.verdict}`,
      `Feasibility: ${report.feasibilityScore}%`,
      report.overallScore ? `Peer Review Score: ${report.overallScore}/10` : '',
      '',
      `Claims: ${report.claims?.length || 0}`,
      `Plan Steps: ${report.replicationPlan?.length || 0}`,
      report.matchPrediction != null ? `Match Prediction: ${report.matchPrediction}%` : '',
      '',
      `Generated: ${report.generatedAt}`,
    ].filter(Boolean).join('\n');
    navigator.clipboard.writeText(summary);
  };

  const getDifficultyVariant = (difficulty) => {
    if (difficulty === 'open_problem' || difficulty === 'hard') return 'destructive';
    if (difficulty === 'moderate') return 'warning';
    return 'info';
  };

  return (
    <div className="border border-neutral-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-neutral-100">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
          Replication Report
        </h3>
        <Badge variant={verdictVariant}>
          {report.verdict}
        </Badge>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-4 gap-px bg-neutral-100 border-b border-neutral-100">
        {report.feasibilityScore != null && (
          <div className="bg-white p-4 text-center">
            <span className="block font-mono text-lg font-bold text-neutral-900">{report.feasibilityScore}%</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Feasibility</span>
          </div>
        )}
        {report.overallScore != null && (
          <div className="bg-white p-4 text-center">
            <span className="block font-mono text-lg font-bold text-neutral-900">{report.overallScore}/10</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Peer Review</span>
          </div>
        )}
        {report.matchPrediction != null && (
          <div className="bg-white p-4 text-center">
            <span className="block font-mono text-lg font-bold text-neutral-900">{report.matchPrediction}%</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Match Rate</span>
          </div>
        )}
        {report.claims?.length > 0 && (
          <div className="bg-white p-4 text-center">
            <span className="block font-mono text-lg font-bold text-neutral-900">{report.claims.length}</span>
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">Claims</span>
          </div>
        )}
      </div>

      {/* Key Claims */}
      {report.claims?.length > 0 && (
        <div className="p-6 border-b border-neutral-100">
          <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">
            Key Claims
          </h4>
          <ul className="space-y-2">
            {report.claims.slice(0, 5).map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="shrink-0 mt-0.5">
                  {c.type}
                </Badge>
                <span className="text-neutral-600 font-light leading-relaxed">{c.claim}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Replication Plan */}
      <div
        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
        onClick={() => toggleSection('plan')}
      >
        <span className="text-sm text-neutral-700">Replication Plan ({report.replicationPlan?.length || 0} steps)</span>
        <span className="text-neutral-400 text-xs">{expandedSections.plan ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expandedSections.plan && report.replicationPlan?.length > 0 && (
        <div className="p-6 border-b border-neutral-100">
          <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-600 font-light leading-relaxed">
            {report.replicationPlan.map((s, i) => (
              <li key={i}><strong className="text-neutral-800">{s.title}</strong> -- {s.description}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Python Code */}
      <div
        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
        onClick={() => toggleSection('code')}
      >
        <span className="text-sm text-neutral-700">Python Code</span>
        <span className="text-neutral-400 text-xs">{expandedSections.code ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expandedSections.code && report.pythonCode && (
        <div className="p-6 border-b border-neutral-100">
          <pre className="bg-neutral-50 border border-neutral-200 p-4 overflow-x-auto">
            <code className="font-mono text-xs text-neutral-700">{report.pythonCode}</code>
          </pre>
        </div>
      )}

      {/* Simulated Results */}
      <div
        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
        onClick={() => toggleSection('results')}
      >
        <span className="text-sm text-neutral-700">Simulated Results</span>
        <span className="text-neutral-400 text-xs">{expandedSections.results ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expandedSections.results && report.simulatedResults?.length > 0 && (
        <div className="p-6 border-b border-neutral-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left font-mono text-xs uppercase tracking-widest text-neutral-400 pb-2">Metric</th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-neutral-400 pb-2">Original</th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-neutral-400 pb-2">Estimated</th>
                <th className="text-left font-mono text-xs uppercase tracking-widest text-neutral-400 pb-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {report.simulatedResults.map((r, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-700 font-medium">{r.metric}</td>
                  <td className="py-2 text-neutral-600 font-light">{r.original}</td>
                  <td className="py-2 text-neutral-600 font-light">{r.estimated}</td>
                  <td className="py-2 text-neutral-600 font-light">{r.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Peer Review */}
      <div
        className="flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-neutral-50 transition-colors border-b border-neutral-100"
        onClick={() => toggleSection('review')}
      >
        <span className="text-sm text-neutral-700">Peer Review</span>
        <span className="text-neutral-400 text-xs">{expandedSections.review ? '\u25B2' : '\u25BC'}</span>
      </div>
      {expandedSections.review && report.peerReview && (
        <div className="p-6 border-b border-neutral-100 space-y-4">
          {report.peerReview.strengths?.length > 0 && (
            <div>
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Strengths</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 font-light">
                {report.peerReview.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {report.peerReview.weaknesses?.length > 0 && (
            <div>
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Weaknesses</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 font-light">
                {report.peerReview.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
          {report.peerReview.recommendations?.length > 0 && (
            <div>
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">Recommendations</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-neutral-600 font-light">
                {report.peerReview.recommendations.map((r, i) => <li key={i}>{r}</li>)}
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

export default ReplicationReport;
