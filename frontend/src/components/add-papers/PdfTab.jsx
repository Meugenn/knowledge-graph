import React, { useState, useCallback, useRef } from 'react';
import { FileUp, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { parsePdfFile } from '../../utils/pdfParser';

function PdfTab({ onAddPaper, onClose }) {
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState('');
  const [abstract, setAbstract] = useState('');
  const [doi, setDoi] = useState('');
  const fileRef = useRef(null);

  const handleFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    setError(null);
    setParsed(null);

    try {
      const result = await parsePdfFile(file);
      setParsed(result);
      setTitle(result.title || '');
      setAuthors((result.authors || []).join(', '));
      setYear(result.year ? String(result.year) : '');
      setAbstract(result.abstract || '');
      setDoi(result.doi || '');
    } catch (err) {
      setError(err.message);
    }

    setParsing(false);
    if (fileRef.current) fileRef.current.value = '';
  }, []);

  const handleAdd = useCallback(() => {
    const paper = {
      id: `pdf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      paperId: `pdf_${Date.now()}`,
      title: title.trim() || 'Untitled',
      authors: authors.split(',').map(a => a.trim()).filter(Boolean),
      year: year ? parseInt(year) : null,
      citationCount: 0,
      abstract: abstract.trim(),
      fieldsOfStudy: [],
      doi: doi.trim() || null,
      source: 'pdf_upload',
      val: 3,
    };
    onAddPaper(paper);
    onClose();
  }, [title, authors, year, abstract, doi, onAddPaper, onClose]);

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500">
        Upload an academic PDF. Metadata is extracted using Grobid (S2ORC pipeline) with client-side fallback.
      </p>

      {/* File input */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          onChange={handleFile}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="flex items-center justify-center gap-2 border-2 border-dashed border-neutral-300 hover:border-neutral-400 py-4 px-4 cursor-pointer transition-colors text-sm text-neutral-500 hover:text-neutral-700"
        >
          {parsing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting metadata...
            </>
          ) : (
            <>
              <FileUp className="h-4 w-4" />
              Choose PDF file
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {/* Editable fields after parsing */}
      {parsed && (
        <>
          {parsed._method && (
            <div className="text-[10px] font-mono text-neutral-400">
              Extracted via {parsed._method === 'grobid' ? 'Grobid (S2ORC)' : parsed._method === 'pdfjs' ? 'PDF.js (client-side)' : 'filename'}
            </div>
          )}

          <div className="space-y-2">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} className="h-8 text-sm" />
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Authors (comma-separated)</label>
              <Input value={authors} onChange={e => setAuthors(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Year</label>
                <Input value={year} onChange={e => setYear(e.target.value)} className="h-8 text-sm" type="number" />
              </div>
              <div className="flex-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">DOI</label>
                <Input value={doi} onChange={e => setDoi(e.target.value)} className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">Abstract</label>
              <Textarea value={abstract} onChange={e => setAbstract(e.target.value)} className="text-xs h-24 resize-none" />
            </div>
          </div>

          <Button
            onClick={handleAdd}
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-[10px] uppercase tracking-widest"
            disabled={!title.trim()}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Add to Graph
          </Button>
        </>
      )}
    </div>
  );
}

export default PdfTab;
