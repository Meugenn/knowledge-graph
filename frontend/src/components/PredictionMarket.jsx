import React, { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FadeIn } from '@/components/ui/fade-in';

const DEMO_MARKETS = [
  { id: 1, paperId: 1, paperTitle: 'Attention Is All You Need', question: 'Will Transformers remain the dominant architecture through 2027?', yesShares: 8500, noShares: 1500, b: 1000, totalParticipants: 142, endTime: Date.now() + 86400000 * 45, resolved: false, outcome: false },
  { id: 2, paperId: 5, paperTitle: 'Generative Adversarial Networks', question: 'Will GANs outperform diffusion models on FID scores by end of 2026?', yesShares: 3000, noShares: 7000, b: 1000, totalParticipants: 89, endTime: Date.now() + 86400000 * 120, resolved: false, outcome: false },
  { id: 3, paperId: 8, paperTitle: 'Denoising Diffusion Probabilistic Models', question: 'Can DDPM FID scores be replicated within 10% on standard hardware?', yesShares: 6200, noShares: 1800, b: 1000, totalParticipants: 67, endTime: Date.now() + 86400000 * 30, resolved: false, outcome: false },
  { id: 4, paperId: 12, paperTitle: 'Mastering the Game of Go', question: 'Were AlphaGo win rates accurately measured in the original study?', yesShares: 9000, noShares: 1000, b: 1000, totalParticipants: 203, endTime: Date.now() - 86400000 * 10, resolved: true, outcome: true },
  { id: 5, paperId: 3, paperTitle: 'Chain-of-Thought Prompting', question: 'Does CoT prompting improve GSM8K accuracy by more than 15%?', yesShares: 5500, noShares: 2500, b: 1000, totalParticipants: 54, endTime: Date.now() + 86400000 * 60, resolved: false, outcome: false },
  { id: 6, paperId: 15, paperTitle: 'Sparks of AGI: GPT-4 Experiments', question: 'Will key claims be validated by 3+ independent research groups?', yesShares: 2200, noShares: 5100, b: 1000, totalParticipants: 178, endTime: Date.now() - 86400000 * 5, resolved: true, outcome: false },
];

const DEMO_POSITIONS = [
  { marketId: 1, side: 'yes', shares: 500, timestamp: Date.now() - 86400000 * 3 },
  { marketId: 3, side: 'yes', shares: 200, timestamp: Date.now() - 86400000 * 1 },
];

// LMSR price calculation: p_yes = e^(qYes/b) / (e^(qYes/b) + e^(qNo/b))
function lmsrYesPrice(yesShares, noShares, b) {
  if (b === 0) return 0.5;
  const expYes = Math.exp(yesShares / b);
  const expNo = Math.exp(noShares / b);
  return expYes / (expYes + expNo);
}

// LMSR cost to buy `shares` on a given side
function lmsrCost(yesShares, noShares, b, shares, isYes) {
  const costBefore = b * Math.log(Math.exp(yesShares / b) + Math.exp(noShares / b));
  const newYes = isYes ? yesShares + shares : yesShares;
  const newNo = isYes ? noShares : noShares + shares;
  const costAfter = b * Math.log(Math.exp(newYes / b) + Math.exp(newNo / b));
  return costAfter - costBefore;
}

function PredictionMarket({ contracts, account }) {
  const [filter, setFilter] = useState('active');
  const [expandedBet, setExpandedBet] = useState(null);
  const [betSide, setBetSide] = useState('yes');
  const [betShares, setBetShares] = useState('100');
  const [positions, setPositions] = useState(DEMO_POSITIONS);
  const [markets, setMarkets] = useState(DEMO_MARKETS);

  const activeMarkets = markets.filter(m => !m.resolved);
  const resolvedMarkets = markets.filter(m => m.resolved);
  const filteredMarkets = filter === 'active' ? activeMarkets : resolvedMarkets;
  const totalVolume = markets.reduce((sum, m) => sum + m.yesShares + m.noShares, 0);
  const totalParticipants = markets.reduce((sum, m) => sum + m.totalParticipants, 0);

  const getTimeRemaining = (endTime) => {
    const diff = endTime - Date.now();
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / 86400000);
    if (days > 0) return `${days}d remaining`;
    const hours = Math.floor(diff / 3600000);
    return `${hours}h remaining`;
  };

  const placeBet = async (market) => {
    const shares = parseFloat(betShares);
    if (!shares || shares <= 0) return;
    const isYes = betSide === 'yes';

    if (contracts.predictionMarket && contracts.researchToken) {
      try {
        const weiShares = ethers.parseEther(betShares);
        const weiCost = ethers.parseEther(String(Math.ceil(lmsrCost(market.yesShares, market.noShares, market.b, shares, isYes))));
        const approveTx = await contracts.researchToken.approve(await contracts.predictionMarket.getAddress(), weiCost);
        await approveTx.wait();
        const tx = isYes
          ? await contracts.predictionMarket.buyYes(market.id, weiShares)
          : await contracts.predictionMarket.buyNo(market.id, weiShares);
        await tx.wait();
      } catch (error) {
        console.error('On-chain bet failed:', error);
        return;
      }
    }

    setMarkets(prev => prev.map(m => {
      if (m.id !== market.id) return m;
      return {
        ...m,
        yesShares: isYes ? m.yesShares + shares : m.yesShares,
        noShares: !isYes ? m.noShares + shares : m.noShares,
        totalParticipants: m.totalParticipants + 1,
      };
    }));
    setPositions(prev => [...prev, { marketId: market.id, side: betSide, shares, timestamp: Date.now() }]);
    setExpandedBet(null);
    setBetShares('100');
  };

  const claimPayout = async (market) => {
    if (contracts.predictionMarket) {
      try { const tx = await contracts.predictionMarket.claimWinnings(market.id); await tx.wait(); } catch (error) { console.error('Claim failed:', error); }
    }
    setPositions(prev => prev.filter(p => p.marketId !== market.id));
  };

  const getUserPosition = (marketId) => positions.find(p => p.marketId === marketId);

  return (
    <div>
      <FadeIn>
        <span className="section-label mb-2 block">Markets</span>
        <h2 className="section-title mb-2">LMSR Prediction Markets</h2>
        <p className="body-text text-sm mb-8">
          Logarithmic Market Scoring Rule markets for paper replication outcomes.
          Dynamic pricing ensures infinite liquidity and proper probability estimation.
        </p>
      </FadeIn>

      {/* Stats */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { value: activeMarkets.length, label: 'Active' },
            { value: `${(totalVolume / 1000).toFixed(1)}k`, label: 'Total Volume' },
            { value: totalParticipants, label: 'Participants' },
            { value: resolvedMarkets.length, label: 'Resolved' },
          ].map((s, i) => (
            <div key={i} className="border border-neutral-200 p-4">
              <div className="text-2xl font-light">{s.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">{s.label}</div>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Filter */}
      <div className="flex gap-1 border-b border-neutral-200 mb-6">
        {['active', 'resolved'].map(f => (
          <button
            key={f}
            className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${filter === f ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-px' : 'text-neutral-400 hover:text-neutral-600'}`}
            onClick={() => setFilter(f)}
          >
            {f} ({f === 'active' ? activeMarkets.length : resolvedMarkets.length})
          </button>
        ))}
      </div>

      {/* Markets */}
      <div className="space-y-4">
        {filteredMarkets.map((market, i) => {
          const yesPrice = lmsrYesPrice(market.yesShares, market.noShares, market.b);
          const noPrice = 1 - yesPrice;
          const yesPercent = Math.round(yesPrice * 100);
          const noPercent = 100 - yesPercent;
          const userPos = getUserPosition(market.id);
          const isExpanded = expandedBet === market.id;

          return (
            <FadeIn key={market.id} delay={0.05 * i}>
              <div className="border border-neutral-200 p-6 hover:border-neutral-400 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">{market.paperTitle}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] font-mono">LMSR b={market.b}</Badge>
                    {market.resolved && (
                      <Badge variant={market.outcome ? 'success' : 'destructive'}>{market.outcome ? 'YES' : 'NO'}</Badge>
                    )}
                  </div>
                </div>

                <p className="text-base mb-4">{market.question}</p>

                {/* LMSR Price Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-700 font-mono">YES {yesPercent}% ({yesPrice.toFixed(3)})</span>
                    <span className="text-red-700 font-mono">({noPrice.toFixed(3)}) {noPercent}% NO</span>
                  </div>
                  <div className="flex h-2 w-full overflow-hidden">
                    <div className="bg-green-200 transition-all" style={{ width: `${yesPercent}%` }} />
                    <div className="bg-red-200 transition-all" style={{ width: `${noPercent}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-neutral-400 font-mono mb-4">
                  <span>{market.yesShares + market.noShares} shares traded</span>
                  <span>{market.totalParticipants} participants</span>
                  <span>{getTimeRemaining(market.endTime)}</span>
                </div>

                {userPos && (
                  <div className={`border p-3 mb-3 text-sm ${userPos.side === 'yes' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                    <span>Your position: {userPos.side.toUpperCase()} — {userPos.shares} shares</span>
                    {market.resolved && ((market.outcome && userPos.side === 'yes') || (!market.outcome && userPos.side === 'no')) && (
                      <Button variant="outline" size="sm" className="ml-3 font-mono text-[10px] uppercase" onClick={() => claimPayout(market)}>Claim</Button>
                    )}
                  </div>
                )}

                {!market.resolved && !userPos && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-[10px] uppercase tracking-widest"
                    onClick={() => setExpandedBet(isExpanded ? null : market.id)}
                  >
                    {isExpanded ? 'Cancel' : 'Buy Shares'}
                  </Button>
                )}

                {isExpanded && (
                  <div className="mt-4 border-t border-neutral-100 pt-4 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        variant={betSide === 'yes' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 font-mono text-xs ${betSide === 'yes' ? 'bg-green-700 hover:bg-green-800' : ''}`}
                        onClick={() => setBetSide('yes')}
                      >YES</Button>
                      <Button
                        variant={betSide === 'no' ? 'default' : 'outline'}
                        size="sm"
                        className={`flex-1 font-mono text-xs ${betSide === 'no' ? 'bg-red-700 hover:bg-red-800' : ''}`}
                        onClick={() => setBetSide('no')}
                      >NO</Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={betShares}
                        onChange={(e) => setBetShares(e.target.value)}
                        placeholder="Shares"
                        min="1"
                        className="flex-1"
                      />
                      <span className="font-mono text-xs text-neutral-400">shares</span>
                    </div>
                    <div className="text-sm text-neutral-600">
                      Cost: <strong>
                        {lmsrCost(market.yesShares, market.noShares, market.b, parseFloat(betShares) || 0, betSide === 'yes').toFixed(2)} RESEARCH
                      </strong>
                      <span className="text-neutral-400 ml-2">
                        (price per share: {(betSide === 'yes' ? yesPrice : noPrice).toFixed(4)})
                      </span>
                    </div>
                    <Button
                      className="w-full bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-xs uppercase tracking-widest"
                      onClick={() => placeBet(market)}
                    >
                      Buy {betSide.toUpperCase()} Shares
                    </Button>
                  </div>
                )}
              </div>
            </FadeIn>
          );
        })}
      </div>

      {/* Positions */}
      {positions.length > 0 && (
        <FadeIn delay={0.2}>
          <div className="mt-12">
            <span className="section-label mb-4 block">Your Positions</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {positions.map(pos => {
                const market = markets.find(m => m.id === pos.marketId);
                if (!market) return null;
                return (
                  <div key={pos.marketId} className="border border-neutral-200 p-4">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">{market.paperTitle}</div>
                    <div className="flex items-center gap-3 text-sm">
                      <Badge variant={pos.side === 'yes' ? 'success' : 'destructive'}>{pos.side.toUpperCase()}</Badge>
                      <span>{pos.shares} shares</span>
                    </div>
                    {market.resolved && ((market.outcome && pos.side === 'yes') || (!market.outcome && pos.side === 'no')) && (
                      <Button variant="outline" size="sm" className="mt-2 font-mono text-[10px] uppercase" onClick={() => claimPayout(market)}>Claim Winnings</Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}

export default PredictionMarket;
