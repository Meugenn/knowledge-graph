import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Upload, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FadeIn } from '@/components/ui/fade-in';

function SubmitPaper({ contracts, account, importData }) {
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    doi: '',
    ipfsHash: '',
  });

  useEffect(() => {
    if (importData) {
      setFormData(prev => ({
        ...prev,
        title: importData.title || prev.title,
        abstract: importData.abstract || prev.abstract,
        doi: importData.doi || prev.doi,
      }));
      setMessage({ type: 'info', text: `Imported "${importData.title}" from Knowledge Graph.` });
    }
  }, [importData]);

  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handlePdfSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const mockHash = 'Qm' + btoa(file.name).replace(/[^a-zA-Z0-9]/g, '').substring(0, 44);
      setFormData(prev => ({ ...prev, ipfsHash: mockHash }));
    }
  };

  const removePdf = () => {
    setPdfFile(null);
    setFormData(prev => ({ ...prev, ipfsHash: '' }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contracts.researchGraph || !contracts.usdc) {
      setMessage({ type: 'error', text: 'Contracts not initialized' });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: 'info', text: 'Preparing submission...' });

      const mockIpfsHash = formData.ipfsHash || 'Qm' + Math.random().toString(36).substring(7);
      const submissionFee = await contracts.researchGraph.submissionFeeUSD();

      setMessage({ type: 'info', text: `Approving ${ethers.formatUnits(submissionFee, 6)} USDC...` });

      const approveTx = await contracts.usdc.approve(
        await contracts.researchGraph.getAddress(),
        submissionFee
      );
      await approveTx.wait();

      setMessage({ type: 'info', text: 'Submitting paper to blockchain...' });

      const submitTx = await contracts.researchGraph.submitPaper(mockIpfsHash, formData.doi);
      const receipt = await submitTx.wait();

      const event = receipt.logs.find(log => {
        try {
          return contracts.researchGraph.interface.parseLog(log)?.name === 'PaperSubmitted';
        } catch {
          return false;
        }
      });

      const paperId = event ? contracts.researchGraph.interface.parseLog(event).args.paperId : 'N/A';

      setMessage({
        type: 'success',
        text: `Paper submitted. ID: ${paperId}. Flare FDC verification initiated.`
      });

      setFormData({ title: '', abstract: '', doi: '', ipfsHash: '' });
    } catch (error) {
      console.error('Submission error:', error);
      setMessage({
        type: 'error',
        text: error.reason || error.message || 'Failed to submit paper'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <FadeIn>
        <span className="section-label mb-2 block">Submit</span>
        <h2 className="section-title mb-2">Submit Research Paper</h2>
        <p className="body-text text-sm mb-8">
          Submit your paper to the decentralized research graph. Requires a $50 USDC submission fee on Plasma.
        </p>
      </FadeIn>

      {message.text && (
        <Alert
          variant={message.type === 'error' ? 'destructive' : message.type === 'success' ? 'success' : 'default'}
          className="mb-6"
        >
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PDF Upload */}
        <FadeIn delay={0.1}>
          {!pdfFile ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 p-8 cursor-pointer hover:border-neutral-400 transition-colors">
              <input type="file" accept=".pdf" onChange={handlePdfSelect} className="hidden" />
              <Upload className="h-6 w-6 text-neutral-400 mb-2" />
              <span className="font-mono text-xs uppercase tracking-widest text-neutral-500">Attach PDF</span>
              <span className="text-xs text-neutral-400 mt-1">Stored on IPFS</span>
            </label>
          ) : (
            <div className="flex items-center gap-4 border border-neutral-200 p-4">
              <FileText className="h-5 w-5 text-neutral-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{pdfFile.name}</div>
                <div className="text-xs text-neutral-400">{formatFileSize(pdfFile.size)}</div>
              </div>
              <button type="button" onClick={removePdf} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-widest text-neutral-500">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Paper title"
              required
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-widest text-neutral-500">Abstract</label>
            <Textarea
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              placeholder="Paper abstract"
              required
              className="min-h-[120px]"
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.25}>
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-widest text-neutral-500">DOI</label>
            <Input
              value={formData.doi}
              onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
              placeholder="10.1234/example.2024"
            />
            <span className="text-xs text-neutral-400">
              If provided, verified via Flare Data Connector
            </span>
          </div>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="space-y-2">
            <label className="font-mono text-xs uppercase tracking-widest text-neutral-500">IPFS Hash</label>
            <Input
              value={formData.ipfsHash}
              onChange={(e) => setFormData({ ...formData, ipfsHash: e.target.value })}
              placeholder="QmXYZ123... (auto-generated for demo)"
            />
          </div>
        </FadeIn>

        <FadeIn delay={0.35}>
          <div className="bg-neutral-50 border border-neutral-200 p-6">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-400 block mb-3">After submission</span>
            <ul className="space-y-2 text-sm text-neutral-600 font-light">
              <li>Paper submitted to IPFS for decentralized storage</li>
              <li>Flare FDC verifies external data (DOI, citations)</li>
              <li>Reviewers assigned via Flare RNG, paid $100 USDC each</li>
              <li>Accepted papers earn RESEARCH governance tokens</li>
            </ul>
          </div>
        </FadeIn>

        <FadeIn delay={0.4}>
          <Button
            type="submit"
            className="w-full bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-xs uppercase tracking-widest h-12"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Paper — $50 USDC'}
          </Button>
        </FadeIn>
      </form>
    </div>
  );
}

export default SubmitPaper;
