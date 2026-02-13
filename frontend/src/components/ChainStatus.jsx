import React, { useState, useEffect, useCallback } from 'react';
import { Link2, ArrowRightLeft, Wallet, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/fade-in';


const DEMO_EVENTS = [
  { id: 'evt-1', chain: 'human', type: 'PaperSubmitted', data: { paperId: 1, author: '0x742d...4a3e' }, timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'evt-2', chain: 'human', type: 'ReviewSubmitted', data: { paperId: 1, reviewer: '0x8f3b...c2d1' }, timestamp: new Date(Date.now() - 2400000).toISOString() },
  { id: 'evt-3', chain: 'ai', type: 'AgentAnalysis', data: { agentId: 'iris', paperId: 'vaswani2017' }, timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 'evt-4', chain: 'ai', type: 'AgentAnalysis', data: { agentId: 'atlas', paperId: 'vaswani2017' }, timestamp: new Date(Date.now() - 1200000).toISOString() },
  { id: 'evt-5', chain: 'human', type: 'MarketCreated', data: { marketId: 1, paperId: 'vaswani2017' }, timestamp: new Date(Date.now() - 600000).toISOString() },
  { id: 'evt-6', chain: 'ai', type: 'ForensicsScore', data: { paperId: 'vaswani2017', score: 87 }, timestamp: new Date(Date.now() - 300000).toISOString() },
];

function ChainCard({ name, chainId, role, connected, events, colour }) {
  return (
    <div className={`border p-6 ${colour}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link2 className="h-4 w-4" />
            <h3 className="font-mono text-sm uppercase tracking-widest">{name}</h3>
          </div>
          <p className="text-xs text-neutral-500">Chain ID: {chainId}</p>
        </div>
        <Badge variant="outline" className={`text-[10px] ${connected ? 'border-emerald-300 text-emerald-600' : 'border-red-300 text-red-600'}`}>
          {connected ? 'Connected' : 'Offline'}
        </Badge>
      </div>

      <p className="text-xs text-neutral-600 mb-4">{role}</p>

      <div className="space-y-2">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Recent Events</h4>
        {events.length === 0 ? (
          <p className="text-xs text-neutral-400">No events yet</p>
        ) : (
          events.map(evt => (
            <div key={evt.id} className="flex items-start gap-2 text-xs py-1 border-b border-neutral-100 last:border-0">
              <Clock className="h-3 w-3 text-neutral-300 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-mono text-neutral-600">{evt.type}</span>
                <span className="text-neutral-400 ml-2">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ChainStatus() {
  const [chainData, setChainData] = useState(null);
  const [events, setEvents] = useState(DEMO_EVENTS);

  const fetchChainData = useCallback(async () => {
    try {
      const [statusRes, eventsRes] = await Promise.allSettled([
        fetch(`/api/blockchain/status`).then(r => r.json()),
        fetch(`/api/blockchain/events`).then(r => r.json()),
      ]);
      if (statusRes.status === 'fulfilled') setChainData(statusRes.value);
      if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value);
    } catch {
      // Use demo data
    }
  }, []);

  useEffect(() => { fetchChainData(); }, [fetchChainData]);

  const humanEvents = events.filter(e => e.chain === 'human');
  const aiEvents = events.filter(e => e.chain === 'ai');
  const humanStatus = chainData?.humanChain || { name: 'Flare Testnet (Coston2)', chainId: 114, connected: false, role: 'Human verification, paper submissions, reviews' };
  const aiStatus = chainData?.aiChain || { name: 'Plasma Testnet', chainId: 7777, connected: false, role: 'AI agent transactions, autonomous operations' };
  const bridgeData = chainData?.bridge || { transferCount: 3, recentTransfers: [] };

  return (
    <div>
      <FadeIn>
        <span className="section-label mb-2 block">Chains</span>
        <h2 className="section-title mb-2">Dual-Chain Architecture</h2>
        <p className="body-text text-sm mb-8">
          The Republic operates across two chains: a Human Chain for verification and governance,
          and an AI Chain where agents transact autonomously.
        </p>
      </FadeIn>

      {/* Chain Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <FadeIn delay={0.1}>
          <ChainCard
            {...humanStatus}
            events={humanEvents.slice(0, 5)}
            colour="border-blue-200 bg-blue-50/30"
          />
        </FadeIn>
        <FadeIn delay={0.15}>
          <ChainCard
            {...aiStatus}
            events={aiEvents.slice(0, 5)}
            colour="border-purple-200 bg-purple-50/30"
          />
        </FadeIn>
      </div>

      {/* Bridge */}
      <FadeIn delay={0.2}>
        <div className="border border-neutral-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft className="h-4 w-4 text-neutral-400" />
            <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400">Cross-Chain Bridge</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-light">{bridgeData.transferCount}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Transfers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light">{humanEvents.length}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Human Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light">{aiEvents.length}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">AI Events</div>
            </div>
          </div>

          <p className="text-xs text-neutral-500">
            Critical events are mirrored between chains. Human submissions trigger agent analysis on the AI chain.
            Agent findings are bridged back to inform prediction markets on the Human chain.
          </p>
        </div>
      </FadeIn>

      {/* Full Event Timeline */}
      <FadeIn delay={0.25}>
        <div className="border border-neutral-200 p-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-4">
            <Activity className="h-3 w-3 inline mr-1" /> Event Timeline
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {events.map(evt => (
              <div key={evt.id} className="flex items-center gap-3 text-xs font-mono py-1.5 border-b border-neutral-100 last:border-0">
                <Badge
                  variant="outline"
                  className={`text-[9px] w-16 justify-center ${evt.chain === 'human' ? 'border-blue-300 text-blue-600' : 'border-purple-300 text-purple-600'}`}
                >
                  {evt.chain === 'human' ? 'FLARE' : 'PLASMA'}
                </Badge>
                <span className="text-neutral-600 flex-1">{evt.type}</span>
                <span className="text-neutral-300">{new Date(evt.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

export default ChainStatus;
