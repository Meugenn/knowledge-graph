// Shared LLM calling utilities — routes all calls through backend proxy
// API keys: server .env as fallback, user key from sessionStorage takes priority

import { BACKEND_URL } from '../config';

const PROVIDER_STORAGE = 'rg_llm_provider';
const MODEL_STORAGE = 'rg_llm_model';
const APIKEY_STORAGE = 'rg_llm_apikey';

export const PROVIDERS = {
  claude: {
    label: 'Claude (Anthropic)',
    defaultModel: 'claude-sonnet-4-5-20250929',
    contextWindow: 200000,
    maxOutput: 8192,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  openai: {
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    contextWindow: 128000,
    maxOutput: 16384,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
  openrouter: {
    label: 'OpenRouter',
    defaultModel: 'anthropic/claude-sonnet-4-5',
    contextWindow: 200000,
    maxOutput: 8192,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
  },
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    contextWindow: 1000000,
    maxOutput: 8192,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
};

export function getLLMConfig() {
  const provider = localStorage.getItem(PROVIDER_STORAGE) || 'claude';
  const model = localStorage.getItem(MODEL_STORAGE) || '';
  return { provider, model };
}

export function setLLMConfig(provider, model) {
  if (provider) localStorage.setItem(PROVIDER_STORAGE, provider);
  if (model !== undefined) localStorage.setItem(MODEL_STORAGE, model);
}

export function getStoredApiKey() {
  return sessionStorage.getItem(APIKEY_STORAGE) || '';
}

export function setStoredApiKey(key) {
  if (key) {
    sessionStorage.setItem(APIKEY_STORAGE, key);
  } else {
    sessionStorage.removeItem(APIKEY_STORAGE);
  }
}

export function hasStoredApiKey() {
  return !!sessionStorage.getItem(APIKEY_STORAGE);
}

// Dispatch event to open the global API Key Settings panel from anywhere
export function openApiSettings() {
  window.dispatchEvent(new Event('open-api-settings'));
}

export async function callLLM(systemPrompt, userMessages, options = {}) {
  const { provider, model } = getLLMConfig();
  const effectiveModel = model || PROVIDERS[provider]?.defaultModel || '';
  const userApiKey = getStoredApiKey();

  const response = await fetch(`${BACKEND_URL}/api/llm/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      model: effectiveModel,
      systemPrompt,
      messages: userMessages,
      maxTokens: options.maxTokens || 1500,
      temperature: options.temperature ?? 0.7,
      ...(userApiKey ? { userApiKey } : {}),
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errBody.error || `LLM proxy error ${response.status}`);
  }

  const data = await response.json();
  if (!data.content) {
    throw new Error('LLM returned empty response. Try rephrasing your question.');
  }
  return data.content;
}
