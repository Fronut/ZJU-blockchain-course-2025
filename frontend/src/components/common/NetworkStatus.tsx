// src/components/common/NetworkStatus.tsx
import React from 'react';
import { useWeb3 } from '../../hooks/useWeb3';

export const NetworkStatus: React.FC = () => {
  const { chainId, isConnected } = useWeb3();
  
  if (!isConnected) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mx-4 mt-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-yellow-800 font-semibold">Wallet Not Connected</h4>
            <p className="text-yellow-700 text-sm">
              Please connect your wallet to use EasyBet features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // === 改进网络错误信息 ===
  if (chainId !== 1337) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mx-4 mt-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-red-800 font-semibold">Wrong Network</h4>
            <p className="text-red-700 text-sm">
              Please switch to <strong>Ganache Local network (Chain ID: 1337)</strong> to use all features.
              {chainId && ` Current chain ID: ${chainId}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};