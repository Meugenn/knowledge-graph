import React, { useState, useCallback, useRef } from 'react';
import { FileJson, Check, AlertCircle } from 'lucide-react';

function JsonTab({ onImportJSON, onClose }) {
  const [count, setCount] = useState(null);
  const fileRef = useRef(null);

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const papers = data.papers || data.nodes || [];
        const citations = data.citations || data.links || [];
        if (papers.length === 0) {
          setCount(-1);
          return;
        }
        setCount(papers.length);
        onImportJSON(papers, citations);
        setTimeout(onClose, 800);
      } catch (err) {
        console.error('JSON import failed:', err);
        setCount(-1);
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  }, [onImportJSON, onClose]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">
        Import a JSON file with papers and citations. Accepts exports from The Republic or custom collections.
      </p>

      <div className="text-[10px] font-mono text-neutral-400 bg-neutral-50 p-2 border border-neutral-100">
        {'{ "papers": [{ id, title, authors, year, ... }], "citations": [{ source, target }] }'}
      </div>

      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          onChange={handleFile}
          className="hidden"
          id="json-upload"
        />
        <label
          htmlFor="json-upload"
          className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-300 hover:border-neutral-400 py-4 px-4 cursor-pointer transition-colors text-sm text-neutral-500 hover:text-neutral-700"
        >
          <FileJson className="h-4 w-4" />
          Choose JSON file
        </label>
      </div>

      {count !== null && (
        <div className={`flex items-center gap-2 text-xs ${count > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {count > 0 ? (
            <><Check className="h-3.5 w-3.5" /> Imported {count} papers</>
          ) : (
            <><AlertCircle className="h-3.5 w-3.5" /> No valid papers found in file</>
          )}
        </div>
      )}
    </div>
  );
}

export default JsonTab;
