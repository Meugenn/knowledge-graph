import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AGENTS } from '../utils/agentDefinitions';
import { FRONTIER_AGENTS } from '../utils/frontierDefinitions';
import { runAgentPipeline, runReplicationPipeline } from '../utils/agentOrchestrator';
import { buildPipelineWithCustom } from '../utils/customAgents';
import { estimatePipeline } from '../utils/tokenEstimator';
import AgentCard from './AgentCard';
import ReplicationReport from './ReplicationReport';
import FrontierReport from './FrontierReport';
import RALPHMode from './RALPHMode';
import AgentReviewPanel from './AgentReviewPanel';
import { SEED_PAPERS } from '../utils/seedData';
import { PROBLEM_SETS } from '../utils/problemSets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FadeIn } from '@/components/ui/fade-in';
import { Search, Plus, X, Upload, FlaskConical, Telescope, ChevronRight, FileText, Puzzle, Network, Loader2, ExternalLink, Users, Zap, CheckCircle, AlertTriangle } from 'lucide-react';
import { searchPapers } from '../utils/semanticScholar';

const CUSTOM_PAPERS_KEY = 'lab-custom-papers';

function loadCustomPapers() {
  try {
    const raw = localStorage.getItem(CUSTOM_PAPERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomPapers(papers) {
  localStorage.setItem(CUSTOM_PAPERS_KEY, JSON.stringify(papers));
}

function buildInitialStates(agents) {
  return Object.fromEntries(
    agents.map(a => [a.id, { status: 'pending', output: null, duration: null, error: null }])
  );
}

/**
 * Build a modified copy of agents with user custom prompt injected into system prompts.
 */
function buildPromptedAgents(agents, customPrompt) {
  if (!customPrompt || !customPrompt.trim()) return agents;
  const block = `\n\nUSER INSTRUCTIONS:\n${customPrompt.trim()}`;
  return agents.map(agent => {
    if (agent.isClientSide) return agent;
    return { ...agent, systemPrompt: agent.systemPrompt + block };
  });
}

function AIResearchLab({ labPaper }) {
  const papers = SEED_PAPERS;
  const [customPapers, setCustomPapers] = useState(loadCustomPapers);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('replicate'); // 'replicate' | 'discover' | 'ralph'
  const [paperSource, setPaperSource] = useState('papers'); // 'papers' | 'problems'
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [selectedPapers, setSelectedPapers] = useState([]); // for discover multi-select
  const [agentStates, setAgentStates] = useState(buildInitialStates(AGENTS));
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [hasApiKey, setHasApiKey] = useState(true); // API keys are server-side now
  const [customPrompt, setCustomPrompt] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [form, setForm] = useState({ title: '', authors: '', year: '', abstract: '', fields: '' });
  const updateForm = useCallback((field, value) => setForm(prev => ({ ...prev, [field]: value })), []);
  const [showConnections, setShowConnections] = useState(false);
  const [connectedPapers, setConnectedPapers] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [showTokenDetail, setShowTokenDetail] = useState(false);
  const pipelineRef = useRef(null);
  const fileInputRef = useRef(null);

  const activeAgents = useMemo(
    () => {
      if (mode === 'discover' || mode === 'ralph') return buildPipelineWithCustom(FRONTIER_AGENTS, 'discover');
      return buildPipelineWithCustom(AGENTS, 'replicate');
    },
    [mode]
  );

  // Token usage estimate for current pipeline + selection
  const tokenEstimate = useMemo(() => {
    const papers = mode === 'discover' ? selectedPapers : (selectedPaper ? [selectedPaper] : []);
    if (papers.length === 0 || !papers[0]) return null;
    return estimatePipeline(activeAgents, papers);
  }, [activeAgents, selectedPaper, selectedPapers, mode]);

  // Fetch knowledge graph connections for selected paper
  const fetchConnections = useCallback(async (paper) => {
    if (!paper?.title) return;
    setLoadingConnections(true);
    setShowConnections(true);
    try {
      // Search S2 for papers related to this one
      const terms = paper.title.split(/\s+/).filter(w => w.length > 3).slice(0, 5).join(' ');
      const results = await searchPapers(terms, 8);
      // Filter out the selected paper itself
      const filtered = results.filter(r => r.title?.toLowerCase() !== paper.title?.toLowerCase());
      setConnectedPapers(filtered);
    } catch (err) {
      console.error('Connection fetch failed:', err);
      setConnectedPapers([]);
    }
    setLoadingConnections(false);
  }, []);

  // Handle incoming paper from PaperDetail "Replicate" button
  useEffect(() => {
    if (labPaper && labPaper.title) {
      setSelectedPaper(labPaper);
      setMode('replicate');
    }
  }, [labPaper]);

  // Reset state on mode switch
  const handleModeSwitch = useCallback((newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setPipelineRunning(false);
    setFinalReport(null);
    if (newMode === 'discover' || newMode === 'ralph') {
      setAgentStates(buildInitialStates(buildPipelineWithCustom(FRONTIER_AGENTS, 'discover')));
      // Carry over selected paper to multi-select
      setSelectedPapers(selectedPaper ? [selectedPaper] : []);
    } else if (newMode === 'agents') {
      // No state reset needed for agent review tab
    } else {
      setAgentStates(buildInitialStates(buildPipelineWithCustom(AGENTS, 'replicate')));
      // Carry over first selected paper
      if (selectedPapers.length > 0) setSelectedPaper(selectedPapers[0]);
      setSelectedPapers([]);
    }
  }, [mode, selectedPaper, selectedPapers]);

  // Build the display list based on paper source
  const displayPapers = useMemo(() => {
    if (paperSource === 'problems') return PROBLEM_SETS;
    return [...customPapers, ...papers];
  }, [paperSource, customPapers, papers]);

  const filteredPapers = displayPapers.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.authors || []).some(a => {
      const name = typeof a === 'string' ? a : a.name;
      return name.toLowerCase().includes(search.toLowerCase());
    })
  );

  const updateAgent = useCallback((id, updates) => {
    setAgentStates(prev => ({ ...prev, [id]: { ...prev[id], ...updates } }));
  }, []);

  // Toggle paper in multi-select (discover mode)
  const togglePaperSelection = useCallback((paper) => {
    setSelectedPapers(prev => {
      const exists = prev.find(p => p.id === paper.id);
      if (exists) return prev.filter(p => p.id !== paper.id);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, paper];
    });
    setFinalReport(null);
    setAgentStates(buildInitialStates(FRONTIER_AGENTS));
  }, []);

  // Select paper in replicate mode
  const selectPaper = useCallback((paper) => {
    setSelectedPaper(paper);
    setFinalReport(null);
    setAgentStates(buildInitialStates(AGENTS));
  }, []);

  // Custom paper form handlers
  const handleAddCustomPaper = useCallback(() => {
    if (!form.title.trim() || !form.abstract.trim()) return;
    const newPaper = {
      id: `custom-${Date.now()}`,
      title: form.title.trim(),
      authors: form.authors ? form.authors.split(',').map(a => a.trim()).filter(Boolean) : [],
      year: form.year ? parseInt(form.year, 10) : new Date().getFullYear(),
      abstract: form.abstract.trim(),
      fieldsOfStudy: form.fields ? form.fields.split(',').map(f => f.trim()).filter(Boolean) : [],
      citationCount: 0,
      source: 'custom',
    };
    const updated = [newPaper, ...customPapers];
    setCustomPapers(updated);
    saveCustomPapers(updated);
    setForm({ title: '', authors: '', year: '', abstract: '', fields: '' });
    setShowCustomForm(false);
    // Auto-select the new paper
    if (mode === 'discover' || mode === 'ralph') {
      setSelectedPapers(prev => prev.length < 5 ? [...prev, newPaper] : prev);
    } else {
      setSelectedPaper(newPaper);
    }
  }, [form, customPapers, mode]);

  const handleRemoveCustomPaper = useCallback((paperId) => {
    const updated = customPapers.filter(p => p.id !== paperId);
    setCustomPapers(updated);
    saveCustomPapers(updated);
    // Deselect if removed
    if (selectedPaper?.id === paperId) setSelectedPaper(null);
    setSelectedPapers(prev => prev.filter(p => p.id !== paperId));
  }, [customPapers, selectedPaper]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updateForm('abstract', ev.target.result);
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  }, []);

  const startPipeline = useCallback(async () => {
    if (pipelineRunning) return;

    const papersForPipeline = mode === 'discover' ? selectedPapers : [selectedPaper];
    if (papersForPipeline.length === 0 || !papersForPipeline[0]) return;

    setPipelineRunning(true);
    setFinalReport(null);
    setAgentStates(buildInitialStates(activeAgents));

    const callbacks = {
      onAgentStart: (id) => updateAgent(id, { status: 'working', output: null, duration: null, error: null }),
      onAgentComplete: (id, output, duration) => updateAgent(id, { status: 'complete', output, duration }),
      onAgentError: (id, error, duration) => updateAgent(id, { status: 'error', error: error.message, duration }),
      onPipelineComplete: (outputs) => {
        const scribeId = mode === 'discover' ? 'frontier-scribe' : 'scribe';
        if (outputs[scribeId]) setFinalReport(outputs[scribeId]);
        setPipelineRunning(false);
      },
    };

    // Inject custom prompt into agents if set
    const promptedAgents = buildPromptedAgents(activeAgents, customPrompt);

    if (mode === 'replicate') {
      pipelineRef.current = runAgentPipeline(promptedAgents, [selectedPaper], callbacks);
    } else {
      pipelineRef.current = runAgentPipeline(promptedAgents, papersForPipeline, callbacks);
    }
    await pipelineRef.current;
  }, [mode, selectedPaper, selectedPapers, pipelineRunning, activeAgents, updateAgent, customPrompt]);

  // Determine if we have a valid selection
  const hasSelection = (mode === 'discover' || mode === 'ralph') ? selectedPapers.length > 0 : !!selectedPaper;

  // Button text
  const getButtonText = () => {
    if (pipelineRunning) return 'Running...';
    if (mode === 'replicate') return 'Replicate This Paper';
    if (selectedPapers.length > 1) return `Synthesize Frontiers (${selectedPapers.length} papers)`;
    return 'Discover Frontiers';
  };

  return (
    <div className="flex h-full min-h-0">
      {/* Left panel */}
      <div className="w-80 flex-shrink-0 border-r border-neutral-200 bg-neutral-50 flex flex-col overflow-hidden">
        <div className="px-4 pt-5 pb-3 flex items-center justify-between border-b border-neutral-200">
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
            Select {(mode === 'discover' || mode === 'ralph') ? 'Papers' : 'a Paper'}
          </h3>
          {(mode === 'discover' || mode === 'ralph') && selectedPapers.length > 0 && (
            <Badge variant="outline" className="text-neutral-500">
              {selectedPapers.length}/5
            </Badge>
          )}
        </div>

        {/* Source toggle: Papers | Problems */}
        <div className="flex border-b border-neutral-200">
          <button
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest transition-colors ${
              paperSource === 'papers'
                ? 'bg-white text-neutral-900 border-b-2 border-neutral-900'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
            onClick={() => setPaperSource('papers')}
          >
            <FileText className="inline-block w-3 h-3 mr-1.5 -mt-px" />
            Papers
          </button>
          <button
            className={`flex-1 py-2 text-xs font-mono uppercase tracking-widest transition-colors ${
              paperSource === 'problems'
                ? 'bg-white text-neutral-900 border-b-2 border-neutral-900'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
            onClick={() => setPaperSource('problems')}
          >
            <Puzzle className="inline-block w-3 h-3 mr-1.5 -mt-px" />
            Problems
          </button>
        </div>

        {/* Add Custom Paper button (only in Papers mode) */}
        {paperSource === 'papers' && (
          <div className="px-4 pt-3">
            <Button
              variant={showCustomForm ? 'outline' : 'ghost'}
              size="sm"
              className="w-full text-xs font-mono uppercase tracking-widest"
              onClick={() => setShowCustomForm(!showCustomForm)}
            >
              {showCustomForm ? (
                <>Cancel</>
              ) : (
                <><Plus className="w-3 h-3 mr-1" /> Add Custom Paper</>
              )}
            </Button>
          </div>
        )}

        {/* Custom Paper Form */}
        {showCustomForm && paperSource === 'papers' && (
          <FadeIn className="px-4 pt-3 pb-3 border-b border-neutral-200 space-y-2">
            <Input
              type="text"
              placeholder="Title *"
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
            />
            <Input
              type="text"
              placeholder="Authors (comma-separated)"
              value={form.authors}
              onChange={(e) => updateForm('authors', e.target.value)}
            />
            <Input
              type="text"
              placeholder="Year"
              value={form.year}
              onChange={(e) => updateForm('year', e.target.value)}
            />
            <Textarea
              placeholder="Abstract / Content *"
              value={form.abstract}
              onChange={(e) => updateForm('abstract', e.target.value)}
              rows={5}
            />
            <Input
              type="text"
              placeholder="Fields (comma-separated)"
              value={form.fields}
              onChange={(e) => updateForm('fields', e.target.value)}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload .txt
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.text"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                size="sm"
                onClick={handleAddCustomPaper}
                disabled={!form.title.trim() || !form.abstract.trim()}
              >
                Add Paper
              </Button>
            </div>
          </FadeIn>
        )}

        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <Input
              type="text"
              placeholder={paperSource === 'problems' ? 'Search problems...' : 'Search papers...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {filteredPapers.map(p => {
            const isMultiSelect = mode === 'discover' || mode === 'ralph';
            const isSelected = isMultiSelect
              ? selectedPapers.some(sp => sp.id === p.id)
              : selectedPaper?.id === p.id;

            return (
              <div
                key={p.id}
                className={`group flex items-start gap-2 px-3 py-2.5 mb-0.5 cursor-pointer transition-colors border border-transparent ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'hover:bg-neutral-100'
                } ${p.source === 'custom' ? 'border-l-2 border-l-neutral-400' : ''} ${
                  p.source === 'problem' ? 'border-l-2 border-l-neutral-600' : ''
                }`}
                onClick={() => {
                  if (isMultiSelect) {
                    togglePaperSelection(p);
                  } else {
                    selectPaper(p);
                  }
                }}
              >
                {isMultiSelect && (
                  <input
                    type="checkbox"
                    className="mt-1 accent-neutral-900"
                    checked={isSelected}
                    readOnly
                  />
                )}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-light leading-snug block ${isSelected ? 'text-white' : 'text-neutral-700'}`}>
                    {p.source === 'custom' && (
                      <Badge variant="outline" className={`mr-1.5 text-[10px] py-0 ${isSelected ? 'border-neutral-500 text-neutral-300' : ''}`}>
                        CUSTOM
                      </Badge>
                    )}
                    {p.source === 'problem' && (
                      <Badge variant="info" className={`mr-1.5 text-[10px] py-0 ${isSelected ? 'border-neutral-500 text-neutral-300' : ''}`}>
                        PROBLEM
                      </Badge>
                    )}
                    {p.title}
                  </span>
                  <span className={`text-xs mt-0.5 block ${isSelected ? 'text-neutral-400' : 'text-neutral-400'}`}>
                    {p.year} &middot; {(p.citationCount || 0).toLocaleString()} cites
                  </span>
                </div>
                {p.source === 'custom' && (
                  <button
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 ${
                      isSelected ? 'text-neutral-400 hover:text-white' : 'text-neutral-400 hover:text-neutral-700'
                    }`}
                    onClick={(e) => { e.stopPropagation(); handleRemoveCustomPaper(p.id); }}
                    title="Remove custom paper"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          {filteredPapers.length === 0 && (
            <div className="text-sm text-neutral-400 text-center py-8 font-light">
              No {paperSource === 'problems' ? 'problems' : 'papers'} match your search.
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-white">
        {/* Mode toggle */}
        <div className="flex items-center border-b border-neutral-200 bg-neutral-50">
          <button
            className={`px-6 py-3 text-xs font-mono uppercase tracking-widest transition-colors border-b-2 ${
              mode === 'replicate'
                ? 'border-neutral-900 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
            onClick={() => handleModeSwitch('replicate')}
          >
            <FlaskConical className="inline-block w-3.5 h-3.5 mr-1.5 -mt-px" />
            Replicate
          </button>
          <button
            className={`px-6 py-3 text-xs font-mono uppercase tracking-widest transition-colors border-b-2 ${
              mode === 'discover'
                ? 'border-neutral-900 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
            onClick={() => handleModeSwitch('discover')}
          >
            <Telescope className="inline-block w-3.5 h-3.5 mr-1.5 -mt-px" />
            Discover
          </button>
          <button
            className={`px-6 py-3 text-xs font-mono uppercase tracking-widest transition-colors border-b-2 ${
              mode === 'ralph'
                ? 'border-neutral-900 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
            onClick={() => handleModeSwitch('ralph')}
          >
            <span className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest mr-1 ${
              mode === 'ralph' ? 'ralph-pill text-white' : 'bg-neutral-200 text-neutral-500'
            }`}>
              RALPH
            </span>
          </button>
          <button
            className={`px-6 py-3 text-xs font-mono uppercase tracking-widest transition-colors border-b-2 ${
              mode === 'agents'
                ? 'border-neutral-900 text-neutral-900 bg-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
            onClick={() => handleModeSwitch('agents')}
          >
            <Users className="inline-block w-3.5 h-3.5 mr-1.5 -mt-px" />
            Agents
          </button>
        </div>

        {mode === 'agents' ? (
          <AgentReviewPanel />
        ) : mode === 'ralph' ? (
          <RALPHMode seedPapers={selectedPapers} hasApiKey={hasApiKey} />
        ) : !hasSelection ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
            <FadeIn className="text-center max-w-md">
              {mode === 'discover' ? (
                <Telescope className="w-12 h-12 mx-auto mb-6 text-neutral-300" />
              ) : (
                <FlaskConical className="w-12 h-12 mx-auto mb-6 text-neutral-300" />
              )}
              <h2 className="text-2xl font-light tracking-tight text-neutral-800 mb-3">AI Research Lab</h2>
              {mode === 'discover' ? (
                <>
                  <p className="text-neutral-600 font-light leading-relaxed mb-2">
                    Select 1-5 papers from the left panel to discover research frontiers.
                  </p>
                  <p className="text-sm text-neutral-400 font-light leading-relaxed">
                    A team of 5 AI agents will find gaps, generate novel hypotheses, discover cross-field connections, and design experiments.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-neutral-600 font-light leading-relaxed mb-2">
                    Select a paper from the left panel to begin autonomous replication analysis.
                  </p>
                  <p className="text-sm text-neutral-400 font-light leading-relaxed">
                    A team of 5 AI agents will analyze the paper, design a replication plan, simulate results, peer-review, and compile a report.
                  </p>
                </>
              )}
            </FadeIn>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Paper header */}
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                {mode === 'discover' && selectedPapers.length > 1 ? (
                  <div>
                    <h2 className="text-xl font-light tracking-tight text-neutral-800 mb-3">Frontier Discovery</h2>
                    <div className="flex flex-wrap gap-2">
                      {selectedPapers.map(p => (
                        <Badge key={p.id} variant="secondary" className="max-w-xs truncate pr-1">
                          <span className="truncate">
                            {p.title.length > 40 ? p.title.slice(0, 40) + '...' : p.title}
                          </span>
                          <button
                            className="ml-1.5 p-0.5 hover:bg-neutral-300 transition-colors"
                            onClick={(e) => { e.stopPropagation(); togglePaperSelection(p); }}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-light tracking-tight text-neutral-800">
                      {mode === 'discover' ? selectedPapers[0]?.title : selectedPaper?.title}
                    </h2>
                    <p className="text-sm text-neutral-400 font-light mt-1">
                      {(() => {
                        const p = mode === 'discover' ? selectedPapers[0] : selectedPaper;
                        if (!p) return '';
                        const authors = (p.authors || []).slice(0, 3).map(a => typeof a === 'string' ? a : a.name).join(', ');
                        return `${authors}${(p.authors || []).length > 3 ? ' et al.' : ''} \u00B7 ${p.year}`;
                      })()}
                    </p>
                  </>
                )}
              </div>
              {/* Graph Connections Button */}
              <Button
                variant="outline"
                size="sm"
                className="font-mono text-[10px] uppercase tracking-widest rounded-none"
                onClick={() => {
                  const p = mode === 'discover' ? selectedPapers[0] : selectedPaper;
                  if (showConnections) { setShowConnections(false); }
                  else { fetchConnections(p); }
                }}
              >
                <Network className="h-3.5 w-3.5 mr-1.5" />
                {showConnections ? 'Hide Connections' : 'Graph Connections'}
              </Button>

              {!hasApiKey ? (
                <Alert variant="warning" className="max-w-xs">
                  <AlertDescription>
                    Set up an API key in the Research Navigator first.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="flex-shrink-0 space-y-3 w-80">
                  {/* Custom prompt */}
                  <div>
                    <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">
                      Custom Instructions (optional)
                    </label>
                    <Textarea
                      placeholder="e.g. Focus on the methodology gaps, compare with reinforcement learning approaches, explore connections to algebraic geometry..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={2}
                      disabled={pipelineRunning}
                      className="text-sm"
                    />
                  </div>
                  {/* Token predictor widget */}
                  {tokenEstimate && (
                    <div className="border border-neutral-200 bg-neutral-50 p-3">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setShowTokenDetail(!showTokenDetail)}
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="h-3.5 w-3.5 text-neutral-400" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                            Est. Usage
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-neutral-600">
                          <span className="font-mono">~{tokenEstimate.totalTokens.toLocaleString()} tokens</span>
                          <span className="text-neutral-300">|</span>
                          <span className="font-mono">~${tokenEstimate.estimatedCost.toFixed(4)}</span>
                          <span className="text-neutral-300">|</span>
                          <span className="text-[10px] text-neutral-400">{tokenEstimate.provider}</span>
                          {tokenEstimate.allWithinLimits ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        </div>
                      </div>
                      {showTokenDetail && (
                        <div className="mt-2 pt-2 border-t border-neutral-200 space-y-1">
                          {tokenEstimate.perAgent.map(a => (
                            <div key={a.id} className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-neutral-600 truncate max-w-[120px]">{a.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-neutral-400">{a.inputTokens.toLocaleString()} in</span>
                                <span className="text-neutral-400">{a.outputTokens.toLocaleString()} out</span>
                                <span className="text-neutral-600 font-medium w-16 text-right">{a.tokens.toLocaleString()}</span>
                                {a.withinLimits ? (
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 text-amber-500" title="May exceed context window" />
                                )}
                              </div>
                            </div>
                          ))}
                          {!tokenEstimate.allWithinLimits && (
                            <p className="text-[10px] text-amber-600 mt-1">
                              Some agents may exceed the context window for {tokenEstimate.provider}. Output may be truncated.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    className="w-full"
                    onClick={startPipeline}
                    disabled={pipelineRunning}
                  >
                    {getButtonText()}
                  </Button>
                </div>
              )}
            </div>

            {/* Pipeline visualization */}
            <div className="border border-neutral-200 bg-neutral-50 px-5 py-3">
              <div className="flex items-center gap-1 overflow-x-auto">
                {activeAgents.map((agent, i) => {
                  const state = agentStates[agent.id]?.status;
                  return (
                    <React.Fragment key={agent.id}>
                      {i > 0 && (
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                          state !== 'pending' ? 'text-neutral-700' : 'text-neutral-300'
                        }`} />
                      )}
                      <div
                        className={`flex items-center justify-center w-8 h-8 border text-xs font-mono flex-shrink-0 ${
                          state === 'working'
                            ? 'border-neutral-900 bg-neutral-900 text-white agent-pulse'
                            : state === 'complete'
                            ? 'border-neutral-400 bg-neutral-200 text-neutral-700'
                            : state === 'error'
                            ? 'border-red-300 bg-red-50 text-red-600'
                            : 'border-neutral-200 bg-white text-neutral-400'
                        }`}
                        title={agent.name}
                      >
                        {agent.name.charAt(agent.name.lastIndexOf(' ') + 1)}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Graph connections panel */}
            {showConnections && (
              <div className="mb-6 border border-neutral-200 bg-neutral-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Network className="h-4 w-4 text-neutral-500" />
                  <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-neutral-500">
                    Knowledge Graph — Connected Papers
                  </span>
                </div>
                {loadingConnections && (
                  <div className="flex items-center gap-2 text-neutral-400 text-xs py-4">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Searching Semantic Scholar for connected research...
                  </div>
                )}
                {!loadingConnections && connectedPapers.length === 0 && (
                  <div className="text-neutral-400 text-xs italic py-2">No connected papers found.</div>
                )}
                {!loadingConnections && connectedPapers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {connectedPapers.map((paper, j) => (
                      <a
                        key={paper.paperId || j}
                        href={`https://www.semanticscholar.org/paper/${paper.paperId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col gap-1 p-3 bg-white border border-neutral-100 hover:border-neutral-400 transition-colors"
                      >
                        <div className="text-sm font-medium text-neutral-800 line-clamp-2 leading-snug">{paper.title}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {paper.authors?.slice(0, 2).map(a => typeof a === 'string' ? a : a.name).join(', ')}
                          {paper.authors?.length > 2 ? ' et al.' : ''} ({paper.year})
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] font-mono text-neutral-400">{(paper.citationCount || 0).toLocaleString()} citations</span>
                          {paper.fieldsOfStudy?.[0] && (
                            <Badge variant="outline" className="text-[8px] font-mono">{paper.fieldsOfStudy[0]}</Badge>
                          )}
                          <ExternalLink className="h-3 w-3 text-neutral-300 ml-auto" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Agent cards */}
            <div className="space-y-3">
              {activeAgents.map(agent => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  status={agentStates[agent.id]?.status || 'pending'}
                  output={agentStates[agent.id]?.output}
                  duration={agentStates[agent.id]?.duration}
                  error={agentStates[agent.id]?.error}
                />
              ))}
            </div>

            {/* Final report */}
            {finalReport && mode === 'replicate' && <ReplicationReport report={finalReport} />}
            {finalReport && mode === 'discover' && <FrontierReport report={finalReport} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIResearchLab;
