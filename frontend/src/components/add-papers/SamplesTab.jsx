import React, { useState, useCallback, useRef } from 'react';
import { Loader2, Check, Search, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SAMPLE_COLLECTIONS } from '../../utils/sampleCollections';
import { bulkFetchPapers } from '../../utils/bulkImport';
import { getSeedGraphData } from '../../utils/seedData';

function SamplesTab({ onImportBulk, onClose }) {
  const [loading, setLoading] = useState(null);
  const [progress, setProgress] = useState(null);
  const [done, setDone] = useState(null);
  const [topic, setTopic] = useState('');
  const abortRef = useRef(null);

  const handleCancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(null);
    setProgress(null);
  }, []);

  const handleLoad = useCallback(async (collection) => {
    // Abort any previous in-flight fetch
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(collection.id);
    setProgress(null);
    setDone(null);

    try {
      if (collection.type === 'seed') {
        const data = getSeedGraphData();
        onImportBulk(data.nodes, data.links);
        setDone({ id: collection.id, count: data.nodes.length });
      } else if (collection.type === 'openalex' || collection.type === 'openalex-full') {
        const queries = collection.type === 'openalex-full'
          ? undefined
          : collection.queries;

        const { papers, citations } = await bulkFetchPapers(queries, (p) => {
          if (!controller.signal.aborted) setProgress(p);
        }, controller.signal);

        if (!controller.signal.aborted) {
          onImportBulk(papers, citations);
          setDone({ id: collection.id, count: papers.length });
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Collection load failed:', err);
      }
    }

    if (!controller.signal.aborted) setLoading(null);
    if (abortRef.current === controller) abortRef.current = null;
  }, [onImportBulk]);

  const handleCustomFetch = useCallback(async (e) => {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed || loading) return;

    // Abort any previous in-flight fetch
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading('custom');
    setProgress(null);
    setDone(null);

    try {
      const queries = [{
        filter: `default.search:${trimmed}`,
        label: trimmed,
        pages: 2,
      }];
      const { papers, citations } = await bulkFetchPapers(queries, (p) => {
        if (!controller.signal.aborted) setProgress(p);
      }, controller.signal);

      if (!controller.signal.aborted) {
        onImportBulk(papers, citations);
        setDone({ id: 'custom', count: papers.length });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Custom topic fetch failed:', err);
      }
    }

    if (!controller.signal.aborted) setLoading(null);
    if (abortRef.current === controller) abortRef.current = null;
  }, [topic, loading, onImportBulk]);

  return (
    <div className="space-y-2">
      <p className="text-xs text-neutral-500 mb-3">
        Quick-load curated paper collections from OpenAlex or bundled seed data.
      </p>

      {/* Custom topic search */}
      <form onSubmit={handleCustomFetch} className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
          <Input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Search any topic..."
            disabled={!!loading}
            className="h-8 text-sm pl-8 bg-white border-neutral-200 font-light text-neutral-700 placeholder:text-neutral-400"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={!!loading || !topic.trim()}
          className="font-mono text-[10px] uppercase tracking-widest h-8 px-3 flex-shrink-0"
        >
          {loading === 'custom' ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              {progress?.phase === 'fetching' ? `${progress.field}...` : 'Fetching...'}
            </>
          ) : done?.id === 'custom' ? (
            <>
              <Check className="mr-1 h-3 w-3" />
              {done.count}
            </>
          ) : (
            'Fetch'
          )}
        </Button>
      </form>

      {/* Cancel button — shown during any loading */}
      {loading && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCancel}
          className="w-full font-mono text-[10px] uppercase tracking-widest h-7 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <XCircle className="mr-1 h-3 w-3" />
          Cancel Loading
        </Button>
      )}

      <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 mt-1 mb-1">
        Or choose a curated collection
      </div>

      {SAMPLE_COLLECTIONS.map(col => {
        const isLoading = loading === col.id;
        const isDone = done?.id === col.id;

        return (
          <div
            key={col.id}
            className="flex items-center justify-between gap-3 border border-neutral-200 hover:border-neutral-300 p-3 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-medium text-neutral-900 truncate">{col.label}</div>
              <div className="text-[10px] text-neutral-500 truncate">{col.description}</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleLoad(col)}
              disabled={!!loading}
              className="font-mono text-[10px] uppercase tracking-widest h-7 px-3 flex-shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  {progress?.phase === 'fetching' ? `${progress.field}...` : 'Loading...'}
                </>
              ) : isDone ? (
                <>
                  <Check className="mr-1 h-3 w-3" />
                  {done.count}
                </>
              ) : (
                'Load'
              )}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

export default SamplesTab;
