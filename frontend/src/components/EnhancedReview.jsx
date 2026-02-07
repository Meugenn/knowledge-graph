import React, { useState, useCallback } from 'react';
import {
  DIMENSIONS,
  JOURNAL_TIERS,
  createBlankEvaluation,
  computeCompositeScore,
  compositeToOnChain,
  serializeEvaluation,
} from '../utils/evaluation';
import RadarChart from './RadarChart';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/fade-in';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

function EnhancedReview({ paperId, onSubmit, account }) {
  const [evaluation, setEvaluation] = useState(createBlankEvaluation);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('scores');

  const composite = computeCompositeScore(evaluation.scores);
  const onChainScore = compositeToOnChain(composite);

  // Update a dimension score
  const updateScore = useCallback((dimKey, field, value) => {
    setEvaluation(prev => {
      const current = prev.scores[dimKey];
      const updated = { ...current, [field]: Number(value) };

      // Auto-adjust CI bounds to maintain validity
      if (field === 'midpoint') {
        if (updated.low > updated.midpoint) updated.low = Math.max(0, updated.midpoint - 10);
        if (updated.high < updated.midpoint) updated.high = Math.min(100, updated.midpoint + 10);
      } else if (field === 'low') {
        if (updated.low > updated.midpoint) updated.midpoint = updated.low;
        if (updated.low > updated.high) updated.high = updated.low;
      } else if (field === 'high') {
        if (updated.high < updated.midpoint) updated.midpoint = updated.high;
        if (updated.high < updated.low) updated.low = updated.high;
      }

      return {
        ...prev,
        scores: { ...prev.scores, [dimKey]: updated },
      };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    try {
      const serialized = serializeEvaluation(evaluation, account);
      await onSubmit({
        paperId,
        onChainScore,
        evaluationJson: serialized,
        evaluation,
      });
    } catch (e) {
      console.error('Enhanced review submission error:', e);
    }
    setSubmitting(false);
  }, [evaluation, paperId, onChainScore, onSubmit, account]);

  const ciWidth = (dimKey) => {
    const s = evaluation.scores[dimKey];
    return s.high - s.low;
  };

  const sectionTabs = [
    { key: 'scores', label: 'Dimension Scores' },
    { key: 'predictions', label: 'Predictions' },
    { key: 'written', label: 'Written Review' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
          Multi-Dimensional Evaluation
        </h3>
        <p className="mt-2 text-neutral-600 font-light leading-relaxed text-sm">
          Rate each dimension with a score and 90% confidence interval.
          Your certainty matters as much as your score.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-0 border-b border-neutral-200">
        {sectionTabs.map(tab => (
          <button
            key={tab.key}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors border-b-2 ${
              activeSection === tab.key
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
            onClick={() => setActiveSection(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dimension Scores */}
      {activeSection === 'scores' && (
        <FadeIn>
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
            {/* Radar preview */}
            <div className="flex flex-col items-center gap-3">
              <RadarChart evaluations={[evaluation]} size={240} />
              <div className="flex flex-col items-center">
                <span className="font-mono text-3xl font-bold text-neutral-900">{composite}</span>
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">composite</span>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-6">
              {DIMENSIONS.map(d => {
                const s = evaluation.scores[d.key];
                const width = ciWidth(d.key);
                return (
                  <div key={d.key} className="border border-neutral-200 bg-white p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-500">
                        {d.label}
                      </span>
                      <span className="font-mono text-lg font-bold text-neutral-900">{s.midpoint}</span>
                    </div>
                    <p className="text-neutral-500 font-light text-xs leading-relaxed mb-3">{d.description}</p>

                    {/* Main score slider */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-xs text-neutral-400 w-12">Score</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={s.midpoint}
                        onChange={e => updateScore(d.key, 'midpoint', e.target.value)}
                        className="flex-1 h-1.5 bg-neutral-200 appearance-none cursor-pointer accent-neutral-900"
                      />
                    </div>

                    {/* CI sliders */}
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-neutral-400 w-8">Low</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={s.low}
                          onChange={e => updateScore(d.key, 'low', e.target.value)}
                          className="flex-1 h-1 bg-neutral-100 appearance-none cursor-pointer accent-neutral-500"
                        />
                        <span className="font-mono text-xs text-neutral-500 w-6 text-right">{s.low}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-neutral-400 w-8">High</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={s.high}
                          onChange={e => updateScore(d.key, 'high', e.target.value)}
                          className="flex-1 h-1 bg-neutral-100 appearance-none cursor-pointer accent-neutral-500"
                        />
                        <span className="font-mono text-xs text-neutral-500 w-6 text-right">{s.high}</span>
                      </div>
                      <Badge variant={width <= 20 ? 'success' : width >= 50 ? 'warning' : 'info'}>
                        CI: {width}pt {width <= 20 ? '(confident)' : width >= 50 ? '(uncertain)' : ''}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Predictions */}
      {activeSection === 'predictions' && (
        <FadeIn>
          <div className="space-y-8">
            {/* Replication Probability */}
            <div className="border border-neutral-200 bg-white p-6">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                Replication Probability
              </h4>
              <p className="text-neutral-600 font-light leading-relaxed text-sm mb-4">
                If an independent team attempted to replicate the main findings of this paper
                with adequate resources, what is the probability they would succeed?
              </p>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={evaluation.replicationProbability}
                  onChange={e => setEvaluation(prev => ({
                    ...prev,
                    replicationProbability: Number(e.target.value),
                  }))}
                  className="w-full h-1.5 bg-neutral-200 appearance-none cursor-pointer accent-neutral-900"
                />
                <div className="flex items-center justify-between">
                  <span className={`font-mono text-2xl font-bold ${
                    evaluation.replicationProbability >= 70 ? 'text-green-700' :
                    evaluation.replicationProbability >= 40 ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {evaluation.replicationProbability}%
                  </span>
                  <span className="text-neutral-500 font-light text-sm">
                    {evaluation.replicationProbability >= 80 ? 'Very likely to replicate' :
                     evaluation.replicationProbability >= 60 ? 'Likely to replicate' :
                     evaluation.replicationProbability >= 40 ? 'Uncertain' :
                     evaluation.replicationProbability >= 20 ? 'Unlikely to replicate' :
                     'Very unlikely to replicate'}
                  </span>
                </div>
              </div>
            </div>

            {/* Journal Tier */}
            <div className="border border-neutral-200 bg-white p-6">
              <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                Journal Tier Prediction
              </h4>
              <p className="text-neutral-600 font-light leading-relaxed text-sm mb-4">
                Where <em>should</em> this paper publish based on merit alone?
                And where do you <em>predict</em> it will actually publish?
                The gap reveals systemic bias.
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">
                    Should Publish (Merit)
                  </div>
                  <div className="space-y-1">
                    {JOURNAL_TIERS.map(t => (
                      <label
                        key={t.value}
                        className={`flex items-center gap-3 p-2 cursor-pointer transition-colors ${
                          evaluation.tierShould === t.value
                            ? 'bg-neutral-100 border border-neutral-300'
                            : 'border border-transparent hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tierShould"
                          value={t.value}
                          checked={evaluation.tierShould === t.value}
                          onChange={() => setEvaluation(prev => ({ ...prev, tierShould: t.value }))}
                          className="accent-neutral-900"
                        />
                        <span className="font-mono text-sm font-bold text-neutral-700">{t.value}</span>
                        <span className="text-neutral-500 font-light text-sm">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">
                    Will Publish (Prediction)
                  </div>
                  <div className="space-y-1">
                    {JOURNAL_TIERS.map(t => (
                      <label
                        key={t.value}
                        className={`flex items-center gap-3 p-2 cursor-pointer transition-colors ${
                          evaluation.tierWill === t.value
                            ? 'bg-neutral-100 border border-neutral-300'
                            : 'border border-transparent hover:bg-neutral-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tierWill"
                          value={t.value}
                          checked={evaluation.tierWill === t.value}
                          onChange={() => setEvaluation(prev => ({ ...prev, tierWill: t.value }))}
                          className="accent-neutral-900"
                        />
                        <span className="font-mono text-sm font-bold text-neutral-700">{t.value}</span>
                        <span className="text-neutral-500 font-light text-sm">{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {evaluation.tierShould !== evaluation.tierWill && (
                <Alert
                  variant={evaluation.tierShould > evaluation.tierWill ? 'warning' : 'destructive'}
                  className="mt-4"
                >
                  <AlertDescription>
                    {evaluation.tierShould > evaluation.tierWill
                      ? `This paper deserves a higher-tier venue than it will likely get (+${evaluation.tierShould - evaluation.tierWill} tier gap)`
                      : `This paper may be overvalued by the system (${evaluation.tierShould - evaluation.tierWill} tier gap)`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Written Review */}
      {activeSection === 'written' && (
        <FadeIn>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                Overall Evaluation
              </label>
              <Textarea
                value={evaluation.writtenEvaluation}
                onChange={e => setEvaluation(prev => ({ ...prev, writtenEvaluation: e.target.value }))}
                placeholder="Provide your overall assessment of this paper. Consider the main claims, evidence, and implications..."
                rows={5}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                Key Strengths
              </label>
              <Textarea
                value={evaluation.strengths}
                onChange={e => setEvaluation(prev => ({ ...prev, strengths: e.target.value }))}
                placeholder="What does this paper do well? What are its strongest contributions?"
                rows={3}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                Key Weaknesses
              </label>
              <Textarea
                value={evaluation.weaknesses}
                onChange={e => setEvaluation(prev => ({ ...prev, weaknesses: e.target.value }))}
                placeholder="What are the main limitations? What could undermine the conclusions?"
                rows={3}
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                Suggestions for Improvement
              </label>
              <Textarea
                value={evaluation.suggestions}
                onChange={e => setEvaluation(prev => ({ ...prev, suggestions: e.target.value }))}
                placeholder="Concrete suggestions for the authors to improve this work..."
                rows={3}
                className="bg-white"
              />
            </div>
          </div>
        </FadeIn>
      )}

      {/* Submit Bar */}
      <Separator />
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xl font-bold text-neutral-900">{composite}/100</span>
            <span className="font-mono text-xs text-neutral-400">On-chain: {onChainScore}/10</span>
          </div>
          <div className="font-mono text-xs text-neutral-500">
            Replication: {evaluation.replicationProbability}%
            {' / '}
            Tier: {evaluation.tierShould}/5 (merit)
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!evaluation.writtenEvaluation.trim() && (
            <span className="text-xs text-neutral-400 font-light">Written evaluation required</span>
          )}
          <Button
            onClick={handleSubmit}
            disabled={submitting || !evaluation.writtenEvaluation.trim()}
          >
            {submitting ? 'Submitting...' : 'Submit Evaluation (Earn $100 USDC)'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EnhancedReview;
