import React, { useState, useCallback } from 'react';
import { Search, Loader2, ArrowLeft, Check, ExternalLink, BookOpen, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { searchPapers } from '../../utils/semanticScholar';

function SearchTab({ onAddPaper, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [added, setAdded] = useState(new Set());

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    setError(null);
    setResults([]);
    setSelectedPaper(null);

    try {
      const papers = await searchPapers(q, 10);
      if (papers.length === 0) {
        setError('No results found. Try different keywords.');
      }
      setResults(papers);
    } catch (err) {
      setError('Search failed. Check your connection and try again.');
    }

    setSearching(false);
  }, [query]);

  const handleAdd = useCallback((paper) => {
    onAddPaper(paper);
    setAdded(prev => new Set([...prev, paper.id]));
    setSelectedPaper(null);
  }, [onAddPaper]);

  // ── Preview view (selected paper) ──
  if (selectedPaper) {
    const p = selectedPaper;
    const isAdded = added.has(p.id);

    return (
      <div className="space-y-3">
        <button
          onClick={() => setSelectedPaper(null)}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to results
        </button>

        <div className="space-y-2">
          <h3 className="text-sm font-bold text-neutral-900 leading-snug">
            {p.title}
          </h3>

          <div className="text-[11px] text-neutral-500 leading-relaxed">
            {(p.authors || []).join(', ') || 'Unknown authors'}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {p.year && (
              <span className="font-mono text-[10px] text-neutral-400">{p.year}</span>
            )}
            {p.citationCount > 0 && (
              <span className="font-mono text-[10px] text-neutral-400">
                {p.citationCount.toLocaleString()} citations
              </span>
            )}
            {p.doi && (
              <a
                href={`https://doi.org/${p.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 font-mono text-[10px] text-blue-500 hover:text-blue-700"
              >
                DOI <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
          </div>

          {(p.fieldsOfStudy || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {p.fieldsOfStudy.map(f => (
                <Badge
                  key={f}
                  variant="outline"
                  className="text-[9px] font-mono px-1.5 py-0 h-4"
                >
                  {f}
                </Badge>
              ))}
            </div>
          )}

          {p.abstract && (
            <div className="border-t border-neutral-100 pt-2">
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                {p.abstract}
              </p>
            </div>
          )}

          {p.tldr && (
            <div className="bg-neutral-50 border border-neutral-100 p-2">
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400 block mb-0.5">TL;DR</span>
              <p className="text-[11px] text-neutral-600 leading-relaxed">{p.tldr}</p>
            </div>
          )}
        </div>

        <Button
          onClick={() => handleAdd(p)}
          disabled={isAdded}
          className={`w-full font-mono text-[10px] uppercase tracking-widest ${
            isAdded
              ? 'bg-green-600 text-white cursor-default'
              : 'bg-neutral-900 text-white hover:bg-neutral-800'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Added to Graph
            </>
          ) : (
            <>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Add to Graph
            </>
          )}
        </Button>
      </div>
    );
  }

  // ── Search + results list view ──
  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">
        Search for papers by title, topic, or author name.
      </p>

      {/* Search input */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. Political Competition, Policy and Growth"
          className="h-8 text-sm flex-1"
          autoFocus
        />
        <Button
          type="submit"
          variant="outline"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          disabled={searching || !query.trim()}
        >
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
        </Button>
      </form>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-400">
            {results.length} results
          </span>
          <div className="space-y-0.5">
            {results.map(paper => {
              const isAdded = added.has(paper.id);
              return (
                <button
                  key={paper.id}
                  onClick={() => setSelectedPaper(paper)}
                  className={`w-full text-left p-2.5 border transition-colors ${
                    isAdded
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-neutral-800 leading-snug line-clamp-2">
                        {paper.title}
                      </h4>
                      <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
                        {(paper.authors || []).slice(0, 3).join(', ')}
                        {(paper.authors || []).length > 3 && ` +${paper.authors.length - 3}`}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      {paper.year && (
                        <span className="font-mono text-[10px] text-neutral-400">{paper.year}</span>
                      )}
                      {isAdded && (
                        <Badge className="text-[8px] bg-green-100 text-green-700 border-green-200 px-1 py-0 h-3.5">
                          Added
                        </Badge>
                      )}
                    </div>
                  </div>
                  {paper.citationCount > 0 && (
                    <span className="font-mono text-[9px] text-neutral-300 mt-1 block">
                      {paper.citationCount.toLocaleString()} citations
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!searching && results.length === 0 && !error && (
        <div className="py-6 text-center">
          <BookOpen className="h-6 w-6 text-neutral-200 mx-auto mb-2" />
          <p className="text-[11px] text-neutral-400">
            Search for any academic paper to add it to your graph
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchTab;
