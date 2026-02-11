// Custom agent CRUD + hydration for the AI Research Lab pipeline
// Stores user-created agents in localStorage and merges them into pipelines

import { defaultParse } from './agentDefinitions';

const STORAGE_KEY = 'rg_custom_agents';

// Serializable agent shape:
// { id, name, letter, color, specialty, systemPrompt, temperature, dependsOn[], mode: 'replicate'|'discover'|'both' }

export function loadCustomAgents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCustomAgents(agents) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(agents));
}

export function addCustomAgent(agent) {
  const agents = loadCustomAgents();
  agents.push({ ...agent, id: agent.id || `custom-${Date.now()}` });
  saveCustomAgents(agents);
  return agents;
}

export function updateCustomAgent(id, updates) {
  const agents = loadCustomAgents().map(a =>
    a.id === id ? { ...a, ...updates } : a
  );
  saveCustomAgents(agents);
  return agents;
}

export function deleteCustomAgent(id) {
  const agents = loadCustomAgents().filter(a => a.id !== id);
  saveCustomAgents(agents);
  return agents;
}

// Convert a stored agent into a runnable pipeline agent (adds functions)
export function hydrateAgent(stored) {
  return {
    ...stored,
    isCustom: true,
    dependsOn: stored.dependsOn || [],
    buildUserMessage(papers, prevOutputs) {
      const paperCtx = papers.map(p =>
        `TITLE: ${p.title}\nABSTRACT: ${p.abstract || 'N/A'}\nFIELD: ${(p.fieldsOfStudy || []).join(', ')}`
      ).join('\n---\n');
      const prevCtx = Object.entries(prevOutputs)
        .filter(([_, v]) => v && !v._error)
        .map(([id, v]) => `[${id}]: ${JSON.stringify(v).slice(0, 2000)}`)
        .join('\n');
      return `Papers:\n${paperCtx}\n\nPrevious analyses:\n${prevCtx || 'None yet'}`;
    },
    parseOutput: defaultParse,
  };
}

// Merge custom agents into a default pipeline based on mode
export function buildPipelineWithCustom(defaultAgents, mode) {
  const customs = loadCustomAgents()
    .filter(a => a.mode === mode || a.mode === 'both')
    .map(hydrateAgent);
  return [...defaultAgents, ...customs];
}
