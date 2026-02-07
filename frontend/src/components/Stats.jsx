import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { Skeleton } from '@/components/ui/skeleton';

function Stats({ contracts, account }) {
  const [stats, setStats] = useState({
    totalPapers: 0,
    acceptedPapers: 0,
    totalCitations: 0,
    totalReviews: 0,
    userBalance: '0',
    usdcBalance: '0',
    submissionFee: '0',
    reviewReward: '0',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [contracts, account]);

  const loadStats = async () => {
    if (!contracts.researchGraph || !contracts.researchToken || !contracts.usdc) return;

    try {
      setLoading(true);
      const paperCount = await contracts.researchGraph.paperCount();
      let acceptedCount = 0;
      let totalCites = 0;

      for (let i = 1; i <= Number(paperCount); i++) {
        const paper = await contracts.researchGraph.getPaper(i);
        if (Number(paper.status) === 2) acceptedCount++;
        totalCites += Number(paper.citationCount);
      }

      const tokenBalance = await contracts.researchToken.balanceOf(account);
      const usdcBal = await contracts.usdc.balanceOf(account);
      const subFee = await contracts.researchGraph.submissionFeeUSD();
      const revReward = await contracts.researchGraph.reviewRewardUSD();

      setStats({
        totalPapers: Number(paperCount),
        acceptedPapers: acceptedCount,
        totalCitations: totalCites,
        totalReviews: 0,
        userBalance: ethers.formatEther(tokenBalance),
        usdcBalance: ethers.formatUnits(usdcBal, 6),
        submissionFee: ethers.formatUnits(subFee, 6),
        reviewReward: ethers.formatUnits(revReward, 6),
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const StatCard = ({ value, label }) => (
    <div className="border border-neutral-200 p-6">
      <div className="text-3xl font-light text-neutral-900 mb-1">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">{label}</div>
    </div>
  );

  return (
    <div>
      <FadeIn>
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="section-label mb-2 block">Protocol Metrics</span>
            <h2 className="section-title">Statistics</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-xs uppercase tracking-widest"
            onClick={loadStats}
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <span className="section-label mb-4 block">01 — Network</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard value={stats.totalPapers} label="Total Papers" />
          <StatCard value={stats.acceptedPapers} label="Accepted" />
          <StatCard value={stats.totalCitations} label="Citations" />
          <StatCard
            value={`${stats.totalPapers > 0 ? ((stats.acceptedPapers / stats.totalPapers) * 100).toFixed(0) : 0}%`}
            label="Acceptance Rate"
          />
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <span className="section-label mb-4 block">02 — Your Balances</span>
        <div className="grid grid-cols-2 gap-4 mb-12">
          <StatCard value={parseFloat(stats.userBalance).toFixed(2)} label="RESEARCH Tokens" />
          <StatCard value={`$${parseFloat(stats.usdcBalance).toFixed(2)}`} label="USDC (Plasma)" />
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <span className="section-label mb-4 block">03 — Economics</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard value={`$${stats.submissionFee}`} label="Submission Fee" />
          <StatCard value={`$${stats.reviewReward}`} label="Review Reward" />
          <StatCard value="10" label="Citation Reward" />
          <StatCard value="50" label="Replication Reward" />
        </div>
      </FadeIn>

      <FadeIn delay={0.4}>
        <span className="section-label mb-4 block">04 — Infrastructure</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-50 border border-neutral-200 p-6">
            <h4 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-4">Flare Network</h4>
            <ul className="space-y-2 text-sm text-neutral-600 font-light">
              <li>FDC: External data verification</li>
              <li>FTSO: Token price feeds</li>
              <li>RNG: Random reviewer assignment</li>
            </ul>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 p-6">
            <h4 className="font-mono text-xs uppercase tracking-widest text-neutral-400 mb-4">Plasma Network</h4>
            <ul className="space-y-2 text-sm text-neutral-600 font-light">
              <li>Stablecoin payments (USDC)</li>
              <li>Fast settlement</li>
              <li>Low transaction fees</li>
            </ul>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

export default Stats;
