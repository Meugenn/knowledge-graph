import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SEED_PAPERS } from '../utils/seedData';
import { getRepoForPaper, getMCPConfig, getPaperIdsWithRepos } from '../utils/repoData';
import ToolCard from './ToolCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FadeIn } from '@/components/ui/fade-in';
import { Check, FolderOpen, Star, Circle, Copy, Loader2, Play, Settings, FileCode, BookOpen, Package, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PHASES = [
  { key: 'discovery', label: 'Repository Discovery', duration: 1500 },
  { key: 'analysis', label: 'Code Analysis', duration: 2000 },
  { key: 'ready', label: 'MCP Server Ready', duration: 800 },
];

function Paper2Agent({ agentPaper }) {
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(-1);
  const [phaseComplete, setPhaseComplete] = useState([false, false, false]);
  const [copied, setCopied] = useState(false);
  const [repo, setRepo] = useState(null);
  const [mcpConfig, setMcpConfig] = useState(null);

  // Autocomplete search state
  const [searchInput, setSearchInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const autocompleteRef = useRef(null);

  // Papers that have repos
  const papersWithRepos = SEED_PAPERS.filter(p => getPaperIdsWithRepos().includes(p.id));

  // Handle incoming paper from graph
  useEffect(() => {
    if (agentPaper && agentPaper.id) {
      const repoData = getRepoForPaper(agentPaper.id);
      if (repoData) {
        setSelectedPaper(agentPaper);
        setSearchInput(`${agentPaper.title} (${agentPaper.year})`);
      }
    }
  }, [agentPaper]);

  // Start the pipeline when a paper is selected
  const startPipeline = useCallback((paper) => {
    const repoData = getRepoForPaper(paper.id);
    if (!repoData) return;

    setSelectedPaper(paper);
    setRepo(repoData);
    setMcpConfig(getMCPConfig(paper.id));
    setCurrentPhase(0);
    setPhaseComplete([false, false, false]);
    setCopied(false);

    // Animate through phases
    let phase = 0;
    const advancePhase = () => {
      setPhaseComplete(prev => {
        const next = [...prev];
        next[phase] = true;
        return next;
      });
      phase++;
      if (phase < PHASES.length) {
        setCurrentPhase(phase);
        setTimeout(advancePhase, PHASES[phase].duration);
      }
    };
    setTimeout(advancePhase, PHASES[0].duration);
  }, []);

  // Filter papers by search query (title and authors)
  const filterPapers = useCallback((query) => {
    if (!query.trim()) {
      return papersWithRepos;
    }

    const lowerQuery = query.toLowerCase();

    return papersWithRepos.filter(paper => {
      const titleMatch = paper.title.toLowerCase().includes(lowerQuery);
      const authorsMatch = paper.authors.some(author =>
        author.toLowerCase().includes(lowerQuery)
      );
      return titleMatch || authorsMatch;
    });
  }, [papersWithRepos]);

  // Format authors for display (first 3, then "et al.")
  const formatAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'Unknown authors';
    if (authors.length <= 3) return authors.join(', ');
    return `${authors.slice(0, 3).join(', ')}, et al.`;
  };

  // Update filtered papers when search input changes
  useEffect(() => {
    setFilteredPapers(filterPapers(searchInput));
  }, [searchInput, filterPapers]);

  // Auto-start when paper arrives from graph
  useEffect(() => {
    if (agentPaper && agentPaper.id && getRepoForPaper(agentPaper.id)) {
      startPipeline(agentPaper);
    }
  }, [agentPaper, startPipeline]);

  // Handle paper selection from autocomplete
  const handlePaperSelection = (paper) => {
    setSelectedPaper(paper);
    setSearchInput(`${paper.title} (${paper.year})`);
    setShowSuggestions(false);
    setFocusedIndex(-1);
    startPipeline(paper);
  };

  // Handle keyboard navigation in autocomplete
  const handleKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === 'ArrowDown') {
        setShowSuggestions(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < filteredPapers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredPapers[focusedIndex]) {
          handlePaperSelection(filteredPapers[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
      case 'Tab':
        setShowSuggestions(false);
        setFocusedIndex(-1);
        break;
    }
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (autocompleteRef.current &&
          !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = () => {
    if (!mcpConfig) return;
    const serverName = Object.keys(mcpConfig.mcpServers)[0];
    const server = mcpConfig.mcpServers[serverName];
    const cmd = `claude mcp add ${serverName} -- ${server.command} ${server.args.join(' ')}`;
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const connectCommand = mcpConfig ? (() => {
    const serverName = Object.keys(mcpConfig.mcpServers)[0];
    const server = mcpConfig.mcpServers[serverName];
    return `claude mcp add ${serverName} -- ${server.command} ${server.args.join(' ')}`;
  })() : '';

  const FILE_GROUPS = [
    { label: 'Entry Points', filesKey: 'entryPoints', icon: Play },
    { label: 'Model Files', filesKey: 'modelFiles', icon: FileCode },
    { label: 'Notebooks', filesKey: 'notebooks', icon: BookOpen },
    { label: 'Configs', filesKey: 'configs', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-mono text-lg font-bold uppercase tracking-widest text-neutral-900">
          Paper2Agent
        </h2>
        <p className="text-sm text-neutral-500 font-light">
          Transform research papers into runnable MCP servers with callable tools
        </p>
      </div>

      {/* How To Use */}
      {!selectedPaper && (
        <FadeIn>
          <div className="border border-neutral-200 bg-white p-5 space-y-4">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
              How it works
            </span>
            <div className="space-y-3">
              {[
                {
                  num: 1,
                  title: 'Pick a paper',
                  desc: 'Select a paper from the dropdown below, or click "Make Runnable" on any paper with a code icon in the Knowledge Graph tab.',
                },
                {
                  num: 2,
                  title: 'Watch the pipeline',
                  desc: 'We match the paper to its GitHub repo, analyze the code structure, and generate MCP tool definitions automatically.',
                },
                {
                  num: 3,
                  title: 'Connect to Claude',
                  desc: 'Copy the generated command and run it in your terminal. This registers the MCP server with Claude Code so you can call the paper\'s tools directly from your AI assistant.',
                },
              ].map(step => (
                <div key={step.num} className="flex gap-3">
                  <span className="flex items-center justify-center w-6 h-6 shrink-0 border border-neutral-900 bg-neutral-900 text-white font-mono text-xs">
                    {step.num}
                  </span>
                  <div className="space-y-0.5">
                    <strong className="text-sm text-neutral-800">{step.title}</strong>
                    <p className="text-sm text-neutral-500 font-light leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Paper Picker */}
      <div className="border border-neutral-200 bg-white p-4 space-y-2">
        <label className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
          Select a paper with code
        </label>
        <div className="relative" ref={autocompleteRef}>
          <div className="relative">
            <Input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setShowSuggestions(true);
                setFocusedIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search by title or author..."
              className="w-full bg-white border-neutral-200 font-light text-neutral-700 placeholder:text-neutral-400 pr-8"
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions}
              aria-controls="paper-suggestions"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setShowSuggestions(true);
                  setFocusedIndex(-1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showSuggestions && (
            <ul
              id="paper-suggestions"
              role="listbox"
              className="absolute z-50 w-full mt-1 max-h-80 overflow-y-auto bg-white border border-neutral-200 rounded-md shadow-lg"
            >
              {filteredPapers.length === 0 ? (
                <li className="px-3 py-2 text-sm text-neutral-400 italic">
                  No papers found matching "{searchInput}"
                </li>
              ) : (
                filteredPapers.map((paper, index) => (
                  <li
                    key={paper.id}
                    id={`paper-option-${index}`}
                    role="option"
                    aria-selected={focusedIndex === index}
                    onClick={() => handlePaperSelection(paper)}
                    className={cn(
                      "px-3 py-2 cursor-pointer border-b border-neutral-100 last:border-0",
                      focusedIndex === index
                        ? "bg-neutral-100"
                        : "hover:bg-neutral-50"
                    )}
                  >
                    <div className="text-sm text-neutral-700 font-medium">
                      {paper.title} ({paper.year})
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      {formatAuthors(paper.authors)}
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Pipeline */}
      {selectedPaper && (
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="flex items-center justify-center gap-0 p-4 border border-neutral-200 bg-white">
            {PHASES.map((phase, i) => (
              <div key={phase.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 flex items-center justify-center text-xs font-mono border ${
                    phaseComplete[i]
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : currentPhase === i
                      ? 'bg-white border-neutral-900 text-neutral-900'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-400'
                  }`}>
                    {phaseComplete[i] ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${
                    phaseComplete[i] || currentPhase === i ? 'text-neutral-700' : 'text-neutral-400'
                  }`}>
                    {phase.label}
                  </span>
                </div>
                {i < PHASES.length - 1 && (
                  <div className={`w-12 h-px mx-2 mt-[-16px] ${
                    phaseComplete[i] ? 'bg-neutral-900' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Phase 1: Repository Discovery */}
          {currentPhase >= 0 && (
            <FadeIn>
              <div className="border border-neutral-200 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 border border-neutral-300 font-mono text-[10px] text-neutral-500">
                    1
                  </span>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                    Repository Discovery
                  </h3>
                  {currentPhase === 0 && !phaseComplete[0] && (
                    <Loader2 className="w-3.5 h-3.5 text-neutral-400 animate-spin" />
                  )}
                </div>
                {repo && (phaseComplete[0] || currentPhase > 0) && (
                  <div className="border border-neutral-100 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <FolderOpen className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm font-medium text-neutral-800 hover:text-neutral-600 underline underline-offset-2"
                        >
                          {repo.owner}/{repo.name}
                        </a>
                        <p className="text-sm text-neutral-500 font-light">{repo.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        {repo.stars.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Circle className="w-2.5 h-2.5 fill-current" />
                        {repo.language}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {repo.topics.map(t => (
                          <Badge key={t} variant="info" className="text-[10px]">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FadeIn>
          )}

          {/* Phase 2: Code Analysis */}
          {currentPhase >= 1 && (
            <FadeIn>
              <div className="border border-neutral-200 bg-white p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 border border-neutral-300 font-mono text-[10px] text-neutral-500">
                    2
                  </span>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                    Code Analysis
                  </h3>
                  {currentPhase === 1 && !phaseComplete[1] && (
                    <Loader2 className="w-3.5 h-3.5 text-neutral-400 animate-spin" />
                  )}
                </div>
                {repo && (phaseComplete[1] || currentPhase > 1) && (
                  <div className="space-y-3">
                    {FILE_GROUPS
                      .filter(g => repo.detectedFiles[g.filesKey].length > 0)
                      .map(group => {
                        const Icon = group.icon;
                        return (
                          <div key={group.label} className="space-y-1.5">
                            <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                              <Icon className="w-3.5 h-3.5" /> {group.label}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {repo.detectedFiles[group.filesKey].map(f => (
                                <code key={f} className="font-mono text-xs bg-neutral-50 border border-neutral-200 px-2 py-0.5 text-neutral-700">
                                  {f}
                                </code>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    <div className="space-y-1.5">
                      <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                        <Package className="w-3.5 h-3.5" /> Dependencies
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {repo.detectedFiles.dependencies.map(d => (
                          <Badge key={d} variant="outline" className="text-[10px] text-neutral-500">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </FadeIn>
          )}

          {/* Phase 3: MCP Server Ready */}
          {currentPhase >= 2 && (
            <FadeIn>
              <div className="border border-neutral-200 bg-white p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-5 h-5 border border-neutral-300 font-mono text-[10px] text-neutral-500">
                    3
                  </span>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                    MCP Server Ready
                  </h3>
                  {currentPhase === 2 && !phaseComplete[2] && (
                    <Loader2 className="w-3.5 h-3.5 text-neutral-400 animate-spin" />
                  )}
                </div>
                {repo && phaseComplete[2] && (
                  <div className="space-y-4">
                    {/* Connect Command */}
                    <div className="space-y-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                        Connect with Claude Code
                      </span>
                      <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 p-3">
                        <code className="flex-1 font-mono text-xs text-neutral-700 break-all">
                          {connectCommand}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                          className="shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          {copied ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    {/* MCP Config JSON */}
                    <div className="space-y-2">
                      <span className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                        MCP Server Configuration
                      </span>
                      <pre className="bg-neutral-50 border border-neutral-200 p-3 overflow-x-auto">
                        <code className="font-mono text-xs text-neutral-700">
                          {JSON.stringify(mcpConfig, null, 2)}
                        </code>
                      </pre>
                    </div>

                    {/* Tool Cards */}
                    <div className="space-y-3">
                      <h4 className="font-mono text-xs font-bold uppercase tracking-widest text-neutral-400">
                        {repo.mcpTools.length} Available Tools
                      </h4>
                      {repo.mcpTools.map(tool => (
                        <ToolCard key={tool.name} tool={tool} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FadeIn>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedPaper && (
        <div className="border border-neutral-200 bg-white p-8 text-center space-y-4">
          <h3 className="font-mono text-sm font-bold uppercase tracking-widest text-neutral-900">
            No Paper Selected
          </h3>
          <p className="text-sm text-neutral-500 font-light leading-relaxed max-w-md mx-auto">
            Pick a paper from the dropdown above to start the pipeline.
            You can also go to the <strong className="text-neutral-700">Knowledge Graph</strong> tab and click
            "Make Runnable" on any paper with a code icon.
          </p>
          <div className="font-mono text-xs text-neutral-400">
            <strong className="text-neutral-600">{papersWithRepos.length}</strong> papers have linked repositories ready to convert
          </div>
          <div className="border-t border-neutral-100 pt-4 text-sm text-neutral-500 font-light leading-relaxed max-w-lg mx-auto">
            <strong className="text-neutral-700">What is MCP?</strong> The Model Context Protocol lets AI assistants
            like Claude call external tools. Paper2Agent turns a research repo into a set
            of typed, callable tools &mdash; so you can run inference, train models,
            or preprocess data just by asking Claude.
          </div>
        </div>
      )}
    </div>
  );
}

export default Paper2Agent;
