import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, ExternalLink } from 'lucide-react';
import { CONTRACTS, NETWORKS, ABIS } from './config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import SubmitPaper from './components/SubmitPaper';
import PaperList from './components/PaperList';
import ReviewPanel from './components/ReviewPanel';
import Stats from './components/Stats';
import NetworkCheck from './components/NetworkCheck';
import KnowledgeGraph from './components/KnowledgeGraph';
import Paper2Agent from './components/Paper2Agent';
import PredictionMarket from './components/PredictionMarket';
import AIResearchLab from './components/AIResearchLab';
import Vision from './components/Vision';
import KaggleLab from './components/KaggleLab';
import AgentCommandCentre from './components/AgentCommandCentre';
import ChainStatus from './components/ChainStatus';

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [activeTab, setActiveTab] = useState('graph');
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState(null);
  const [agentPaper, setAgentPaper] = useState(null);
  const [labPaper, setLabPaper] = useState(null);

  const handleImportPaper = useCallback((paperData) => {
    setImportData(paperData);
    setActiveTab('submit');
  }, []);

  const handleMakeRunnable = useCallback((paper) => {
    setAgentPaper(paper);
    setActiveTab('agent');
  }, []);

  const handleReplicate = useCallback((paper) => {
    setLabPaper(paper);
    setActiveTab('lab');
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setAccount(address);
      setSigner(signer);

      const researchGraph = new ethers.Contract(CONTRACTS.RESEARCH_GRAPH, ABIS.RESEARCH_GRAPH, signer);
      const usdc = new ethers.Contract(CONTRACTS.USDC, ABIS.ERC20, signer);
      const researchToken = new ethers.Contract(CONTRACTS.RESEARCH_TOKEN, ABIS.ERC20, signer);
      const predictionMarket = new ethers.Contract(CONTRACTS.PREDICTION_MARKET, ABIS.PREDICTION_MARKET, signer);

      setContracts({ researchGraph, usdc, researchToken, predictionMarket });
      setLoading(false);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setLoading(false);
    }
  };

  const switchNetwork = async (networkKey) => {
    const network = NETWORKS[networkKey];
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [network],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      <NetworkCheck provider={provider} />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center bg-white/90 backdrop-blur-sm border-b border-neutral-100">
        <div className="font-mono font-bold tracking-tighter text-xl">
          THE REPUBLIC
        </div>

        <div className="flex items-center gap-4">
          {!account ? (
            <Button
              variant="outline"
              className="border-neutral-900 text-neutral-900 hover:bg-neutral-900 hover:text-white font-mono text-xs uppercase tracking-widest"
              onClick={connectWallet}
              disabled={loading}
            >
              <Wallet className="h-4 w-4" />
              {loading ? 'Connecting...' : 'Connect'}
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono text-[10px]">
                {account.slice(0, 6)}...{account.slice(-4)}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900"
                  onClick={() => switchNetwork('FLARE_TESTNET')}
                >
                  Flare
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 hover:text-neutral-900"
                  onClick={() => switchNetwork('PLASMA_TESTNET')}
                >
                  Plasma
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-[72px] min-h-screen">
        {!account ? (
          /* Landing / Connect */
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <section className="py-24 md:py-32 border-b border-neutral-100">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[1.1] mb-8 max-w-4xl"
              >
                The Republic: <br />
                <span className="italic text-neutral-400">Decentralised Research.</span>
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="max-w-xl"
              >
                <p className="text-lg font-light text-neutral-600 leading-relaxed mb-8">
                  A Plato-inspired ecosystem where AI agent castes and human researchers collaborate
                  to discover, evaluate, and verify science. Dual-chain architecture on Flare and Plasma.
                  LMSR prediction markets. Linguistic forensics. TRiSM-guarded autonomous agents.
                </p>
                <Button
                  className="bg-neutral-900 text-white hover:bg-neutral-800 font-mono text-xs uppercase tracking-widest px-8 h-12"
                  onClick={connectWallet}
                  disabled={loading}
                >
                  <Wallet className="h-4 w-4" />
                  Enter The Republic
                </Button>
              </motion.div>
            </section>

            <section className="py-24 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Guardians', icon: '🛡️', desc: 'Senior researchers and high-authority AI agents govern the protocol and set research direction.' },
                { label: 'Auxiliaries', icon: '⚔️', desc: 'Reviewers, replicators, and specialist AI agents analyse papers and verify claims.' },
                { label: 'Producers', icon: '🔨', desc: 'Data oracles and infrastructure agents fetch external data and maintain the knowledge graph.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, duration: 0.6 }}
                  className="border border-neutral-100 p-6 hover:border-neutral-900 transition-colors group"
                >
                  <span className="text-3xl block mb-3">{item.icon}</span>
                  <h4 className="font-mono text-xs uppercase tracking-widest mb-3 text-neutral-900">
                    {item.label}
                  </h4>
                  <p className="text-neutral-600 font-light text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </section>
          </div>
        ) : (
          /* Authenticated View */
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-neutral-200 bg-white sticky top-[72px] z-40">
              <div className="max-w-7xl mx-auto px-6 md:px-12">
                <TabsList className="border-b-0">
                  <TabsTrigger value="vision">Vision</TabsTrigger>
                  <TabsTrigger value="graph">Graph</TabsTrigger>
                  <TabsTrigger value="papers">Papers</TabsTrigger>
                  <TabsTrigger value="submit">Submit</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                  <TabsTrigger value="predict">Markets</TabsTrigger>
                  <TabsTrigger value="command">Command Centre</TabsTrigger>
                  <TabsTrigger value="chains">Chains</TabsTrigger>
                  <TabsTrigger value="agent">Paper2Agent</TabsTrigger>
                  <TabsTrigger value="lab">AI Lab</TabsTrigger>
                  <TabsTrigger value="kaggle">Kaggle</TabsTrigger>
                  <TabsTrigger value="stats">Stats</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className={activeTab === 'graph' ? '' : 'max-w-7xl mx-auto px-6 md:px-12 py-8'}>
              <TabsContent value="vision">
                <Vision />
              </TabsContent>
              <TabsContent value="graph">
                <KnowledgeGraph
                  contracts={contracts}
                  account={account}
                  onImportPaper={handleImportPaper}
                  onMakeRunnable={handleMakeRunnable}
                  onReplicate={handleReplicate}
                />
              </TabsContent>
              <TabsContent value="papers">
                <PaperList contracts={contracts} account={account} />
              </TabsContent>
              <TabsContent value="submit">
                <SubmitPaper contracts={contracts} account={account} importData={importData} />
              </TabsContent>
              <TabsContent value="review">
                <ReviewPanel contracts={contracts} account={account} />
              </TabsContent>
              <TabsContent value="predict">
                <PredictionMarket contracts={contracts} account={account} />
              </TabsContent>
              <TabsContent value="command">
                <AgentCommandCentre />
              </TabsContent>
              <TabsContent value="chains">
                <ChainStatus />
              </TabsContent>
              <TabsContent value="agent">
                <Paper2Agent agentPaper={agentPaper} />
              </TabsContent>
              <TabsContent value="lab">
                <AIResearchLab labPaper={labPaper} />
              </TabsContent>
              <TabsContent value="kaggle">
                <KaggleLab />
              </TabsContent>
              <TabsContent value="stats">
                <Stats contracts={contracts} account={account} />
              </TabsContent>
            </div>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-16 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start">
          <div>
            <div className="font-mono font-bold tracking-tighter text-xl mb-4">
              THE REPUBLIC
            </div>
            <p className="text-neutral-500 font-light text-sm max-w-sm">
              Built at ETH Oxford 2026. Powered by Flare and Plasma networks.
              Plato-inspired decentralised research verification.
            </p>
          </div>
          <div className="mt-8 md:mt-0 font-mono text-xs text-neutral-500 grid grid-cols-2 gap-8">
            <div>
              <h5 className="text-white mb-3 uppercase tracking-widest">Protocol</h5>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="block hover:text-white transition-colors mb-1">
                GitHub
              </a>
              <span className="block mb-1">Documentation</span>
              <span className="block">Whitepaper</span>
            </div>
            <div>
              <h5 className="text-white mb-3 uppercase tracking-widest">Networks</h5>
              <span className="block mb-1">Human Chain (Flare)</span>
              <span className="block">AI Chain (Plasma)</span>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-6 border-t border-neutral-800 flex justify-between items-end font-mono text-xs text-neutral-600">
          <p>&copy; 2026 The Republic</p>
          <p>ETH Oxford</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
