import React, { useState, useRef, useEffect } from 'react';
import { Search, FileUp, FileJson, Library } from 'lucide-react';
import SearchTab from './add-papers/SearchTab';
import PdfTab from './add-papers/PdfTab';
import JsonTab from './add-papers/JsonTab';
import SamplesTab from './add-papers/SamplesTab';

const TABS = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'samples', label: 'Samples', icon: Library },
  { id: 'pdf', label: 'PDF', icon: FileUp },
  { id: 'json', label: 'JSON', icon: FileJson },
];

function AddPapersPanel({ isOpen, onClose, onAddPaper, onImportJSON, onImportBulk, anchorRef }) {
  const [activeTab, setActiveTab] = useState('search');
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: 520 });

  // Position the panel relative to anchor, flipping above if insufficient space below
  useEffect(() => {
    if (!isOpen || !anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const panelWidth = 480;
    const panelMaxHeight = 520;
    const margin = 8;

    // Horizontal: clamp so panel stays within viewport
    const left = Math.max(margin, Math.min(rect.left, window.innerWidth - panelWidth - margin));

    // Vertical: prefer below button, flip above if insufficient space
    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    let top;
    if (spaceBelow >= panelMaxHeight || spaceBelow >= spaceAbove) {
      top = rect.bottom + 4;
    } else {
      top = Math.max(margin, rect.top - panelMaxHeight - 4);
    }

    // Dynamic max height based on actual available space from top position
    const availableHeight = window.innerHeight - top - margin;
    const maxHeight = Math.max(200, Math.min(panelMaxHeight, availableHeight));

    setPos({ top, left, maxHeight });
  }, [isOpen, anchorRef]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          anchorRef?.current && !anchorRef.current.contains(e.target)) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="fixed w-[480px] max-w-[calc(100vw-2rem)] overflow-y-auto z-[900] bg-white border border-neutral-200 shadow-xl"
      style={{ top: pos.top, left: pos.left, maxHeight: pos.maxHeight, overscrollBehavior: 'contain' }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-neutral-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-colors ${
              activeTab === tab.id
                ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-px'
                : 'text-neutral-400 hover:text-neutral-600'
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'search' && <SearchTab onAddPaper={onAddPaper} onClose={onClose} />}
        {activeTab === 'pdf' && <PdfTab onAddPaper={onAddPaper} onClose={onClose} />}
        {activeTab === 'json' && <JsonTab onImportJSON={onImportJSON} onClose={onClose} />}
        {activeTab === 'samples' && <SamplesTab onImportBulk={onImportBulk} onClose={onClose} />}
      </div>
    </div>
  );
}

export default AddPapersPanel;
