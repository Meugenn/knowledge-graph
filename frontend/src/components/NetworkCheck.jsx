import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function NetworkCheck({ provider }) {
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [currentChainId, setCurrentChainId] = useState(null);
  const [expectedChainId] = useState('0x539');

  useEffect(() => {
    checkNetwork();
    const handleChainChanged = (chainId) => {
      setCurrentChainId(chainId);
      checkNetwork();
    };
    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [provider]);

  const checkNetwork = async () => {
    if (!window.ethereum) return;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      setCurrentChainId(chainId);
      setWrongNetwork(chainId !== expectedChainId);
    } catch (error) {
      console.error('Network check failed:', error);
    }
  };

  const switchToHardhat = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: expectedChainId }],
      });
    } catch (error) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: expectedChainId,
              chainName: 'Hardhat Local',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['http://127.0.0.1:8545'],
            }],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      }
    }
  };

  if (!wrongNetwork) return null;

  const networkName = currentChainId === '0x72' ? 'Flare Coston2' : currentChainId === '0x1E61' ? 'Plasma' : 'Unknown';

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] bg-white border border-neutral-900 p-4 max-w-md text-center shadow-lg">
      <div className="flex items-center justify-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-mono text-xs font-bold uppercase tracking-widest">Wrong Network</span>
      </div>
      <p className="text-sm text-neutral-600 mb-3">
        Switch to Hardhat Local. Current: {networkName}
      </p>
      <Button
        variant="outline"
        size="sm"
        className="font-mono text-xs uppercase tracking-widest border-neutral-900"
        onClick={switchToHardhat}
      >
        Switch Network
      </Button>
    </div>
  );
}

export default NetworkCheck;
