// Token estimation utilities for the AI Research Lab pipeline
// Provides rough estimates for cost prediction and context window management

import { PROVIDERS, getLLMConfig } from './llm';

// Rough token estimate: ~4 chars per token for English text
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// Get current provider's context limits and pricing
export function getContextLimits() {
  const { provider } = getLLMConfig();
  const p = PROVIDERS[provider] || PROVIDERS.gemini;
  return {
    contextWindow: p.contextWindow,
    maxOutput: p.maxOutput,
    costPer1kInput: p.costPer1kInput,
    costPer1kOutput: p.costPer1kOutput,
    provider: p.label,
  };
}

// Estimate token usage for a single agent call
export function estimateAgentTokens(agent, papers, prevOutputs = {}) {
  const systemTokens = estimateTokens(agent.systemPrompt || '');
  const paperText = papers.map(p => `${p.title || ''} ${p.abstract || ''}`).join(' ');
  const prevText = Object.values(prevOutputs)
    .filter(v => v && !v._error)
    .map(v => JSON.stringify(v).slice(0, 2000))
    .join(' ');
  const userTokens = estimateTokens(paperText) + estimateTokens(prevText);
  const outputTokens = 2000;
  return { systemTokens, userTokens, outputTokens, total: systemTokens + userTokens + outputTokens };
}

// Estimate total pipeline token usage and cost
export function estimatePipeline(agents, papers) {
  const limits = getContextLimits();
  let totalInput = 0;
  let totalOutput = 0;
  const perAgent = [];
  const mockPrevOutputs = {};

  for (const agent of agents) {
    if (agent.isClientSide) {
      perAgent.push({ id: agent.id, name: agent.name, tokens: 0, inputTokens: 0, outputTokens: 0, withinLimits: true });
      continue;
    }
    const est = estimateAgentTokens(agent, papers, mockPrevOutputs);
    const inputTokens = est.systemTokens + est.userTokens;
    const withinLimits = (inputTokens + est.outputTokens) <= limits.contextWindow;
    perAgent.push({
      id: agent.id,
      name: agent.name,
      tokens: est.total,
      inputTokens,
      outputTokens: est.outputTokens,
      withinLimits,
    });
    totalInput += inputTokens;
    totalOutput += est.outputTokens;
    // Simulated output placeholder for downstream agent estimates
    mockPrevOutputs[agent.id] = { _estimated: true };
  }

  const estimatedCost = (totalInput / 1000) * limits.costPer1kInput + (totalOutput / 1000) * limits.costPer1kOutput;

  return {
    totalTokens: totalInput + totalOutput,
    totalInput,
    totalOutput,
    estimatedCost,
    perAgent,
    provider: limits.provider,
    contextWindow: limits.contextWindow,
    allWithinLimits: perAgent.every(a => a.withinLimits),
  };
}
