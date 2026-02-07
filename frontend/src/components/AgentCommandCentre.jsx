import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/fade-in';
import { BACKEND_URL } from '../config';

const CASTE_ICONS = { guardian: '🛡️', philosopher: '⚔️', producer: '🔨' };
const CASTE_COLOURS = { guardian: 'border-amber-300 bg-amber-50', philosopher: 'border-purple-300 bg-purple-50', producer: 'border-green-300 bg-green-50' };

function AgentCommandCentre() {
  const [agents, setAgents] = useState([]);
  const [budget, setBudget] = useState({});
  const [running, setRunning] = useState(false);
  const [currentAgent, setCurrentAgent] = useState(null);
  const [actionFeed, setActionFeed] = useState([]);
  const [trismStatus, setTrismStatus] = useState(null);
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);

  const fetchAgents = useCallback(async () => {
    try {
      const [agentsRes, budgetRes, trismRes, papersRes] = await Promise.allSettled([
        fetch(`${BACKEND_URL}/api/agents`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/agents/budget`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/trism/status`).then(r => r.json()),
        fetch(`${BACKEND_URL}/api/kg/papers`).then(r => r.json()),
      ]);
      if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value);
      if (budgetRes.status === 'fulfilled') setBudget(budgetRes.value);
      if (trismRes.status === 'fulfilled') setTrismStatus(trismRes.value);
      if (papersRes.status === 'fulfilled') {
        setPapers(papersRes.value);
        if (!selectedPaper && papersRes.value.length > 0) setSelectedPaper(papersRes.value[0]);
      }
    } catch (e) {
      console.error('Failed to fetch agents:', e);
    }
  }, [selectedPaper]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const runPipeline = async () => {
    if (!selectedPaper) return;
    setRunning(true);
    setActionFeed([]);

    const pipelineAgents = agents.map(a => a.id);
    for (const agentId of pipelineAgents) {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) continue;
      setCurrentAgent(agentId);

      setActionFeed(prev => [...prev, {
        agent: agent.name,
        agentId,
        status: 'running',
        time: new Date().toLocaleTimeString(),
      }]);

      try {
        const task = `Analyse the paper "${selectedPaper.title}" by ${(selectedPaper.authors || []).join(', ')} (${selectedPaper.year}).

Abstract: ${selectedPaper.abstract || 'N/A'}
Fields: ${(selectedPaper.fieldsOfStudy || []).join(', ')}
Citations: ${selectedPaper.citationCount || 'Unknown'}

Provide your analysis in your role as ${agent.role} (${agent.caste} caste). Be thorough but concise. Use British English.`;

        const res = await fetch(`${BACKEND_URL}/api/agents/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId, task }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.error) {
          setActionFeed(prev => prev.map(f =>
            f.agentId === agentId ? { ...f, status: 'error', response: data.error } : f
          ));
        } else {
          setActionFeed(prev => prev.map(f =>
            f.agentId === agentId ? {
              ...f,
              status: 'done',
              response: data.content || '[No content]',
              tokensUsed: data.tokensUsed,
              trism: data.trismResult,
            } : f
          ));
        }
      } catch (e) {
        setActionFeed(prev => prev.map(f =>
          f.agentId === agentId ? { ...f, status: 'error', response: e.message } : f
        ));
      }
    }

    setCurrentAgent(null);
    setRunning(false);
    fetchAgents(); // Refresh budget
  };

  const getCasteBudget = (caste) => {
    const b = budget[caste];
    if (!b) return { pct: 0, used: 0, limit: 100000 };
    return { pct: Math.round(b.ratio * 100), used: b.used, limit: b.limit };
  };

  return (
    <div>
      <FadeIn>
        <span className="section-label mb-2 block">Command Centre</span>
        <h2 className="section-title mb-2">Agent Command Centre</h2>
        <p className="body-text text-sm mb-8">
          Orchestrate AI agent castes to analyse papers. Each agent calls Claude with its specialised role.
        </p>
      </FadeIn>

      {/* Paper Selector */}
      <FadeIn delay={0.05}>
        <div className="border border-neutral-200 p-4 mb-6">
          <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">Select Paper to Analyse</label>
          <select
            className="w-full border border-neutral-200 p-2 text-sm font-mono"
            value={selectedPaper?.id || ''}
            onChange={(e) => setSelectedPaper(papers.find(p => p.id === e.target.value))}
          >
            {papers.map(p => (
              <option key={p.id} value={p.id}>{p.title} ({p.year})</option>
            ))}
          </select>
        </div>
      </FadeIn>

      {/* Stats Row */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-neutral-200 p-4">
            <div className="text-2xl font-light">{agents.length}</div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Agents</div>
          </div>
          {['guardian', 'philosopher', 'producer'].map(caste => {
            const b = getCasteBudget(caste);
            return (
              <div key={caste} className="border border-neutral-200 p-4">
                <div className="text-2xl font-light">{b.pct}%</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">{caste} budget</div>
                <div className="h-1 bg-neutral-200 rounded-full mt-1 overflow-hidden">
                  <div className={`h-full ${b.pct >= 80 ? 'bg-red-500' : b.pct >= 50 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </FadeIn>

      {/* Run Pipeline */}
      <FadeIn delay={0.15}>
        <Button
          className="mb-8 bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-xs uppercase tracking-widest px-8 h-12"
          onClick={runPipeline}
          disabled={running || !selectedPaper}
        >
          {running ? `Running ${currentAgent || ''}...` : 'Run Pipeline'}
        </Button>
      </FadeIn>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {agents.map((agent, i) => {
          const feedEntry = actionFeed.find(f => f.agentId === agent.id);
          const isActive = currentAgent === agent.id;
          const b = getCasteBudget(agent.caste);

          return (
            <FadeIn key={agent.id} delay={0.05 * i}>
              <div className={`border p-5 transition-all ${isActive ? 'border-blue-400 ring-2 ring-blue-100' : CASTE_COLOURS[agent.caste] || 'border-neutral-200'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{CASTE_ICONS[agent.caste] || '🤖'}</span>
                    <div>
                      <h4 className="font-medium text-sm">{agent.name}</h4>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">{agent.caste}</span>
                    </div>
                  </div>
                  <Badge
                    variant={isActive ? 'default' : feedEntry?.status === 'done' ? 'outline' : feedEntry?.status === 'error' ? 'destructive' : 'outline'}
                    className="font-mono text-[9px]"
                  >
                    {isActive ? 'working' : feedEntry?.status || 'idle'}
                  </Badge>
                </div>
                <p className="text-neutral-600 text-xs mb-3">{agent.role}</p>
                <div className="text-[10px] text-neutral-400 font-mono">T={agent.temperature}</div>

                {/* Response preview */}
                {feedEntry?.response && (
                  <details className="mt-3 pt-3 border-t border-neutral-200">
                    <summary className="text-xs cursor-pointer text-neutral-500 hover:text-neutral-700">
                      {feedEntry.status === 'error' ? 'Error' : `Response (${feedEntry.tokensUsed || '?'} tokens)`}
                    </summary>
                    <div className="mt-2 text-xs text-neutral-600 max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {feedEntry.response}
                    </div>
                    {feedEntry.trism && (
                      <div className="mt-2 text-[10px] font-mono text-neutral-400">
                        TRiSM: hallucination={feedEntry.trism.hallucinationScore?.toFixed(2)} drift={feedEntry.trism.driftScore?.toFixed(2)} action={feedEntry.trism.action}
                      </div>
                    )}
                  </details>
                )}
              </div>
            </FadeIn>
          );
        })}
      </div>

      {/* Action Feed Timeline */}
      {actionFeed.length > 0 && (
        <FadeIn delay={0.2}>
          <div className="border border-neutral-200 p-5">
            <span className="section-label mb-4 block">Pipeline Timeline</span>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {actionFeed.map((action, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="font-mono text-[10px] text-neutral-400 whitespace-nowrap mt-0.5">{action.time}</span>
                  <Badge
                    variant={action.status === 'running' ? 'default' : action.status === 'error' ? 'destructive' : 'outline'}
                    className="font-mono text-[9px] shrink-0"
                  >
                    {action.status}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium text-xs">{action.agent}</span>
                    {action.tokensUsed && <span className="text-neutral-400 text-[10px] ml-2">{action.tokensUsed} tokens</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

export default AgentCommandCentre;
