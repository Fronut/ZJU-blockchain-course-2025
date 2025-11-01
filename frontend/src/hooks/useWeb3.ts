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
      throw new Error('MetaMask not installed');
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // 检查当前网络
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // 如果不是 Ganache 网络，提示用户手动切换
      if (chainId !== 1337) {
        throw new Error('Please switch to Ganache network (Chain ID: 1337) in MetaMask');
      }
      
      // 请求账户访问
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const accounts = await provider.listAccounts();
      const signer = await provider.getSigner();

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      setWeb3State({
        account: accounts[0].address,
        chainId: chainId,
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
      throw error;
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
    const checkConnection = async () => {
      if (window.ethereum?.selectedAddress) {
        try {
          await connectWallet();
        } catch (error) {
          console.error('Auto-connect failed:', error);
        }
      }
    };

    checkConnection();
  }, [connectWallet]);

  return {
    ...web3State,
    connectWallet,
    disconnectWallet
  };
};