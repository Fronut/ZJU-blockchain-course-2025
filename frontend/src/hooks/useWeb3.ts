// src/hooks/useWeb3.ts
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { Web3State } from '../types';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export const useWeb3 = () => {
  const [web3State, setWeb3State] = useState<Web3State>({
    account: null,
    chainId: null,
    isConnected: false,
    provider: null,
    signer: null
  });

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const accounts = await provider.listAccounts();
      const network = await provider.getNetwork();
      const signer = await provider.getSigner();

      setWeb3State({
        account: accounts[0].address,
        chainId: Number(network.chainId),
        isConnected: true,
        provider,
        signer
      });

      // 监听账户变化
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setWeb3State(prev => ({
          ...prev,
          account: accounts[0] || null,
          isConnected: accounts.length > 0
        }));
      });

      // 监听网络变化
      window.ethereum.on('chainChanged', (chainId: string) => {
        setWeb3State(prev => ({
          ...prev,
          chainId: parseInt(chainId, 16)
        }));
      });

    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWeb3State({
      account: null,
      chainId: null,
      isConnected: false,
      provider: null,
      signer: null
    });
  }, []);

  useEffect(() => {
    // 检查是否已经连接
    if (window.ethereum?.selectedAddress) {
      connectWallet();
    }
  }, [connectWallet]);

  return {
    ...web3State,
    connectWallet,
    disconnectWallet
  };
};