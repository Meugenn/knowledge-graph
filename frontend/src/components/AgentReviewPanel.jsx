import React, { useState, useCallback } from 'react';
import { AGENTS } from '../utils/agentDefinitions';
import { FRONTIER_AGENTS } from '../utils/frontierDefinitions';
import { loadCustomAgents, addCustomAgent, updateCustomAgent, deleteCustomAgent } from '../utils/customAgents';
import AgentBuilder from './AgentBuilder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Plus, Pencil, Trash2, FlaskConical, Telescope } from 'lucide-react';

function AgentReviewPanel() {
  const [viewMode, setViewMode] = useState('replicate'); // 'replicate' | 'discover'
  const [expandedAgent, setExpandedAgent] = useState(null);
  const [customAgents, setCustomAgents] = useState(loadCustomAgents);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  const defaultAgents = viewMode === 'discover' ? FRONTIER_AGENTS : AGENTS;
  const relevantCustom = customAgents.filter(a => a.mode === viewMode || a.mode === 'both');
  const allAgents = [...defaultAgents, ...relevantCustom];

  const handleSaveAgent = useCallback((agent) => {
    const existing = customAgents.find(a => a.id === agent.id);
    if (existing) {
      setCustomAgents(updateCustomAgent(agent.id, agent));
    } else {
      setCustomAgents(addCustomAgent(agent));
    }
    setEditingAgent(null);
  }, [customAgents]);

  const handleDeleteAgent = useCallback((id) => {
    setCustomAgents(deleteCustomAgent(id));
  }, []);

  const handleEdit = useCallback((agent) => {
    setEditingAgent(agent);
    setBuilderOpen(true);
  }, []);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* Sub-toggle */}
      <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-3 bg-neutral-50">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('replicate')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest border transition-colors ${
              viewMode === 'replicate'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400'
            }`}
          >
            <FlaskConical className="inline-block w-3 h-3 mr-1.5 -mt-px" />
            Replicate
          </button>
          <button
            onClick={() => setViewMode('discover')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-widest border transition-colors ${
              viewMode === 'discover'
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-400'
            }`}
          >
            <Telescope className="inline-block w-3 h-3 mr-1.5 -mt-px" />
            Discover
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-[10px] uppercase tracking-widest"
          onClick={() => { setEditingAgent(null); setBuilderOpen(true); }}
        >
          <Plus className="h-3 w-3 mr-1.5" />
          Add Agent
        </Button>
      </div>

      {/* Pipeline diagram */}
      <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-2">Pipeline Flow</div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {allAgents.map((agent, i) => (
            <React.Fragment key={agent.id}>
              {i > 0 && <ChevronRight className="w-4 h-4 flex-shrink-0 text-neutral-300" />}
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 border border-neutral-200 bg-white text-xs flex-shrink-0 cursor-pointer hover:border-neutral-400 transition-colors"
                onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
              >
                <span
                  className="w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: agent.color || '#737373' }}
                >
                  {agent.name?.charAt(agent.name.lastIndexOf(' ') + 1) || '?'}
                </span>
                <span className="text-neutral-700 whitespace-nowrap">{agent.name}</span>
                {agent.isCustom && <Badge variant="outline" className="text-[8px] py-0 px-1">Custom</Badge>}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Agent list */}
      <div className="p-6 space-y-2">
        {allAgents.map(agent => {
          const isExpanded = expandedAgent === agent.id;
          const isCustom = agent.isCustom || customAgents.some(c => c.id === agent.id);
          const storedVersion = customAgents.find(c => c.id === agent.id);
          return (
            <div key={agent.id} className="border border-neutral-200 bg-white">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none hover:bg-neutral-50 transition-colors"
                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 items-center justify-center text-xs font-mono font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: agent.color || '#737373' }}
                  >
                    {agent.name?.charAt(agent.name.lastIndexOf(' ') + 1) || '?'}
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900">{agent.name}</span>
                    <span className="block text-xs text-neutral-400">{agent.specialty}</span>
                  </div>
                  {isCustom && <Badge variant="outline" className="text-[10px]">Custom</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {agent.dependsOn?.length > 0 && (
                    <div className="flex gap-1">
                      {agent.dependsOn.map(dep => (
                        <Badge key={dep} variant="secondary" className="text-[10px]">{dep}</Badge>
                      ))}
                    </div>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-neutral-200 px-4 py-3 bg-neutral-50">
                  <div className="space-y-3">
                    {/* Metadata */}
                    <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                      <span>Temperature: <strong className="text-neutral-700">{(agent.temperature ?? 0.4).toFixed(1)}</strong></span>
                      {agent.isClientSide && <Badge variant="info">Client-side</Badge>}
                      {agent.dependsOn?.length > 0 && (
                        <span>
                          Depends on:{' '}
                          {agent.dependsOn.map(dep => {
                            const depAgent = allAgents.find(a => a.id === dep);
                            return <Badge key={dep} variant="secondary" className="ml-1 text-[10px]">{depAgent?.name || dep}</Badge>;
                          })}
                        </span>
                      )}
                    </div>

                    {/* System Prompt */}
                    {agent.systemPrompt && (
                      <div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">System Prompt</div>
                        <pre className="bg-white border border-neutral-200 p-3 text-xs font-mono text-neutral-600 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap">
                          {agent.systemPrompt}
                        </pre>
                      </div>
                    )}

                    {/* Custom agent actions */}
                    {isCustom && storedVersion && (
                      <div className="flex gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] font-mono uppercase tracking-widest"
                          onClick={(e) => { e.stopPropagation(); handleEdit(storedVersion); }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] font-mono uppercase tracking-widest text-red-500 border-red-200 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); handleDeleteAgent(storedVersion.id); }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Agent Builder modal */}
      <AgentBuilder
        isOpen={builderOpen}
        onClose={() => { setBuilderOpen(false); setEditingAgent(null); }}
        onSave={handleSaveAgent}
        existingAgent={editingAgent}
        allAgents={defaultAgents}
      />
    </div>
  );
}

export default AgentReviewPanel;
