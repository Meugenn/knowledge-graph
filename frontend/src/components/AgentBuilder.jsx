import React, { useState, useEffect } from 'react';
import { X, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const COLOR_PALETTE = [
  '#4A90D9', '#E53E3E', '#38A169', '#D69E2E',
  '#805AD5', '#DD6B20', '#319795', '#B83280',
];

function AgentBuilder({ isOpen, onClose, onSave, existingAgent, allAgents }) {
  const [name, setName] = useState('');
  const [letter, setLetter] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [specialty, setSpecialty] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.5);
  const [dependsOn, setDependsOn] = useState([]);
  const [pipeline, setPipeline] = useState('replicate');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen && existingAgent) {
      setName(existingAgent.name || '');
      setLetter(existingAgent.letter || '');
      setColor(existingAgent.color || COLOR_PALETTE[0]);
      setSpecialty(existingAgent.specialty || '');
      setSystemPrompt(existingAgent.systemPrompt || '');
      setTemperature(existingAgent.temperature ?? 0.5);
      setDependsOn(existingAgent.dependsOn || []);
      setPipeline(existingAgent.mode || 'replicate');
    } else if (isOpen) {
      setName('');
      setLetter('');
      setColor(COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)]);
      setSpecialty('');
      setSystemPrompt('');
      setTemperature(0.5);
      setDependsOn([]);
      setPipeline('replicate');
      setShowPreview(false);
    }
  }, [isOpen, existingAgent]);

  // Auto-derive letter from name
  useEffect(() => {
    if (name && !existingAgent) {
      const parts = name.trim().split(/\s+/);
      const last = parts[parts.length - 1];
      setLetter(last.charAt(0).toUpperCase());
    }
  }, [name, existingAgent]);

  if (!isOpen) return null;

  const toggleDep = (id) => {
    setDependsOn(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    onSave({
      id: existingAgent?.id || `custom-${Date.now()}`,
      name: name.trim(),
      letter: letter || name.trim().charAt(0).toUpperCase(),
      color,
      specialty: specialty.trim(),
      systemPrompt: systemPrompt.trim(),
      temperature,
      dependsOn,
      mode: pipeline,
    });
    onClose();
  };

  const isValid = name.trim() && systemPrompt.trim();

  return (
    <div className="fixed inset-0 z-[1000] bg-black/40" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-full sm:w-[480px] sm:max-w-[90vw] bg-white border-l border-neutral-200 overflow-y-auto animate-slide-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-xs uppercase tracking-widest font-medium">
              {existingAgent ? 'Edit Agent' : 'New Agent'}
            </span>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
              Name *
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Dr. Hypothesis"
              className="h-9 text-sm"
            />
          </div>

          {/* Letter + Color row */}
          <div className="flex gap-4 mb-4">
            <div className="w-20">
              <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
                Letter
              </label>
              <Input
                value={letter}
                onChange={e => setLetter(e.target.value.slice(0, 1).toUpperCase())}
                maxLength={1}
                className="h-9 text-sm text-center font-mono font-bold"
              />
            </div>
            <div className="flex-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
                Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c}
                    className={`w-7 h-7 border-2 transition-all ${
                      color === c ? 'border-neutral-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Specialty */}
          <div className="mb-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
              Specialty
            </label>
            <Input
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              placeholder="e.g. Statistical Validator"
              className="h-9 text-sm"
            />
          </div>

          {/* System Prompt */}
          <div className="mb-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
              System Prompt *
            </label>
            <Textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder={"You are [Agent Name], a specialist in [domain].\n\nYour task is to analyze research papers and provide...\n\nRespond with JSON for structured rendering, or plain text."}
              rows={8}
              className="text-sm font-mono"
            />
            <p className="text-[10px] text-neutral-400 mt-1">
              Your agent will receive paper data + previous agent outputs. Use JSON for structured output or plain text.
            </p>
          </div>

          {/* Temperature */}
          <div className="mb-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
              Temperature: {temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-200 appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-neutral-900 [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-neutral-400 mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Dependencies */}
          <div className="mb-4">
            <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
              Depends On (runs after these agents)
            </label>
            <div className="flex flex-wrap gap-2">
              {(allAgents || []).map(a => (
                <button
                  key={a.id}
                  onClick={() => toggleDep(a.id)}
                  className={`px-2.5 py-1 text-xs border transition-colors ${
                    dependsOn.includes(a.id)
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
            {(allAgents || []).length === 0 && (
              <p className="text-[10px] text-neutral-400 mt-1">No existing agents to depend on.</p>
            )}
          </div>

          {/* Pipeline */}
          <div className="mb-6">
            <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 block mb-2">
              Pipeline
            </label>
            <div className="flex gap-2">
              {[
                { value: 'replicate', label: 'Replicate' },
                { value: 'discover', label: 'Discover' },
                { value: 'both', label: 'Both' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPipeline(opt.value)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest border transition-colors ${
                    pipeline === opt.value
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 mb-4"
          >
            <Eye className="h-3.5 w-3.5" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>

          {showPreview && (
            <div className="border border-neutral-200 p-4 mb-6 bg-neutral-50">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center border text-sm font-mono font-bold text-white"
                  style={{ backgroundColor: color, borderColor: color }}
                >
                  {letter || '?'}
                </span>
                <div>
                  <span className="text-sm font-semibold text-neutral-900">{name || 'Agent Name'}</span>
                  <span className="block text-xs text-neutral-400">{specialty || 'Specialty'}</span>
                </div>
                <Badge variant="outline" className="ml-auto">Custom</Badge>
              </div>
              {dependsOn.length > 0 && (
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  <span className="text-[10px] text-neutral-400">After:</span>
                  {dependsOn.map(id => {
                    const a = (allAgents || []).find(ag => ag.id === id);
                    return <Badge key={id} variant="secondary" className="text-[10px]">{a?.name || id}</Badge>;
                  })}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-[10px] uppercase tracking-widest"
              onClick={handleSave}
              disabled={!isValid}
            >
              <Save className="h-3 w-3 mr-1.5" />
              {existingAgent ? 'Update Agent' : 'Create Agent'}
            </Button>
            <Button
              variant="outline"
              className="font-mono text-[10px] uppercase tracking-widest"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentBuilder;
