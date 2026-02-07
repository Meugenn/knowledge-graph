import React from 'react';
import { motion } from 'framer-motion';
import { Shield, BookOpen, Cpu, ArrowRight } from 'lucide-react';
import { FadeIn } from '@/components/ui/fade-in';

function Vision() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero */}
      <section className="py-16 border-b border-neutral-100">
        <FadeIn>
          <span className="section-label mb-6 block">ETH Oxford 2026 — New Consumer Primitives</span>
          <h1 className="hero-title mb-8 max-w-4xl">
            The Republic of <br />
            <span className="italic text-neutral-400">Verified Knowledge.</span>
          </h1>
          <p className="body-text text-lg max-w-2xl mb-8">
            Inspired by Plato&rsquo;s vision of a just society governed by wisdom,
            The Republic is a decentralised ecosystem where three AI agent castes
            collaborate to verify, evaluate, and advance scientific research.
          </p>
          <p className="body-text text-lg max-w-2xl">
            On-chain incentives ensure every claim is scrutinised, every review is rewarded,
            and every result is reproducible &mdash; or exposed.
          </p>
        </FadeIn>
      </section>

      {/* The Three Castes */}
      <section className="py-24 border-b border-neutral-100">
        <FadeIn>
          <span className="section-label mb-6 block">01 — The Three Castes</span>
          <h2 className="section-title mb-6">Guardians. Philosophers. Producers.</h2>
          <p className="body-text text-base max-w-2xl mb-16">
            As in Plato&rsquo;s ideal state, each caste serves a distinct purpose.
            Together, they form a self-regulating system where no single agent can
            dominate or corrupt the pursuit of truth.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield, num: '01', label: 'Guardians',
              desc: 'Dr. Iris and her kind survey the scholarly landscape. They analyse citation networks, identify gaps in the literature, and verify claims against existing knowledge. Temperature: 0.3 — precise, methodical, unwavering.',
              colour: 'border-blue-200 hover:border-blue-500',
            },
            {
              icon: BookOpen, num: '02', label: 'Philosophers',
              desc: 'Prof. Atlas designs experimental frameworks and charts new research directions. Philosopher agents identify methodological weaknesses, propose improvements, and map the frontier of knowledge. Temperature: 0.5 — balanced, creative, rigorous.',
              colour: 'border-purple-200 hover:border-purple-500',
            },
            {
              icon: Cpu, num: '03', label: 'Producers',
              desc: 'Agent Tensor estimates computational requirements, simulates experiments, and evaluates replication feasibility. Producer agents ground abstract ideas in practical reality. Temperature: 0.4 — efficient, precise, resourceful.',
              colour: 'border-emerald-200 hover:border-emerald-500',
            },
          ].map((caste, i) => (
            <FadeIn key={i} delay={0.1 * i}>
              <div className={`border p-8 transition-colors ${caste.colour}`}>
                <caste.icon className="h-6 w-6 mb-4 text-neutral-400" />
                <span className="font-mono text-4xl font-light text-neutral-200 block mb-2">{caste.num}</span>
                <h3 className="text-2xl mb-3">{caste.label}</h3>
                <p className="text-neutral-600 font-light text-sm leading-relaxed">{caste.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Problems */}
      <section className="py-24 border-b border-neutral-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-4">
            <FadeIn>
              <span className="section-label mb-6 block">02 — The Problem</span>
              <h2 className="section-title mb-6">Broken incentives, broken science.</h2>
              <p className="body-text text-base">
                The publish-or-perish model optimises for quantity over quality.
                The people who matter most &mdash; reviewers &mdash; have no stake in the outcome.
              </p>
            </FadeIn>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { title: 'Slow Review Cycles', desc: 'Peer review takes months to years. Reviewers work for free with no accountability or incentive to be thorough.' },
              { title: 'Zero Reviewer Compensation', desc: 'Reviewers donate thousands of hours with no compensation, leading to declining quality and participation.' },
              { title: 'Citation Gaming', desc: 'Impact factors and h-indices are easily gamed. Metrics reward self-citation and quantity over genuine contribution.' },
              { title: 'Irreproducible Results', desc: 'Most published research cannot be reproduced. Code is missing, environments are undocumented, results are unverifiable.' },
            ].map((item, i) => (
              <FadeIn key={i} delay={0.05 * i}>
                <div className="border border-neutral-100 p-6 hover:border-neutral-900 transition-colors group">
                  <h4 className="font-mono text-xs uppercase tracking-widest mb-3 text-neutral-900">
                    {item.title}
                  </h4>
                  <p className="text-neutral-600 font-light text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* The Protocol */}
      <section className="py-24 border-b border-neutral-100">
        <FadeIn>
          <span className="section-label mb-6 block">03 — The Protocol</span>
          <h2 className="section-title mb-6">Discover. Evaluate. Execute.</h2>
          <p className="body-text text-base max-w-2xl mb-16">
            Three stages, each incentive-aligned. Every paper is discoverable, every review is rewarded,
            and every result is executable.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { num: '01', label: 'Discover', desc: 'Explore papers through an interactive knowledge graph with citation networks, semantic search, GNN-powered link prediction, and LMSR prediction markets.' },
            { num: '02', label: 'Evaluate', desc: 'Multi-dimensional review with Bayesian aggregation, linguistic forensics, TRiSM safety protocols, and on-chain USDC incentives via dual-chain architecture.' },
            { num: '03', label: 'Execute', desc: 'AI agent castes autonomously analyse, verify, and replicate research. Paper2Agent transforms papers into callable MCP tools. RALPH discovers frontiers.' },
          ].map((step, i) => (
            <FadeIn key={i} delay={0.1 * i}>
              <div className="border border-neutral-200 p-8">
                <span className="font-mono text-4xl font-light text-neutral-200 block mb-4">{step.num}</span>
                <h3 className="text-2xl mb-3">{step.label}</h3>
                <p className="text-neutral-600 font-light text-sm leading-relaxed">{step.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Infrastructure */}
      <section className="py-24 border-b border-neutral-100">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-4">
            <FadeIn>
              <span className="section-label mb-6 block">04 — Dual-Chain Architecture</span>
              <h2 className="section-title mb-6">Human Chain &amp; AI Chain.</h2>
              <p className="body-text text-base">
                Two chains, complementary roles. Flare for human verification and data integrity.
                Plasma for autonomous AI agent transactions. A bridge mirrors critical events.
              </p>
            </FadeIn>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { title: 'Knowledge Graph', desc: 'Interactive force-directed visualisation of papers with citation networks. Search, filter by field, and explore connections with real Semantic Scholar data.' },
              { title: 'LMSR Markets', desc: 'Logarithmic Market Scoring Rule prediction markets for paper replication outcomes. Proper automated market making with dynamic pricing.' },
              { title: 'Linguistic Forensics', desc: 'Deontic and hedge marker analysis to assess synthetic ethos. Citation traceability scoring against the knowledge graph.' },
              { title: 'TRiSM Safety', desc: 'Trust, Risk, and Security Management for AI agents. Hallucination detection, drift monitoring, and 3-level circuit breaker escalation.' },
            ].map((item, i) => (
              <FadeIn key={i} delay={0.05 * i}>
                <div className="border border-neutral-100 p-6 hover:border-neutral-900 transition-colors group">
                  <h4 className="font-mono text-xs uppercase tracking-widest mb-3 text-neutral-900">
                    {item.title}
                  </h4>
                  <p className="text-neutral-600 font-light text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24">
        <FadeIn>
          <span className="section-label mb-6 block">05 — Stack</span>
          <h2 className="section-title mb-16">Architecture</h2>
        </FadeIn>

        <div className="space-y-4">
          {[
            { label: 'Frontend', tech: 'React + Vite + Tailwind + ForceGraph2D', items: 'Knowledge Graph, Agent Command Centre, LMSR Markets, AI Lab, RALPH' },
            { label: 'Backend', tech: 'Node.js + Express + WebSocket', items: 'KG Service, Agent Gateway, Data Oracle, Forensics, TRiSM, Paper2Agent' },
            { label: 'Smart Contracts', tech: 'Solidity + Ethers.js', items: 'ResearchGraph.sol, LMSR PredictionMarket.sol, ResearchToken.sol' },
            { label: 'Infrastructure', tech: 'Flare Testnet + Plasma Testnet', items: 'Dual-chain bridge, Semantic Scholar API, OpenAlex, arXiv' },
          ].map((layer, i) => (
            <FadeIn key={i} delay={0.1 * i}>
              <div className="bg-neutral-50 border border-neutral-200 p-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="md:w-48 flex-shrink-0">
                  <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">{layer.label}</span>
                </div>
                <div className="flex-1">
                  <span className="text-neutral-900 font-medium text-sm">{layer.tech}</span>
                  <p className="text-neutral-500 text-xs mt-1">{layer.items}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Vision;
