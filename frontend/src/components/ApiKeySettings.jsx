import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Eye, EyeOff, KeyRound, Check, Trash2, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  PROVIDERS,
  getLLMConfig,
  setLLMConfig,
  getStoredApiKey,
  setStoredApiKey,
  hasStoredApiKey,
} from '../utils/llm';

function ApiKeySettings({ isOpen, onClose }) {
  const [provider, setProvider] = useState('claude');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [autoSwitched, setAutoSwitched] = useState(null); // provider label after auto-switch

  useEffect(() => {
    if (isOpen) {
      const config = getLLMConfig();
      setProvider(config.provider);
      setModel(config.model);
      setApiKey(getStoredApiKey());
      setSaved(false);
      setAutoSwitched(null);
    }
  }, [isOpen]);

  // Auto-detect provider from key prefix
  const handleKeyChange = useCallback((e) => {
    const key = e.target.value;
    setApiKey(key);
    setAutoSwitched(null);
    if (key.startsWith('AIza')) {
      setProvider(prev => {
        if (prev !== 'gemini') { setAutoSwitched('Google Gemini'); return 'gemini'; }
        return prev;
      });
    } else if (key.startsWith('sk-')) {
      setProvider(prev => {
        if (prev !== 'openai' && prev !== 'openrouter') { setAutoSwitched('OpenAI'); return 'openai'; }
        return prev;
      });
    }
  }, []);

  // Detect key/provider mismatch (must be before early return to keep hook order stable)
  const keyMismatch = useMemo(() => {
    if (!apiKey) return null;
    if (apiKey.startsWith('AIza') && provider !== 'gemini') {
      return { detected: 'gemini', label: 'Google Gemini' };
    }
    if (apiKey.startsWith('sk-') && provider !== 'openai' && provider !== 'openrouter') {
      return { detected: 'openai', label: 'OpenAI' };
    }
    return null;
  }, [apiKey, provider]);

  if (!isOpen) return null;

  const handleSave = () => {
    setLLMConfig(provider, model);
    setStoredApiKey(apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearKey = () => {
    setApiKey('');
    setStoredApiKey('');
  };

  const keyIsSet = hasStoredApiKey();

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full sm:w-[380px] sm:max-w-[90vw] bg-white border-l border-neutral-200 overflow-y-auto animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-neutral-500" />
              <span className="font-mono text-xs uppercase tracking-widest font-medium">AI Settings</span>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Provider */}
          <div className="mb-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
              Provider
            </label>
            <select
              value={provider}
              onChange={e => setProvider(e.target.value)}
              className="w-full h-9 px-3 text-sm border border-neutral-200 bg-white text-neutral-700 focus:outline-none focus:ring-1 focus:ring-neutral-300"
            >
              {Object.entries(PROVIDERS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Model override */}
          <div className="mb-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
              Model Override
            </label>
            <Input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder={PROVIDERS[provider]?.defaultModel || 'default'}
              className="h-9 text-sm bg-white border-neutral-200 font-light text-neutral-700 placeholder:text-neutral-400"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              Leave blank to use default: {PROVIDERS[provider]?.defaultModel}
            </p>
          </div>

          <Separator className="my-5" />

          {/* API Key */}
          <div className="mb-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
              API Key
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={handleKeyChange}
                  placeholder="sk-... or AIza..."
                  className="h-9 text-sm bg-white border-neutral-200 font-mono text-neutral-700 placeholder:text-neutral-400 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {apiKey && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 text-red-400 border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={handleClearKey}
                  title="Clear key"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Key/provider auto-switch confirmation or mismatch warning */}
          {autoSwitched && (
            <div className="flex items-center gap-2 p-2.5 mb-4 bg-green-50 border border-green-200 text-green-700">
              <Info className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[11px] leading-snug">
                Provider switched to <strong>{autoSwitched}</strong> based on key prefix.
              </span>
            </div>
          )}
          {!autoSwitched && keyMismatch && (
            <button
              onClick={() => setProvider(keyMismatch.detected)}
              className="w-full flex items-center gap-2 text-left p-2.5 mb-4 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-[11px] leading-snug">
                This looks like a <strong>{keyMismatch.label}</strong> key. Click to switch provider.
              </span>
            </button>
          )}

          {/* Status */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-1.5 h-1.5 rounded-full ${keyIsSet ? 'bg-green-500' : 'bg-neutral-300'}`} />
            <span className="text-xs text-neutral-500">
              {keyIsSet ? 'User key set' : 'Using server key (if configured)'}
            </span>
          </div>

          {/* Security note */}
          <div className="bg-neutral-50 border border-neutral-100 p-3 mb-5">
            <p className="text-[10px] text-neutral-500 leading-relaxed">
              Your API key is stored in <strong>session storage only</strong> and is cleared when you close this tab.
              It is sent per-request to the backend proxy and never persisted on the server.
            </p>
          </div>

          {/* Save */}
          <Button
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-[10px] uppercase tracking-widest"
            onClick={handleSave}
          >
            {saved ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Saved
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ApiKeySettings;
