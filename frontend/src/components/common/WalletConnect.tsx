// src/components/common/WalletConnect.tsx
import React, { useState } from 'react';
import { useWeb3 } from '../../hooks/useWeb3';
import { Link } from 'react-router-dom';
import { SUPPORTED_CHAINS } from '../../utils/constants';

export const WalletConnect: React.FC = () => {
  const { account, chainId, isConnected, connectWallet, disconnectWallet } = useWeb3();
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return 'Unknown';
    return SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS] || `Chain ${chainId}`;
  };

  const handleConnect = async () => {
    if (!window.ethereum) {
      setShowInstallModal(true);
      return;
    }
    
    try {
      await connectWallet();
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      
      // 如果是网络错误，显示网络切换提示
      if (error.message.includes('Ganache network')) {
        setShowNetworkModal(true);
      } else {
        alert(`Connection failed: ${error.message}`);
      }
    }
  };

  const installMetaMask = () => {
    window.open('https://metamask.io/download.html', '_blank');
    setShowInstallModal(false);
  };

  const addGanacheNetwork = () => {
    if (!window.ethereum) return;
    
    window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x539', // 1337 in hex
        chainName: 'Ganache Local',
        rpcUrls: ['http://127.0.0.1:8545'],
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18,
        },
        blockExplorerUrls: ['']
      }]
    }).catch(error => {
      console.error('Failed to add network:', error);
    });
  };

  if (!isConnected || !account) {
    return (
      <>
        <button
          onClick={handleConnect}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9a9 9 0 00-9 9"/>
          </svg>
          Connect Wallet
        </button>

        {/* MetaMask 安装提示模态框 */}
        {showInstallModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">🦊</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">MetaMask Required</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  To use EasyBet, you need to install MetaMask, a crypto wallet for Ethereum and other EVM-compatible blockchains.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowInstallModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Link to="/">Back to Home</Link>
                  </button>
                  <button
                    onClick={installMetaMask}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Install MetaMask</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 网络切换提示模态框 */}
        {showNetworkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">🌐</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Switch Network</h3>
                </div>
                
                <p className="text-gray-600 mb-6">
                  Please switch to Ganache Local network (Chain ID: 1337) to use EasyBet.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">1</div>
                    <span>Click the network selector in MetaMask</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">2</div>
                    <span>Select "Ganache Local" or add it manually</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">3</div>
                    <span>Click "Connect Wallet" again</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNetworkModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addGanacheNetwork}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
                  >
                    Add Ganache Network
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-lg">
      <div className="text-sm">
        <div className="font-medium">{formatAddress(account)}</div>
        <div className="text-gray-600 text-xs">{getNetworkName(chainId)}</div>
      </div>
      <button
        onClick={disconnectWallet}
        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
};