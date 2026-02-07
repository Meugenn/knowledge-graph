#!/usr/bin/env node
const path = require('path');
const KnowledgeGraph = require('../services/kg');
const AgentGateway = require('../services/agent-gateway');

async function seed() {
  console.log('Seeding The Republic...\n');

  // 1. Seed KG (auto-loads from fixtures/demo-seed.json)
  const kg = new KnowledgeGraph();
  const stats = kg.getStats();
  console.log(`KG: ${stats.paperCount} papers, ${stats.authorCount} authors, ${stats.relationCount} relations`);

  // 2. Create agent wallets
  const gateway = new AgentGateway({ kg });
  const agents = gateway.getAgents();
  for (const agent of agents) {
    const wallet = await gateway.createAgentWallet(agent.id);
    console.log(`Agent ${agent.name} (${agent.caste}): ${wallet.address}`);
  }

  console.log('\nSeed complete.');
}

seed().catch(console.error);
