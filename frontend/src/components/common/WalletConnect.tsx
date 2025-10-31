// src/components/common/WalletConnect.tsx
import React from 'react';
import { useWeb3 } from '../../hooks/useWeb3';
import { SUPPORTED_CHAINS } from '../../utils/constants';

export const WalletConnect: React.FC = () => {
  const { account, chainId, isConnected, connectWallet, disconnectWallet } = useWeb3();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return 'Unknown';
    return SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS] || `Chain ${chainId}`;
  };

  if (!isConnected || !account) {
    return (
      <button
        onClick={connectWallet}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
      >
        Connect Wallet
      </button>
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