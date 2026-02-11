import React, { useState, useMemo } from 'react';
import { Trash2, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SORT_FIELDS = ['citationCount', 'title', 'year'];

function fieldToColor(fieldName) {
  if (!fieldName) return '#A0AEC0';
  const lower = fieldName.toLowerCase();
  if (lower.includes('computer') || lower.includes('artificial')) return '#4A90D9';
  if (lower.includes('biolog') || lower.includes('medicin') || lower.includes('biochem')) return '#48BB78';
  if (lower.includes('physic')) return '#ECC94B';
  if (lower.includes('chemi') || lower.includes('material')) return '#DD6B20';
  if (lower.includes('neuro')) return '#E53E3E';
  if (lower.includes('math') || lower.includes('engineer')) return '#9F7AEA';
  if (lower.includes('environ') || lower.includes('earth')) return '#319795';
  return '#A0AEC0';
}

function formatAuthors(authors) {
  if (!authors || authors.length === 0) return 'Unknown';
  const names = authors.map(a => typeof a === 'string' ? a : a.name);
  if (names.length <= 2) return names.join(', ');
  return `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
}

function PaperListView({ nodes, onSelectPaper, onRemovePaper }) {
  const [sortField, setSortField] = useState('citationCount');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = useMemo(() => {
    const copy = [...nodes];
    copy.sort((a, b) => {
      let aVal, bVal;
      if (sortField === 'citationCount') {
        aVal = a.citationCount || 0;
        bVal = b.citationCount || 0;
      } else if (sortField === 'year') {
        aVal = a.year || 0;
        bVal = b.year || 0;
      } else {
        aVal = (a.title || '').toLowerCase();
        bVal = (b.title || '').toLowerCase();
        if (sortDir === 'asc') return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return copy;
  }, [nodes, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir(field === 'title' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-neutral-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-neutral-700" />
      : <ChevronDown className="h-3 w-3 text-neutral-700" />;
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-neutral-50 border-b border-neutral-200 grid grid-cols-[1fr_180px_60px_100px_40px] gap-2 px-4 py-2 items-center">
        <button
          onClick={() => toggleSort('title')}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors text-left"
        >
          Title <SortIcon field="title" />
        </button>
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
          Authors
        </span>
        <button
          onClick={() => toggleSort('year')}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          Year <SortIcon field="year" />
        </button>
        <button
          onClick={() => toggleSort('citationCount')}
          className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900 transition-colors text-right justify-end"
        >
          Citations <SortIcon field="citationCount" />
        </button>
        <span />
      </div>

      {/* Rows */}
      {sorted.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-neutral-400 font-light">
          No papers match current filters
        </div>
      ) : (
        sorted.map((paper, i) => {
          const field = paper.fieldsOfStudy?.[0] || null;
          return (
            <div
              key={paper.id}
              className={`grid grid-cols-[1fr_180px_60px_100px_40px] gap-2 px-4 py-2.5 items-center border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer group ${
                i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
              }`}
              onClick={() => onSelectPaper(paper)}
            >
              {/* Title + field badge */}
              <div className="min-w-0">
                <div className="text-sm text-neutral-800 font-medium truncate">
                  {paper.title}
                </div>
                {field && (
                  <Badge
                    variant="outline"
                    className="text-[9px] mt-0.5 border-none px-0"
                    style={{ color: fieldToColor(field) }}
                  >
                    {field}
                  </Badge>
                )}
              </div>

              {/* Authors */}
              <div className="text-xs text-neutral-500 font-light truncate">
                {formatAuthors(paper.authors)}
              </div>

              {/* Year */}
              <div className="text-xs text-neutral-600 font-mono">
                {paper.year || '—'}
              </div>

              {/* Citations */}
              <div className="text-sm text-neutral-800 font-mono text-right tabular-nums">
                {(paper.citationCount || 0).toLocaleString()}
              </div>

              {/* Remove */}
              <div className="flex justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePaper(paper.id);
                  }}
                  className="text-neutral-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from graph"
                  aria-label={`Remove ${paper.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Footer count */}
      <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-4 py-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
          {sorted.length} paper{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}

export default PaperListView;
