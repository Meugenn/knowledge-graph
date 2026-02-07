import React, { useState, useEffect } from 'react';

function NetworkCheck({ provider }) {
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [currentChainId, setCurrentChainId] = useState(null);
  const [expectedChainId] = useState('0x539'); // 1337 in hex (Hardhat)

  useEffect(() => {
    checkNetwork();

    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', (chainId) => {
        setCurrentChainId(chainId);
        checkNetwork();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('chainChanged');
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
        // Network not added
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
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  };

  if (!wrongNetwork) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#ff6b6b',
      color: 'white',
      padding: '15px 30px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      zIndex: 9999,
      maxWidth: '500px',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>
        ⚠️ Wrong Network!
      </div>
      <div style={{ marginBottom: '15px', fontSize: '0.9rem' }}>
        Please switch to <strong>Hardhat Local</strong> network
        <br/>
        <small>Current: {currentChainId === '0x72' ? 'Flare Coston2' : currentChainId === '0x1E61' ? 'Plasma' : 'Unknown'}</small>
      </div>
      <button
        onClick={switchToHardhat}
        style={{
          background: 'white',
          color: '#ff6b6b',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        Switch to Hardhat Local
      </button>
    </div>
  );
}

export default NetworkCheck;
